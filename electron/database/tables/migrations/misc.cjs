// electron/database/tables/migrations/misc.cjs
'use strict';

const { log, warn, dropIndex, addColumnIfMissing } = require('../helpers.cjs');

function migrateMisc(db) {
  // Fournisseurs
  addColumnIfMissing(db, 'fournisseurs', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');

  // Produits status update
  try {
    db.exec(`UPDATE produits SET status = 'actif' WHERE quantite_stock <= 0`);
  } catch (err) {
    warn('⚠️ Update produits status:', err.message);
  }

  // Drop index unique paiements
  log('🔧 Suppression de l\'index UNIQUE sur paiements_employes...');
  dropIndex(db, 'idx_paiements_unique_periode');
  log('✅ Index UNIQUE supprimé (si existant)');
}

module.exports = { migrateMisc };