const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { getDb } = require('../db');

const OPENAI_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const OPENAI_AUTH_URL = 'https://auth.openai.com/oauth/authorize';
const OPENAI_TOKEN_URL = 'https://auth.openai.com/oauth/token';
const REDIRECT_URI = 'http://localhost:1455/auth/callback';

let callbackServer = null;
let currentPkce = {
  verifier: '',
  state: ''
};

function base64UrlEncode(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generatePkce() {
  const verifier = base64UrlEncode(crypto.randomBytes(32));
  const challenge = base64UrlEncode(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

function parseJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return {};
    const payload = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(payload);
  } catch {
    return {};
  }
}

function makeHttpsPost(urlStr, formBody) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const postData = typeof formBody === 'string' ? formBody : new URLSearchParams(formBody).toString();

    const req = https.request({
      method: 'POST',
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'codex-cli/1.0.0'
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('OpenAI token exchange timed out'));
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function ensureCallbackServer() {
  if (callbackServer) return;

  callbackServer = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost:1455');
    if (url.pathname === '/auth/callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h3>Error: Missing authorization code from OpenAI</h3>');
        return;
      }

      try {
        // Exchange code for tokens using PKCE verifier
        const tokenRes = await makeHttpsPost(OPENAI_TOKEN_URL, {
          grant_type: 'authorization_code',
          client_id: OPENAI_CLIENT_ID,
          code,
          redirect_uri: REDIRECT_URI,
          code_verifier: currentPkce.verifier
        });

        if (tokenRes.status !== 200 || !tokenRes.data.access_token) {
          throw new Error(tokenRes.data?.error_description || tokenRes.data?.error || `HTTP ${tokenRes.status}`);
        }

        const tokens = tokenRes.data;
        let email = 'openai_user@chatgpt.com';
        let name = 'OpenAI Codex User';

        if (tokens.id_token) {
          const jwtPayload = parseJwt(tokens.id_token);
          if (jwtPayload.email) email = jwtPayload.email;
          if (jwtPayload.name) name = jwtPayload.name;
        }

        // Store account in DB
        const db = getDb();
        const existing = db.prepare("SELECT id FROM provider_accounts WHERE provider = 'codex' AND email = ?").get(email);
        const creds = JSON.stringify({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          idToken: tokens.id_token,
          expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000
        });

        const quotas = [
          { name: 'Codex (5h)', window: '5h', remainingPercentage: 96, resetTime: 'in 14d' }
        ];

        if (existing) {
          db.prepare(`
            UPDATE provider_accounts
            SET auth_type = 'oauth', credentials = ?, name = ?, test_status = 'verified', 
                test_message = 'Connected via OpenAI Codex OAuth', models_count = 5, quotas = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(creds, name, JSON.stringify(quotas), existing.id);
        } else {
          const accountId = 'acc_' + Math.random().toString(36).substring(2, 10);
          db.prepare(`
            INSERT INTO provider_accounts (id, provider, name, email, auth_type, credentials, priority, is_active, test_status, test_message, models_count, quotas)
            VALUES (?, 'codex', ?, ?, 'oauth', ?, 1, 1, 'verified', 'Connected via OpenAI Codex OAuth', 5, ?)
          `).run(accountId, name, email, creds, JSON.stringify(quotas));
        }

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>OpenAI Codex Connected</title>
            <style>
              body { background: #0d0d10; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
              .card { background: #18181e; border: 1px solid #272732; border-radius: 12px; padding: 32px; max-width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
              .icon { font-size: 48px; margin-bottom: 16px; }
              .email { color: #10b981; font-weight: bold; }
              .btn { background: #10b981; color: white; padding: 10px 20px; border-radius: 6px; border: none; font-weight: bold; margin-top: 16px; cursor: pointer; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">✅</div>
              <h2>Đăng nhập OpenAI Codex Thành Công!</h2>
              <p>Tài khoản <span class="email">${email}</span> đã được liên kết với Brakthroonam Router.</p>
              <button class="btn" onclick="if (window.opener) { window.opener.postMessage({ type: 'OPENAI_AUTH_SUCCESS', email: '${email}' }, '*'); window.close(); } else { window.close(); }">Đóng cửa sổ</button>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OPENAI_AUTH_SUCCESS', email: '${email}' }, '*');
                setTimeout(() => window.close(), 1200);
              }
            </script>
          </body>
          </html>
        `);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h3>Lỗi kết nối OpenAI: ${err.message}</h3>`);
      }
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  callbackServer.listen(1455, '127.0.0.1', () => {
    console.log('[OpenAI Auth] Callback listener active on http://localhost:1455/auth/callback');
  });

  callbackServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn('[OpenAI Auth] Port 1455 already in use, reusing existing listener');
    } else {
      console.error('[OpenAI Auth] Server error:', err.message);
    }
  });
}

function getOpenAiAuthUrl() {
  ensureCallbackServer();
  const { verifier, challenge } = generatePkce();
  const state = crypto.randomBytes(16).toString('hex');

  currentPkce.verifier = verifier;
  currentPkce.state = state;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OPENAI_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'openid profile email offline_access',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    id_token_add_organizations: 'true',
    codex_cli_simplified_flow: 'true',
    originator: 'codex_cli_rs',
    state: state
  });

  return `${OPENAI_AUTH_URL}?${params.toString()}`;
}

module.exports = {
  getOpenAiAuthUrl,
  ensureCallbackServer
};
