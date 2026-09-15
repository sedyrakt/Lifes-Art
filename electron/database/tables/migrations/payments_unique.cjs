// electron/database/tables/migrations/payments_unique.cjs
'use strict';

const { log, warn, tableExists } = require('../helpers.cjs');

/**
 * ⭐ FIX: Mametraka UNIQUE INDEX ho an'ny paiements_employes
 *    (1 paiement / employé / mois / année)
 *
 * Dingana:
 *   1. Fafao ny index taloha non-unique (raha misy)
 *   2. Hamarino raha misy doublons — diovina raha misy
 *   3. Mamorona UNIQUE INDEX
 */
function migratePaymentsUnique(db) {
  if (!tableExists(db, 'paiements_employes')) return;

  try {
    // ─── Étape 1: Fafao ny index taloha (non-unique) ───
    db.exec(`DROP INDEX IF EXISTS idx_paiements_employes_periode`);
    db.exec(`DROP INDEX IF EXISTS idx_paiement_unique_mois`);

    // ─── Étape 2: Hamarino raha misy doublons ───
    const duplicates = db.prepare(`
      SELECT employe_id, mois, annee, COUNT(*) AS c
      FROM paiements_employes
      GROUP BY employe_id, mois, annee
      HAVING c > 1
    `).all();

    if (duplicates.length > 0) {
      warn(`⚠️ [migration] ${duplicates.length} doublon(s) paiement hita — fanadiovana...`);

      // Tehirizo ny paiement tranainy indrindra (id ambany indrindra),
      // fafao ny duplicate hafa
      const deleteStmt = db.prepare(`
        DELETE FROM paiements_employes
        WHERE employe_id = ?
          AND mois = ?
          AND annee = ?
          AND id NOT IN (
            SELECT MIN(id) FROM paiements_employes
            WHERE employe_id = ? AND mois = ? AND annee = ?
          )
      `);

      let deletedCount = 0;
      for (const dup of duplicates) {
        const res = deleteStmt.run(
          dup.employe_id, dup.mois, dup.annee,
          dup.employe_id, dup.mois, dup.annee
        );
        deletedCount += res.changes || 0;
      }

      log(`✅ [migration] ${deletedCount} doublon(s) paiement esorina`);
    }

    // ─── Étape 3: Mamorona UNIQUE INDEX ───
    db.exec(`
      CREATE UNIQUE INDEX idx_paiement_unique_mois
        ON paiements_employes(employe_id, mois, annee)
    `);
    log('✅ [migration] idx_paiement_unique_mois (UNIQUE) créé');
  } catch (err) {
    warn('⚠️ [migration] unique index paiement:', err.message);
  }
}

module.exports = { migratePaymentsUnique };