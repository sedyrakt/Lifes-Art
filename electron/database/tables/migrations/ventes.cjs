// electron/database/tables/migrations/ventes.cjs
'use strict';

const { tableExists, addColumnIfMissing } = require('../helpers.cjs');

function migrateVentes(db) {
  // ⭐ Devis
  if (tableExists(db, 'devis')) {
    addColumnIfMissing(db, 'devis', 'mode_paiement', "TEXT DEFAULT 'Espèces'");
    addColumnIfMissing(db, 'devis', 'modalite_paiement', "TEXT DEFAULT 'Immediat'");
    addColumnIfMissing(db, 'devis', 'frais_livraison', 'REAL DEFAULT 0');
    addColumnIfMissing(db, 'devis', 'date_limite_paiement', 'TEXT');
  }

  // ⭐ Factures
  if (tableExists(db, 'factures')) {
    addColumnIfMissing(db, 'factures', 'mode_paiement', "TEXT DEFAULT 'Espèces'");
    addColumnIfMissing(db, 'factures', 'modalite_paiement', "TEXT DEFAULT 'Immediat'");
    addColumnIfMissing(db, 'factures', 'frais_livraison', 'REAL DEFAULT 0');
    addColumnIfMissing(db, 'factures', 'date_limite_paiement', 'TEXT');
  }
}

module.exports = { migrateVentes };