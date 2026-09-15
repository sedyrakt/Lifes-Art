// electron/database/tables/migrations/orders.cjs
'use strict';

const { tableExists, addColumnIfMissing } = require('../helpers.cjs');

function migrateOrders(db) {
  if (tableExists(db, 'commandes')) {
    addColumnIfMissing(db, 'commandes', 'client_id', 'INTEGER');
    addColumnIfMissing(db, 'commandes', 'client_nom', 'TEXT');
    addColumnIfMissing(db, 'commandes', 'total_ht', 'REAL DEFAULT 0');
    addColumnIfMissing(db, 'commandes', 'total_ttc', 'REAL DEFAULT 0');
    addColumnIfMissing(db, 'commandes', 'total', 'REAL DEFAULT 0');
    addColumnIfMissing(db, 'commandes', 'statut_paiement', "TEXT DEFAULT 'Non payé'");
    addColumnIfMissing(db, 'commandes', 'montant_paye', 'REAL DEFAULT 0');
    addColumnIfMissing(db, 'commandes', 'montant_restant', 'REAL DEFAULT 0');
    addColumnIfMissing(db, 'commandes', 'date_limite_paiement', 'TEXT');
    addColumnIfMissing(db, 'commandes', 'mode_paiement', "TEXT DEFAULT 'Espèces'");
    addColumnIfMissing(db, 'commandes', 'modalite_paiement', "TEXT DEFAULT 'Immediat'");
    addColumnIfMissing(db, 'commandes', 'frais_livraison', 'REAL DEFAULT 0');
    addColumnIfMissing(db, 'commandes', 'stock_restaure', 'INTEGER NOT NULL DEFAULT 0');
    addColumnIfMissing(db, 'commandes', 'date_commande', 'TEXT DEFAULT CURRENT_TIMESTAMP');
    addColumnIfMissing(db, 'commandes', 'created_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
    addColumnIfMissing(db, 'commandes', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
  }
  addColumnIfMissing(db, 'details_commandes', 'tva_rate', 'REAL DEFAULT 0.2');
}

module.exports = { migrateOrders };