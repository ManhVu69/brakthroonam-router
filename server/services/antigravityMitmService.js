const fs = require('fs');
const path = require('path');
const https = require('https');
const http2 = require('http2');
const tls = require('tls');
const { execSync, exec } = require('child_process');
const forge = require('node-forge');
const { getDb } = require('../db');
const { refreshAccessToken } = require('./googleAuthService');
const { resolveDirectHost, invalidateDnsCache } = require('./googleDnsHelper');

const defaultLocalCertDir = path.join(__dirname, '..', '..', 'data', 'certs');
const CERT_DIR = fs.existsSync(defaultLocalCertDir)
  ? defaultLocalCertDir
  : (process.platform === 'win32'
      ? path.join(process.env.APPDATA || require('os').homedir(), 'ai-router', 'certs')
      : path.join(require('os').homedir(), '.ai-router', 'certs'));
const CA_KEY_PATH = path.join(CERT_DIR, 'brakthroonam-ca.key');
const CA_CRT_PATH = path.join(CERT_DIR, 'brakthroonam-ca.crt');
const DOMAIN_KEY_PATH = path.join(CERT_DIR, 'brakthroonam-domain.key');
const DOMAIN_CRT_PATH = path.join(CERT_DIR, 'brakthroonam-domain.crt');
const HOSTS_PATH = process.platform === 'win32'
  ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'drivers', 'etc', 'hosts')
  : '/etc/hosts';

const TARGET_DOMAINS = [
  'cloudcode-pa.googleapis.com',
  'daily-cloudcode-pa.googleapis.com'
];

let mitmServer = null;
let isMitmRunning = false;

// Ensure certs directory exists
if (!fs.existsSync(CERT_DIR)) {
  fs.mkdirSync(CERT_DIR, { recursive: true });
}

function flushDnsCache() {
  try {
    if (process.platform === 'win32') {
      execSync('ipconfig /flushdns', { stdio: 'ignore', timeout: 1500 });
    } else if (process.platform === 'darwin') {
      execSync('killall -HUP mDNSResponder', { stdio: 'ignore', timeout: 1500 });
    } else {
      try { execSync('resolvectl flush-caches', { stdio: 'ignore', timeout: 1500 }); } catch {
        try { execSync('systemd-resolve --flush-caches', { stdio: 'ignore', timeout: 1500 }); } catch {}
      }
    }
  } catch {}
}

/**
 * 1. CERTIFICATE MANAGEMENT (Pure JavaScript via node-forge)
 */
