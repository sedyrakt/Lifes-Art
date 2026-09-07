// electron/ipc/products/audit.cjs - AUDIT LOG 10/10
'use strict';

const { getDb } = require('../../database/connection.cjs');
const { log, error } = require('./logger.cjs');

const logAudit = (action, productId, productName, userId, details = '') => {
  try {
    const db = getDb();
    if (!db) return;

    db.exec(`CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      action TEXT, 
      entity TEXT, 
      entity_id INTEGER, 
      entity_name TEXT, 
      user_id INTEGER, 
      details TEXT, 
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    const stmt = db.prepare(`
      INSERT INTO audit_logs (action, entity, entity_id, entity_name, user_id, details, created_at)
      VALUES (?, 'produit', ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(action, productId, productName, userId, details);
    log(`📝 Audit: ${action} - ${productName} (${productId})`);
  } catch (err) {
    error('⚠️ Erreur audit log (produits):', err.message);
  }
};

module.exports = { logAudit };