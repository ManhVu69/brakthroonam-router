const fs = require('fs');
const path = require('path');
const os = require('os');
const { getDb } = require('../db');
const googleAuthService = require('./googleAuthService');

let lastKnownActiveEmail = null;
let syncIntervalTimer = null;

function readAntigravityCurrentUsername() {
  try {
    const googleAccPath = path.join(os.homedir(), '.gemini', 'google_accounts.json');
    if (fs.existsSync(googleAccPath)) {
      const data = JSON.parse(fs.readFileSync(googleAccPath, 'utf8'));
      if (data.active) return data.active.trim();
    }
  } catch (err) {}

  try {
    const appStoragePath = process.platform === 'win32'
      ? path.join(process.env.APPDATA || os.homedir(), 'Antigravity', 'app_storage.json')
      : path.join(os.homedir(), '.config', 'Antigravity', 'app_storage.json');
    if (fs.existsSync(appStoragePath)) {
      const data = JSON.parse(fs.readFileSync(appStoragePath, 'utf8'));
      if (data['agy.onboarding.lastLoginUsername'] && typeof data['agy.onboarding.lastLoginUsername'] === 'string') {
        return data['agy.onboarding.lastLoginUsername'].trim();
      }
    }
  } catch (err) {}

  return null;
}

/**
 * Live synchronize active account from Antigravity IDE into Brakthroonam Router
 */
function syncAntigravityActiveAccount() {
  const currentEmail = readAntigravityCurrentUsername();
  if (!currentEmail) return { changed: false, email: null };

  const db = getDb();
  const isSwitch = (lastKnownActiveEmail !== null && lastKnownActiveEmail.toLowerCase() !== currentEmail.toLowerCase());
  lastKnownActiveEmail = currentEmail;

  const existingAcc = db.prepare("SELECT * FROM provider_accounts WHERE lower(email) = lower(?) AND provider = 'gemini'").get(currentEmail);

  if (existingAcc) {
    const { isAccountExhausted } = require('./antigravityMitmService');
    // If account is marked as quota exhausted, DO NOT promote it to Priority 1!
    if (isAccountExhausted(currentEmail)) {
      return { changed: false, email: currentEmail };
    }

    if (existingAcc.priority !== 1 || isSwitch) {
      console.log(`[AntigravitySync] 🔄 Detected Antigravity account switch to: ${currentEmail}. Promoting to Priority 1.`);
      
      db.transaction(() => {
        db.prepare("UPDATE provider_accounts SET priority = priority + 1 WHERE id != ? AND provider = 'gemini'").run(existingAcc.id);
        db.prepare("UPDATE provider_accounts SET priority = 1, is_active = 1, last_error = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(existingAcc.id);
      })();
    }
  } else {
    // Check .gemini/oauth_creds.json for new account credentials
    let creds = null;
    try {
      const credPath = path.join(os.homedir(), '.gemini', 'oauth_creds.json');
      if (fs.existsSync(credPath)) {
        const raw = JSON.parse(fs.readFileSync(credPath, 'utf8'));
        if (raw.refresh_token) {
          creds = {
            accessToken: raw.access_token,
            refreshToken: raw.refresh_token,
            expiresAt: Date.now() + (raw.expires_in || 3600) * 1000,
            projectId: 'aicode-consumers'
          };
        }
      }
    } catch (e) {}

    if (creds) {
      const newId = 'acc_' + Math.random().toString(36).substring(2, 10);
      db.transaction(() => {
        db.prepare("UPDATE provider_accounts SET priority = priority + 1 WHERE provider = 'gemini'").run();
        db.prepare(`
          INSERT INTO provider_accounts (id, provider, name, email, auth_type, credentials, priority, is_active, test_status, test_message)
          VALUES (?, 'gemini', ?, ?, 'oauth', ?, 1, 1, 'verified', 'Auto-synced from Antigravity IDE')
        `).run(newId, currentEmail.split('@')[0], currentEmail, JSON.stringify(creds));
      })();
      console.log(`[AntigravitySync] ✅ Successfully imported ${currentEmail} as Priority 1 into Brakthroonam Router.`);
    }
  }

  return { changed: isSwitch, email: currentEmail };
}

/**
 * Handle account quota exhaustion (429 Rate Limit / Resource Exhausted):
 * Auto-demote exhausted account and promote next ready account seamlessly
 */
function handleQuotaExhausted(accountId, model = '') {
  const db = getDb();
  const acc = db.prepare("SELECT * FROM provider_accounts WHERE id = ?").get(accountId);
  if (!acc) return null;

  console.warn(`[QuotaFailover] ⚠️ Account ${acc.email || acc.name} hit 429 quota exhaustion on model '${model}'. Auto-failing over...`);

  // Find next best candidate account with priority >= 2 and active
  const nextAcc = db.prepare(`
    SELECT * FROM provider_accounts 
    WHERE provider = ? AND is_active = 1 AND id != ?
    ORDER BY priority ASC, last_used_at ASC
    LIMIT 1
  `).get(acc.provider, accountId);

  db.transaction(() => {
    // Demote exhausted account
    db.prepare(`
      UPDATE provider_accounts 
      SET priority = 99, 
          last_error = '429 Quota Exhausted (Auto-failover active)', 
          last_error_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(accountId);

    if (nextAcc) {
      // Promote next ready account to Priority 1
      db.prepare("UPDATE provider_accounts SET priority = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(nextAcc.id);
      // Re-index remaining accounts
      const remaining = db.prepare("SELECT id FROM provider_accounts WHERE provider = ? AND id NOT IN (?, ?) ORDER BY priority ASC").all(acc.provider, nextAcc.id, accountId);
      let p = 2;
      for (const r of remaining) {
        db.prepare("UPDATE provider_accounts SET priority = ? WHERE id = ?").run(p++, r.id);
      }
      console.log(`[QuotaFailover] 🚀 Seamlessly rotated to standby account: ${nextAcc.email || nextAcc.name} (Priority 1). Zero downtime!`);
    }
  })();

  return nextAcc;
}

/**
 * Start background watcher daemon: checks for user switching account in Antigravity every 2 seconds
 */
function startAntigravityWatcher() {
  if (syncIntervalTimer) return;

  // Run initial sync
  syncAntigravityActiveAccount();

  syncIntervalTimer = setInterval(() => {
    try {
      syncAntigravityActiveAccount();
    } catch (e) {
      console.error('[AntigravitySync] Error in polling loop:', e.message);
    }
  }, 2000);

  console.log('[AntigravitySync] 👁️ Live Antigravity Account Watcher started (interval: 2s).');
}

function stopAntigravityWatcher() {
  if (syncIntervalTimer) {
    clearInterval(syncIntervalTimer);
    syncIntervalTimer = null;
  }
}

module.exports = {
  syncAntigravityActiveAccount,
  handleQuotaExhausted,
  startAntigravityWatcher,
  stopAntigravityWatcher,
  readAntigravityCurrentUsername
};
