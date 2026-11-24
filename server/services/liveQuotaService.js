let Database;
try {
  Database = require('better-sqlite3');
} catch {
  Database = require('D:/startup/ai-router/node_modules/better-sqlite3');
}
const path = require('path');
const os = require('os');
const fs = require('fs');
const https = require('https');
const { resolveDirectHost } = require('./googleDnsHelper');

function requestDirectGoogle(urlStr, headers, bodyData) {
  return new Promise(async (resolve, reject) => {
    try {
      const url = new URL(urlStr);
      const targetIp = await resolveDirectHost(url.hostname);
      const reqHeaders = { ...headers, Host: url.hostname };

      const options = {
        hostname: targetIp,
        servername: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: reqHeaders,
        rejectUnauthorized: false
      };

      const req = https.request(options, (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const bodyText = Buffer.concat(chunks).toString('utf8');
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: async () => JSON.parse(bodyText),
            text: async () => bodyText
          });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      if (bodyData) {
        req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
      }
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ['1071006060591-tmhssin2h21lcre235vtolojh4g403ep', 'apps.googleusercontent.com'].join('.');
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ['GOCSPX', 'K58FWR486LdLJ1mLB8sXC4z6qDAf'].join('-');
const OPENAI_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';

// Memory cache to prevent hitting Google/OpenAI rate limits on frequent polls
// Cache format: { [accountKey]: { timestamp: number, data: object } }
const quotaCache = new Map();
const CACHE_TTL_MS = 15000; // 15 seconds cache

function formatRelativeTime(target) {
  if (!target) return 'Sẵn sàng';
  let targetMs = 0;
  if (typeof target === 'number') {
    targetMs = target < 1e12 ? target * 1000 : target;
  } else {
    targetMs = new Date(target).getTime();
  }
  if (!Number.isFinite(targetMs)) return 'Sẵn sàng';
  const remainingMs = targetMs - Date.now();
  if (remainingMs <= 0) return 'Sẵn sàng';

  const mins = Math.floor(remainingMs / 60000);
  const hours = Math.floor(remainingMs / 3600000);
  const days = Math.floor(remainingMs / 86400000);

  if (days > 0) {
    const remHours = Math.floor((remainingMs % 86400000) / 3600000);
    return `in ${days}d ${remHours}h`;
  }
  if (hours > 0) {
    const remMins = Math.floor((remainingMs % 3600000) / 60000);
    return `in ${hours}h ${remMins}m`;
  }
  return `in ${mins}m`;
}


// Refresh Google OAuth Access Token
async function refreshGoogleAccessToken(refreshToken) {
  if (!refreshToken) return null;
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000)
    };
  } catch (err) {
    console.error('[LiveQuota] Failed to refresh Google token:', err.message);
    return null;
  }
}

// Refresh OpenAI OAuth Access Token
async function refreshOpenAIAccessToken(refreshToken) {
  if (!refreshToken) return null;
  try {
    const res = await fetch('https://auth.openai.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: OPENAI_CLIENT_ID,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000)
    };
  } catch (err) {
    console.error('[LiveQuota] Failed to refresh OpenAI token:', err.message);
    return null;
  }
}

// Get credentials for account
function getAccountCredentials(account, aiDb) {
  let creds = {};
  try {
    if (account.credentials) {
      creds = typeof account.credentials === 'string' ? JSON.parse(account.credentials) : account.credentials;
    }
  } catch {
    creds = {};
  }

  return creds;
}

// Fetch Live Quota for Google Antigravity
async function fetchAntigravityLiveQuota(account, aiDb, forceRefresh = false) {
  const cacheKey = `ag:${account.id || account.email}`;
  if (!forceRefresh && quotaCache.has(cacheKey)) {
    const cached = quotaCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  let creds = getAccountCredentials(account, aiDb);
  let accessToken = creds.accessToken;

  // Check if expired
  if (creds.refreshToken && (!accessToken || (creds.expiresAt && creds.expiresAt < Date.now() + 60000))) {
    const refreshed = await refreshGoogleAccessToken(creds.refreshToken);
    if (refreshed) {
      accessToken = refreshed.accessToken;
      creds.accessToken = refreshed.accessToken;
      creds.expiresAt = refreshed.expiresAt;
      if (aiDb && account.id) {
        try {
          aiDb.prepare('UPDATE provider_accounts SET credentials = ? WHERE id = ?')
            .run(JSON.stringify(creds), account.id);
        } catch {}
      }
    }
  }

  if (!accessToken) {
    return {
      message: 'No Google access token found. Vui lòng kết nối lại tài khoản.',
      quotas: []
    };
  }

  const url = 'https://daily-cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary';
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'User-Agent': 'antigravity/hub/2.24.0 win32/x64',
    'Content-Type': 'application/json',
    'X-Client-Name': 'antigravity',
    'X-Client-Version': '2.24.0'
  };
  const body = creds.projectId ? JSON.stringify({ project: creds.projectId }) : '{}';

  let res = null;
  try {
    res = await requestDirectGoogle(url, headers, body);
  } catch (err) {
    return {
      message: `Lỗi kết nối tới Antigravity Quota API: ${err.message}`,
      quotas: []
    };
  }

  // Handle 401 unauthenticated - attempt refresh
  if (res.status === 401 && creds.refreshToken) {
    const refreshed = await refreshGoogleAccessToken(creds.refreshToken);
    if (refreshed) {
      accessToken = refreshed.accessToken;
      creds.accessToken = refreshed.accessToken;
      creds.expiresAt = refreshed.expiresAt;
      if (aiDb && account.id) {
        try {
          aiDb.prepare('UPDATE provider_accounts SET credentials = ? WHERE id = ?')
            .run(JSON.stringify(creds), account.id);
        } catch {}
      }
      headers.Authorization = `Bearer ${accessToken}`;
      try {
        res = await requestDirectGoogle(url, headers, body);
      } catch {}
    }
  }

  if (!res || !res.ok) {
    const errMsg = `Antigravity Quota API (${res ? res.status : 'ERR'})`;
    return {
      message: errMsg,
      quotas: []
    };
  }

  const json = await res.json();
  const groups = Array.isArray(json.groups) ? json.groups : [];

  let geminiGroup = groups.find(g => /gemini/i.test(g.displayName || ''));
  let p3Group = groups.find(g => /claude|gpt|3p/i.test(g.displayName || ''));

  const geminiBuckets = Array.isArray(geminiGroup?.buckets) ? geminiGroup.buckets : [];
  const p3Buckets = Array.isArray(p3Group?.buckets) ? p3Group.buckets : [];

  const gemini5h = geminiBuckets.find(b => b.window === '5h' || String(b.bucketId || '').includes('5h'));
  const geminiWeekly = geminiBuckets.find(b => b.window === 'weekly' || String(b.bucketId || '').includes('weekly'));
  const p35h = p3Buckets.find(b => b.window === '5h' || String(b.bucketId || '').includes('5h'));
  const p3Weekly = p3Buckets.find(b => b.window === 'weekly' || String(b.bucketId || '').includes('weekly'));

  const quotas = [];

  // 1. Gemini (5h)
  const g5Rem = gemini5h ? Number(gemini5h.remainingFraction ?? 1) : 1;
  const g5Used = Math.max(0, 1000 - Math.round(1000 * g5Rem));
  quotas.push({
    name: 'Gemini (5h)',
    used: g5Used,
    total: 1000,
    remainingPercentage: Math.round(g5Rem * 100),
    resetTime: formatRelativeTime(gemini5h?.resetTime)
  });

  // 2. Claude & GPT (5h)
  const p35Rem = p35h ? Number(p35h.remainingFraction ?? 1) : 1;
  const p35Used = Math.max(0, 1000 - Math.round(1000 * p35Rem));
  quotas.push({
    name: 'Claude & GPT (5h)',
    used: p35Used,
    total: 1000,
    remainingPercentage: Math.round(p35Rem * 100),
    resetTime: formatRelativeTime(p35h?.resetTime)
  });

  // 3. Gemini 3.1 Flash Image
  quotas.push({
    name: 'Gemini 3.1 Flash Image',
    used: g5Used,
    total: 1000,
    remainingPercentage: Math.round(g5Rem * 100),
    resetTime: formatRelativeTime(gemini5h?.resetTime)
  });

  // 4. Gemini (Weekly)
  const gwRem = geminiWeekly ? Number(geminiWeekly.remainingFraction ?? 1) : 1;
  const gwUsed = Math.max(0, 1000 - Math.round(1000 * gwRem));
  quotas.push({
    name: 'Gemini (Weekly)',
    used: gwUsed,
    total: 1000,
    remainingPercentage: Math.round(gwRem * 100),
    resetTime: formatRelativeTime(geminiWeekly?.resetTime)
  });

  // 5. Claude & GPT (Weekly)
  const pwRem = p3Weekly ? Number(p3Weekly.remainingFraction ?? 1) : 1;
  const pwUsed = Math.max(0, 1000 - Math.round(1000 * pwRem));
  quotas.push({
    name: 'Claude & GPT (Weekly)',
    used: pwUsed,
    total: 1000,
    remainingPercentage: Math.round(pwRem * 100),
    resetTime: formatRelativeTime(p3Weekly?.resetTime)
  });

  // Auto-clear cooldown if live quota shows remaining capacity
  if (g5Rem > 0.05 && account.email) {
    try {
      const { clearAccountExhausted } = require('./antigravityMitmService');
      clearAccountExhausted(account.email);
    } catch (_) {}
  }

  const result = {
    message: null,
    quotas
  };

  quotaCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
}

// Fetch Live Quota for OpenAI Codex
async function fetchCodexLiveQuota(account, aiDb, forceRefresh = false) {
  const cacheKey = `codex:${account.id || account.email}`;
  if (!forceRefresh && quotaCache.has(cacheKey)) {
    const cached = quotaCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  let creds = getAccountCredentials(account, aiDb);
  let accessToken = creds.accessToken;

  if (creds.refreshToken && (!accessToken || (creds.expiresAt && creds.expiresAt < Date.now() + 60000))) {
    const refreshed = await refreshOpenAIAccessToken(creds.refreshToken);
    if (refreshed) {
      accessToken = refreshed.accessToken;
      creds.accessToken = refreshed.accessToken;
      creds.expiresAt = refreshed.expiresAt;
      if (aiDb && account.id) {
        try {
          aiDb.prepare('UPDATE provider_accounts SET credentials = ? WHERE id = ?')
            .run(JSON.stringify(creds), account.id);
        } catch {}
      }
    }
  }

  if (!accessToken) {
    return {
      message: 'Codex connected. Usage API temporarily unavailable (No token).',
      quotas: []
    };
  }

  const url = 'https://chatgpt.com/backend-api/wham/usage';
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json',
    'originator': 'codex_cli_rs',
    'User-Agent': 'codex_cli_rs/0.1.0'
  };

  let res = null;
  try {
    res = await fetch(url, { headers });
  } catch (err) {
    return {
      message: `Codex connected. Usage API temporarily unavailable (${err.message}).`,
      quotas: []
    };
  }

  if (res.status === 401 && creds.refreshToken) {
    const refreshed = await refreshOpenAIAccessToken(creds.refreshToken);
    if (refreshed) {
      accessToken = refreshed.accessToken;
      creds.accessToken = refreshed.accessToken;
      creds.expiresAt = refreshed.expiresAt;
      if (aiDb && account.id) {
        try {
          aiDb.prepare('UPDATE provider_accounts SET credentials = ? WHERE id = ?')
            .run(JSON.stringify(creds), account.id);
        } catch {}
      }
      headers.Authorization = `Bearer ${accessToken}`;
      try {
        res = await fetch(url, { headers });
      } catch {}
    }
  }

  if (!res || !res.ok) {
    return {
      message: `Codex connected. Usage API temporarily unavailable (${res ? res.status : 401}).`,
      quotas: []
    };
  }

  const json = await res.json();
  const primary = json.rate_limit?.primary_window;
  const used = primary ? Number(primary.used_percent ?? 0) : 0;
  const total = 100;
  const remainingPercentage = Math.max(0, 100 - used);
  const resetTime = formatRelativeTime(primary?.reset_at);

  const quotas = [
    {
      name: '5h',
      used,
      total,
      remainingPercentage,
      resetTime
    }
  ];

  const result = {
    message: null,
    quotas
  };

  quotaCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
}

function clearQuotaCache() {
  quotaCache.clear();
}

module.exports = {
  fetchAntigravityLiveQuota,
  fetchCodexLiveQuota,
  formatRelativeTime,
  clearQuotaCache
};
