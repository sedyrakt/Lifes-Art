'use strict';
const { getDb } = require('../../database/connection.cjs');
const { log, error } = require('../../database/utils.cjs');
const { buildEmployesQuery, buildEmployesCountQuery } = require('./queries.cjs');

const stmts = {};

function prepareStatements() {
  const db = getDb();
  if (!db) { error('❌ [employes:statements] DB indisponible'); return false; }

  try {
    db.prepare('SELECT 1 FROM employes LIMIT 1').get(); // check

    // ---------- Base Statements ----------
    stmts.stmtGetById = db.prepare('SELECT id, nom, prenom, email, telephone, poste, departement, date_embauche, salaire, status, created_at, updated_at FROM employes WHERE id = ?');
    stmts.stmtGetByEmail = db.prepare('SELECT id FROM employes WHERE email = ?');
    stmts.stmtGetByDepartement = db.prepare('SELECT id, nom, prenom, email, poste, status FROM employes WHERE departement = ? AND status = ? ORDER BY nom');
    stmts.stmtGetByStatus = db.prepare('SELECT id, nom, prenom, email, poste, status FROM employes WHERE status = ? ORDER BY nom');
    stmts.stmtCreate = db.prepare('INSERT INTO employes (nom, prenom, email, telephone, poste, departement, date_embauche, salaire, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))');
    stmts.stmtUpdate = db.prepare('UPDATE employes SET nom = ?, prenom = ?, email = ?, telephone = ?, poste = ?, departement = ?, date_embauche = ?, salaire = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmts.stmtSoftDelete = db.prepare('UPDATE employes SET status = ? WHERE id = ?');
    stmts.stmtUpdateStatus = db.prepare('UPDATE employes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmts.stmtCheckEmail = db.prepare('SELECT id FROM employes WHERE email = ?');
    stmts.stmtCheckEmailExcept = db.prepare('SELECT id FROM employes WHERE email = ? AND id != ?');
    stmts.stmtPaymentCount = db.prepare('SELECT COUNT(*) AS total FROM paiements_employes WHERE employe_id = ?');
    stmts.stmtStats = db.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'actif' THEN 1 ELSE 0 END) AS actifs, SUM(CASE WHEN status = 'inactif' THEN 1 ELSE 0 END) AS inactifs, SUM(CASE WHEN status = 'en_conge' THEN 1 ELSE 0 END) AS en_conge, SUM(CASE WHEN status = 'licencie' THEN 1 ELSE 0 END) AS licencies, SUM(salaire) AS total_salaires, AVG(salaire) AS salaire_moyen, COUNT(DISTINCT departement) AS departements FROM employes`);
    stmts.stmtSearch = db.prepare('SELECT id, nom, prenom, email, poste, departement, status FROM employes WHERE (nom LIKE ? OR prenom LIKE ? OR email LIKE ?) AND status != \'licencie\' ORDER BY nom LIMIT 50');
    stmts.stmtGetAllActifs = db.prepare('SELECT id, nom, prenom, email, poste, departement, status FROM employes WHERE status != \'licencie\' ORDER BY nom, prenom LIMIT 50');
    stmts.stmtGetPaiementCountsBatch = db.prepare(`SELECT employe_id, COUNT(*) AS count FROM paiements_employes WHERE employe_id IN (${Array.from({ length: 50 }, () => '?').join(',')}) GROUP BY employe_id`);

    // ---------- RH Statements (agrégées mensuelles) ----------
    stmts.stmtGetPresence = db.prepare(`SELECT * FROM presence_employes WHERE employe_id = ? AND mois = ? AND annee = ?`);
    stmts.stmtUpsertPresence = db.prepare(`
      INSERT INTO presence_employes (employe_id, mois, annee, jours_absences, jours_conges, jours_maladie, justificatif_maladie, observation, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(employe_id, mois, annee) DO UPDATE SET
        jours_absences = excluded.jours_absences,
        jours_conges = excluded.jours_conges,
        jours_maladie = excluded.jours_maladie,
        justificatif_maladie = excluded.justificatif_maladie,
        observation = excluded.observation,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmts.stmtGetSalaryHistory = db.prepare(`SELECT * FROM historique_salaires WHERE employe_id = ? ORDER BY date_changement DESC`);
    stmts.stmtAddSalaryHistory = db.prepare(`INSERT INTO historique_salaires (employe_id, ancien_salaire, nouveau_salaire, raison) VALUES (?, ?, ?, ?)`);

    // ---------- ⭐ NEW: PRESENCE JOURNALIERE ----------
    stmts.stmtGetPresenceJournaliereByEmployeMois = db.prepare(`
      SELECT * FROM presence_journaliere
      WHERE employe_id = ? AND substr(date, 1, 7) = ?
      ORDER BY date ASC
    `);

    stmts.stmtGetPresenceJournaliereByDate = db.prepare(`
      SELECT * FROM presence_journaliere WHERE date = ?
    `);

    // ⭐ NEW BATCH: Get ALL presence for a month (10 000 employés)
    stmts.stmtGetPresenceJournaliereByMois = db.prepare(`
      SELECT * FROM presence_journaliere
      WHERE substr(date, 1, 7) = ?
      ORDER BY date ASC
    `);

    stmts.stmtUpsertPresenceJournaliere = db.prepare(`
      INSERT INTO presence_journaliere (employe_id, date, statut, heure_arrivee, heure_depart, observation, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(employe_id, date) DO UPDATE SET
        statut = excluded.statut,
        heure_arrivee = excluded.heure_arrivee,
        heure_depart = excluded.heure_depart,
        observation = excluded.observation,
        updated_at = CURRENT_TIMESTAMP
    `);

    // ⭐ NEW BATCH: Bulk Update presence
    stmts.stmtBulkUpsertPresenceJournaliere = db.prepare(`
      INSERT INTO presence_journaliere (employe_id, date, statut, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(employe_id, date) DO UPDATE SET
        statut = excluded.statut,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmts.stmtDeletePresenceJournaliere = db.prepare(`
      DELETE FROM presence_journaliere WHERE id = ?
    `);

    return true;
  } catch (err) {
    error('❌ [employes:statements] Erreur:', err.message);
    return false;
  }
}

function getStatements() {
  return stmts;
}

module.exports = {
  prepareStatements,
  getStatements,
  buildEmployesQuery,
  buildEmployesCountQuery
};