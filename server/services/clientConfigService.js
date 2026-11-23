const fs = require('fs');
const path = require('path');
const os = require('os');
const { getDb } = require('../db');

const CODEX_DIR = path.join(os.homedir(), '.codex');
const CODEX_CONFIG_PATH = path.join(CODEX_DIR, 'config.toml');
const CODEX_AUTH_PATH = path.join(CODEX_DIR, 'auth.json');
const MASTER_API_KEY = 'sk-brakthroonam-master';

/**
 * Ensure Master API Key exists in the database
 */
function ensureMasterApiKey() {
  try {
    const db = getDb();
    const existing = db.prepare("SELECT id FROM api_keys WHERE key = ?").get(MASTER_API_KEY);
    if (!existing) {
      db.prepare("INSERT INTO api_keys (id, name, key, is_active) VALUES (?, ?, ?, 1)")
        .run('key_master_codex', 'Brakthroonam Master Client Key', MASTER_API_KEY);
    }
  } catch (err) {
    console.warn('[ClientConfig] Warning ensuring master API key:', err.message);
  }
}

/**
 * Check Codex configuration status
 */
function getCodexStatus(port = 20129) {
  const exists = fs.existsSync(CODEX_CONFIG_PATH);
  if (!exists) {
    return {
      installed: false,
      isConfigured: false,
      message: 'Không tìm thấy thư mục ~/.codex trên máy'
    };
  }

  try {
    const content = fs.readFileSync(CODEX_CONFIG_PATH, 'utf8');
    const hasBrakthroonam = content.includes('model_provider = "brakthroonam"') || content.includes("model_provider = 'brakthroonam'");
    const targetUrl = `http://127.0.0.1:${port}/v1`;
    const altTargetUrl = `http://localhost:${port}/v1`;
    const hasCorrectUrl = content.includes(targetUrl) || content.includes(altTargetUrl);

    // Check if auth.json is using router key
    let authClean = false;
    if (fs.existsSync(CODEX_AUTH_PATH)) {
      try {
        const authData = JSON.parse(fs.readFileSync(CODEX_AUTH_PATH, 'utf8'));
        authClean = authData.OPENAI_API_KEY === MASTER_API_KEY || authData.OPENAI_API_KEY === 'sk_brakthroonam';
      } catch {}
    }

    const isFullyConfigured = hasBrakthroonam && hasCorrectUrl;

    return {
      installed: true,
      isConfigured: isFullyConfigured,
      hasCorrectUrl,
      hasBrakthroonam,
      authClean,
      configPath: CODEX_CONFIG_PATH,
      authPath: CODEX_AUTH_PATH,
      targetPort: port
    };
  } catch (err) {
    return {
      installed: true,
      isConfigured: false,
      error: err.message
    };
  }
}

/**
 * 1-Click Configure Codex Desktop and CLI
 */
function configureCodex(port = 20129) {
  if (!fs.existsSync(CODEX_DIR)) {
    fs.mkdirSync(CODEX_DIR, { recursive: true });
  }

  ensureMasterApiKey();

  // 1. Backup existing config.toml if exists
  if (fs.existsSync(CODEX_CONFIG_PATH)) {
    try {
      fs.copyFileSync(CODEX_CONFIG_PATH, CODEX_CONFIG_PATH + '.bak');
    } catch {}
  }

  // 2. Read existing config.toml or create default
  let configContent = '';
  if (fs.existsSync(CODEX_CONFIG_PATH)) {
    configContent = fs.readFileSync(CODEX_CONFIG_PATH, 'utf8');
  }

  // Update model_provider at top of file
  if (/^model_provider\s*=\s*.*/m.test(configContent)) {
    configContent = configContent.replace(/^model_provider\s*=\s*.*/m, 'model_provider = "brakthroonam"');
  } else {
    configContent = `model_provider = "brakthroonam"\n` + configContent;
  }

  // Remove old 9router provider block if present
  configContent = configContent.replace(/\[model_providers\.9router\][\s\S]*?(?=\n\[|$)/g, '');
  configContent = configContent.replace(/\[model_providers\.9router\.http_headers\][\s\S]*?(?=\n\[|$)/g, '');

  // Remove existing brakthroonam provider block to rewrite cleanly
  configContent = configContent.replace(/\[model_providers\.brakthroonam\][\s\S]*?(?=\n\[|$)/g, '');
  configContent = configContent.replace(/\[model_providers\.brakthroonam\.http_headers\][\s\S]*?(?=\n\[|$)/g, '');

  // Append new brakthroonam provider definition
  const brakthroonamBlock = `
[model_providers.brakthroonam]
name = "Brakthroonam Router"
base_url = "http://127.0.0.1:${port}/v1"
wire_api = "responses"

[model_providers.brakthroonam.http_headers]
Authorization = "Bearer ${MASTER_API_KEY}"
`;

  configContent = configContent.trim() + '\n' + brakthroonamBlock;

  fs.writeFileSync(CODEX_CONFIG_PATH, configContent, 'utf8');

  // 3. Update auth.json so any fallback also uses the Master API Key instead of invalid keys
  let authJson = { auth_mode: 'apikey', OPENAI_API_KEY: MASTER_API_KEY };
  if (fs.existsSync(CODEX_AUTH_PATH)) {
    try {
      authJson = JSON.parse(fs.readFileSync(CODEX_AUTH_PATH, 'utf8'));
    } catch {}
  }
  authJson.auth_mode = 'apikey';
  authJson.OPENAI_API_KEY = MASTER_API_KEY;

  fs.writeFileSync(CODEX_AUTH_PATH, JSON.stringify(authJson, null, 2), 'utf8');

  return {
    success: true,
    message: `Đã cấu hình Codex 1-Click thành công! Đã trỏ về Brakthroonam Router tại cổng ${port}.`,
    configPath: CODEX_CONFIG_PATH,
    authPath: CODEX_AUTH_PATH
  };
}

module.exports = {
  getCodexStatus,
  configureCodex,
  ensureMasterApiKey,
  MASTER_API_KEY
};
