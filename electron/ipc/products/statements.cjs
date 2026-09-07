// electron/ipc/products/statements.cjs
'use strict';

const { getDb } = require('../../database/connection.cjs');

const DEBUG = false;

const log = (...args) => { if (DEBUG) console.log('[📦 Products]', ...args); };
const error = (...args) => console.error('[❌ Products]', ...args);

let stmtPrepared = false;

let stmtGetById = null;
let stmtGetByCode = null;
let stmtCreate = null;
let stmtUpdate = null;
let stmtDelete = null;
let stmtSoftDelete = null;
let stmtUpdateStock = null;
let stmtGetAlertes = null;
let stmtGetTop = null;
let stmtGetByCategorie = null;
let stmtSearchFTS = null;
let stmtSearchLike = null;
let stmtGetStats = null;
let stmtCheckUsage = null;

// Nampiana ny p.tva_rate
const PRODUCT_COLUMNS = `
  p.id, p.code, p.nom, p.description, p.categorie_id, p.fournisseur_id,
  p.prix_achat, p.prix_vente, p.quantite_stock, p.quantite_minimale,
  p.unite, p.tva_rate,
  CASE WHEN p.quantite_stock <= 0 THEN 'inactif' ELSE p.status END AS status,
  p.statut_stock, p.created_at, p.updated_at
`;

function prepareStatements() {
  if (stmtPrepared) return true;
  if (DEBUG) log('📦 [products:statements] Preparing statements...');
  const db = getDb();
  if (!db) { error('❌ Database indisponible'); return false; }
  try {
    stmtGetById = db.prepare(`
      SELECT ${PRODUCT_COLUMNS}, c.nom AS categorie_nom, f.nom AS fournisseur_nom
      FROM produits p
      LEFT JOIN categories c ON c.id = p.categorie_id
      LEFT JOIN fournisseurs f ON f.id = p.fournisseur_id
      WHERE p.id = ?
      LIMIT 1
    `);
    stmtGetByCode = db.prepare(`SELECT ${PRODUCT_COLUMNS}, c.nom AS categorie_nom FROM produits p LEFT JOIN categories c ON c.id = p.categorie_id WHERE p.code = ? LIMIT 1`);

    // Nampiana ny tva_rate
    stmtCreate = db.prepare(`
      INSERT INTO produits (code, nom, description, categorie_id, fournisseur_id,
        prix_achat, prix_vente, quantite_stock, quantite_minimale,
        unite, status, statut_stock, tva_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'disponible', ?)
    `);

    // Nampiana ny tva_rate
    stmtUpdate = db.prepare(`
      UPDATE produits SET code = ?, nom = ?, description = ?, categorie_id = ?,
        fournisseur_id = ?, prix_achat = ?, prix_vente = ?, quantite_stock = ?,
        quantite_minimale = ?, unite = ?, status = ?, tva_rate = ?,
        updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);

    stmtDelete = db.prepare(`DELETE FROM produits WHERE id = ?`);
    stmtSoftDelete = db.prepare(`UPDATE produits SET status = 'inactif', updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    stmtUpdateStock = db.prepare(`UPDATE produits SET quantite_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);

    stmtGetAlertes = db.prepare(`
      SELECT p.id, p.code, p.nom, p.prix_vente, p.quantite_stock,
        p.quantite_minimale, p.status
      FROM produits p
      WHERE p.status = 'actif' AND p.quantite_stock <= p.quantite_minimale
      ORDER BY p.quantite_stock ASC, p.id ASC LIMIT ?
    `);

    stmtGetTop = db.prepare(`
      SELECT p.id, p.nom, p.code, p.quantite_stock, p.prix_vente
      FROM produits p
      WHERE p.status = 'actif' AND p.quantite_stock > 0
      ORDER BY p.quantite_stock DESC, p.id ASC LIMIT ?
    `);

    stmtGetByCategorie = db.prepare(`
      SELECT ${PRODUCT_COLUMNS}, c.nom AS categorie_nom FROM produits p
      LEFT JOIN categories c ON c.id = p.categorie_id
      WHERE p.categorie_id = ? AND p.status = 'actif'
      ORDER BY p.nom COLLATE NOCASE ASC, p.id ASC LIMIT ?
    `);

    stmtSearchFTS = db.prepare(`
      SELECT ${PRODUCT_COLUMNS}, c.nom AS categorie_nom FROM produits_fts f
      INNER JOIN produits p ON p.id = f.rowid
      LEFT JOIN categories c ON c.id = p.categorie_id
      WHERE produits_fts MATCH ? AND p.status != 'archive'
      ORDER BY p.nom COLLATE NOCASE ASC, p.id ASC LIMIT ?
    `);

    stmtSearchLike = db.prepare(`
      SELECT ${PRODUCT_COLUMNS}, c.nom AS categorie_nom FROM produits p
      LEFT JOIN categories c ON c.id = p.categorie_id
      WHERE p.nom LIKE ? OR p.code LIKE ?
      ORDER BY p.nom COLLATE NOCASE ASC, p.id ASC LIMIT ?
    `);

    stmtGetStats = db.prepare(`
      SELECT COUNT(*) AS total,
        COALESCE(SUM(quantite_stock), 0) AS totalStock,
        COALESCE(SUM(CASE WHEN quantite_stock <= 0 THEN 1 ELSE 0 END), 0) AS rupture,
        COALESCE(SUM(CASE WHEN quantite_stock > 0 AND quantite_stock <= quantite_minimale THEN 1 ELSE 0 END), 0) AS alerte,
        COALESCE(SUM(prix_vente * quantite_stock), 0) AS valeur_totale
      FROM produits WHERE status != 'archive'
    `);

    stmtCheckUsage = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM details_commandes WHERE produit_id = ?) AS commandes,
        (SELECT COUNT(*) FROM mouvements_stock WHERE produit_id = ?) AS mouvements,
        (SELECT COUNT(*) FROM entrees_stock WHERE produit_id = ?) AS entrees,
        (SELECT COUNT(*) FROM sorties_stock WHERE produit_id = ?) AS sorties
    `);

    stmtPrepared = true;
    if (DEBUG) log('✅ [products:statements] All prepared statements ready');
    return true;
  } catch (err) {
    error('❌ [products:statements] Erreur preparation:', err.message);
    return false;
  }
}

module.exports = {
  prepareStatements,
  get stmtGetById() { return stmtGetById; },
  get stmtGetByCode() { return stmtGetByCode; },
  get stmtCreate() { return stmtCreate; },
  get stmtUpdate() { return stmtUpdate; },
  get stmtDelete() { return stmtDelete; },
  get stmtSoftDelete() { return stmtSoftDelete; },
  get stmtUpdateStock() { return stmtUpdateStock; },
  get stmtGetAlertes() { return stmtGetAlertes; },
  get stmtGetTop() { return stmtGetTop; },
  get stmtGetByCategorie() { return stmtGetByCategorie; },
  get stmtSearchFTS() { return stmtSearchFTS; },
  get stmtSearchLike() { return stmtSearchLike; },
  get stmtGetStats() { return stmtGetStats; },
  get stmtCheckUsage() { return stmtCheckUsage; },
};