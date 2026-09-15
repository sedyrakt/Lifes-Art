// electron/database/tables/migrations/employees.cjs
'use strict';

const { log, warn, tableExists, addColumnIfMissing } = require('../helpers.cjs');

function migrateEmployees(db) {
  if (!tableExists(db, 'employes')) return;

  // ─── Colonnes de base ───
  addColumnIfMissing(db, 'employes', 'status', "TEXT DEFAULT 'actif'");
  addColumnIfMissing(db, 'employes', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
  addColumnIfMissing(db, 'employes', 'cnaps', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'employes', 'ostie', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'employes', 'irsa', 'REAL DEFAULT 0');
  addColumnIfMissing(db, 'employes', 'salaire_base', 'REAL DEFAULT 0');

  // ─── NOUVEAU: Infos Madagascar ───
  addColumnIfMissing(db, 'employes', 'situation_familiale', 'TEXT');
  addColumnIfMissing(db, 'employes', 'nombre_enfants', 'INTEGER DEFAULT 0');
  addColumnIfMissing(db, 'employes', 'matricule', 'TEXT');
  addColumnIfMissing(db, 'employes', 'cin', 'TEXT');
  addColumnIfMissing(db, 'employes', 'cnaps_numero', 'TEXT');
  addColumnIfMissing(db, 'employes', 'ostie_numero', 'TEXT');
  addColumnIfMissing(db, 'employes', 'banque', 'TEXT');
  addColumnIfMissing(db, 'employes', 'numero_compte', 'TEXT');

  // ─── BACKFILL salaire_base depuis salaire ───
  try {
    const res = db.prepare(`
      UPDATE employes
      SET salaire_base = salaire
      WHERE (salaire_base IS NULL OR salaire_base = 0)
        AND salaire IS NOT NULL AND salaire > 0
    `).run();
    if (res && res.changes > 0) {
      log(`✅ [migration] salaire_base backfill: ${res.changes} ligne(s)`);
    }
  } catch (err) {
    warn('⚠️ [migration] backfill salaire_base:', err.message);
  }
}

module.exports = { migrateEmployees };