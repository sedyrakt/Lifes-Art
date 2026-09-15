// electron/database/tables/migrations/quotes.cjs
'use strict';

const { tableExists, addColumnIfMissing } = require('../helpers.cjs');

function migrateQuotes(db) {
  if (tableExists(db, 'devis')) {
    addColumnIfMissing(db, 'devis', 'statut_paiement', "TEXT DEFAULT 'Non payé'");
    addColumnIfMissing(db, 'devis', 'montant_paye', 'REAL DEFAULT 0');
    addColumnIfMissing(db, 'devis', 'montant_restant', 'REAL DEFAULT 0');
  }
  addColumnIfMissing(db, 'details_devis', 'tva_rate', 'REAL DEFAULT 0.2');
}

module.exports = { migrateQuotes };