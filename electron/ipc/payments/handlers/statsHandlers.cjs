// electron/ipc/payments/handlers/statsHandlers.cjs
'use strict';

const { withLiveDb, normalizeMoney, safeHandle } = require('../helpers.cjs');

function registerStatsHandlers(ipcMain) {
  console.log('[PAYMENTS] 🔧 registerStatsHandlers');

  safeHandle(ipcMain, 'payments:get-stats', async (_event, options = {}) => {
    return withLiveDb((db) => {
      const conditions = [];
      const params = [];

      if (options.mois != null) { conditions.push('mois = ?'); params.push(Number(options.mois)); }
      if (options.annee != null) { conditions.push('annee = ?'); params.push(Number(options.annee)); }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const row = db.prepare(`
        SELECT
          COUNT(*) AS total,
          COALESCE(SUM(CASE WHEN (statut = 'Payé' OR statut = 'Partiel') AND COALESCE(montant, 0) > 0 THEN 1 ELSE 0 END), 0) AS payes,
          COALESCE(SUM(CASE WHEN statut = 'Non payé' THEN 1 ELSE 0 END), 0) AS non_payes,
          COALESCE(SUM(CASE WHEN statut = 'Brouillon' THEN 1 ELSE 0 END), 0) AS brouillons,
          COALESCE(SUM(CASE WHEN (statut = 'Payé' OR statut = 'Partiel') THEN COALESCE(montant, 0) ELSE 0 END), 0) AS montant
        FROM paiements_employes
        ${where}
      `).get(...params);

      return {
        total: Number(row?.total || 0),
        payes: Number(row?.payes || 0),
        nonPayes: Number(row?.non_payes || 0),
        brouillons: Number(row?.brouillons || 0),
        montant: normalizeMoney(row?.montant),
        totalPaiements: Number(row?.total || 0),
        totalMontant: normalizeMoney(row?.montant),
      };
    });
  });

  safeHandle(ipcMain, 'payments:count-by-employe', async (_event, employeId) => {
    return withLiveDb((db) => {
      const row = db.prepare(`SELECT COUNT(*) AS count FROM paiements_employes WHERE employe_id = ?`).get(Number(employeId));
      return Number(row?.count || 0);
    });
  });

  safeHandle(ipcMain, 'payments:get-employe-stats', async (_event, employeId) => {
    return withLiveDb((db) => {
      const row = db.prepare(`
        SELECT
          COUNT(*) AS total,
          COALESCE(SUM(montant), 0) AS montant_total,
          COALESCE(SUM(salaire_brut), 0) AS brut_total,
          COALESCE(SUM(cnaps), 0) AS cnaps_total,
          COALESCE(SUM(ostie), 0) AS ostie_total,
          COALESCE(SUM(irsa), 0) AS irsa_total,
          COALESCE(SUM(avance), 0) AS avance_total
        FROM paiements_employes
        WHERE employe_id = ?
      `).get(Number(employeId));

      return {
        total: Number(row?.total || 0),
        montant_total: normalizeMoney(row?.montant_total),
        brut_total: normalizeMoney(row?.brut_total),
        cnaps_total: normalizeMoney(row?.cnaps_total),
        ostie_total: normalizeMoney(row?.ostie_total),
        irsa_total: normalizeMoney(row?.irsa_total),
        avance_total: normalizeMoney(row?.avance_total),
      };
    });
  });
}

module.exports = { registerStatsHandlers };