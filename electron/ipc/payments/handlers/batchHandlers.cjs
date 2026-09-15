// electron/ipc/payments/handlers/batchHandlers.cjs
'use strict';

const { withLiveDb, safeHandle } = require('../helpers.cjs');

function registerBatchHandlers(ipcMain) {
  console.log('[PAYMENTS] 🔧 registerBatchHandlers');

  safeHandle(ipcMain, 'payments:get-last-batch', async (_event, employeIds) => {
    return withLiveDb((db) => {
      if (!Array.isArray(employeIds) || employeIds.length === 0) {
        return { success: true, data: {} };
      }

      const safeIds = employeIds
        .map(Number)
        .filter(id => Number.isInteger(id) && id > 0)
        .slice(0, 500);

      if (safeIds.length === 0) return { success: true, data: {} };

      const placeholders = safeIds.map(() => '?').join(',');

      const rows = db.prepare(`
        SELECT p.*
        FROM paiements_employes p
        INNER JOIN (
          SELECT employe_id, MAX(id) AS max_id
          FROM paiements_employes
          WHERE employe_id IN (${placeholders})
          GROUP BY employe_id
        ) latest ON latest.employe_id = p.employe_id AND latest.max_id = p.id
      `).all(...safeIds);

      const map = {};
      rows.forEach((row) => { map[row.employe_id] = row; });

      return { success: true, data: map };
    });
  });
}

module.exports = { registerBatchHandlers };