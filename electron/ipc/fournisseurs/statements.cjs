// ============================================================
// electron/ipc/fournisseurs/statements.cjs - CORRIGÉ
// ⭐ FIX: stmtGetStats mamerina total, avec_contact, avec_telephone, avec_email, avec_adresse
// ⭐ FIX: NESORINA NY image
// ============================================================
'use strict';

const { getDb } = require('../../database/connection.cjs');
const { log, error } = require('../../database/utils.cjs');

let stmtGetById, stmtGetByName, stmtGetByNameExcept, stmtGetByEmail, stmtGetByEmailExcept,
  stmtCreate, stmtUpdate, stmtDelete, stmtProductCount, stmtExpenseCount,
  stmtGetProductsByFournisseur, stmtGetStats, stmtSearch;

function prepareStatements() {
  const db = getDb();
  if (!db || !db.open) {
    error('❌ [fournisseurs:statements] DB indisponible');
    return false;
  }
  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_fournisseurs_nom ON fournisseurs(nom)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_fournisseurs_email ON fournisseurs(email)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_fournisseurs_created ON fournisseurs(created_at)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_fournisseurs_telephone ON fournisseurs(telephone)');

    stmtGetById = db.prepare('SELECT id, nom, contact, telephone, email, adresse, created_at, updated_at FROM fournisseurs WHERE id = ?');
    stmtGetByName = db.prepare('SELECT id FROM fournisseurs WHERE LOWER(nom) = LOWER(?)');
    stmtGetByNameExcept = db.prepare('SELECT id FROM fournisseurs WHERE LOWER(nom) = LOWER(?) AND id != ?');
    stmtGetByEmail = db.prepare('SELECT id, nom, contact, telephone, email, adresse FROM fournisseurs WHERE LOWER(email) = LOWER(?)');
    stmtGetByEmailExcept = db.prepare('SELECT id FROM fournisseurs WHERE LOWER(email) = LOWER(?) AND id != ?');

    stmtCreate = db.prepare("INSERT INTO fournisseurs (nom, contact, telephone, email, adresse, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))");
    stmtUpdate = db.prepare('UPDATE fournisseurs SET nom = ?, contact = ?, telephone = ?, email = ?, adresse = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmtDelete = db.prepare('DELETE FROM fournisseurs WHERE id = ?');
    stmtProductCount = db.prepare('SELECT COUNT(*) as total FROM produits WHERE fournisseur_id = ?');
    stmtExpenseCount = db.prepare('SELECT COUNT(*) as total FROM depenses WHERE fournisseur_id = ?');
    stmtGetProductsByFournisseur = db.prepare('SELECT id, code, nom, prix_vente, quantite_stock, quantite_minimale, status FROM produits WHERE fournisseur_id = ? ORDER BY nom');

    // ⭐⭐⭐ STATS COMPLETE ⭐⭐⭐
    stmtGetStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN contact IS NOT NULL AND TRIM(contact) != '' THEN 1 END) as avec_contact,
        COUNT(CASE WHEN telephone IS NOT NULL AND TRIM(telephone) != '' THEN 1 END) as avec_telephone,
        COUNT(CASE WHEN email IS NOT NULL AND TRIM(email) != '' THEN 1 END) as avec_email,
        COUNT(CASE WHEN adresse IS NOT NULL AND TRIM(adresse) != '' THEN 1 END) as avec_adresse
      FROM fournisseurs
    `);

    stmtSearch = db.prepare('SELECT id, nom, contact, telephone, email FROM fournisseurs WHERE nom LIKE ? OR contact LIKE ? OR email LIKE ? OR telephone LIKE ? ORDER BY nom LIMIT 50');

    log('✅ [fournisseurs:statements] Prêts');
    return true;
  } catch (err) {
    error('❌ [fournisseurs:statements] Erreur préparation:', err.message);
    return false;
  }
}

module.exports = {
  prepareStatements,
  get stmtGetById() { return stmtGetById; },
  get stmtGetByName() { return stmtGetByName; },
  get stmtGetByNameExcept() { return stmtGetByNameExcept; },
  get stmtGetByEmail() { return stmtGetByEmail; },
  get stmtGetByEmailExcept() { return stmtGetByEmailExcept; },
  get stmtCreate() { return stmtCreate; },
  get stmtUpdate() { return stmtUpdate; },
  get stmtDelete() { return stmtDelete; },
  get stmtProductCount() { return stmtProductCount; },
  get stmtExpenseCount() { return stmtExpenseCount; },
  get stmtGetProductsByFournisseur() { return stmtGetProductsByFournisseur; },
  get stmtGetStats() { return stmtGetStats; },
  get stmtSearch() { return stmtSearch; }
};