function generateCertificates() {
  if (fs.existsSync(CA_KEY_PATH) && fs.existsSync(CA_CRT_PATH) &&
      fs.existsSync(DOMAIN_KEY_PATH) && fs.existsSync(DOMAIN_CRT_PATH)) {
    return {
      caKey: fs.readFileSync(CA_KEY_PATH, 'utf8'),
      caCrt: fs.readFileSync(CA_CRT_PATH, 'utf8'),
      domainKey: fs.readFileSync(DOMAIN_KEY_PATH, 'utf8'),
      domainCrt: fs.readFileSync(DOMAIN_CRT_PATH, 'utf8')
    };
  }

  console.log('[Brakthroonam MITM] 🔐 Generating internal Brakthroonam Root CA & Domain SSL Certificates...');
  const pki = forge.pki;

  // A. Generate Root CA
  const caKeys = pki.rsa.generateKeyPair(2048);
  const caCert = pki.createCertificate();
  caCert.publicKey = caKeys.publicKey;
  caCert.serialNumber = '01' + Date.now();
  caCert.validity.notBefore = new Date();
  caCert.validity.notAfter = new Date();
  caCert.validity.notAfter.setFullYear(caCert.validity.notBefore.getFullYear() + 10);

  const caAttrs = [
    { name: 'commonName', value: 'Brakthroonam Router Root CA' },
    { name: 'organizationName', value: 'Brakthroonam' },
    { name: 'countryName', value: 'VN' }
  ];
  caCert.setSubject(caAttrs);
  caCert.setIssuer(caAttrs);
  caCert.setExtensions([
    { name: 'basicConstraints', cA: true },
    { name: 'keyUsage', keyCertSign: true, digitalSignature: true, cRLSign: true }
  ]);
  caCert.sign(caKeys.privateKey, forge.md.sha256.create());

  const caPemKey = pki.privateKeyToPem(caKeys.privateKey);
  const caPemCrt = pki.certificateToPem(caCert);

  fs.writeFileSync(CA_KEY_PATH, caPemKey, 'utf8');
  fs.writeFileSync(CA_CRT_PATH, caPemCrt, 'utf8');

  // B. Generate Domain Certificate for Antigravity Endpoints
  const domainKeys = pki.rsa.generateKeyPair(2048);
  const domainCert = pki.createCertificate();
  domainCert.publicKey = domainKeys.publicKey;
  domainCert.serialNumber = '02' + Date.now();
  domainCert.validity.notBefore = new Date();
  domainCert.validity.notAfter = new Date();
  domainCert.validity.notAfter.setFullYear(domainCert.validity.notBefore.getFullYear() + 3);

  const domainAttrs = [
    { name: 'commonName', value: 'cloudcode-pa.googleapis.com' },
    { name: 'organizationName', value: 'Brakthroonam' }
  ];
  domainCert.setSubject(domainAttrs);
  domainCert.setIssuer(caAttrs);
  domainCert.setExtensions([
    { name: 'basicConstraints', cA: false },
    { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
    { name: 'extKeyUsage', serverAuth: true, clientAuth: true },
    {
      name: 'subjectAltName',
      altNames: TARGET_DOMAINS.map(d => ({ type: 2, value: d }))
    }
  ]);
  domainCert.sign(caKeys.privateKey, forge.md.sha256.create());

  const domainPemKey = pki.privateKeyToPem(domainKeys.privateKey);
  const domainPemCrt = pki.certificateToPem(domainCert);

  fs.writeFileSync(DOMAIN_KEY_PATH, domainPemKey, 'utf8');
  fs.writeFileSync(DOMAIN_CRT_PATH, domainPemCrt, 'utf8');

  console.log('[Brakthroonam MITM] ✅ Certificates generated successfully at:', CERT_DIR);
  return {
    caKey: caPemKey,
    caCrt: caPemCrt,
    domainKey: domainPemKey,
    domainCrt: domainPemCrt
  };
}

/**
 * Check if Brakthroonam Root CA is trusted in Windows Store
 */
let caTrustedCache = null;
let lastCaCheckTime = 0;

function isCaTrustedInWindows() {
  if (process.platform !== 'win32') return true;
  const now = Date.now();
  if (caTrustedCache === true || (now - lastCaCheckTime < 30000)) {
    return caTrustedCache !== null ? caTrustedCache : false;
  }
  lastCaCheckTime = now;
  try {
    const out = execSync('certutil -store "ROOT" "Brakthroonam Router Root CA"', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000 });
    caTrustedCache = out.includes('Brakthroonam Router Root CA');
    return caTrustedCache;
  } catch {
    caTrustedCache = false;
    return false;
  }
}

/**
 * Install Root CA into Windows Trusted Store
 */
function installCaToWindows() {
  if (process.platform !== 'win32') return true;
  generateCertificates();
  try {
    execSync(`certutil -addstore -f "ROOT" "${CA_CRT_PATH}"`, { stdio: 'ignore' });
    process.env.NODE_EXTRA_CA_CERTS = CA_CRT_PATH;
    return true;
  } catch (err) {
    // If permission denied, trigger elevated PowerShell
    const psCmd = `Start-Process certutil -ArgumentList '-addstore', '-f', 'ROOT', '${CA_CRT_PATH}' -Verb RunAs -Wait`;
    execSync(`powershell -NoProfile -Command "${psCmd}"`, { stdio: 'ignore' });
    process.env.NODE_EXTRA_CA_CERTS = CA_CRT_PATH;
    return isCaTrustedInWindows();
  }
}

/**
 * 2. HOSTS FILE REDIRECTION
 */
function isHostsConfigured() {
  if (!fs.existsSync(HOSTS_PATH)) return false;
  try {
    const content = fs.readFileSync(HOSTS_PATH, 'utf8');
    const lines = content.split(/\r?\n/);
    const activeEntries = lines.filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('#') && TARGET_DOMAINS.some(d => trimmed.includes(d) && trimmed.includes('127.0.0.1'));
    });
    return activeEntries.length >= TARGET_DOMAINS.length;
  } catch {
    return false;
  }
}

