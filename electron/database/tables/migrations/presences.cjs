// electron/database/tables/migrations/presences.cjs
'use strict';

const { tableExists, addColumnIfMissing } = require('../helpers.cjs');

function migratePresences(db) {
  if (tableExists(db, 'presence_employes')) {
    addColumnIfMissing(db, 'presence_employes', 'justificatif_maladie', 'TEXT');
  }
  if (tableExists(db, 'presence_journaliere')) {
    addColumnIfMissing(db, 'presence_journaliere', 'heure_debut_planifiee', "TEXT DEFAULT '08:00'");
    addColumnIfMissing(db, 'presence_journaliere', 'heure_fin_planifiee', "TEXT DEFAULT '17:00'");
    addColumnIfMissing(db, 'presence_journaliere', 'retard', 'INTEGER DEFAULT 0');
    addColumnIfMissing(db, 'presence_journaliere', 'heures_travaillees', 'REAL DEFAULT 0');
    addColumnIfMissing(db, 'presence_journaliere', 'heures_sup', 'REAL DEFAULT 0');
  }
}

module.exports = { migratePresences };