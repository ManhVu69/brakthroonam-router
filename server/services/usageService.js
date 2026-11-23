const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const Database = require('better-sqlite3');
const { getDb } = require('../db');

// In-memory active request tracking for real-time Topology Graph
const activeRequests = new Map();

// Running agent process detection cache
let cachedRunningAgents = null;
let lastAgentCheckTimestamp = 0;
let lastAgSyncTime = 0;

function getAntigravityActiveAccount(db) {
  let activeEmail = null;
  try {
    const appStoragePath = path.join(process.env.APPDATA || '', 'Antigravity', 'app_storage.json');
    if (fs.existsSync(appStoragePath)) {
      const data = JSON.parse(fs.readFileSync(appStoragePath, 'utf8'));
      if (data['agy.onboarding.lastLoginUsername'] && typeof data['agy.onboarding.lastLoginUsername'] === 'string') {
        activeEmail = data['agy.onboarding.lastLoginUsername'].trim();
      }
    }
  } catch (err) {}

  if (!activeEmail) {
    try {
      const googleAccPath = path.join(process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\Admin', '.gemini', 'google_accounts.json');
      if (fs.existsSync(googleAccPath)) {
        const data = JSON.parse(fs.readFileSync(googleAccPath, 'utf8'));
        if (data.active) activeEmail = data.active.trim();
      }
    } catch (err) {}
  }

  let accountName = activeEmail || 'google-antigravity';
  let accountId = 'google-antigravity';

  const database = db || (typeof getDb === 'function' ? getDb() : null);
  if (database && activeEmail) {
    try {
      const acc = database.prepare("SELECT id, name, email FROM provider_accounts WHERE email = ? AND is_active = 1 LIMIT 1").get(activeEmail);
      if (acc) {
        accountName = acc.email || acc.name;
        accountId = acc.id;
      } else {
        const anyAcc = database.prepare("SELECT id, name, email FROM provider_accounts WHERE email = ? LIMIT 1").get(activeEmail);
        if (anyAcc) {
          accountName = anyAcc.email || anyAcc.name;
          accountId = anyAcc.id;
        }
      }
    } catch (err) {}
  }

  return { email: activeEmail, accountName, accountId };
}

function roleToCombo(role = '') {
  const r = (role || '').toLowerCase();
  if (r.includes('review')) return 'combo-review';
  if (r.includes('test')) return 'combo-test';
  if (r.includes('plan')) return 'combo-plan';
  if (r.includes('ask')) return 'combo-ask';
  return 'combo-code';
}

function detectRoleFromTranscript(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return null;
  let detectedRole = null;
  let detectedSummary = '';

  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const line = lines[i];
      if (!line.includes('USER_INPUT') && !line.includes('USER_EXPLICIT')) continue;
      const s = JSON.parse(line);
      // Strictly verify this is a real user prompt, NOT a tool output echoing user request text
      if (s.source !== 'USER_EXPLICIT' && s.type !== 'USER_INPUT') continue;

      const content = (s.content || '').toLowerCase();

      if (content.includes('/todo') || content.includes('#todo')) {
        detectedRole = 'todo';
        detectedSummary = 'Chu trình phát triển toàn diện (/todo)';
        break;
      }
      if (content.includes('/ask') || content.includes('#ask') || content.includes('ck:ask')) {
        detectedRole = 'ask';
        detectedSummary = 'Tư vấn kỹ thuật chuyên sâu qua 4 chuyên gia kiến trúc (/ask)';
        break;
      }
      if (content.includes('/planning') || content.includes('#planning') || content.includes('ck:plan')) {
        detectedRole = 'planner';
        detectedSummary = 'Thiết kế kiến trúc & lập kế hoạch (/planning)';
        break;
      }
      if (content.includes('/test') || content.includes('#test') || content.includes('ck:test')) {
        detectedRole = 'tester';
        detectedSummary = 'Chạy kiểm thử tự động & xác minh (/test)';
        break;
      }
      if (content.includes('/review') || content.includes('#review') || content.includes('ck:code-review')) {
        detectedRole = 'reviewer';
        detectedSummary = 'Thẩm định mã nguồn, kiến trúc & bảo mật (/review)';
        break;
      }
      if (content.includes('/fix') || content.includes('#fix')) {
        detectedRole = 'coder';
        detectedSummary = 'Sửa lỗi & khắc phục bug theo vết (/fix)';
        break;
      }
    } catch {}
  }

  return detectedRole ? { role: detectedRole, summary: detectedSummary } : null;
}

