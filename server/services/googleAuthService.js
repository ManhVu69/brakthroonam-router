const https = require('https');
const { resolveDirectHost } = require('./googleDnsHelper');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ['1071006060591-tmhssin2h21lcre235vtolojh4g403ep', 'apps.googleusercontent.com'].join('.');
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ['GOCSPX', 'K58FWR486LdLJ1mLB8sXC4z6qDAf'].join('-');

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/cclog',
  'https://www.googleapis.com/auth/experimentsandconfigs'
];

async function makeHttpsRequest(urlStr, options = {}, bodyData = null) {
  const url = new URL(urlStr);
  const targetHost = await resolveDirectHost(url.hostname);
  const reqHeaders = {
    'User-Agent': 'google-api-nodejs-client/9.15.1',
    ...options.headers
  };
  if (targetHost !== url.hostname) {
    reqHeaders['Host'] = url.hostname;
  }

  return new Promise((resolve, reject) => {
    const reqOptions = {
      method: options.method || 'GET',
      hostname: targetHost,
      servername: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      headers: reqHeaders,
      rejectUnauthorized: false,
      timeout: 15000
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch {
          resolve({ status: res.statusCode, data, raw: data });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

function getAuthUrl(redirectUri, state = 'gemini') {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent select_account',
    state: state
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCode(code, redirectUri) {
  const body = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  }).toString();

  const res = await makeHttpsRequest('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }, body);

  if (res.status !== 200 || !res.data.access_token) {
    throw new Error(res.data?.error_description || res.data?.error || `Token exchange failed with HTTP ${res.status}`);
  }

  return res.data; // { access_token, refresh_token, expires_in, scope }
}

async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    grant_type: 'refresh_token'
  }).toString();

  const res = await makeHttpsRequest('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }, body);

  if (res.status !== 200 || !res.data.access_token) {
    throw new Error(res.data?.error_description || `Token refresh failed with HTTP ${res.status}`);
  }

  return res.data;
}

async function getUserInfo(accessToken) {
  const res = await makeHttpsRequest('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (res.status !== 200) {
    throw new Error(`Failed to fetch user info: HTTP ${res.status}`);
  }

  return res.data; // { id, email, verified_email, name, picture }
}

async function loadCodeAssist(accessToken) {
  try {
    const res = await makeHttpsRequest('https://cloudcode-pa.googleapis.com/v1internal:loadCodeAssist', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'antigravity/1.10.0 windows/amd64',
        'X-Goog-Api-Client': 'google-cloud-sdk vscode_cloudshelleditor/0.1'
      }
    }, {
      metadata: {
        ideType: 'ANTIGRAVITY',
        platform: 'WINDOWS_AMD64',
        pluginType: 'GEMINI',
        ideName: 'antigravity',
        ideVersion: '1.10.0'
      },
      mode: 1
    });

    if (res.status === 200 && res.data) {
      const proj = res.data.cloudaicompanionProject?.id || res.data.cloudaicompanionProject || 'aicode-consumers';
      return { projectId: proj, data: res.data };
    }
  } catch (err) {
    console.warn('[GoogleAuth] loadCodeAssist warning:', err.message);
  }
  return { projectId: 'aicode-consumers' };
}

async function fetchAvailableModels(accessToken, projectId = '') {
  try {
    const proj = projectId || 'aicode-consumers';
    const res = await makeHttpsRequest('https://cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'antigravity/1.10.0 windows/amd64',
        'X-Goog-Api-Client': 'google-cloud-sdk vscode_cloudshelleditor/0.1'
      }
    }, { project: proj });

    if (res.status === 200 && res.data) {
      if (Array.isArray(res.data.models)) {
        return res.data.models.map(m => ({
          id: m.id || m.model || m.name,
          name: m.displayName || m.name || m.id
        }));
      }
      if (typeof res.data.models === 'object') {
        return Object.entries(res.data.models).map(([k, v]) => ({
          id: k,
          name: v.displayName || v.name || k
        }));
      }
    }
  } catch (err) {
    console.warn('[GoogleAuth] fetchAvailableModels warning:', err.message);
  }

  // Fallback default Antigravity models if empty
  return [
    { id: 'gemini-3.8-flash-high', name: 'Gemini 3.8 Flash (High)' },
    { id: 'gemini-3.8-flash-medium', name: 'Gemini 3.8 Flash (Medium)' },
    { id: 'gemini-3.8-flash-low', name: 'Gemini 3.8 Flash (Low)' },
    { id: 'gemini-3.7-flash-high', name: 'Gemini 3.7 Flash (High)' },
    { id: 'gemini-3.1-pro-high', name: 'Gemini 3.1 Pro (High)' },
    { id: 'claude-sonnet-5-5-high', name: 'Claude Sonnet 5.5 (High)' },
    { id: 'claude-opus-5-5-high', name: 'Claude Opus 5.5 (High)' },
    { id: 'gpt-oss-120b-medium', name: 'GPT-OSS 120B (Medium)' }
  ];
}

async function fetchQuotaSummary(accessToken, projectId = '') {
  try {
    const proj = projectId || 'aicode-consumers';
    const res = await makeHttpsRequest('https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'antigravity/1.10.0 windows/amd64',
        'X-Goog-Api-Client': 'google-cloud-sdk vscode_cloudshelleditor/0.1'
      }
    }, { project: proj });

    if (res.status === 200 && res.data) {
      const groups = res.data.groups || res.data.quotaSummary?.groups || [];
      const quotas = [];

      for (const group of groups) {
        const groupName = group.displayName || '';
        for (const bucket of (group.buckets || [])) {
          const window = String(bucket.window || '').toLowerCase();
          const bucketName = `${bucket.bucketId || ''} ${bucket.displayName || ''}`.toLowerCase();
          const isWeekly = window === 'weekly' || bucketName.includes('weekly');
          const is5h = window === '5h' || bucketName.includes('5h') || bucketName.includes('five hour') || window === 'daily';

          if (!isWeekly && !is5h) continue;

          const remainingFraction = bucket.disabled ? 0 : Number(bucket.remainingFraction ?? 1);
          const remainingPct = Math.round(remainingFraction * 100);

          quotas.push({
            name: `${groupName} (${isWeekly ? 'Weekly' : '5h'})`,
            window: isWeekly ? 'Weekly' : '5h',
            remainingPercentage: remainingPct,
            resetTime: bucket.resetTime || null,
            disabled: !!bucket.disabled
          });
        }
      }
      return quotas;
    }
  } catch (err) {
    console.warn('[GoogleAuth] fetchQuotaSummary warning:', err.message);
  }
  return [];
}

module.exports = {
  GOOGLE_CLIENT_ID,
  getAuthUrl,
  exchangeCode,
  refreshAccessToken,
  getUserInfo,
  loadCodeAssist,
  fetchAvailableModels,
  fetchQuotaSummary
};
