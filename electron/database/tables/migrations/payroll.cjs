// electron/database/tables/migrations/payroll.cjs
'use strict';

const { log, warn, tableExists, addColumnIfMissing } = require('../helpers.cjs');

function migratePayroll(db) {
  if (!tableExists(db, 'parametres_paie')) return;

  // ─── Colonnes additionnelles ───
  addColumnIfMissing(db, 'parametres_paie', 'irsa_exoneration', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'parametres_paie', 'cnaps_plafond', 'REAL DEFAULT 1600000');
  addColumnIfMissing(db, 'parametres_paie', 'ostie_plafond', 'REAL DEFAULT 1600000');
  addColumnIfMissing(db, 'parametres_paie', 'cnaps_base', "TEXT DEFAULT 'brut'");
  addColumnIfMissing(db, 'parametres_paie', 'ostie_base', "TEXT DEFAULT 'brut'");
  addColumnIfMissing(db, 'parametres_paie', 'irsa_base', "TEXT DEFAULT 'net_imposable'");
  // ⭐ NOUVEAU: Mode
  addColumnIfMissing(db, 'parametres_paie', 'mode_paie', "TEXT DEFAULT 'complet'");

  // ─── S'assurer qu'une ligne existe ───
  try {
    const row = db.prepare('SELECT COUNT(*) AS c FROM parametres_paie').get();
    if (!row || Number(row.c) === 0) {
      db.exec(`INSERT INTO parametres_paie (id) VALUES (1)`);
      log('✅ [migration] Paramètres paie par défaut créés');
    }
  } catch (err) {
    warn('⚠️ [migration] parametres_paie:', err.message);
  }

  // ─── FIX: OSTIE 5% → 1% (part salariale) ───
  try {
    const res = db.prepare(`
      UPDATE parametres_paie SET ostie_taux = 1.0
      WHERE ostie_taux = 5 OR ostie_taux IS NULL OR ostie_taux = 0
    `).run();
    if (res && res.changes > 0) {
      log(`✅ [migration] ostie_taux corrigé (5% → 1%): ${res.changes} ligne(s)`);
    }
  } catch (err) {
    warn('⚠️ [migration] fix ostie_taux:', err.message);
  }

  // ─── FIX: Barème IRSA mis à jour ───
  try {
    const OLD_BAREME = '[{"min":0,"max":400000,"taux":0},{"min":400000,"max":500000,"taux":5},{"min":500000,"max":600000,"taux":10},{"min":600000,"max":700000,"taux":15},{"min":700000,"max":null,"taux":20}]';
    const NEW_BAREME = '[{"min":0,"max":350000,"taux":0},{"min":350000,"max":400000,"taux":5},{"min":400000,"max":500000,"taux":10},{"min":500000,"max":600000,"taux":15},{"min":600000,"max":700000,"taux":20},{"min":700000,"max":null,"taux":25}]';

    const row = db.prepare('SELECT irsa_bareme FROM parametres_paie WHERE id = 1').get();
    if (row && (row.irsa_bareme === OLD_BAREME || !row.irsa_bareme)) {
      db.prepare('UPDATE parametres_paie SET irsa_bareme = ? WHERE id = 1').run(NEW_BAREME);
      log('✅ [migration] Barème IRSA mis à jour');
    }
  } catch (err) {
    warn('⚠️ [migration] fix irsa_bareme:', err.message);
  }

  // ─── FIX: mode_paie NULL → 'complet' ───
  try {
    const res = db.prepare(`
      UPDATE parametres_paie SET mode_paie = 'complet'
      WHERE mode_paie IS NULL OR TRIM(mode_paie) = ''
    `).run();
    if (res && res.changes > 0) {
      log(`✅ [migration] mode_paie initialisé: ${res.changes} ligne(s)`);
    }
  } catch (err) {
    warn('⚠️ [migration] fix mode_paie:', err.message);
  }
}

module.exports = { migratePayroll };