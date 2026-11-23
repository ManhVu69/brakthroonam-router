const { getDb } = require('../db');

function listCombos() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM combos ORDER BY created_at DESC").all();
  return rows.map(r => ({
    ...r,
    models: JSON.parse(r.models || '[]')
  }));
}

function getComboByName(name) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM combos WHERE name = ?").get(name);
  if (!row) return null;
  return {
    ...row,
    models: JSON.parse(row.models || '[]')
  };
}

function createCombo({ name, strategy = 'fallback', models = [] }) {
  const db = getDb();
  const id = 'combo_' + Math.random().toString(36).substring(2, 10);
  const modelsJson = JSON.stringify(models);
  db.prepare(`
    INSERT INTO combos (id, name, strategy, models)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET strategy = excluded.strategy, models = excluded.models, updated_at = CURRENT_TIMESTAMP
  `).run(id, name, strategy, modelsJson);
  return getComboByName(name);
}

function deleteCombo(id) {
  const db = getDb();
  db.prepare("DELETE FROM combos WHERE id = ?").run(id);
  return { success: true };
}

function updateCombo(id, { name, strategy, models }) {
  const db = getDb();
  const fields = [];
  const params = [];
  if (name !== undefined) { fields.push("name = ?"); params.push(name); }
  if (strategy !== undefined) { fields.push("strategy = ?"); params.push(strategy); }
  if (models !== undefined) { fields.push("models = ?"); params.push(JSON.stringify(models)); }
  fields.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  db.prepare(`UPDATE combos SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  const row = db.prepare("SELECT * FROM combos WHERE id = ?").get(id);
  return row ? { ...row, models: JSON.parse(row.models || '[]') } : null;
}

module.exports = {
  listCombos,
  getComboByName,
  createCombo,
  deleteCombo,
  updateCombo
};
