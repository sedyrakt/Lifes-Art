// electron/database/tables/migrations/purchases.cjs
'use strict';

const { tableExists, addColumnIfMissing } = require('../helpers.cjs');

function migratePurchases(db) {
  if (tableExists(db, 'achats')) {
    addColumnIfMissing(db, 'achats', 'statut_paiement', "TEXT DEFAULT 'Non payé'");
    addColumnIfMissing(db, 'achats', 'montant_paye', 'REAL DEFAULT 0');
    addColumnIfMissing(db, 'achats', 'montant_restant', 'REAL DEFAULT 0');
    addColumnIfMissing(db, 'achats', 'designation', 'TEXT');
    addColumnIfMissing(db, 'achats', 'nombre_produits', 'INTEGER DEFAULT 0');
    addColumnIfMissing(db, 'achats', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
  }
  addColumnIfMissing(db, 'details_achats', 'tva_rate', 'REAL DEFAULT 0.2');
}

module.exports = { migratePurchases };