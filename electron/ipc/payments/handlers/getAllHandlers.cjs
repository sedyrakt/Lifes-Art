// electron/ipc/payments/handlers/getAllHandlers.cjs
'use strict';

const { withLiveDb, tableExists, safeHandle } = require('../helpers.cjs');
const { getPaymentById } = require('../crud.cjs');

function registerGetAllHandlers(ipcMain) {
  console.log('[PAYMENTS] 🔧 registerGetAllHandlers');

  safeHandle(ipcMain, 'payments:get-all', async (_event, options = {}) => {
    return withLiveDb((db) => {
      const { limit = 10000, offset = 0, search = '', employeId = null, mois = null, annee = null, statut = null } = options || {};
      const safeLimit = Math.min(Math.max(Number(limit) || 10000, 1), 10000);
      const safeOffset = Math.max(Number(offset) || 0, 0);
      const conditions = [];
      const params = [];

      if (search && tableExists(db, 'employes')) {
        conditions.push(`(
          LOWER(COALESCE(e.nom, '') || ' ' || COALESCE(e.prenom, '')) LIKE ?
          OR LOWER(COALESCE(p.reference, '')) LIKE ?
          OR LOWER(COALESCE(p.observation, '')) LIKE ?
        )`);
        const q = `%${String(search).toLowerCase()}%`;
        params.push(q, q, q);
      }

      if (employeId != null) { conditions.push('p.employe_id = ?'); params.push(Number(employeId)); }
      if (mois != null) { conditions.push('p.mois = ?'); params.push(Number(mois)); }
      if (annee != null) { conditions.push('p.annee = ?'); params.push(Number(annee)); }

      if (statut && statut !== 'Tous') {
        if (statut === 'Payé') {
          conditions.push(`((p.statut = 'Payé' OR p.statut = 'Partiel') AND COALESCE(p.montant, 0) > 0)`);
        } else if (statut === 'Non payé') {
          conditions.push(`(p.statut = 'Non payé' OR (p.statut = 'Partiel' AND COALESCE(p.montant, 0) <= 0))`);
        } else {
          conditions.push('p.statut = ?');
          params.push(statut);
        }
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const sql = `
        SELECT
          p.*,
          e.nom AS employe_nom,
          e.prenom AS employe_prenom,
          e.poste AS employe_poste,
          COALESCE(e.salaire_base, e.salaire, 0) AS salaire_base
        FROM paiements_employes p
        LEFT JOIN employes e ON e.id = p.employe_id
        ${where}
        ORDER BY COALESCE(p.date_paiement, p.created_at, '') DESC, p.id DESC
        LIMIT ? OFFSET ?
      `;

      params.push(safeLimit, safeOffset);
      return db.prepare(sql).all(...params);
    });
  });

  safeHandle(ipcMain, 'payments:get-by-id', async (_event, id) => {
    return withLiveDb((db) => getPaymentById(db, Number(id)));
  });
}

module.exports = { registerGetAllHandlers };