const fs = require('fs');
const path = require('path');
const os = require('os');
const Database = require('better-sqlite3');

function getDbPath() {
  const dataDir = process.env.DATA_DIR || (
    process.platform === 'win32'
      ? path.join(process.env.APPDATA || os.homedir(), 'ai-router', 'db')
      : path.join(os.homedir(), '.ai-router', 'db')
  );
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'data.sqlite');
}

let dbInstance = null;

function getDb() {
  if (!dbInstance) {
    const dbPath = getDbPath();
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    initTables(dbInstance);
  }
  return dbInstance;
}

function initTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key TEXT NOT NULL UNIQUE,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS provider_accounts (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      auth_type TEXT NOT NULL DEFAULT 'api_key',
      api_key TEXT,
      credentials TEXT,
      base_url TEXT,
      priority INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      consecutive_uses INTEGER DEFAULT 0,
      test_status TEXT DEFAULT 'untested',
      test_message TEXT,
      models_count INTEGER DEFAULT 0,
      last_used_at DATETIME,
      last_error TEXT,
      last_error_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS combos (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      strategy TEXT DEFAULT 'fallback',
      models TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      provider TEXT NOT NULL,
      account_id TEXT NOT NULL,
      account_name TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt_tokens INTEGER DEFAULT 0,
      completion_tokens INTEGER DEFAULT 0,
      total_tokens INTEGER DEFAULT 0,
      duration_ms INTEGER DEFAULT 0,
      status TEXT DEFAULT 'ok'
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migrate missing columns if upgrading
  const cols = db.prepare("PRAGMA table_info(provider_accounts)").all().map(c => c.name);
  if (!cols.includes('email')) {
    try { db.exec("ALTER TABLE provider_accounts ADD COLUMN email TEXT"); } catch {}
  }
  if (!cols.includes('test_status')) {
    try { db.exec("ALTER TABLE provider_accounts ADD COLUMN test_status TEXT DEFAULT 'untested'"); } catch {}
  }
  if (!cols.includes('test_message')) {
    try { db.exec("ALTER TABLE provider_accounts ADD COLUMN test_message TEXT"); } catch {}
  }
  if (!cols.includes('models_count')) {
    try { db.exec("ALTER TABLE provider_accounts ADD COLUMN models_count INTEGER DEFAULT 0"); } catch {}
  }
  if (!cols.includes('quotas')) {
    try { db.exec("ALTER TABLE provider_accounts ADD COLUMN quotas TEXT"); } catch {}
  }
  if (!cols.includes('probed_models')) {
    try { db.exec("ALTER TABLE provider_accounts ADD COLUMN probed_models TEXT"); } catch {}
  }
  if (!cols.includes('role')) {
    try { db.exec("ALTER TABLE provider_accounts ADD COLUMN role TEXT DEFAULT 'all'"); } catch {}
  }

  const usageCols = db.prepare("PRAGMA table_info(usage_logs)").all().map(c => c.name);
  if (!usageCols.includes('requested_model')) {
    try { db.exec("ALTER TABLE usage_logs ADD COLUMN requested_model TEXT"); } catch {}
  }
  if (!usageCols.includes('agent_role')) {
    try { db.exec("ALTER TABLE usage_logs ADD COLUMN agent_role TEXT"); } catch {}
  }

  // Seed default combos if empty
  const comboCount = db.prepare("SELECT COUNT(*) as count FROM combos").get().count;
  if (comboCount === 0) {
    const defaultCombos = [
      {
        id: 'combo_plan',
        name: 'combo-plan',
        strategy: 'fallback',
        models: JSON.stringify(['claude-3-7-sonnet', 'gemini-3.8-flash-high', 'o3-mini', 'gemini-2.5-pro'])
      },
      {
        id: 'combo_code',
        name: 'combo-code',
        strategy: 'fallback',
        models: JSON.stringify(['gemini-3.8-flash-high', 'gpt-4o', 'claude-3-5-sonnet-latest', 'gemini-2.5-flash'])
      },
      {
        id: 'combo_test',
        name: 'combo-test',
        strategy: 'fallback',
        models: JSON.stringify(['gemini-2.5-flash', 'gpt-4o-mini', 'claude-3-5-haiku-latest'])
      },
      {
        id: 'combo_review',
        name: 'combo-review',
        strategy: 'fallback',
        models: JSON.stringify(['claude-3-7-sonnet', 'o1', 'gemini-3.8-flash-high', 'gemini-2.5-pro'])
      }
    ];

    const insertCombo = db.prepare("INSERT INTO combos (id, name, strategy, models) VALUES (@id, @name, @strategy, @models)");
    for (const c of defaultCombos) {
      insertCombo.run(c);
    }
  }

  // Initialize default Master API key if none exists
  const existingKey = db.prepare("SELECT COUNT(*) as count FROM api_keys").get();
  if (existingKey.count === 0) {
    const defaultKey = 'sk-airouter-' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    db.prepare("INSERT INTO api_keys (id, name, key, is_active) VALUES (?, ?, ?, 1)").run(
      'default',
      'Default Key',
      defaultKey
    );
  }

  // Initialize default settings
  const existingSettings = db.prepare("SELECT value FROM settings WHERE key = 'app_config'").get();
  if (!existingSettings) {
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(
      'app_config',
      JSON.stringify({
        requireApiKey: false,
        port: 20129,
        host: '0.0.0.0',
        providerStrategies: {
          gemini: { fallbackStrategy: 'round-robin', stickyLimit: 3 },
          codex: { fallbackStrategy: 'round-robin', stickyLimit: 3 },
          antigravity: { fallbackStrategy: 'round-robin', stickyLimit: 3 }
        }
      })
    );
  }
}

module.exports = {
  getDb,
  getDbPath
};