function enableHosts() {
  if (isHostsConfigured()) return true;
  const content = fs.existsSync(HOSTS_PATH) ? fs.readFileSync(HOSTS_PATH, 'utf8') : '';

  // Clean old entries or commented lines of target domains
  const cleanLines = content.split(/\r?\n/).filter(line => {
    return !TARGET_DOMAINS.some(d => line.includes(d));
  });

  cleanLines.push('# --- BRAKTHROONAM ROUTER ANTIGRAVITY MITM ---');
  TARGET_DOMAINS.forEach(d => {
    cleanLines.push(`127.0.0.1 ${d}`);
  });
  cleanLines.push('# --- END BRAKTHROONAM ROUTER ---');
  cleanLines.push('');

  const newContent = cleanLines.join('\r\n');

  try {
    fs.writeFileSync(HOSTS_PATH, newContent, 'utf8');
    flushDnsCache();
    return true;
  } catch (err) {
    return isHostsConfigured();
  }
}

function disableHosts() {
  if (!fs.existsSync(HOSTS_PATH)) return true;
  const content = fs.readFileSync(HOSTS_PATH, 'utf8');
  const cleanLines = content.split(/\r?\n/).filter(line => {
    return !line.includes('BRAKTHROONAM') && !TARGET_DOMAINS.some(d => line.includes(d));
  });
  const newContent = cleanLines.join('\r\n');

  try {
    fs.writeFileSync(HOSTS_PATH, newContent, 'utf8');
    flushDnsCache();
    return true;
  } catch {
    return !isHostsConfigured();
  }
}

// Graceful shutdown hooks: If process is terminated, auto clean hosts so Antigravity never loses connectivity!
let isShuttingDown = false;
function registerGracefulShutdown() {
  const cleanup = () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    try {
      console.log('[Brakthroonam MITM] 🧹 Graceful shutdown: Restoring hosts to prevent Antigravity downtime...');
      disableHosts();
    } catch (_) {}
  };

  process.once('SIGINT', () => { cleanup(); process.exit(0); });
  process.once('SIGTERM', () => { cleanup(); process.exit(0); });
}
registerGracefulShutdown();

/**
 * 3. REAL GOOGLE IP RESOLUTION (Bypassing localhost hosts file)
 */
async function resolveGoogleIp(domain) {
  return await resolveDirectHost(domain);
}

const exhaustedAccounts = new Map();

function markAccountExhausted(email, isBurst = false) {
  if (!email) return;
  const key = email.toLowerCase().trim();
  // Burst rate limit (RPM) resets in 60s; 5h quota pauses in-memory for 15 minutes
  const ttlMs = isBurst ? 60 * 1000 : 15 * 60 * 1000;
  exhaustedAccounts.set(key, Date.now() + ttlMs);
  console.warn(`[Brakthroonam MITM] 🚫 Marked ${key} on temporary cooldown for ${Math.round(ttlMs / 1000)}s (${isBurst ? 'Burst RPM' : 'Quota'}).`);
}

function clearAccountExhausted(email) {
  if (!email) return;
  const key = email.toLowerCase().trim();
  exhaustedAccounts.delete(key);
}

function isAccountExhausted(email) {
  if (!email) return false;
  const key = email.toLowerCase().trim();
  const exp = exhaustedAccounts.get(key);
  if (!exp) return false;
  if (Date.now() > exp) {
    exhaustedAccounts.delete(key);
    return false;
  }
  return true;
}

function getAccountFromAuthHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const db = getDb();
  const accounts = db.prepare("SELECT * FROM provider_accounts WHERE provider = 'gemini'").all();
  for (const acc of accounts) {
    try {
      const c = JSON.parse(acc.credentials || '{}');
      if (c.accessToken === token) return acc;
    } catch (_) {}
  }
  return null;
}

/**
 * 4. TOKEN POOL & AUTO-SWAP
 */
