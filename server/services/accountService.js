const { getDb } = require('../db');
const { verifyAccountConnection } = require('./connectionVerifier');
const googleAuthService = require('./googleAuthService');

function listAccountsByProvider(provider) {
  const db = getDb();
  // Support 'gemini' and 'antigravity' interoperability
  const providerFilter = (provider === 'gemini' || provider === 'antigravity') 
    ? "('gemini', 'antigravity')" 
    : `('${provider}')`;

  return db.prepare(`
    SELECT id, provider, name, email, auth_type, priority, is_active, 
           consecutive_uses, test_status, test_message, models_count, quotas, probed_models,
           last_used_at, last_error, last_error_at, created_at, updated_at,
           CASE WHEN api_key IS NOT NULL AND length(api_key) > 8 
                THEN substr(api_key, 1, 6) || '••••••••' || substr(api_key, -4) 
                ELSE (CASE WHEN auth_type = 'oauth' THEN 'OAuth Token (Auto)' ELSE '••••••••' END) END as masked_key,
           api_key as raw_key
    FROM provider_accounts
    WHERE provider IN ${providerFilter}
    ORDER BY priority ASC, created_at ASC
  `).all();
}

function getAllActiveAccounts() {
  const db = getDb();
  return db.prepare(`
    SELECT id, provider, name, email, auth_type, priority, is_active, 
           consecutive_uses, test_status, test_message, models_count, quotas, probed_models,
           last_used_at, last_error, last_error_at, created_at, updated_at
    FROM provider_accounts
    WHERE is_active = 1
    ORDER BY provider ASC, priority ASC
  `).all();
}

function getAccountById(id) {
  const db = getDb();
  return db.prepare(`
    SELECT id, provider, name, email, auth_type, priority, is_active, 
           consecutive_uses, test_status, test_message, models_count, quotas, probed_models,
           last_used_at, last_error, last_error_at, created_at, updated_at,
           CASE WHEN api_key IS NOT NULL AND length(api_key) > 8 
                THEN substr(api_key, 1, 6) || '••••••••' || substr(api_key, -4) 
                ELSE (CASE WHEN auth_type = 'oauth' THEN 'OAuth Token (Auto)' ELSE '••••••••' END) END as masked_key,
           api_key as raw_key,
           credentials
    FROM provider_accounts
    WHERE id = ?
  `).get(id);
}

async function createAccount({ id, provider, name, email = null, auth_type = 'api_key', api_key = null, credentials = null, base_url = null, priority = 1, quotas = null }) {
  const db = getDb();
  const accountId = id || ('acc_' + Math.random().toString(36).substring(2, 10));

  db.prepare(`
    INSERT INTO provider_accounts (id, provider, name, email, auth_type, api_key, credentials, base_url, priority, is_active, test_status, quotas)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'untested', ?)
  `).run(accountId, provider, name, email, auth_type, api_key, credentials, base_url, priority, quotas);

  // Automatically test connection upon creation
  if (api_key || auth_type === 'oauth') {
    await testAndSaveAccountStatus(accountId);
  }

  return getAccountById(accountId);
}

function updateAccount(id, { name, email, api_key, priority, is_active, base_url, credentials, quotas }) {
  const db = getDb();
  const fields = [];
  const params = [];

  if (name !== undefined) { fields.push("name = ?"); params.push(name); }
  if (email !== undefined) { fields.push("email = ?"); params.push(email); }
  if (api_key !== undefined) { fields.push("api_key = ?"); params.push(api_key); }
  if (credentials !== undefined) { fields.push("credentials = ?"); params.push(credentials); }
  if (base_url !== undefined) { fields.push("base_url = ?"); params.push(base_url); }
  if (priority !== undefined) { fields.push("priority = ?"); params.push(priority); }
  if (is_active !== undefined) { fields.push("is_active = ?"); params.push(is_active ? 1 : 0); }
  if (quotas !== undefined) { fields.push("quotas = ?"); params.push(quotas); }

  fields.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  db.prepare(`UPDATE provider_accounts SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return getAccountById(id);
}

async function testAndSaveAccountStatus(id) {
  const db = getDb();
  const account = db.prepare("SELECT * FROM provider_accounts WHERE id = ?").get(id);
  if (!account) return { status: 'failed', message: 'Account not found' };

  const testResult = await verifyAccountConnection(account);

  const updates = [
    "test_status = ?",
    "test_message = ?",
    "models_count = ?",
    "updated_at = CURRENT_TIMESTAMP"
  ];
  const params = [testResult.status, testResult.message, testResult.modelsCount || 0];

  if (testResult.quotas) {
    updates.push("quotas = ?");
    params.push(testResult.quotas);
  }
  if (testResult.updatedCredentials) {
    updates.push("credentials = ?");
    params.push(testResult.updatedCredentials);
  }

  params.push(id);
  db.prepare(`UPDATE provider_accounts SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  return getAccountById(id);
}

function deleteAccount(id) {
  const db = getDb();
  db.prepare("DELETE FROM provider_accounts WHERE id = ?").run(id);
  return { success: true };
}

/**
 * Get all active accounts for a given provider, ordered by priority and model support
 */
function getActiveAccountsForProvider(provider, model = null) {
  const db = getDb();
  const providerFilter = (provider === 'gemini' || provider === 'antigravity') 
    ? "('gemini', 'antigravity')" 
    : `('${provider}')`;

  const accounts = db.prepare(`
    SELECT * FROM provider_accounts 
    WHERE provider IN ${providerFilter} AND is_active = 1
    ORDER BY priority ASC, last_used_at ASC
  `).all();

  if (!model) return accounts;

  const cleanModel = model.replace(/^(cx|oc|gm|antigravity)\//, '').toLowerCase();

  // Model-aware priority: Accounts that probed and verified support for this model come first!
  return accounts.sort((a, b) => {
    let aHas = false;
    let bHas = false;
    try {
      if (a.probed_models) {
        const probed = JSON.parse(a.probed_models);
        aHas = probed.some(m => m.modelId && (m.modelId.toLowerCase() === cleanModel || m.modelId.toLowerCase().includes(cleanModel)));
      }
    } catch (_) {}
    try {
      if (b.probed_models) {
        const probed = JSON.parse(b.probed_models);
        bHas = probed.some(m => m.modelId && (m.modelId.toLowerCase() === cleanModel || m.modelId.toLowerCase().includes(cleanModel)));
      }
    } catch (_) {}

    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    return (a.priority || 1) - (b.priority || 1);
  });
}

/**
 * Update account usage timestamp and increment counter
 */
function recordAccountSuccess(id) {
  const db = getDb();
  db.prepare(`
    UPDATE provider_accounts 
    SET last_used_at = CURRENT_TIMESTAMP, consecutive_uses = consecutive_uses + 1
    WHERE id = ?
  `).run(id);
}

function recordAccountError(id, errorMessage) {
  const db = getDb();
  db.prepare(`
    UPDATE provider_accounts 
    SET last_error = ?, last_error_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(errorMessage, id);
}

module.exports = {
  listAccountsByProvider,
  getAllActiveAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  testAndSaveAccountStatus,
  deleteAccount,
  getActiveAccountsForProvider,
  recordAccountSuccess,
  recordAccountError
};
