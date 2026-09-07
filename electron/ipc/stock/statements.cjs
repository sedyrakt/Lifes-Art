'use strict';
const { getDb } = require('../../database/connection.cjs');
const { log, error } = require('./logger.cjs');

function prepareStatements() {
  const db = getDb();
  if (!db) { error('❌ [stock:statements] Database indisponible'); return null; }
  try {
    const stmtGetProduitById = db.prepare(`SELECT id, code, nom, quantite_stock, quantite_minimale, statut_stock FROM produits WHERE id = ?`);
    const stmtGetProduitByCode = db.prepare(`SELECT id, code, nom, quantite_stock, quantite_minimale FROM produits WHERE code = ?`);
    const stmtUpdateStockSeul = db.prepare(`UPDATE produits SET quantite_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    const stmtInsertEntree = db.prepare(`INSERT INTO entrees_stock (produit_id, quantite, prix_unitaire, reference, fournisseur_id, observation) VALUES (?, ?, ?, ?, ?, ?)`);
    const stmtInsertSortie = db.prepare(`INSERT INTO sorties_stock (produit_id, quantite, prix_unitaire, reference, destination, observation) VALUES (?, ?, ?, ?, ?, ?)`);
    
    // ⭐ FIX: Ampiana ny colonne prix_unitaire
    const stmtInsertMouvement = db.prepare(`
      INSERT INTO mouvements_stock 
      (produit_id, type_mouvement, quantite, ancien_stock, nouveau_stock, reference, observation, prix_unitaire, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const stmtGetEntreesStats = db.prepare(`SELECT COUNT(*) AS total, COALESCE(SUM(quantite), 0) AS quantite_totale, COALESCE(SUM(prix_unitaire * quantite), 0) AS valeur_totale, COUNT(DISTINCT fournisseur_id) AS nb_fournisseurs FROM entrees_stock`);
    const stmtGetSortiesStats = db.prepare(`SELECT COUNT(*) AS total, COALESCE(SUM(quantite), 0) AS quantite_totale, COALESCE(SUM(prix_unitaire * quantite), 0) AS valeur_totale, COUNT(DISTINCT destination) AS nb_destinations FROM sorties_stock`);
    
    return { stmtGetProduitById, stmtGetProduitByCode, stmtUpdateStockSeul, stmtInsertEntree, stmtInsertSortie, stmtInsertMouvement, stmtGetEntreesStats, stmtGetSortiesStats };
  } catch (err) { error('❌ [stock:statements] Erreur:', err.message); return null; }
}
module.exports = { prepareStatements };