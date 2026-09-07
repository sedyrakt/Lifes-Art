// ============================================================
// electron/ipc/orders/audit.cjs - AUDIT LOG
// ⭐ FIX: 7 paramètres (action, entity, entity_id, entity_name, user_id, details, created_at)
// ============================================================

'use strict';

const { getDb } = require('../../database/connection.cjs');
const { log, error } = require('../../database/utils.cjs');

function logAudit(action, orderId, orderNumber, userId, details = '') {
  try {
    const db = getDb();
    if (!db) return;

    // ⭐ FIX: 7 paramètres (action, entity, entity_id, entity_name, user_id, details, created_at)
    const stmt = db.prepare(`
      INSERT INTO audit_logs (action, entity, entity_id, entity_name, user_id, details, created_at)
      VALUES (?, 'commande', ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(action, orderId, orderNumber, userId, details);
    log(`📝 Audit: ${action} - ${orderNumber} (${orderId})`);
  } catch (err) {
    error('⚠️ Erreur audit log:', err.message);
  }
}

module.exports = { logAudit };