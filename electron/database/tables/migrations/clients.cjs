// electron/database/tables/migrations/clients.cjs
'use strict';

const { tableExists, addColumnIfMissing } = require('../helpers.cjs');

function migrateClients(db) {
  if (!tableExists(db, 'clients')) return;
  addColumnIfMissing(db, 'clients', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
  addColumnIfMissing(db, 'clients', 'ville', 'TEXT');
  addColumnIfMissing(db, 'clients', 'code_postal', 'TEXT');
  addColumnIfMissing(db, 'clients', 'pays', 'TEXT');
  addColumnIfMissing(db, 'clients', 'type', "TEXT DEFAULT 'Particulier'");
}

module.exports = { migrateClients };