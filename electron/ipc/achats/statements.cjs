// electron/ipc/achats/statements.cjs — ACHATS STATEMENTS (FIXED TVA)
'use strict';

const { getDb } = require('../../database/connection.cjs');
const { log, error } = require('./utils.cjs');

let stmtGetById = null;
let stmtCreate = null;
let stmtUpdate = null;
let stmtDelete = null;
let stmtGetDetails = null;
let stmtInsertDetail = null;
let stmtDeleteDetails = null;
let stmtCheckProduit = null;
let stmtCountProduits = null;

function prepareStatements() {
  try {
    const db = getDb();
    if (!db || !db.open) {
      error('❌ [achats.statements] DB indisponible');
      return false;
    }

    log('🛒 [achats.statements] Préparation...');

    const achatsColumns = db.prepare(`PRAGMA table_info(achats)`).all();
    const achatsColumnNames = achatsColumns.map(column => column.name);
    log('📋 Colonnes achats:', achatsColumnNames.join(', '));

    const requiredColumns = ['fournisseur_id', 'date_achat', 'total_ht', 'total_ttc', 'statut_paiement', 'montant_paye', 'montant_restant'];
    const missingRequired = requiredColumns.filter(column => !achatsColumnNames.includes(column));
    if (missingRequired.length > 0) {
      error(`❌ [achats.statements] Colonnes obligatoires manquantes: ${missingRequired.join(', ')}`);
      return false;
    }

    stmtCreate = db.prepare(`
      INSERT INTO achats (fournisseur_id, reference, date_achat, total_ht, total_ttc, designation, nombre_produits, statut_paiement, montant_paye, montant_restant, observation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmtUpdate = db.prepare(`
      UPDATE achats
      SET fournisseur_id = ?, reference = ?, date_achat = ?, total_ht = ?, total_ttc = ?,
        designation = ?, nombre_produits = ?, statut_paiement = ?, montant_paye = ?,
        montant_restant = ?, observation = ?
      WHERE id = ?
    `);

    stmtGetById = db.prepare(`
      SELECT a.id, a.reference, a.fournisseur_id, a.date_achat, a.total_ht, a.total_ttc,
        a.designation, a.nombre_produits, a.statut_paiement, a.montant_paye, a.montant_restant,
        a.observation, a.created_at, COALESCE(a.updated_at, a.created_at) AS updated_at,
        COALESCE(f.nom, 'Aucun fournisseur') AS fournisseur_nom
      FROM achats a
      LEFT JOIN fournisseurs f ON f.id = a.fournisseur_id
      WHERE a.id = ?
    `);

    stmtDelete = db.prepare(`DELETE FROM achats WHERE id = ?`);

    // ⭐ FIX: NAMPIANA NY TVA RATE AO AMIN'NY INSERT
    stmtInsertDetail = db.prepare(`
      INSERT INTO details_achats (achat_id, produit_id, quantite, prix_unitaire, total, tva_rate)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmtDeleteDetails = db.prepare(`DELETE FROM details_achats WHERE achat_id = ?`);

    stmtCheckProduit = db.prepare(`
      SELECT id, nom, quantite_stock, prix_achat, tva_rate FROM produits WHERE id = ?
    `);

    stmtGetDetails = db.prepare(`
      SELECT d.id, d.achat_id, d.produit_id, d.quantite, d.prix_unitaire, d.total, d.tva_rate, p.nom AS produit_nom
      FROM details_achats d
      LEFT JOIN produits p ON p.id = d.produit_id
      WHERE d.achat_id = ?
      ORDER BY d.id ASC
    `);

    stmtCountProduits = db.prepare(`SELECT COUNT(*) AS total FROM details_achats WHERE achat_id = ?`);

    log('✅ [achats.statements] Statements préparés');
    return true;
  } catch (err) {
    error('❌ [achats.statements] Erreur:', err.message);
    if (err.stack) error(err.stack);
    stmtGetById = null; stmtCreate = null; stmtUpdate = null; stmtDelete = null;
    stmtGetDetails = null; stmtInsertDetail = null; stmtDeleteDetails = null;
    stmtCheckProduit = null; stmtCountProduits = null;
    return false;
  }
}

function getStatements() {
  if (!stmtGetById || !stmtCreate || !stmtUpdate || !stmtDelete || !stmtGetDetails || !stmtInsertDetail || !stmtDeleteDetails || !stmtCheckProduit) {
    throw new Error('Statements ACHATS non préparés.');
  }
  return { stmtGetById, stmtCreate, stmtUpdate, stmtDelete, stmtGetDetails, stmtInsertDetail, stmtDeleteDetails, stmtCheckProduit, stmtCountProduits };
}

module.exports = { prepareStatements, getStatements };