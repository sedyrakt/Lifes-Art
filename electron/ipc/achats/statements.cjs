// electron/ipc/achats/statements.cjs — ACHATS STATEMENTS
// ⭐ VAOVAO: stmtGetStats (stats global) + stmtUpdatePaiement (update paiement)
// ⭐ FIX: stmtGetStats kajy dynamique ny statut
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
let stmtGetStats = null;             // ⭐ VAOVAO
let stmtUpdatePaiement = null;       // ⭐ VAOVAO
let stmtGetAllMinimal = null;        // ⭐ VAOVAO (ho an'ny export)

function prepareStatements() {
  try {
    const db = getDb();
    if (!db || !db.open) {
      error('❌ [achats.statements] DB indisponible');
      return false;
    }

    log('🛒 [achats.statements] Préparation...');

    // ⭐ MIGRATION: Colonnes vaovao
    const achatsColumns = db.prepare(`PRAGMA table_info(achats)`).all();
    const achatsColumnNames = achatsColumns.map(column => column.name);

    if (!achatsColumnNames.includes('mode_paiement')) {
      db.exec(`ALTER TABLE achats ADD COLUMN mode_paiement TEXT DEFAULT 'Espèces'`);
    }
    if (!achatsColumnNames.includes('modalite_paiement')) {
      db.exec(`ALTER TABLE achats ADD COLUMN modalite_paiement TEXT DEFAULT 'Immediat'`);
    }
    if (!achatsColumnNames.includes('frais_livraison')) {
      db.exec(`ALTER TABLE achats ADD COLUMN frais_livraison REAL DEFAULT 0`);
    }
    if (!achatsColumnNames.includes('observation')) {
      db.exec(`ALTER TABLE achats ADD COLUMN observation TEXT`);
    }

    const requiredColumns = ['fournisseur_id', 'date_achat', 'total_ht', 'total_ttc', 'statut_paiement', 'montant_paye', 'montant_restant'];
    const missingRequired = requiredColumns.filter(column => !achatsColumnNames.includes(column));
    if (missingRequired.length > 0) {
      error(`❌ [achats.statements] Colonnes obligatoires manquantes: ${missingRequired.join(', ')}`);
      return false;
    }

    // ═══════════════════════════════════════════════════════════
    // ⭐ CREATE
    // ═══════════════════════════════════════════════════════════
    stmtCreate = db.prepare(`
      INSERT INTO achats (fournisseur_id, reference, date_achat, total_ht, total_ttc, designation, nombre_produits, statut_paiement, montant_paye, montant_restant, observation, mode_paiement, modalite_paiement, frais_livraison)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // ═══════════════════════════════════════════════════════════
    // ⭐ UPDATE
    // ═══════════════════════════════════════════════════════════
    stmtUpdate = db.prepare(`
      UPDATE achats
      SET fournisseur_id = ?, reference = ?, date_achat = ?, total_ht = ?, total_ttc = ?,
        designation = ?, nombre_produits = ?, statut_paiement = ?, montant_paye = ?,
        montant_restant = ?, observation = ?, mode_paiement = ?, modalite_paiement = ?, frais_livraison = ?
      WHERE id = ?
    `);

    // ═══════════════════════════════════════════════════════════
    // ⭐ GET BY ID
    // ═══════════════════════════════════════════════════════════
    stmtGetById = db.prepare(`
      SELECT a.id, a.reference, a.fournisseur_id, a.date_achat, a.total_ht, a.total_ttc,
        a.designation, a.nombre_produits, a.statut_paiement, a.montant_paye, a.montant_restant,
        a.observation, a.mode_paiement, a.modalite_paiement, a.frais_livraison,
        a.created_at, COALESCE(a.updated_at, a.created_at) AS updated_at,
        COALESCE(f.nom, 'Aucun fournisseur') AS fournisseur_nom
      FROM achats a
      LEFT JOIN fournisseurs f ON f.id = a.fournisseur_id
      WHERE a.id = ?
    `);

    // ═══════════════════════════════════════════════════════════
    // ⭐ DELETE
    // ═══════════════════════════════════════════════════════════
    stmtDelete = db.prepare(`DELETE FROM achats WHERE id = ?`);

    // ═══════════════════════════════════════════════════════════
    // ⭐ DETAILS
    // ═══════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════
    // ⭐⭐⭐ UPDATE PAIEMENT ⭐⭐⭐
    //    Ampiasaina rehefa "Marquer comme payée"
    // ═══════════════════════════════════════════════════════════
    stmtUpdatePaiement = db.prepare(`
      UPDATE achats
      SET statut_paiement = ?, montant_paye = ?, montant_restant = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    // ═══════════════════════════════════════════════════════════
    // ⭐⭐⭐ GET STATS GLOBAL ⭐⭐⭐
    //    Tsy misy filtre — total rehetra avy amin'ny DB
    //    ⭐ FIX: Kajy dynamique ny statut
    // ═══════════════════════════════════════════════════════════
    stmtGetStats = db.prepare(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(a.total_ttc), 0) AS total_montant,
        COALESCE(SUM(a.montant_paye), 0) AS total_paye,
        COALESCE(SUM(COALESCE(a.montant_restant, a.total_ttc - COALESCE(a.montant_paye, 0))), 0) AS total_reste,
        COALESCE(SUM(COALESCE(a.nombre_produits, 0)), 0) AS total_produits,
        COUNT(DISTINCT CASE WHEN a.fournisseur_id IS NOT NULL THEN a.fournisseur_id END) AS total_fournisseurs,
        COALESCE(SUM(CASE WHEN COALESCE(a.montant_paye, 0) <= 0 THEN 1 ELSE 0 END), 0) AS non_payes,
        COALESCE(SUM(CASE WHEN COALESCE(a.montant_paye, 0) >= COALESCE(a.total_ttc, 0) AND COALESCE(a.total_ttc, 0) > 0 THEN 1 ELSE 0 END), 0) AS payes,
        COALESCE(SUM(CASE WHEN COALESCE(a.montant_paye, 0) > 0 AND COALESCE(a.montant_paye, 0) < COALESCE(a.total_ttc, 0) THEN 1 ELSE 0 END), 0) AS partiels
      FROM achats a
    `);

    // ═══════════════════════════════════════════════════════════
    // ⭐⭐⭐ GET ALL MINIMAL (ho an'ny export) ⭐⭐⭐
    //    Tsy misy pagination, misy fournisseur_nom
    // ═══════════════════════════════════════════════════════════
    stmtGetAllMinimal = db.prepare(`
      SELECT a.id, a.reference, a.fournisseur_id, a.date_achat, a.total_ht, a.total_ttc,
        a.designation, a.nombre_produits, a.statut_paiement, a.montant_paye, a.montant_restant,
        a.observation, a.mode_paiement, a.modalite_paiement, a.frais_livraison,
        a.created_at, COALESCE(f.nom, 'Aucun fournisseur') AS fournisseur_nom
      FROM achats a
      LEFT JOIN fournisseurs f ON f.id = a.fournisseur_id
      ORDER BY a.date_achat DESC, a.id DESC
    `);

    log('✅ [achats.statements] Statements préparés');
    return true;
  } catch (err) {
    error('❌ [achats.statements] Erreur:', err.message);
    if (err.stack) error(err.stack);
    stmtGetById = null; stmtCreate = null; stmtUpdate = null; stmtDelete = null;
    stmtGetDetails = null; stmtInsertDetail = null; stmtDeleteDetails = null;
    stmtCheckProduit = null; stmtCountProduits = null;
    stmtGetStats = null; stmtUpdatePaiement = null; stmtGetAllMinimal = null;
    return false;
  }
}

function getStatements() {
  if (
    !stmtGetById ||
    !stmtCreate ||
    !stmtUpdate ||
    !stmtDelete ||
    !stmtGetDetails ||
    !stmtInsertDetail ||
    !stmtDeleteDetails ||
    !stmtCheckProduit
  ) {
    throw new Error('Statements ACHATS non préparés.');
  }
  return {
    stmtGetById,
    stmtCreate,
    stmtUpdate,
    stmtDelete,
    stmtGetDetails,
    stmtInsertDetail,
    stmtDeleteDetails,
    stmtCheckProduit,
    stmtCountProduits,
    stmtGetStats,          // ⭐ VAOVAO
    stmtUpdatePaiement,    // ⭐ VAOVAO
    stmtGetAllMinimal,     // ⭐ VAOVAO
  };
}

module.exports = { prepareStatements, getStatements };