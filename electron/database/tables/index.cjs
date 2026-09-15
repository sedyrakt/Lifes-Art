// electron/database/tables/index.cjs
'use strict';

const {
  tableExists,
  columnExists,
  addColumnIfMissing,
  createIndex,
  dropIndex,
} = require('./helpers.cjs');

const { createAllSchemas } = require('./schemas.cjs');
const { runAllMigrations } = require('./migrations/index.cjs');
const { createAllIndexes } = require('./indexes.cjs');
const { createAllFTS } = require('./fts.cjs');

module.exports = {
  ensureTables,
  tableExists,
  columnExists,
  addColumnIfMissing,
  createIndex,
  dropIndex,
};

function ensureTables() {
  const { getDb } = require('../connection.cjs');
  const { log, error } = require('./helpers.cjs');

  const db = getDb();
  if (!db || !db.open) {
    error('[tables] DB indisponible');
    return false;
  }

  try {
    createAllSchemas(db);
    runAllMigrations(db);
    createAllIndexes(db);
    createAllFTS(db);

    log('================================================');
    log('✅ DATABASE SCHEMA INITIALISÉ');
    log('✅ Tables vérifiées');
    log('✅ Migrations vérifiées');
    log('✅ Payroll vérifié');
    log('✅ Paramètres paie configurés (CNaPS/OSTIE/IRSA optionnels)');
    log('✅ Colonnes paiements complètes (actif, taux, retards, snapshot)');
    log('✅ Index calendrier vérifiés');
    log('✅ FTS5 vérifié');
    log('✅ Triggers vérifiés');
    log('✅ salaire_base migré + backfill');
    log('✅ stock_snapshots prêt (historique + variations + sparklines)');
    log('================================================');

    return true;
  } catch (err) {
    error('[tables] ❌ Erreur lors de la création du schéma:', err.message);
    if (err.stack) error(err.stack);
    return false;
  }
}