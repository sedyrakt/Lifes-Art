// electron/ipc/orders/statements.cjs
'use strict';

const { getDb } = require('../../database/connection.cjs');
const { log, error } = require('../../database/utils.cjs');

let statements = null;

function prepareStatements() {
  try {
    const db = getDb();
    if (!db || !db.open) {
      error('❌ [orders.statements] Database indisponible');
      statements = null;
      return false;
    }

    const stmtCreate = db.prepare(`
      INSERT INTO commandes (client_id, client_nom, total_ht, total_ttc, total, statut_paiement, montant_paye, montant_restant)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const stmtUpdate = db.prepare(`
      UPDATE commandes
      SET client_id = ?, client_nom = ?, total_ht = ?, total_ttc = ?, total = ?,
          statut_paiement = ?, montant_paye = ?, montant_restant = ?
      WHERE id = ?
    `);

    // ⭐ FIX: LEFT JOIN clients ho an'ny téléphone
    const stmtGetById = db.prepare(`
      SELECT c.*, 'CMD-' || printf('%06d', c.id) AS numero,
        cl.telephone AS client_telephone,
        COALESCE(GROUP_CONCAT(p.nom, ', '), '') AS produits_noms
      FROM commandes c
      LEFT JOIN clients cl ON cl.id = c.client_id
      LEFT JOIN details_commandes d ON d.commande_id = c.id
      LEFT JOIN produits p ON p.id = d.produit_id
      WHERE c.id = ?
      GROUP BY c.id
    `);

    const stmtDelete = db.prepare(`DELETE FROM commandes WHERE id = ?`);

    const stmtGetDetails = db.prepare(`
      SELECT d.id, d.commande_id, d.produit_id,
        COALESCE(p.nom, 'Produit') AS produit_nom,
        COALESCE(p.code, '') AS produit_code,
        d.quantite, d.prix_unitaire, d.total, d.total AS total_ligne, d.tva_rate
      FROM details_commandes d
      LEFT JOIN produits p ON p.id = d.produit_id
      WHERE d.commande_id = ?
      ORDER BY d.id ASC
    `);

    const stmtGetProducts = db.prepare(`
      SELECT d.produit_id,
        COALESCE(p.nom, 'Produit') AS produit_nom,
        COALESCE(p.code, '') AS produit_code,
        d.quantite, d.prix_unitaire, d.total, d.total AS total_ligne, d.tva_rate
      FROM details_commandes d
      LEFT JOIN produits p ON p.id = d.produit_id
      WHERE d.commande_id = ?
      ORDER BY d.id ASC
    `);

    // ⭐ FIX: JOIN clients ho an'ny téléphone
    const stmtGetByClient = db.prepare(`
      SELECT c.*, 'CMD-' || printf('%06d', c.id) AS numero,
        cl.telephone AS client_telephone
      FROM commandes c
      LEFT JOIN clients cl ON cl.id = c.client_id
      WHERE c.client_nom LIKE ?
      ORDER BY c.date_commande DESC
    `);

    // ⭐ FIX: JOIN clients ho an'ny téléphone
    const stmtGetByStatus = db.prepare(`
      SELECT c.*, 'CMD-' || printf('%06d', c.id) AS numero,
        cl.telephone AS client_telephone
      FROM commandes c
      LEFT JOIN clients cl ON cl.id = c.client_id
      WHERE c.statut_paiement = ?
      ORDER BY c.date_commande DESC
    `);

    // ⭐ FIX: JOIN clients ho an'ny téléphone
    const stmtGetByDateRange = db.prepare(`
      SELECT c.*, 'CMD-' || printf('%06d', c.id) AS numero,
        cl.telephone AS client_telephone
      FROM commandes c
      LEFT JOIN clients cl ON cl.id = c.client_id
      WHERE c.date_commande >= ? AND c.date_commande <= ?
      ORDER BY c.date_commande DESC
    `);

    const stmtGetStats = db.prepare(`
      SELECT COUNT(*) AS total,
        COALESCE(SUM(total_ttc), 0) AS total_ca,
        COALESCE(SUM(total_ht), 0) AS total_ht,
        COALESCE(AVG(total_ttc), 0) AS moyenne_panier,
        COUNT(DISTINCT client_id) AS clients_uniques,
        COALESCE(SUM(montant_restant), 0) AS total_dette,
        COALESCE(SUM(CASE WHEN montant_restant > 0 THEN 1 ELSE 0 END), 0) AS nb_commandes_non_payees
      FROM commandes
    `);

    const stmtGetTotal = db.prepare(`
      SELECT COALESCE(SUM(total_ht), 0) AS total_ht,
        COALESCE(SUM(total_ttc), 0) AS total_ttc
      FROM commandes WHERE id = ?
    `);

    const stmtGetJournalieres = db.prepare(`
      SELECT DATE(date_commande) AS jour, COUNT(*) AS nb,
        COALESCE(SUM(total_ttc), 0) AS total
      FROM commandes
      WHERE date_commande >= ? AND date_commande <= ?
      GROUP BY DATE(date_commande)
      ORDER BY jour DESC
    `);

    const stmtInsertDetail = db.prepare(`
      INSERT INTO details_commandes (commande_id, produit_id, quantite, prix_unitaire, total, tva_rate)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const stmtCheckStock = db.prepare(`
      SELECT id, nom, quantite_stock, tva_rate FROM produits WHERE id = ?
    `);

    const stmtUpdateStock = db.prepare(`
      UPDATE produits
      SET quantite_stock = quantite_stock - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND quantite_stock >= ?
    `);

    const stmtRestoreStock = db.prepare(`
      UPDATE produits
      SET quantite_stock = quantite_stock + ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const stmtInsertMouvement = db.prepare(`
      INSERT INTO mouvements_stock (
        produit_id, type_mouvement, quantite, ancien_stock,
        nouveau_stock, reference, observation, created_by
      )
      VALUES (?, 'SORTIE', ?, ?, ?, ?, ?, NULL)
    `);

    const stmtInsertMouvementRestore = db.prepare(`
      INSERT INTO mouvements_stock (
        produit_id, type_mouvement, quantite, ancien_stock,
        nouveau_stock, reference, observation, created_by
      )
      VALUES (?, 'ENTREE', ?, ?, ?, ?, ?, NULL)
    `);

    const stmtGetDetailsForRestore = db.prepare(`
      SELECT produit_id, quantite FROM details_commandes WHERE commande_id = ?
    `);

    const stmtMarkStockRestored = db.prepare(`
      UPDATE commandes SET stock_restaure = 1 WHERE id = ?
    `);

    const stmtUpdatePaiement = db.prepare(`
      UPDATE commandes
      SET statut_paiement = ?, montant_paye = ?, montant_restant = ?
      WHERE id = ?
    `);

    const stmtGetDetteStats = db.prepare(`
      SELECT COALESCE(SUM(CASE WHEN montant_restant > 0 THEN montant_restant ELSE 0 END), 0) AS total_dette,
        COALESCE(SUM(CASE WHEN montant_restant > 0 THEN 1 ELSE 0 END), 0) AS nb_commandes_non_payees
      FROM commandes
    `);

    statements = {
      stmtCreate, stmtUpdate, stmtGetById, stmtDelete, stmtGetDetails,
      stmtGetProducts, stmtGetByClient, stmtGetByStatus, stmtGetByDateRange,
      stmtGetStats, stmtGetTotal, stmtGetJournalieres, stmtInsertDetail,
      stmtCheckStock, stmtUpdateStock, stmtRestoreStock, stmtInsertMouvement,
      stmtInsertMouvementRestore, stmtGetDetailsForRestore, stmtMarkStockRestored,
      stmtUpdatePaiement, stmtGetDetteStats
    };

    log('✅ [orders.statements] Statements préparés (Avec téléphone client + TVA dynamique)');
    return true;

  } catch (err) {
    error('❌ [orders.statements] Error preparing statements:', err.message);
    statements = null;
    return false;
  }
}

function getStatements() {
  return statements;
}

module.exports = { prepareStatements, getStatements };