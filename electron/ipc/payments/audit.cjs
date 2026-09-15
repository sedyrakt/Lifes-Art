// electron/ipc/payments/audit.cjs
'use strict';

const { tableExists } = require('./helpers.cjs');

function logAudit(db, action, entity, entityId, details = null) {
  try {
    if (!tableExists(db, 'audit_logs')) return;

    const columns = db.prepare(`PRAGMA table_info(audit_logs)`).all().map((row) => row.name);
    const has = (name) => columns.includes(name);
    const payload = details ? JSON.stringify(details) : null;

    if (has('action') && has('entity') && has('entity_id') && has('details')) {
      db.prepare(`INSERT INTO audit_logs (action, entity, entity_id, details) VALUES (?, ?, ?, ?)`).run(action, entity, entityId, payload);
      return;
    }
    if (has('action') && has('module') && has('record_id') && has('details')) {
      db.prepare(`INSERT INTO audit_logs (action, module, record_id, details) VALUES (?, ?, ?, ?)`).run(action, entity, entityId, payload);
    }
  } catch (err) {
    console.warn('[PAYMENTS] Audit ignoré:', err.message);
  }
}

module.exports = { logAudit };