// electron/database/tables/migrations/payments.cjs
'use strict';

const { warn, tableExists, addColumnIfMissing } = require('../helpers.cjs');

function migratePayments(db) {
  if (!tableExists(db, 'paiements_employes')) return;

  // ─── Colonnes de base ───
  addColumnIfMissing(db, 'paiements_employes', 'mois', 'INTEGER');
  addColumnIfMissing(db, 'paiements_employes', 'annee', 'INTEGER');
  addColumnIfMissing(db, 'paiements_employes', 'montant', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'date_paiement', 'TEXT');
  addColumnIfMissing(db, 'paiements_employes', 'mode_paiement', "TEXT DEFAULT 'Espèces'");
  addColumnIfMissing(db, 'paiements_employes', 'statut', "TEXT DEFAULT 'Payé'");
  addColumnIfMissing(db, 'paiements_employes', 'reference', 'TEXT');
  addColumnIfMissing(db, 'paiements_employes', 'observation', 'TEXT');
  addColumnIfMissing(db, 'paiements_employes', 'created_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
  addColumnIfMissing(db, 'paiements_employes', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');

  // ─── GAINS ───
  addColumnIfMissing(db, 'paiements_employes', 'salaire_base', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'salaire_brut', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'heures_sup', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'heures_sup_montant', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'hs_montant', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'prime_anciennete', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'prime_logement', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'prime_cherte_vie', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'indemnite_transport', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'autres_primes', 'REAL DEFAULT 0');

  // ─── RETENUES ───
  addColumnIfMissing(db, 'paiements_employes', 'cnaps', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'ostie', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'irsa', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'avance', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'absences_deduction', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'absences_count', 'INTEGER DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'retards', 'INTEGER DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'autres_retenues', 'REAL DEFAULT 0');

  // ─── TOTAUX / CUMULS ───
  addColumnIfMissing(db, 'paiements_employes', 'net_imposable', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'cumul_gains', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'cumul_retenues', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'cumul_net', 'REAL DEFAULT 0');

  // ─── TOGGLES / SNAPSHOT ───
  addColumnIfMissing(db, 'paiements_employes', 'cnaps_actif', 'INTEGER DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'ostie_actif', 'INTEGER DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'irsa_actif', 'INTEGER DEFAULT 0');
  addColumnIfMissing(db, 'paiements_employes', 'cnaps_taux', 'REAL DEFAULT 1.0');
  addColumnIfMissing(db, 'paiements_employes', 'ostie_taux', 'REAL DEFAULT 1.0');
  addColumnIfMissing(db, 'paiements_employes', 'payroll_parameters_snapshot', 'TEXT');
  addColumnIfMissing(db, 'paiements_employes', 'parametres_snapshot', 'TEXT');

  // ─── BACKFILL heures_sup_montant ───
  try {
    db.exec(`
      UPDATE paiements_employes
      SET heures_sup_montant = hs_montant
      WHERE (heures_sup_montant IS NULL OR heures_sup_montant = 0)
        AND hs_montant IS NOT NULL AND hs_montant > 0
    `);
  } catch (err) {
    warn('⚠️ [migration] backfill heures_sup_montant:', err.message);
  }

  // ─── BACKFILL date_paiement ───
  try {
    db.exec(`
      UPDATE paiements_employes
      SET date_paiement = CASE
        WHEN date_paiement IS NOT NULL AND TRIM(date_paiement) <> '' THEN substr(date_paiement, 1, 10)
        WHEN created_at IS NOT NULL AND TRIM(created_at) <> '' THEN substr(created_at, 1, 10)
        WHEN annee IS NOT NULL AND mois IS NOT NULL THEN printf('%04d-%02d-01', annee, mois)
        ELSE date('now')
      END
      WHERE date_paiement IS NULL OR TRIM(date_paiement) = ''
    `);
  } catch (err) {
    warn('⚠️ [migration] backfill date_paiement:', err.message);
  }

  // ─── BACKFILL salaire_base depuis salaire_brut ───
  try {
    db.exec(`
      UPDATE paiements_employes
      SET salaire_base = salaire_brut
      WHERE (salaire_base IS NULL OR salaire_base = 0)
        AND salaire_brut IS NOT NULL AND salaire_brut > 0
    `);
  } catch (err) {
    warn('⚠️ [migration] backfill salaire_base:', err.message);
  }
}

module.exports = { migratePayments };