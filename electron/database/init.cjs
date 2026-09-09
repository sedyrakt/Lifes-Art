'use strict';

const { getDb } = require('./connection.cjs'); // ⭐ Ampiasao ity getDb ity!
const { log, error, createFolders } = require('./utils.cjs');

async function initDatabase() {
  try {
    log('🔄 Initialisation de la base de données...');
    
    // ⭐ Ny getDb() dia hamorona connection vaovao raha toa ka mikatona!
    const db = getDb();
    if (!db) {
      throw new Error('Connexion à la base de données non disponible');
    }
    log('✅ Connexion à la base de données établie');

    const { ensureTables } = require('./tables.cjs');
    log('📦 Création/vérification des tables et index (avec migration)...');
    const success = ensureTables();
    if (!success) {
      throw new Error('Erreur lors de la création des tables/indexes');
    }
    log('✅ Tables et index créés/vérifiés avec succès');

    log('📁 Création des dossiers d\'upload...');
    createFolders();
    log('✅ Dossiers d\'upload créés');

    log('✅ Base de données initialisée avec succès');
    return { success: true, db };
  } catch (err) {
    error('❌ Erreur initDatabase:', err.message);
    throw err;
  }
}

function closeDatabase() {
  const { closeDatabase: closeDb } = require('./connection.cjs');
  closeDb();
  log('✅ Base de données fermée avec succès');
}

module.exports = { initDatabase, closeDatabase };