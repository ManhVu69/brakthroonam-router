const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const os = require('os');
const { getDb } = require('../db');
const { getAllProviders, getProviderById, getAllCatalogModels } = require('../services/providerService');
const googleAuthService = require('../services/googleAuthService');
const openAiAuthService = require('../services/openAiAuthService');
const claudeAuthService = require('../services/claudeAuthService');
const {
  listAccountsByProvider,
  getAllActiveAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  testAndSaveAccountStatus
} = require('../services/accountService');
const { probeAccountModels } = require('../services/connectionVerifier');
const {
  listCombos,
  createCombo,
  updateCombo,
  deleteCombo
} = require('../services/comboService');
const {
  getUsageSummary,
  getRecentLogs,
  getHourlyChartData,
  getActiveRequests,
  detectRunningAgents
} = require('../services/usageService');
const antigravityMitmService = require('../services/antigravityMitmService');
const clientConfigService = require('../services/clientConfigService');
const {
  fetchAntigravityLiveQuota,
  fetchCodexLiveQuota,
  clearQuotaCache
} = require('../services/liveQuotaService');
const { getLiveTaskExecution } = require('../services/taskTrackerService');

// Disable all HTTP caching for API endpoints so real-time updates and auto-refresh always fetch latest data
router.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
});

// --- 1. SYSTEM & ENDPOINT STATUS ---
router.get('/status', (req, res) => {
  const db = getDb();
  const settingsRow = db.prepare("SELECT value FROM settings WHERE key = 'app_config'").get();
  const config = settingsRow ? JSON.parse(settingsRow.value) : {};

  const totalAccounts = db.prepare("SELECT COUNT(*) as count FROM provider_accounts WHERE is_active = 1").get().count;
  const totalCombos = db.prepare("SELECT COUNT(*) as count FROM combos").get().count;
  const usageTotals = db.prepare("SELECT COALESCE(SUM(total_tokens), 0) as tokens, COUNT(*) as requests FROM usage_logs").get();

  res.json({
    status: 'online',
    version: '1.0.2',
    port: config.port || 20129,
    requireApiKey: !!config.requireApiKey,
    endpoint: `http://localhost:${config.port || 20129}/v1`,
    totalActiveAccounts: totalAccounts,
    totalCombos: totalCombos,
    totalTokens: usageTotals.tokens,
    totalRequests: usageTotals.requests
  });
});

// --- 2. MASTER CLIENT API KEYS ---
router.get('/keys', (req, res) => {
  const db = getDb();
  const keys = db.prepare("SELECT id, name, key, is_active, created_at FROM api_keys ORDER BY created_at DESC").all();
  res.json(keys);
});

router.post('/keys', (req, res) => {
  const db = getDb();
  const { name = 'New Key' } = req.body;
  const id = 'key_' + Math.random().toString(36).substring(2, 10);
  const key = 'sk-airouter-' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

  db.prepare("INSERT INTO api_keys (id, name, key, is_active) VALUES (?, ?, ?, 1)").run(id, name, key);
  res.json({ id, name, key, is_active: 1 });
});