async function getActiveStandbyAccount(excludeEmails = []) {
  const db = getDb();
  const accounts = db.prepare(`
    SELECT * FROM provider_accounts 
    WHERE provider = 'gemini' AND is_active = 1
    ORDER BY priority ASC
  `).all();

  const excludeSet = new Set((Array.isArray(excludeEmails) ? excludeEmails : [excludeEmails])
    .filter(Boolean)
    .map(e => e.toLowerCase().trim()));

  for (const [email, exp] of exhaustedAccounts.entries()) {
    if (Date.now() < exp) {
      excludeSet.add(email.toLowerCase().trim());
    } else {
      exhaustedAccounts.delete(email);
    }
  }

  for (const acc of accounts) {
    const emailKey = (acc.email || '').toLowerCase().trim();
    if (excludeSet.has(emailKey)) {
      continue;
    }
    const creds = JSON.parse(acc.credentials || '{}');
    if (creds.refreshToken) {
      try {
        const refreshed = await refreshAccessToken(creds.refreshToken);
        creds.accessToken = refreshed.access_token || refreshed.accessToken;
        creds.expiresAt = Date.now() + ((refreshed.expires_in || 3600) * 1000);
        db.prepare("UPDATE provider_accounts SET credentials = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(JSON.stringify(creds), acc.id);
        return { account: acc, accessToken: creds.accessToken, projectId: creds.projectId };
      } catch (e) {
        console.warn(`[Brakthroonam MITM] Token refresh failed for ${acc.email}:`, e.message);
      }
    } else if (creds.accessToken) {
      return { account: acc, accessToken: creds.accessToken, projectId: creds.projectId };
    }
  }
  return null;
}

// Dedicated connection pool agent for upstream Google requests
const upstreamAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 15000,
  maxSockets: 50,
  maxFreeSockets: 20,
  timeout: 0
});

/**
 * 5. MITM HTTPS SERVER (Port 443)
 */