function detectAntigravityLiveSession() {
  const baseDir = path.join(process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\Admin', '.gemini', 'antigravity');
  const brainDir = path.join(baseDir, 'brain');
  if (!fs.existsSync(brainDir)) return null;

  try {
    const dirs = fs.readdirSync(brainDir);
    let newestMtime = 0;
    let newestConvDir = null;
    let newestTransFile = null;

    const now = Date.now();

    for (const d of dirs) {
      const transFile = path.join(brainDir, d, '.system_generated', 'logs', 'transcript.jsonl');
      if (fs.existsSync(transFile)) {
        try {
          const stat = fs.statSync(transFile);
          if (stat.mtimeMs > newestMtime) {
            newestMtime = stat.mtimeMs;
            newestConvDir = d;
            newestTransFile = transFile;
          }
        } catch {}
      }
    }

    if (!newestTransFile) return null;

    const ageMs = now - newestMtime;
    // Considered active streaming if written in last 30s; recent if in last 2 mins
    const isStreaming = ageMs < 30000;
    const isRecent = ageMs < 120000;

    if (!isRecent) return null;

    let model = 'gemini-3.8-flash-high';
    let role = 'coder';
    let lastStep = null;
    let promptPreview = '';

    const lines = fs.readFileSync(newestTransFile, 'utf8').trim().split('\n');

    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const l = lines[i];
      if (l.includes('Model Selection')) {
        const mMatch = l.match(/Model Selection` from \S+ to (.+?)\.\s*(?:No need|<)/i) || l.match(/Model Selection` from \S+ to ([^<\n\.]+)/i);
        if (mMatch && mMatch[1]) {
          model = mMatch[1].trim().toLowerCase().replace(/[\(\)]/g, '').replace(/\s+/g, '-').replace(/\.+$/, '');
        }
      }
    }

    // 1. Check active pipeline event (Real-time Phase has highest priority)
    let phaseDetected = false;
    const eventsFile = path.join(baseDir, '.pipeline', 'events.jsonl');
    if (fs.existsSync(eventsFile)) {
      try {
        const evStat = fs.statSync(eventsFile);
        if (now - evStat.mtimeMs < 120000) {
          const evLines = fs.readFileSync(eventsFile, 'utf8').trim().split('\n');
          for (let i = evLines.length - 1; i >= Math.max(0, evLines.length - 10); i--) {
            const ev = JSON.parse(evLines[i]);
            if (ev.agent?.model) model = ev.agent.model;
            if (ev.phase) {
              if (ev.phase.includes('ask')) {
                role = 'ask';
                promptPreview = ev.summary || 'Ban Cố Vấn Kỹ Thuật Trưởng (/ask)';
                phaseDetected = true;
              } else if (ev.phase.includes('review')) {
                role = 'reviewer';
                promptPreview = ev.summary || 'Thẩm định mã nguồn, kiến trúc & bảo mật (/review)';
                phaseDetected = true;
              } else if (ev.phase.includes('test')) {
                role = 'tester';
                promptPreview = ev.summary || 'Chạy kiểm thử tự động & sửa lỗi biên dịch (/test)';
                phaseDetected = true;
              } else if (ev.phase.includes('plan')) {
                role = 'planner';
                promptPreview = ev.summary || 'Thiết kế kiến trúc & lập kế hoạch (/planning)';
                phaseDetected = true;
              } else if (ev.phase.includes('code') || ev.phase.includes('coding')) {
                role = 'coder';
                promptPreview = ev.summary || 'Lập trình & triển khai mã nguồn (/fix, /todo)';
                phaseDetected = true;
              }
              break;
            }
          }
        }
      } catch {}
    }

    // 2. If no active pipeline event, extract role and intent from latest user prompt in transcript
    let lastUserStepIdx = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const l = lines[i];
        if (!l.includes('USER_INPUT') && !l.includes('USER_EXPLICIT')) continue;
        const s = JSON.parse(l);
        if (s.source === 'USER_EXPLICIT' || s.type === 'USER_INPUT') {
          lastUserStepIdx = i;
          break;
        }
      } catch {}
    }

    if (!phaseDetected) {
      const transRole = detectRoleFromTranscript(lines);
      if (transRole) {
        role = transRole.role;
        promptPreview = transRole.summary;
      }
    }

    // 3. Dynamic Real-time Phase Resolution from recent tool calls (ONLY in the current turn)
    const scanStart = Math.max(lastUserStepIdx >= 0 ? lastUserStepIdx : 0, lines.length - 15);
    for (let i = lines.length - 1; i >= scanStart; i--) {
      try {
        const s = JSON.parse(lines[i]);
        const toolStr = (JSON.stringify(s.tool_calls || '') + ' ' + (s.thinking || '') + ' ' + (s.content || '')).toLowerCase();

        // Check if currently taking screenshots, reading png, or reviewing
        if (toolStr.includes('screenshot') || toolStr.includes('.png') || toolStr.includes('reviewer') || toolStr.includes('thẩm định')) {
          role = 'reviewer';
          promptPreview = 'Thẩm định mã nguồn & chụp ảnh màn hình kiểm chứng (/review)';
          phaseDetected = true;
          break;
        }
        // Check if currently running tests / build
        if (toolStr.includes('npm test') || toolStr.includes('npm run build') || toolStr.includes('vitest') || toolStr.includes('pytest') || toolStr.includes('kiểm thử')) {
          role = 'tester';
          promptPreview = 'Chạy kiểm thử tự động, build verification & linter (/test)';
          phaseDetected = true;
          break;
        }
        // Check if currently writing or editing files
        if (toolStr.includes('edit_file') || toolStr.includes('write_file')) {
          role = 'coder';
          promptPreview = 'Lập trình & chỉnh sửa mã nguồn (/code)';
          phaseDetected = true;
          break;
        }
      } catch {}
    }

    if (role === 'todo') {
      role = 'planner';
      promptPreview = 'Chu trình phát triển toàn diện (/todo)';
    }

    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const s = JSON.parse(lines[i]);
        if (s.type === 'PLANNER_RESPONSE' || s.input_tokens || s.tool_calls) {
          lastStep = s;
          break;
        }
      } catch {}
    }

    const promptTokens = lastStep?.input_tokens || 2400;
    const completionTokens = lastStep?.output_tokens || 350;
    const totalTokens = promptTokens + completionTokens;

    const activeAcc = getAntigravityActiveAccount(getDb());

    return {
      id: `antigravity-live-${newestConvDir}`,
      conversationId: newestConvDir,
      agentRole: role,
      model: model,
      requestedModel: roleToCombo(role),
      provider: 'antigravity',
      accountName: activeAcc.accountName,
      status: isStreaming ? 'streaming' : 'recent',
      isStreaming,
      isRecent,
      ageMs,
      promptTokens,
      completionTokens,
      totalTokens,
      task: promptPreview || 'Đang thực thi tác vụ trong Google Antigravity',
      startTime: newestMtime
    };
  } catch (err) {
    return null;
  }
}

