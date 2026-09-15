// electron/database/tables/migrations/invoices.cjs
'use strict';

const { tableExists, addColumnIfMissing } = require('../helpers.cjs');

function migrateInvoices(db) {
  if (tableExists(db, 'factures')) {
    addColumnIfMissing(db, 'factures', 'statut_paiement', "TEXT DEFAULT 'Non payé'");
    addColumnIfMissing(db, 'factures', 'montant_paye', 'REAL DEFAULT 0');
    addColumnIfMissing(db, 'factures', 'montant_restant', 'REAL DEFAULT 0');
  }
  addColumnIfMissing(db, 'details_factures', 'tva_rate', 'REAL DEFAULT 0.2');
}

module.exports = { migrateInvoices };