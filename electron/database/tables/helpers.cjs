// electron/database/tables/helpers.cjs
'use strict';

const log   = (...args) => console.log('[tables]', ...args);
const error = (...args) => console.error('[tables]', ...args);
const warn  = (...args) => console.warn('[tables]', ...args);

function tableExists(db, tableName) {
  try {
    const stmt = db.prepare(
      `SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`
    );
    return !!stmt.get(tableName);
  } catch (err) {
    warn(`[tables] Vérifier ${tableName}:`, err.message);
    return false;
  }
}

function columnExists(db, table, column) {
  try {
    if (!tableExists(db, table)) return false;
    const stmt = db.prepare(`PRAGMA table_info("${table}")`);
    return stmt.all().some(c => c.name === column);
  } catch (err) {
    warn(`[tables] Vérifier ${table}.${column}:`, err.message);
    return false;
  }
}

function addColumnIfMissing(db, table, column, definition) {
  if (!tableExists(db, table) || columnExists(db, table, column)) return false;
  try {
    db.exec(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`);
    log(`✅ [migration] ${table}.${column} ajoutée`);
    return true;
  } catch (err) {
    error(`❌ [migration] ${table}.${column}:`, err.message);
    return false;
  }
}

function createIndex(db, sql, name) {
  try { db.exec(sql); return true; }
  catch (err) { warn(`⚠️ [index] ${name}:`, err.message); return false; }
}

function dropIndex(db, name) {
  try { db.exec(`DROP INDEX IF EXISTS "${name}"`); return true; }
  catch (err) { warn(`⚠️ [drop index] ${name}:`, err.message); return false; }
}

module.exports = {
  log, error, warn,
  tableExists,
  columnExists,
  addColumnIfMissing,
  createIndex,
  dropIndex,
};