function startMitmServer() {
  if (isMitmRunning && mitmServer) {
    return { success: true, message: 'MITM Server is already running on port 443.' };
  }

  const certs = generateCertificates();
  process.env.NODE_EXTRA_CA_CERTS = CA_CRT_PATH;

  const tlsOptions = {
    key: certs.domainKey,
    cert: `${certs.domainCrt}\n${certs.caCrt}`,
    SNICallback: (servername, cb) => {
      const ctx = tls.createSecureContext({
        key: certs.domainKey,
        cert: `${certs.domainCrt}\n${certs.caCrt}`
      });
      cb(null, ctx);
    }
  };

  mitmServer = https.createServer(tlsOptions, (clientReq, clientRes) => {
    // Keep-alive and socket performance tuning
    if (clientReq.socket) {
      clientReq.socket.setKeepAlive(true, 15000);
      clientReq.socket.setNoDelay(true);
      clientReq.socket.setTimeout(0);
    }
    clientRes.setTimeout(0);

    // Robust socket error prevention
    clientReq.on('error', (err) => {
      console.warn('[Brakthroonam MITM] Client request socket warning:', err.message);
    });
    clientRes.on('error', (err) => {
      console.warn('[Brakthroonam MITM] Client response socket warning:', err.message);
    });

    const hostHeader = (clientReq.headers.host || 'cloudcode-pa.googleapis.com').split(':')[0];
    const isAntigravityStream = clientReq.url.includes(':streamGenerateContent') || clientReq.url.includes(':generateContent');

    // Buffer client request body
    const chunks = [];
    clientReq.on('data', chunk => chunks.push(chunk));
    clientReq.on('end', () => {
      const bodyBuffer = Buffer.concat(chunks);
      handleUpstreamProxy(clientReq, clientRes, hostHeader, bodyBuffer, isAntigravityStream).catch(err => {
        console.error('[Brakthroonam MITM] Unhandled proxy error:', err);
        if (!clientRes.headersSent) {
          clientRes.writeHead(502, { 'Content-Type': 'application/json' });
          clientRes.end(JSON.stringify({ error: { code: 502, message: 'Gateway proxy error: ' + err.message } }));
        }
      });
    });
  });

  // CRITICAL: Disable Node.js 5-minute requestTimeout so agent tasks can run indefinitely without disconnects!
  mitmServer.requestTimeout = 0;
  mitmServer.headersTimeout = 0;
  mitmServer.timeout = 0;
  mitmServer.keepAliveTimeout = 120000;

  mitmServer.on('error', (err) => {
    console.error('[Brakthroonam MITM] Server Error on port 443:', err.message);
    isMitmRunning = false;
    try { mitmServer.close(); } catch (_) {}
  });

  return new Promise((resolve) => {
    mitmServer.once('error', (err) => {
      resolve({ success: false, error: err.message });
    });
    try {
      mitmServer.listen(443, '127.0.0.1', () => {
        isMitmRunning = true;
        console.log('🚀 [Brakthroonam MITM] Listening on 127.0.0.1:443 (Antigravity Intercept Active)');
        resolve({ success: true, message: 'Brakthroonam MITM Proxy đang chạy trên cổng 443.' });
      });
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
}

async function handleUpstreamProxy(clientReq, clientRes, hostHeader, bodyBuffer, isAntigravityStream, retryCount = 0) {
  const realIp = await resolveGoogleIp(hostHeader);
  const { readAntigravityCurrentUsername } = require('./antigravitySyncService');
  
  // Accurate account resolution: Match Bearer token first, then active IDE user
  const accFromToken = getAccountFromAuthHeader(clientReq.headers['authorization']);
  const activeIdeEmail = (readAntigravityCurrentUsername() || '').toLowerCase().trim();
  const currentReqEmail = accFromToken ? accFromToken.email.toLowerCase().trim() : activeIdeEmail;

  const upstreamHeaders = { ...clientReq.headers };
  upstreamHeaders.host = hostHeader;
  delete upstreamHeaders['accept-encoding']; // plain text / stream

  let effectiveBodyBuffer = bodyBuffer;

  // 1. PROACTIVE AUTO-SWAP: Only for inference streams if current account is known to be on cooldown or inactive
  const db = getDb();
  let isCurrentExhausted = currentReqEmail ? isAccountExhausted(currentReqEmail) : false;
  if (!isCurrentExhausted && currentReqEmail) {
    const accRow = db.prepare("SELECT * FROM provider_accounts WHERE lower(email) = lower(?) AND provider = 'gemini'").get(currentReqEmail);
    if (accRow && (accRow.is_active === 0 || accRow.priority >= 90)) {
      isCurrentExhausted = true;
    }
  }

  if (isAntigravityStream && retryCount === 0 && currentReqEmail && isCurrentExhausted) {
    const standby = await getActiveStandbyAccount([currentReqEmail]);
    if (standby && standby.accessToken) {
      console.log(`[Brakthroonam MITM] ⚡ Proactive Auto-Swap: ${currentReqEmail} is on cooldown/inactive -> routing via standby ${standby.account.email}`);
      upstreamHeaders['authorization'] = `Bearer ${standby.accessToken}`;

      if (effectiveBodyBuffer && effectiveBodyBuffer.length > 0) {
        try {
          const bodyJson = JSON.parse(effectiveBodyBuffer.toString('utf8'));
          if (bodyJson.project && standby.projectId) {
            console.log(`[Brakthroonam MITM] 🔄 Swapping request project from ${bodyJson.project} -> ${standby.projectId}`);
            bodyJson.project = standby.projectId;
            effectiveBodyBuffer = Buffer.from(JSON.stringify(bodyJson), 'utf8');
            upstreamHeaders['content-length'] = Buffer.byteLength(effectiveBodyBuffer);
          }
        } catch (err) {}
      }
    }
  }

  const reqOptions = {
    hostname: realIp,
    port: 443,
    path: clientReq.url,
    method: clientReq.method,
    headers: upstreamHeaders,
    servername: hostHeader,
    rejectUnauthorized: false,
    agent: upstreamAgent,
    timeout: 0
  };

  const upstreamReq = https.request(reqOptions, (upstreamRes) => {
    const statusCode = upstreamRes.statusCode;
    const isServerError = statusCode === 503 || statusCode === 500 || statusCode === 502 || statusCode === 504;
    const isRateOrAuth = statusCode === 429 || statusCode === 403 || statusCode === 401;

    // Check if Google returned 429 (Quota), 503 (High Traffic / Capacity), 403 (Subscription), 401 (Token Expired) or 500/502/504
    // ONLY attempt auto-swap for INFERENCE streams (:streamGenerateContent, :generateContent)
    if (isAntigravityStream && (isRateOrAuth || isServerError)) {
      const errChunks = [];
      upstreamRes.on('data', c => errChunks.push(c));
      upstreamRes.on('end', async () => {
        const errBody = Buffer.concat(errChunks).toString('utf8');
        const isQuotaOrAuthOrOverloaded =
          errBody.includes('RESOURCE_EXHAUSTED') ||
          errBody.includes('quota') ||
          errBody.includes('Individual quota') ||
          errBody.includes('UNAUTHENTICATED') ||
          errBody.includes('high traffic') ||
          errBody.includes('UNAVAILABLE') ||
          errBody.includes('overloaded') ||
          isRateOrAuth ||
          isServerError;

        if (isQuotaOrAuthOrOverloaded && retryCount < 3) {
          console.warn(`[Brakthroonam MITM] ⚠️ Upstream hit Quota/Capacity issue (${statusCode}). Initiating Instant Account Auto-Swap...`);
          
          const isBurst = statusCode === 429 && !errBody.includes('Individual quota') && !errBody.includes('RESOURCE_EXHAUSTED');
          if (statusCode !== 401) {
            markAccountExhausted(currentReqEmail, isBurst);
          }

          // Also demote in DB so watcher does not immediately promote it
          try {
            const accToDemote = db.prepare("SELECT id FROM provider_accounts WHERE lower(email) = lower(?) AND provider = 'gemini'").get(currentReqEmail);
            if (accToDemote) {
              const { handleQuotaExhausted } = require('./antigravitySyncService');
              handleQuotaExhausted(accToDemote.id, 'gemini-stream');
            }
          } catch (_) {}

          const standby = await getActiveStandbyAccount([currentReqEmail]);

          if (standby && standby.accessToken) {
            console.log(`[Brakthroonam MITM] 🔄 Swapping token to Standby Account: ${standby.account.email}`);
            
            // Promote standby account as Priority 1
            try {
              db.transaction(() => {
                db.prepare("UPDATE provider_accounts SET priority = priority + 1 WHERE id != ? AND provider = 'gemini'").run(standby.account.id);
                db.prepare("UPDATE provider_accounts SET priority = 1, is_active = 1 WHERE id = ?").run(standby.account.id);
              })();
            } catch (_) {}

            // Retry with new token
            clientReq.headers['authorization'] = `Bearer ${standby.accessToken}`;

            let swappedBody = bodyBuffer;
            if (bodyBuffer && bodyBuffer.length > 0) {
              try {
                const bodyJson = JSON.parse(bodyBuffer.toString('utf8'));
                if (bodyJson.project && standby.projectId) {
                  console.log(`[Brakthroonam MITM] 🔄 Swapping body project from ${bodyJson.project} -> ${standby.projectId}`);
                  bodyJson.project = standby.projectId;
                  swappedBody = Buffer.from(JSON.stringify(bodyJson), 'utf8');
                  clientReq.headers['content-length'] = Buffer.byteLength(swappedBody);
                }
              } catch (err) {}
            }

            return handleUpstreamProxy(clientReq, clientRes, hostHeader, swappedBody, isAntigravityStream, retryCount + 1);
          } else {
            console.warn('[Brakthroonam MITM] ❌ No available standby accounts with quota remaining in pool!');
          }
        }

        // If cannot swap or not a swappable error, pass original upstream response directly
        const errHeaders = { ...upstreamRes.headers };
        delete errHeaders['alt-svc'];
        delete errHeaders['connection'];
        clientRes.writeHead(statusCode, errHeaders);
        clientRes.end(Buffer.concat(errChunks));
      });
      return;
    }

    // Success response - forward stream
    const forwardHeaders = { ...upstreamRes.headers };
    delete forwardHeaders['alt-svc'];
    delete forwardHeaders['connection'];
    delete forwardHeaders['keep-alive'];

    clientRes.writeHead(statusCode, forwardHeaders);
    upstreamRes.pipe(clientRes);

    upstreamRes.on('error', (err) => {
      console.warn('[Brakthroonam MITM] Upstream stream warning:', err.message);
      if (!clientRes.writableEnded) clientRes.end();
    });

    // CRITICAL FIX: Only abort upstream if the client disconnects before the response ends!
    // NEVER abort on clientReq.on('close'), which fires when request upload completes!
    clientRes.on('close', () => {
      if (!clientRes.writableEnded && !upstreamRes.complete) {
        console.log('[Brakthroonam MITM] Client aborted request. Cleaning up upstream connection.');
        upstreamReq.destroy();
      }
    });
  });

  upstreamReq.on('error', async (err) => {
    console.error('[Brakthroonam MITM] Upstream connection warning:', err.message, err.code);
    // If connection was reset or timed out and client response hasn't started, retry with fresh connection!
    if ((err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'EPIPE') && retryCount < 3 && !clientRes.headersSent) {
      console.log(`[Brakthroonam MITM] 🔄 Retrying connection after glitch (${err.code})...`);
      invalidateDnsCache(hostHeader);
      return handleUpstreamProxy(clientReq, clientRes, hostHeader, effectiveBodyBuffer, isAntigravityStream, retryCount + 1);
    }
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'Content-Type': 'application/json' });
      clientRes.end(JSON.stringify({ error: { code: 502, message: 'Brakthroonam MITM Gateway Error: ' + err.message } }));
    } else {
      if (!clientRes.writableEnded) clientRes.end();
    }
  });

  if (effectiveBodyBuffer && effectiveBodyBuffer.length > 0) {
    upstreamReq.write(effectiveBodyBuffer);
  }
  upstreamReq.end();
}

