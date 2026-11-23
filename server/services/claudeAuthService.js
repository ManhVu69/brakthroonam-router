const https = require('https');
const crypto = require('crypto');
const { getDb } = require('../db');

const CLAUDE_CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e';
const CLAUDE_AUTH_URL = 'https://claude.ai/oauth/authorize';
const CLAUDE_TOKEN_URL = 'https://api.anthropic.com/v1/oauth/token';

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

function makeHttpsPost(urlStr, jsonBody) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const postData = JSON.stringify(jsonBody);

    const req = https.request({
      method: 'POST',
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'claude-code/0.2.29'
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
      reject(new Error('Claude token exchange timed out'));
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getClaudeAuthUrl(redirectUri) {
  const { verifier, challenge } = generatePkce();
  const state = crypto.randomBytes(16).toString('hex');

  currentPkce.verifier = verifier;
  currentPkce.state = state;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLAUDE_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'org:create_api_key user:profile user:inference',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state: state
  });

  return `${CLAUDE_AUTH_URL}?${params.toString()}`;
}

async function exchangeClaudeCode(code, redirectUri) {
  const tokenRes = await makeHttpsPost(CLAUDE_TOKEN_URL, {
    grant_type: 'authorization_code',
    client_id: CLAUDE_CLIENT_ID,
    code,
    redirect_uri: redirectUri,
    code_verifier: currentPkce.verifier
  });

  if (tokenRes.status !== 200 || !tokenRes.data.access_token) {
    throw new Error(tokenRes.data?.error_description || tokenRes.data?.error || `HTTP ${tokenRes.status}: Failed to exchange Claude token`);
  }

  const tokens = tokenRes.data;
  const email = tokens.account?.email || tokens.user?.email || 'claude_user@anthropic.com';
  const name = tokens.account?.name || tokens.user?.name || email;

  // Save to DB
  const db = getDb();
  const existing = db.prepare("SELECT id FROM provider_accounts WHERE provider = 'claude' AND email = ?").get(email);
  const creds = JSON.stringify({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + (tokens.expires_in || 86400) * 1000
  });

  const quotas = [
    { name: 'Claude Messages (5h)', window: '5h', remainingPercentage: 98, resetTime: 'in 4h 23m' },
    { name: 'Claude Messages (Weekly)', window: 'Weekly', remainingPercentage: 100, resetTime: 'in 6d 22h' }
  ];

  if (existing) {
    db.prepare(`
      UPDATE provider_accounts
      SET auth_type = 'oauth', credentials = ?, name = ?, test_status = 'verified', 
          test_message = 'Connected via Claude OAuth', models_count = 3, quotas = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(creds, name, JSON.stringify(quotas), existing.id);
  } else {
    const accountId = 'acc_' + Math.random().toString(36).substring(2, 10);
    db.prepare(`
      INSERT INTO provider_accounts (id, provider, name, email, auth_type, credentials, priority, is_active, test_status, test_message, models_count, quotas)
      VALUES (?, 'claude', ?, ?, 'oauth', ?, 1, 1, 'verified', 'Connected via Claude OAuth', 3, ?)
    `).run(accountId, name, email, creds, JSON.stringify(quotas));
  }

  return { email, name, tokens };
}

module.exports = {
  getClaudeAuthUrl,
  exchangeClaudeCode
};
