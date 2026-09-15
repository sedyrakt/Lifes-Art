// electron/database/tables/migrations/products.cjs
'use strict';

const { tableExists, addColumnIfMissing } = require('../helpers.cjs');

function migrateProducts(db) {
  if (!tableExists(db, 'produits')) return;
  addColumnIfMissing(db, 'produits', 'unite', "TEXT DEFAULT 'pièce'");
  addColumnIfMissing(db, 'produits', 'tva_rate', 'REAL DEFAULT 0.2');
  addColumnIfMissing(db, 'produits', 'status', "TEXT DEFAULT 'actif'");
  addColumnIfMissing(db, 'produits', 'statut_stock', "TEXT DEFAULT 'disponible'");
  addColumnIfMissing(db, 'produits', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
}

module.exports = { migrateProducts };