function stopMitmServer() {
  if (mitmServer && isMitmRunning) {
    mitmServer.close();
    mitmServer = null;
    isMitmRunning = false;
    console.log('[Brakthroonam MITM] 🛑 Stopped MITM Proxy on port 443.');
  }
  return { success: true, message: 'Đã dừng MITM Server.' };
}

/**
 * 6. UNIFIED 1-CLICK CONFIGURATION
 */
async function enableMitmAll() {
  generateCertificates();

  if (!isCaTrustedInWindows() || !isHostsConfigured()) {
    let directOk = false;
    try {
      if (process.platform === 'win32') {
        execSync(`certutil -addstore -f "ROOT" "${CA_CRT_PATH}"`, { stdio: 'ignore', timeout: 1500 });
      }
      directOk = enableHosts();
      flushDnsCache();
    } catch (_) {}
  }

  process.env.NODE_EXTRA_CA_CERTS = CA_CRT_PATH;
  await startMitmServer();
  const configured = isHostsConfigured() && isCaTrustedInWindows();
  return {
    success: true,
    hostsConfigured: isHostsConfigured(),
    caInstalled: isCaTrustedInWindows(),
    isRunning: isMitmRunning,
    message: configured
      ? '✅ Đã kích hoạt Antigravity MITM Proxy thành công!'
      : '⚡ Đang thực thi cấu hình Antigravity! Hộp thoại Windows UAC đang hiện lên, bạn chỉ cần chọn "Yes" là xong ngay.'
  };
}

