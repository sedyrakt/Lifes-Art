// electron/ipc/payments/handlers/queryHandlers.cjs
'use strict';

const { withLiveDb, safeHandle } = require('../helpers.cjs');

function registerQueryHandlers(ipcMain) {
  console.log('[PAYMENTS] 🔧 registerQueryHandlers');

  safeHandle(ipcMain, 'payments:get-by-employe', async (_event, employeId, options = {}) => {
    return withLiveDb((db) => {
      const params = [Number(employeId)];
      let sql = `SELECT * FROM paiements_employes WHERE employe_id = ?`;

      if (options.mois != null) { sql += ' AND mois = ?'; params.push(Number(options.mois)); }
      if (options.annee != null) { sql += ' AND annee = ?'; params.push(Number(options.annee)); }

      sql += ` ORDER BY annee DESC, mois DESC, COALESCE(date_paiement, created_at, '') DESC, id DESC`;

      return db.prepare(sql).all(...params);
    });
  });

  safeHandle(ipcMain, 'payments:get-by-period', async (_event, mois, annee) => {
    return withLiveDb((db) => db.prepare(`
      SELECT
        p.*,
        e.nom AS employe_nom,
        e.prenom AS employe_prenom,
        e.poste AS employe_poste
      FROM paiements_employes p
      LEFT JOIN employes e ON e.id = p.employe_id
      WHERE p.mois = ? AND p.annee = ?
      ORDER BY e.nom ASC, e.prenom ASC, p.id DESC
    `).all(Number(mois), Number(annee)));
  });

  safeHandle(ipcMain, 'payments:get-historique', async (_event, employeId) => {
    return withLiveDb((db) => db.prepare(`
      SELECT
        p.*,
        e.nom AS employe_nom,
        e.prenom AS employe_prenom,
        e.poste AS employe_poste
      FROM paiements_employes p
      LEFT JOIN employes e ON e.id = p.employe_id
      WHERE p.employe_id = ?
      ORDER BY p.annee DESC, p.mois DESC, COALESCE(p.date_paiement, p.created_at, '') DESC, p.id DESC
    `).all(Number(employeId)));
  });

  safeHandle(ipcMain, 'payments:get-salaire-mensuel', async (_event, employeId, mois, annee) => {
    return withLiveDb((db) => {
      const row = db.prepare(`
        SELECT
          COUNT(*) AS nombre_paiements,
          COALESCE(SUM(montant), 0) AS montant,
          COALESCE(SUM(salaire_brut), 0) AS salaire_brut,
          COALESCE(SUM(cnaps), 0) AS cnaps,
          COALESCE(SUM(ostie), 0) AS ostie,
          COALESCE(SUM(irsa), 0) AS irsa,
          COALESCE(SUM(avance), 0) AS avance,
          COALESCE(SUM(montant), 0) AS total_paye,
          MIN(date_paiement) AS premiere_date,
          MAX(date_paiement) AS derniere_date
        FROM paiements_employes
        WHERE employe_id = ? AND mois = ? AND annee = ?
      `).get(Number(employeId), Number(mois), Number(annee));

      return row || { nombre_paiements: 0, montant: 0, total_paye: 0, salaire_brut: 0, cnaps: 0, ostie: 0, irsa: 0, avance: 0 };
    });
  });

  // ⭐ VAOVAO: Maka employés tsy mbola voaloa amin'ny volana iray (mois/annee)
  //    → Nampiasaina ho an'ny calendar view (1 paiement par mois)
  safeHandle(ipcMain, 'payments:get-non-payes-for-month', async (_event, mois, annee) => {
    return withLiveDb((db) => {
      const m = Number(mois);
      const y = Number(annee);
      if (!Number.isInteger(m) || m < 1 || m > 12) throw new Error('Mois invalide.');
      if (!Number.isInteger(y) || y < 2000) throw new Error('Année invalide.');

      return db.prepare(`
        SELECT
          e.id, e.nom, e.prenom, e.poste, e.departement,
          COALESCE(e.salaire_base, e.salaire, 0) AS salaire,
          e.status
        FROM employes e
        WHERE e.status != 'licencie'
          AND NOT EXISTS (
            SELECT 1 FROM paiements_employes p
            WHERE p.employe_id = e.id
              AND p.mois = ?
              AND p.annee = ?
          )
        ORDER BY e.nom ASC, e.prenom ASC
      `).all(m, y);
    });
  });

  // ⭐ VAOVAO: Maka employés IZAO no voaloa amin'ny volana iray (mois/annee)
  //    → Nampiasaina ho an'ny calendar view (statut "payé" isam-bolana)
  safeHandle(ipcMain, 'payments:get-paid-for-month', async (_event, mois, annee) => {
    return withLiveDb((db) => {
      const m = Number(mois);
      const y = Number(annee);
      if (!Number.isInteger(m) || m < 1 || m > 12) throw new Error('Mois invalide.');
      if (!Number.isInteger(y) || y < 2000) throw new Error('Année invalide.');

      return db.prepare(`
        SELECT
          e.id, e.nom, e.prenom, e.poste, e.departement,
          COALESCE(e.salaire_base, e.salaire, 0) AS salaire,
          e.status,
          p.id AS paiement_id,
          p.montant,
          p.statut AS statut_paiement,
          p.date_paiement,
          p.mode_paiement
        FROM employes e
        INNER JOIN paiements_employes p ON p.employe_id = e.id
        WHERE p.mois = ?
          AND p.annee = ?
          AND e.status != 'licencie'
        ORDER BY e.nom ASC, e.prenom ASC
      `).all(m, y);
    });
  });
}

module.exports = { registerQueryHandlers };