router.delete('/keys/:id', (req, res) => {
  const db = getDb();
  db.prepare("DELETE FROM api_keys WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

router.patch('/keys/:id/toggle', (req, res) => {
  const db = getDb();
  const current = db.prepare("SELECT is_active FROM api_keys WHERE id = ?").get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Key not found' });

  const nextStatus = current.is_active ? 0 : 1;
  db.prepare("UPDATE api_keys SET is_active = ? WHERE id = ?").run(nextStatus, req.params.id);
  res.json({ success: true, is_active: nextStatus });
});

// --- 3. GOOGLE OAUTH FOR GEMINI / ANTIGRAVITY ---
router.get('/auth/google/start', (req, res) => {
  const host = req.get('host') || 'localhost:20129';
  const protocol = req.protocol || 'http';
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
  const authUrl = googleAuthService.getAuthUrl(redirectUri, 'gemini');
  res.json({ authUrl, redirectUri });
});

// --- 3.1 OPENAI CODEX OAUTH ---
router.get('/auth/openai/start', (req, res) => {
  try {
    const authUrl = openAiAuthService.getOpenAiAuthUrl();
    res.json({ authUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 3.2 ANTHROPIC CLAUDE OAUTH ---
router.get('/auth/claude/start', (req, res) => {
  try {
    const host = req.get('host') || 'localhost:20129';
    const protocol = req.protocol || 'http';
    const redirectUri = `${protocol}://${host}/api/auth/claude/callback`;
    const authUrl = claudeAuthService.getClaudeAuthUrl(redirectUri);
    res.json({ authUrl, redirectUri });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/auth/claude/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('<h3>Error: Missing authorization code from Claude</h3>');
  }

  const host = req.get('host') || 'localhost:20129';
  const protocol = req.protocol || 'http';
  const redirectUri = `${protocol}://${host}/api/auth/claude/callback`;

  try {
    const result = await claudeAuthService.exchangeClaudeCode(code, redirectUri);
    const email = result.email;

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Claude Authentication Successful</title>
        <style>
          body { background: #0d0d10; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
          .card { background: #18181e; border: 1px solid #272732; border-radius: 12px; padding: 32px; max-width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          .icon { font-size: 48px; margin-bottom: 16px; }
          .email { color: #d97706; font-weight: bold; margin: 8px 0; }
          .btn { display: inline-block; background: #d97706; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px; cursor: pointer; border: none; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✅</div>
          <h2>Đăng nhập Claude Thành Công!</h2>
          <p>Tài khoản <span class="email">${email}</span> đã được liên kết với Brakthroonam Router.</p>
          <button class="btn" onclick="if (window.opener) { window.opener.postMessage({ type: 'CLAUDE_AUTH_SUCCESS', email: '${email}' }, '*'); window.close(); } else { window.location.href = '/'; }">Quay lại Dashboard</button>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'CLAUDE_AUTH_SUCCESS', email: '${email}' }, '*');
            setTimeout(() => window.close(), 1200);
          } else {
            setTimeout(() => { window.location.href = '/'; }, 2000);
          }
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('[Claude OAuth Callback] Error:', err);
    res.status(500).send(`
      <div style="background:#0d0d10;color:#ef4444;font-family:sans-serif;padding:30px;text-align:center;">
        <h2>Đăng nhập Claude thất bại</h2>
        <p>${err.message}</p>
        <a href="/" style="color:#d97706;">Quay lại Dashboard</a>
      </div>
    `);
  }
});

router.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  const targetProvider = req.query.state || 'gemini';
  if (!code) {
    return res.status(400).send('<h3>Error: Missing authorization code from Google</h3>');
  }

  const host = req.get('host') || 'localhost:20129';
  const protocol = req.protocol || 'http';
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  try {
    // 1. Exchange code for access & refresh tokens
    const tokens = await googleAuthService.exchangeCode(code, redirectUri);
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;

    // 2. Fetch User Profile
    const userInfo = await googleAuthService.getUserInfo(accessToken);
    const email = userInfo.email;
    const name = userInfo.name || email;

    let projectId = '';
    let quotas = [];
    let modelsCount = 5;

    if (targetProvider === 'gemini') {
      // 3. Load Code Assist project for Gemini
      const assist = await googleAuthService.loadCodeAssist(accessToken);
      projectId = assist.projectId || '';
      quotas = await googleAuthService.fetchQuotaSummary(accessToken, projectId);
      modelsCount = 6;
    } else if (targetProvider === 'codex') {
      quotas = [
        { name: 'Codex (5h)', window: '5h', remainingPercentage: 92, resetTime: 'in 14d' }
      ];
      modelsCount = 5;
    } else {
      quotas = [
        { name: 'Claude Messages (5h)', window: '5h', remainingPercentage: 96, resetTime: 'in 4h 23m' }
      ];
      modelsCount = 3;
    }

    // 4. Store / Update Account in DB
    const db = getDb();
    const existing = db.prepare("SELECT id FROM provider_accounts WHERE provider = ? AND email = ?").get(targetProvider, email);
    const credentials = JSON.stringify({
      accessToken,
      refreshToken,
      expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
      projectId,
      scope: tokens.scope
    });

    let accountId;
    if (existing) {
      accountId = existing.id;
      db.prepare(`
        UPDATE provider_accounts
        SET auth_type = 'oauth', credentials = ?, name = ?, test_status = 'verified', 
            test_message = 'Connected via Google OAuth', models_count = ?, quotas = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(credentials, name, modelsCount, JSON.stringify(quotas), accountId);
    } else {
      accountId = 'acc_' + Math.random().toString(36).substring(2, 10);
      db.prepare(`
        INSERT INTO provider_accounts (id, provider, name, email, auth_type, credentials, priority, is_active, test_status, test_message, models_count, quotas)
        VALUES (?, ?, ?, ?, 'oauth', ?, 1, 1, 'verified', 'Connected via Google OAuth', ?, ?)
      `).run(accountId, targetProvider, name, email, credentials, modelsCount, JSON.stringify(quotas));
    }

    // Return friendly HTML that closes window or redirects to app
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Google Authentication Successful</title>
        <style>
          body { background: #0d0d10; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
          .card { background: #18181e; border: 1px solid #272732; border-radius: 12px; padding: 32px; max-width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          .icon { font-size: 48px; margin-bottom: 16px; }
          .email { color: #f97316; font-weight: bold; margin: 8px 0; }
          .btn { display: inline-block; background: #f97316; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px; cursor: pointer; border: none; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✅</div>
          <h2>Đăng nhập Google Thành Công!</h2>
          <p>Tài khoản <span class="email">${email}</span> đã được liên kết với <strong>${targetProvider.toUpperCase()}</strong>.</p>
          <p style="color: #9ca3af; font-size: 14px;">Bạn có thể đóng cửa sổ này để quay lại giao diện quản trị.</p>
          <button class="btn" onclick="if (window.opener) { window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', email: '${email}', provider: '${targetProvider}' }, '*'); window.close(); } else { window.location.href = '/'; }">Quay lại Dashboard</button>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', email: '${email}', provider: '${targetProvider}' }, '*');
            setTimeout(() => window.close(), 1200);
          } else {
            setTimeout(() => { window.location.href = '/'; }, 2000);
          }
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('[Google OAuth Callback] Error:', err);
    res.status(500).send(`
      <div style="background:#0d0d10;color:#ef4444;font-family:sans-serif;padding:30px;text-align:center;">
        <h2>Đăng nhập Google thất bại</h2>
        <p>${err.message}</p>
        <a href="/" style="color:#f97316;">Quay lại Dashboard</a>
      </div>
    `);
  }
});

// --- 4. PROVIDERS & ACCOUNTS ---
router.get('/providers', (req, res) => {
  const db = getDb();
  const providers = getAllProviders();

  // Attach connection count for each provider
  const counts = db.prepare(`
    SELECT 
      CASE WHEN provider = 'antigravity' THEN 'gemini' ELSE provider END as unified_provider,
      COUNT(*) as total,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
    FROM provider_accounts
    GROUP BY unified_provider
  `).all();

  const countMap = {};
  for (const c of counts) {
    countMap[c.unified_provider] = c;
  }

  const result = providers.map(p => ({
    ...p,
    connectedCount: countMap[p.id]?.total || 0,
    activeCount: countMap[p.id]?.active || 0
  }));

  res.json(result);
});

router.get('/providers/:provider/accounts', (req, res) => {
  const accounts = listAccountsByProvider(req.params.provider);
  res.json(accounts);
});

router.post('/providers/:provider/accounts', async (req, res) => {
  const { name, email, api_key, auth_type = 'api_key', credentials, base_url, priority } = req.body;
  if (!name && !email) {
    return res.status(400).json({ error: 'Email hoặc tên tài khoản là bắt buộc (ví dụ user@gmail.com)' });
  }

  const account = await createAccount({
    provider: req.params.provider,
    name: name || email,
    email: email || name,
    api_key,
    auth_type,
    credentials,
    base_url,
    priority: priority || 1
  });

  res.json(account);
});

router.post('/providers/:provider/accounts/:id/test', async (req, res) => {
  const tested = await testAndSaveAccountStatus(req.params.id);
  res.json(tested);
});

router.post('/providers/:provider/accounts/:id/probe', async (req, res) => {
  try {
    const probe = await probeAccountModels(req.params.id);
    res.json(probe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/providers/:provider/accounts/:id', async (req, res) => {
  const updated = updateAccount(req.params.id, req.body);
  if (req.body.api_key) {
    await testAndSaveAccountStatus(req.params.id);
  }
  res.json(updated);
});

router.delete('/providers/:provider/accounts/:id', (req, res) => {
  deleteAccount(req.params.id);
  res.json({ success: true });
});

// --- 5. MODEL CATALOG WITH TIERS ---
router.get('/models/catalog', (req, res) => {
  const models = getAllCatalogModels();
  res.json(models);
});

// --- 6. COMBOS ---
router.get('/combos', (req, res) => {
  const combos = listCombos();
  res.json(combos);
});

router.post('/combos', (req, res) => {
  const { name, strategy = 'fallback', models = [] } = req.body;
  if (!name) return res.status(400).json({ error: 'Combo name is required' });
  const combo = createCombo({ name, strategy, models });
  res.json(combo);
});

router.patch('/combos/:id', (req, res) => {
  const updated = updateCombo(req.params.id, req.body);
  res.json(updated);
});

router.delete('/combos/:id', (req, res) => {
  deleteCombo(req.params.id);
  res.json({ success: true });
});

// --- 6.5. AGENT ROLES & TASK ROUTING (PLAN, CODE, TEST, REVIEW) ---
const {
  AGENT_ROLES_PATH,
  loadRoles,
  syncSkills,
  syncAllGlobalSkills,
  getGlobalSkillsStatus
} = require('../services/skillSyncService');

router.get('/agent-roles', (req, res) => {
  try {
    const roles = loadRoles();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/agent-roles', (req, res) => {
  try {
    const roles = req.body;
    fs.mkdirSync(path.dirname(AGENT_ROLES_PATH), { recursive: true });
    fs.writeFileSync(AGENT_ROLES_PATH, JSON.stringify(roles, null, 2), 'utf8');

    // Đồng bộ trực tiếp vào bảng combos: Giữ các combo chuẩn (plan, code, test, review, ask)
    if (roles.planner) {
      const chain = [roles.planner.primaryModel, ...(roles.planner.fallbackChain || [])].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
      createCombo({ name: 'combo-plan', strategy: 'fallback', models: chain });
    }
    if (roles.coder) {
      const chain = [roles.coder.primaryModel, ...(roles.coder.fallbackChain || [])].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
      createCombo({ name: 'combo-code', strategy: 'fallback', models: chain });
    }
    if (roles.tester) {
      const chain = [roles.tester.primaryModel, ...(roles.tester.fallbackChain || [])].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
      createCombo({ name: 'combo-test', strategy: 'fallback', models: chain });
    }
    if (roles.review_security || roles.review_architecture || roles.review_functional) {
      const reviewModels = [
        roles.review_security?.primaryModel,
        roles.review_architecture?.primaryModel,
        roles.review_functional?.primaryModel,
        ...(roles.review_security?.fallbackChain || [])
      ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
      createCombo({ name: 'combo-review', strategy: 'fallback', models: reviewModels });
    }
    if (roles.ask) {
      const chain = [roles.ask.primaryModel, ...(roles.ask.fallbackChain || [])].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
      createCombo({ name: 'combo-ask', strategy: 'fallback', models: chain });
    }

    // Xóa các combo alias cũ không dùng
    try {
      const db = getDb();
      db.prepare("DELETE FROM combos WHERE name IN ('combo-planner', 'combo-coder', 'combo-tester')").run();
    } catch (_) {}

    // Chỉ cập nhật lại các targets mà người dùng đã kích hoạt/đồng bộ từ trước
    const currentStatus = getGlobalSkillsStatus();
    if (currentStatus && currentStatus.targets) {
      for (const [key, target] of Object.entries(currentStatus.targets)) {
        if (target.installed) {
          syncSkills(key, roles);
        }
      }
    }

    res.json({ success: true, message: 'Đã lưu cấu hình Agent Roles thành công!', roles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/skills/status', (req, res) => {
  try {
    const status = getGlobalSkillsStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/skills/sync', (req, res) => {
  try {
    const target = req.body?.target || 'antigravity';
    const result = syncSkills(target);
    let targetName = 'Google Antigravity';
    if (target === 'codex') targetName = 'OpenAI Codex / ChatGPT';
    else if (target === 'claude') targetName = 'Anthropic Claude Code';
    else if (target === 'all') targetName = 'Tất cả nền tảng AI Agent';

    res.json({
      success: true,
      message: `Đã đồng bộ 4 Skills cho ${targetName} thành công!`,
      target,
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 7. USAGE, ACTIVE REQUESTS & TOPOLOGY ---
router.get('/usage/summary', (req, res) => {
  const summary = getUsageSummary();
  res.json(summary);
});

router.get('/usage/active', (req, res) => {
  if (typeof syncNineRouterUsage === 'function') {
    syncNineRouterUsage();
  }
  const active = getActiveRequests();
  const detectedAgents = typeof detectRunningAgents === 'function' ? detectRunningAgents() : [];
  res.json({
    activeRequests: active,
    detectedAgents: detectedAgents
  });
});

router.get('/usage/logs', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const logs = getRecentLogs(limit);
  res.json(logs);
});

router.post('/usage/clear-logs', (req, res) => {
  try {
    const db = getDb();
    db.prepare("DELETE FROM request_logs").run();
    res.json({ success: true, message: 'Đã dọn dẹp toàn bộ lịch sử request logs!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/usage/chart', (req, res) => {
  const chartData = getHourlyChartData();
  res.json(chartData);
});

function formatTimeRemaining(ms) {
  if (ms <= 0) return 'sắp reset';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `in ${days}d ${remHours}h`;
  }
  if (hours > 0) {
    return `in ${hours}h ${mins}m`;
  }
  return `in ${mins}m`;
}

// --- 8. QUOTA TRACKER DATA ---
router.get('/quotas', async (req, res) => {
  if (typeof syncNineRouterUsage === 'function') {
    syncNineRouterUsage();
  }

  const db = getDb();
  const accounts = db.prepare(`
    SELECT id, provider, name, email, auth_type, test_status, quotas, updated_at, last_error, last_error_at, credentials, is_active
    FROM provider_accounts
    WHERE is_active = 1
    ORDER BY provider ASC, priority ASC
  `).all();

  const forceRefresh = req.query.refresh === 'true' || req.query.refresh === '1';

  const formatted = await Promise.all(accounts.map(async acc => {
    const email = acc.email || acc.name;
    const rawProv = (acc.provider || '').toLowerCase();
    const isGemini = rawProv === 'gemini' || rawProv === 'antigravity';
    const isCodex = rawProv === 'codex';

    let quotas = [];
    let message = null;

    if (isGemini) {
      const live = await fetchAntigravityLiveQuota(acc, db, forceRefresh);
      quotas = (live.quotas || []).map(q => ({
        name: q.name,
        window: q.name.includes('Weekly') ? 'Weekly' : '5h',
        used: q.used,
        total: q.total,
        remainingPercentage: q.remainingPercentage,
        resetTime: q.resetTime
      }));
      message = live.message;
    } else if (isCodex) {
      const live = await fetchCodexLiveQuota(acc, db, forceRefresh);
      quotas = (live.quotas || []).map(q => ({
        name: 'Codex (5h)',
        window: '5h',
        used: q.used,
        total: q.total,
        remainingPercentage: q.remainingPercentage,
        resetTime: q.resetTime
      }));
      message = live.message;
    } else {
      quotas = [
        { name: 'Standard (5h)', window: '5h', used: 0, total: 1000, remainingPercentage: 100, resetTime: 'Sẵn sàng' }
      ];
    }

    return {
      id: acc.id,
      provider: acc.provider,
      name: acc.name,
      email: email,
      auth_type: acc.auth_type,
      status: message ? 'warning' : (acc.test_status || 'active'),
      quotas,
      message
    };
  }));

  res.json(formatted);
});

// --- 9. SETTINGS ---
router.get('/settings', (req, res) => {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'app_config'").get();
  res.json(row ? JSON.parse(row.value) : {});
});

router.patch('/settings', (req, res) => {
  const db = getDb();
  const current = db.prepare("SELECT value FROM settings WHERE key = 'app_config'").get();
  const config = current ? JSON.parse(current.value) : {};

  const newConfig = { ...config, ...req.body };
  db.prepare("UPDATE settings SET value = ? WHERE key = 'app_config'").run(JSON.stringify(newConfig));
  res.json(newConfig);
});

// --- 10. DEDICATED FULL QUOTA TRACKER SCREEN API (ONLY USER'S CONFIGURED ACCOUNTS) ---
router.get('/quota-tracker', async (req, res) => {
  if (typeof syncNineRouterUsage === 'function') {
    syncNineRouterUsage();
  }

  const aiDb = getDb();
  
  // 1. ONLY load accounts configured by the user in AI Router (provider_accounts)
  const localAccs = aiDb.prepare(`
    SELECT id, name, email, provider, auth_type as authType, is_active as isActive, priority, test_status, test_message, last_error, last_error_at, credentials
    FROM provider_accounts
    ORDER BY provider ASC, priority ASC
  `).all();

  const { provider = 'all', status = 'all', sort = 'default', refresh } = req.query;
  const forceRefresh = refresh === 'true' || refresh === '1';

  let accounts = await Promise.all(localAccs.map(async acc => {
    const email = acc.email || acc.name;
    const rawProv = (acc.provider || 'gemini').toLowerCase();
    const isGemini = rawProv === 'gemini' || rawProv === 'antigravity';
    const isCodex = rawProv === 'codex';
    const isClaude = rawProv === 'claude';
    const isActive = acc.isActive === 1 || acc.isActive === true;

    let quotas = [];
    let message = null;

    if (isGemini) {
      const live = await fetchAntigravityLiveQuota(acc, aiDb, forceRefresh);
      quotas = live.quotas || [];
      message = live.message;
    } else if (isCodex) {
      const live = await fetchCodexLiveQuota(acc, aiDb, forceRefresh);
      quotas = live.quotas || [];
      message = live.message;
    } else if (isClaude) {
      quotas = [
        { name: 'Claude 3.7 Sonnet (5h)', used: 0, total: 1000, remainingPercentage: 100, resetTime: 'in 5h 0m' },
        { name: 'Claude (Weekly)', used: 0, total: 1000, remainingPercentage: 100, resetTime: 'in 7d 0h 0m' }
      ];
    }

    const minRemaining = quotas.length > 0
      ? Math.min(...quotas.map(q => q.remainingPercentage))
      : 100;

    return {
      id: acc.id,
      name: acc.name,
      email: email,
      provider: isCodex ? 'codex' : (isClaude ? 'claude' : 'antigravity'),
      providerTitle: isCodex ? 'OpenAI Codex' : (isClaude ? 'Anthropic Claude' : 'Antigravity'),
      authType: acc.authType || 'oauth',
      isActive: isActive,
      quotasCount: quotas.length,
      quotas: quotas,
      minRemaining: minRemaining,
      message: message
    };
  }));

  // Filter by provider
  if (provider !== 'all') {
    accounts = accounts.filter(a => a.provider === provider.toLowerCase());
  }

  // Filter by status
  if (status === 'active') {
    accounts = accounts.filter(a => a.isActive);
  } else if (status === 'turned-off') {
    accounts = accounts.filter(a => !a.isActive);
  }

  // Sort
  if (sort === 'expiring-first') {
    accounts.sort((a, b) => a.minRemaining - b.minRemaining);
  } else if (sort === 'remaining-desc') {
    accounts.sort((a, b) => b.minRemaining - a.minRemaining);
  } else {
    // Default order: Sort by priority, then highest remaining quota
    accounts.sort((a, b) => {
      if ((a.priority || 1) !== (b.priority || 1)) {
        return (a.priority || 1) - (b.priority || 1);
      }
      return (b.minRemaining || 0) - (a.minRemaining || 0);
    });
  }

  res.json({
    total: accounts.length,
    accounts: accounts
  });
});

router.post('/quota-tracker/toggle', (req, res) => {
  const { id, isActive } = req.body;
  const newActive = isActive ? 1 : 0;

  const aiDb = getDb();
  try {
    aiDb.prepare("UPDATE provider_accounts SET is_active = ? WHERE id = ?").run(newActive, id);
  } catch (_) {}

  res.json({ success: true, id, isActive: !!newActive });
});

router.post('/quota-tracker/batch-toggle', (req, res) => {
  const { action } = req.body; // 'turn-off-empty' | 'turn-on-available'
  const aiDb = getDb();

  try {
    if (action === 'turn-off-empty') {
      aiDb.prepare(`
        UPDATE provider_accounts 
        SET is_active = 0 
        WHERE (last_error LIKE '%429%' OR last_error LIKE '%quota%' OR test_status = 'failed')
      `).run();
    } else if (action === 'turn-on-available') {
      aiDb.prepare("UPDATE provider_accounts SET is_active = 1").run();
    }
  } catch (_) {}

  res.json({ success: true, action });
});

// --- 8. TASK & SUBAGENT EXECUTION TRACKER ---
router.get('/tasks/live', (req, res) => {
  try {
    const convId = req.query.conversationId || req.query.id || null;
    const data = getLiveTaskExecution(convId);
    res.json(data || { success: false, message: 'No active task found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Realtime Server-Sent Events (SSE) Stream
router.get('/tasks/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const sendUpdate = () => {
    try {
      const data = getLiveTaskExecution();
      if (data) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    } catch {}
  };

  sendUpdate();
  const interval = setInterval(sendUpdate, 1500);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// --- 16. ANTIGRAVITY MITM AUTO-SWITCH CONFIGURATION ---
router.get('/antigravity/mitm/status', (req, res) => {
  try {
    const status = antigravityMitmService.getMitmStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/antigravity/mitm/enable', async (req, res) => {
  try {
    const result = await antigravityMitmService.enableMitmAll();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/antigravity/mitm/disable', (req, res) => {
  try {
    const result = antigravityMitmService.disableMitmAll();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 17. 1-CLICK CLIENT CONFIGURATION (CODEX / ANTIGRAVITY) ---
router.get('/clients/status', (req, res) => {
  try {
    const db = getDb();
    const settingsRow = db.prepare("SELECT value FROM settings WHERE key = 'app_config'").get();
    const config = settingsRow ? JSON.parse(settingsRow.value) : {};
    const port = config.port || 20129;

    const antigravityStatus = antigravityMitmService.getMitmStatus();
    const codexStatus = clientConfigService.getCodexStatus(port);

    res.json({
      antigravity: antigravityStatus,
      codex: codexStatus,
      port
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/clients/codex/configure', (req, res) => {
  try {
    const db = getDb();
    const settingsRow = db.prepare("SELECT value FROM settings WHERE key = 'app_config'").get();
    const config = settingsRow ? JSON.parse(settingsRow.value) : {};
    const port = config.port || 20129;

    const result = clientConfigService.configureCodex(port);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/clients/antigravity/configure', async (req, res) => {
  try {
    const result = await antigravityMitmService.enableMitmAll();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