function disableMitmAll() {
  stopMitmServer();
  try {
    disableHosts();
  } catch (_) {}

  return {
    success: true,
    hostsConfigured: isHostsConfigured(),
    isRunning: isMitmRunning,
    message: 'Đã tắt Antigravity MITM Proxy và khôi phục cấu hình mạng trực tiếp.'
  };
}

function getMitmStatus() {
  const db = getDb();
  const totalGemini = db.prepare("SELECT COUNT(*) as c FROM provider_accounts WHERE provider = 'gemini' AND is_active = 1").get().c;
  const currentP1 = db.prepare("SELECT email, name FROM provider_accounts WHERE provider = 'gemini' AND is_active = 1 ORDER BY priority ASC LIMIT 1").get();

  return {
    isRunning: isMitmRunning,
    hostsConfigured: isHostsConfigured(),
    caInstalled: isCaTrustedInWindows(),
    totalActiveAccounts: totalGemini,
    currentAccount: currentP1 ? (currentP1.email || currentP1.name) : 'None',
    certPath: CA_CRT_PATH
  };
}

module.exports = {
  getMitmStatus,
  enableMitmAll,
  disableMitmAll,
  startMitmServer,
  stopMitmServer,
  enableHosts,
  disableHosts,
  isHostsConfigured,
  installCaToWindows,
  generateCertificates,
  isAccountExhausted,
  markAccountExhausted,
  clearAccountExhausted,
  getActiveStandbyAccount
};