function syncAntigravityUsage() {
  const now = Date.now();
  if (now - lastAgSyncTime < 3000) return;
  lastAgSyncTime = now;

  const baseDir = path.join(process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\Admin', '.gemini', 'antigravity');
  const brainDir = path.join(baseDir, 'brain');
  if (!fs.existsSync(brainDir)) return;

  const db = getDb();
  const { accountName, accountId } = getAntigravityActiveAccount(db);

  let pipelineModel = 'gemini-3.8-flash-high';
  let pipelineRole = 'coder';
  const eventsFile = path.join(baseDir, '.pipeline', 'events.jsonl');
  if (fs.existsSync(eventsFile)) {
    try {
      const evLines = fs.readFileSync(eventsFile, 'utf8').trim().split('\n');
      for (let i = evLines.length - 1; i >= Math.max(0, evLines.length - 10); i--) {
        const ev = JSON.parse(evLines[i]);
        if (ev.agent?.model) pipelineModel = ev.agent.model;
        if (ev.phase) {
          if (ev.phase.includes('plan')) pipelineRole = 'planner';
          else if (ev.phase.includes('review')) pipelineRole = 'reviewer';
          else if (ev.phase.includes('test')) pipelineRole = 'tester';
          else pipelineRole = 'coder';
        }
        break;
      }
    } catch {}
  }

  const checkStmt = db.prepare("SELECT id FROM usage_logs WHERE external_id = ?");
  const insertStmt = db.prepare(`
    INSERT INTO usage_logs (
      timestamp, provider, account_id, account_name, model, requested_model, agent_role,
      prompt_tokens, completion_tokens, total_tokens, duration_ms, status, external_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    const dirs = fs.readdirSync(brainDir);
    const toInsert = [];

    for (const d of dirs) {
      const transFile = path.join(brainDir, d, '.system_generated', 'logs', 'transcript.jsonl');
      if (!fs.existsSync(transFile)) continue;

      const stat = fs.statSync(transFile);
      if (now - stat.mtimeMs > 24 * 3600 * 1000) continue;

      const lines = fs.readFileSync(transFile, 'utf8').trim().split('\n');
      let convModel = pipelineModel;

      for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const l = lines[i];
        if (l.includes('Model Selection')) {
          const mMatch = l.match(/Model Selection` from \S+ to (.+?)\.\s*(?:No need|<)/i) || l.match(/Model Selection` from \S+ to ([^<\n\.]+)/i);
          if (mMatch && mMatch[1]) {
            convModel = mMatch[1].trim().toLowerCase().replace(/[\(\)]/g, '').replace(/\s+/g, '-').replace(/\.+$/, '');
          }
        }
      }

      const transRole = detectRoleFromTranscript(lines);
      let convRole = transRole?.role || pipelineRole;
      if (convRole === 'todo') convRole = 'planner';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.includes('"PLANNER_RESPONSE"') && !line.includes('"input_tokens"')) continue;

        try {
          const step = JSON.parse(line);
          if (step.source === 'MODEL' && (step.input_tokens || step.output_tokens)) {
            const extId = `ag-${d}-${step.step_index}`;
            const exists = checkStmt.get(extId);
            if (!exists) {
              const pTokens = step.input_tokens || 1000;
              const cTokens = step.output_tokens || 100;
              const tTokens = pTokens + cTokens;
              const ts = step.created_at || new Date(stat.mtimeMs).toISOString();

              let stepRole = convRole;
              const toolStr = JSON.stringify(step.tool_calls || '').toLowerCase();
              if (toolStr.includes('screenshot') || toolStr.includes('.png') || toolStr.includes('reviewer') || toolStr.includes('thẩm định')) {
                stepRole = 'reviewer';
              } else if (toolStr.includes('npm test') || toolStr.includes('npm run build') || toolStr.includes('vitest') || toolStr.includes('pytest') || toolStr.includes('kiểm thử')) {
                stepRole = 'tester';
              } else if (toolStr.includes('edit_file') || toolStr.includes('write_file')) {
                stepRole = 'coder';
              }

              toInsert.push({
                ts,
                model: convModel,
                role: stepRole,
                pTokens,
                cTokens,
                tTokens,
                extId
              });
            }
          }
        } catch {}
      }
    }

    if (toInsert.length > 0) {
      const insertMany = db.transaction((items) => {
        for (const item of items) {
          insertStmt.run(
            item.ts,
            'antigravity',
            accountId,
            accountName,
            item.model,
            roleToCombo(item.role),
            item.role,
            item.pTokens,
            item.cTokens,
            item.tTokens,
            2400,
            'ok',
            item.extId
          );
        }
      });
      insertMany(toInsert);
    }
  } catch (err) {}
}

function detectRunningAgents() {
  const now = Date.now();
  if (cachedRunningAgents && (now - lastAgentCheckTimestamp < 15000)) {
    return cachedRunningAgents;
  }
  lastAgentCheckTimestamp = now;

  const detected = [];
  const liveAg = detectAntigravityLiveSession();

  try {
    const stdout = execSync('tasklist /FO CSV /NH', { encoding: 'utf-8', timeout: 2000 });
    const lower = stdout.toLowerCase();
    
    if (lower.includes('antigravity.exe')) {
      detected.push({
        id: 'antigravity',
        name: 'Google Antigravity',
        type: 'AI Agent IDE',
        status: liveAg?.isStreaming ? 'streaming' : 'running',
        processName: 'Antigravity.exe',
        isPrimary: true,
        activeModel: liveAg?.model || 'gemini-3.8-flash-high',
        activeRole: liveAg?.agentRole || 'coder',
        activeTask: liveAg?.task || ''
      });
    }
    if (lower.includes('code.exe')) {
      detected.push({
        id: 'code',
        name: 'VS Code / Claude Code',
        type: 'IDE / Agent',
        status: 'running',
        processName: 'Code.exe',
        isPrimary: detected.length === 0
      });
    }
    if (lower.includes('cursor.exe')) {
      detected.push({
        id: 'cursor',
        name: 'Cursor',
        type: 'AI Editor',
        status: 'running',
        processName: 'Cursor.exe',
        isPrimary: detected.length === 0
      });
    }
  } catch (err) {
    // Fallback if tasklist command is restricted
    detected.push({
      id: 'antigravity',
      name: 'Google Antigravity',
      type: 'AI Agent IDE',
      status: liveAg?.isStreaming ? 'streaming' : 'running',
      processName: 'Antigravity.exe',
      isPrimary: true,
      activeModel: liveAg?.model || 'gemini-3.8-flash-high',
      activeRole: liveAg?.agentRole || 'coder',
      activeTask: liveAg?.task || ''
    });
  }

  cachedRunningAgents = detected;
  return detected;
}

function addActiveRequest(id, info) {
  activeRequests.set(id, {
    id,
    ...info,
    startTime: Date.now()
  });
}

function removeActiveRequest(id) {
  activeRequests.delete(id);
}

function getActiveRequests() {
  // Prune any requests older than 45s
  const now = Date.now();
  for (const [id, req] of activeRequests.entries()) {
    if (now - req.startTime > 45000) {
      activeRequests.delete(id);
    }
  }
  const list = Array.from(activeRequests.values());

  // Also include real-time Antigravity conversation if active
  const liveAg = detectAntigravityLiveSession();
  if (liveAg && liveAg.isStreaming) {
    if (!list.some(r => r.id === liveAg.id)) {
      list.unshift(liveAg);
    }
  }

  return list;
}

function logUsage({
  provider,
  account_id,
  account_name,
  model,
  requested_model = null,
  agent_role = null,
  prompt_tokens = 0,
  completion_tokens = 0,
  duration_ms = 0,
  status = 'ok'
}) {
  const db = getDb();
  const total_tokens = prompt_tokens + completion_tokens;
  db.prepare(`
    INSERT INTO usage_logs (
      provider, account_id, account_name, model, requested_model, agent_role,
      prompt_tokens, completion_tokens, total_tokens, 
      duration_ms, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    provider,
    account_id,
    account_name,
    model,
    requested_model || model,
    agent_role || 'custom',
    prompt_tokens,
    completion_tokens,
    total_tokens,
    duration_ms,
    status
  );
}

function syncNineRouterUsage() {
  syncAntigravityUsage();
}

function getUsageSummary() {
  syncNineRouterUsage();
  const db = getDb();

  // Overall totals
  const totals = db.prepare(`
    SELECT 
      COUNT(*) as total_requests,
      COALESCE(SUM(prompt_tokens), 0) as total_prompt_tokens,
      COALESCE(SUM(completion_tokens), 0) as total_completion_tokens,
      COALESCE(SUM(total_tokens), 0) as total_tokens
    FROM usage_logs
    WHERE status = 'ok'
  `).get();

  // Breakdown by Model
  const byModel = db.prepare(`
    SELECT 
      model,
      provider,
      COUNT(*) as requests,
      SUM(prompt_tokens) as prompt_tokens,
      SUM(completion_tokens) as completion_tokens,
      SUM(total_tokens) as total_tokens,
      MAX(timestamp) as last_used
    FROM usage_logs
    GROUP BY model, provider
    ORDER BY total_tokens DESC
  `).all();

  // Breakdown by Account
  const byAccount = db.prepare(`
    SELECT 
      account_id,
      account_name,
      provider,
      COUNT(*) as requests,
      SUM(prompt_tokens) as prompt_tokens,
      SUM(completion_tokens) as completion_tokens,
      SUM(total_tokens) as total_tokens,
      MAX(timestamp) as last_used
    FROM usage_logs
    GROUP BY account_id, account_name, provider
    ORDER BY total_tokens DESC
  `).all();

  // Breakdown by Provider
  const byProvider = db.prepare(`
    SELECT 
      provider,
      COUNT(*) as requests,
      SUM(total_tokens) as total_tokens
    FROM usage_logs
    GROUP BY provider
    ORDER BY total_tokens DESC
  `).all();

  return {
    totals,
    byModel,
    byAccount,
    byProvider,
    activeRequests: getActiveRequests()
  };
}

function getRecentLogs(limit = 50) {
  syncNineRouterUsage();
  const db = getDb();
  return db.prepare(`
    SELECT id, timestamp, provider, account_id, account_name, model, 
           requested_model, agent_role,
           prompt_tokens, completion_tokens, total_tokens, duration_ms, status, external_id
    FROM usage_logs
    ORDER BY timestamp DESC, id DESC
    LIMIT ?
  `).all(limit);
}

function getHourlyChartData() {
  syncNineRouterUsage();
  const db = getDb();
  return db.prepare(`
    SELECT 
      strftime('%Y-%m-%d %H:00', timestamp) as time_slot,
      COUNT(*) as requests,
      SUM(prompt_tokens) as prompt_tokens,
      SUM(completion_tokens) as completion_tokens,
      SUM(total_tokens) as total_tokens
    FROM usage_logs
    WHERE timestamp >= datetime('now', '-24 hours')
    GROUP BY time_slot
    ORDER BY time_slot ASC
  `).all();
}

module.exports = {
  addActiveRequest,
  removeActiveRequest,
  getActiveRequests,
  detectRunningAgents,
  logUsage,
  getUsageSummary,
  getRecentLogs,
  getHourlyChartData,
  syncNineRouterUsage
};
