// electron/database/tables/migrations/stock.cjs
'use strict';

const { tableExists, addColumnIfMissing } = require('../helpers.cjs');

function migrateStock(db) {
  if (tableExists(db, 'mouvements_stock')) {
    addColumnIfMissing(db, 'mouvements_stock', 'prix_unitaire', 'REAL DEFAULT 0');
  }
  if (tableExists(db, 'stock_snapshots')) {
    addColumnIfMissing(db, 'stock_snapshots', 'stock_total', 'INTEGER DEFAULT 0');
    addColumnIfMissing(db, 'stock_snapshots', 'total_produits', 'INTEGER DEFAULT 0');
    addColumnIfMissing(db, 'stock_snapshots', 'rotation_rate', 'REAL DEFAULT 0');
    addColumnIfMissing(db, 'stock_snapshots', 'created_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
  }
}

module.exports = { migrateStock };