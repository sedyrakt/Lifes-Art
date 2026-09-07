'use strict';

const { getDb } = require('../../database/connection.cjs');
const { log, error } = require('../../database/utils.cjs');

const statementCache = new Map();

function getStatement(db, sql) {
  if (!statementCache.has(sql)) statementCache.set(sql, db.prepare(sql));
  return statementCache.get(sql);
}

let stmtStats = null;
let stmtFinancialSummary = null;
let stmtRecentOrders = null;
let stmtRecentExpenses = null;
let stmtRecentClients = null;
let stmtQuickStats = null;
let stmtChartCommandes = null;
let stmtChartEntrees = null;
let stmtChartSorties = null;

// ⭐ VAOVAO: Statements ho an'ny Dashboard Charts
let stmtChartStockEntrees = null;
let stmtChartStockSorties = null;
let stmtChartTopClients = null;
let stmtChartDepensesCategorie = null;
let stmtChartCommandesStatut = null;

let statementsReady = false;

function tableExists(db, tableName) {
  try {
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?");
    return !!stmt.get(tableName);
  } catch (_) { return false; }
}

function prepareStatements() {
  log('📊 [dashboard:statements] Vérification des tables...');
  const db = getDb();
  if (!db) {
    error('❌ [dashboard:statements] La base de données est indisponible');
    statementsReady = false;
    return false;
  }

  if (!tableExists(db, 'commandes')) {
    log('⚠️ [dashboard:statements] La table "commandes" n\'existe pas !');
    statementsReady = false;
    return false;
  }

  log('✅ [dashboard:statements] Table "commandes" trouvée, préparation des statements...');

  try {
    // ==========================================================
    // STATS PRINCIPALES
    // ==========================================================
    stmtStats = getStatement(db, `
      SELECT
        (SELECT COUNT(*) FROM produits WHERE status != 'archive') AS totalProduits,
        (SELECT COALESCE(SUM(quantite_stock), 0) FROM produits) AS stockTotal,
        (SELECT COUNT(*) FROM commandes) AS commandesTotal,
        (SELECT COALESCE(SUM(total_ttc), 0) FROM commandes WHERE statut_paiement != 'Non payé') AS chiffreAffaires,
        (SELECT COALESCE(SUM(montant), 0) FROM depenses) AS depenses,
        (SELECT COALESCE(SUM(montant), 0) FROM paiements_employes) AS salaires,
        (SELECT COUNT(*) FROM clients) AS totalClients
    `);

    // ==========================================================
    // STATS RAPIDES
    // ==========================================================
    stmtQuickStats = getStatement(db, `
      SELECT
        (SELECT COUNT(*) FROM commandes WHERE statut_paiement = 'Non payé') AS commandesEnAttente,
        (SELECT COUNT(*) FROM produits WHERE quantite_stock <= 0 AND status = 'actif') AS ruptureStock,
        (SELECT COUNT(*) FROM produits WHERE quantite_stock > 0 AND quantite_stock <= quantite_minimale AND status = 'actif') AS alertesStock,
        (SELECT COUNT(*) FROM produits WHERE quantite_stock > quantite_minimale AND status = 'actif') AS stockNormal
    `);

    // ==========================================================
    // RÉSUMÉ FINANCIER
    // ==========================================================
    stmtFinancialSummary = getStatement(db, `
      SELECT
        COALESCE((SELECT SUM(total_ttc) FROM commandes WHERE statut_paiement != 'Non payé'), 0) AS chiffreAffaires,
        COALESCE((SELECT SUM(montant) FROM depenses), 0) AS depenses,
        COALESCE((SELECT SUM(montant) FROM paiements_employes), 0) AS salaires
    `);

    // ==========================================================
    // CHART: VENTES PAR MOIS
    // ==========================================================
    stmtChartCommandes = getStatement(db, `
      SELECT strftime('%m', date_commande) AS mois, COUNT(*) AS nb_commandes,
             COALESCE(SUM(total_ttc), 0) AS total_ventes
      FROM commandes WHERE statut_paiement != 'Non payé' AND strftime('%Y', date_commande) = ?
      GROUP BY strftime('%m', date_commande) ORDER BY mois
    `);

    // ==========================================================
    // CHART: ENTREES STOCK
    // ==========================================================
    stmtChartEntrees = getStatement(db, `
      SELECT strftime('%m', date_entree) AS mois, COALESCE(SUM(quantite), 0) AS total_quantite
      FROM entrees_stock WHERE strftime('%Y', date_entree) = ?
      GROUP BY strftime('%m', date_entree) ORDER BY mois
    `);

    // ==========================================================
    // CHART: SORTIES STOCK
    // ==========================================================
    stmtChartSorties = getStatement(db, `
      SELECT strftime('%m', date_sortie) AS mois, COALESCE(SUM(quantite), 0) AS total_quantite
      FROM sorties_stock WHERE strftime('%Y', date_sortie) = ?
      GROUP BY strftime('%m', date_sortie) ORDER BY mois
    `);

    // ⭐ VAOVAO: CHART: ENTREES STOCK (DATE QUOTIDIENNE)
    stmtChartStockEntrees = getStatement(db, `
      SELECT date(date_entree) AS date, COALESCE(SUM(quantite), 0) AS total_quantite
      FROM entrees_stock GROUP BY date(date_entree) ORDER BY date_entree ASC
    `);

    // ⭐ VAOVAO: CHART: SORTIES STOCK (DATE QUOTIDIENNE)
    stmtChartStockSorties = getStatement(db, `
      SELECT date(date_sortie) AS date, COALESCE(SUM(quantite), 0) AS total_quantite
      FROM sorties_stock GROUP BY date(date_sortie) ORDER BY date_sortie ASC
    `);

    // ⭐ VAOVAO: CHART: TOP CLIENTS
    stmtChartTopClients = getStatement(db, `
      SELECT c.nom AS client_nom, COALESCE(SUM(cmd.total_ttc), 0) AS total_achats
      FROM clients c INNER JOIN commandes cmd ON c.id = cmd.client_id
      WHERE cmd.statut_paiement != 'Non payé'
      GROUP BY c.id, c.nom ORDER BY total_achats DESC LIMIT 5
    `);

    // ⭐ VAOVAO: CHART: DEPENSES PAR CATEGORIE
    stmtChartDepensesCategorie = getStatement(db, `
      SELECT categorie, COALESCE(SUM(montant), 0) AS total
      FROM depenses WHERE categorie IS NOT NULL AND categorie != ''
      GROUP BY categorie ORDER BY total DESC
    `);

    // ⭐ VAOVAO: CHART: COMMANDES PAR STATUT
    stmtChartCommandesStatut = getStatement(db, `
      SELECT statut_paiement, COUNT(*) AS nb FROM commandes GROUP BY statut_paiement
    `);

    // ==========================================================
    // COMMANDES RÉCENTES
    // ==========================================================
    stmtRecentOrders = getStatement(db, `
      SELECT id, client_nom, total, statut_paiement, date_commande
      FROM commandes ORDER BY date_commande DESC LIMIT 5
    `);

    // ==========================================================
    // DÉPENSES RÉCENTES
    // ==========================================================
    stmtRecentExpenses = getStatement(db, `
      SELECT id, description, montant, date_depense AS date
      FROM depenses ORDER BY date_depense DESC LIMIT 5
    `);

    // ==========================================================
    // CLIENTS RÉCENTES
    // ==========================================================
    stmtRecentClients = getStatement(db, `
      SELECT id, nom, email, telephone, created_at
      FROM clients ORDER BY created_at DESC LIMIT 5
    `);

    statementsReady = true;
    log('✅ [dashboard:statements] Tous les statements préparés avec succès');
    return true;

  } catch (err) {
    error('❌ [dashboard:statements] Erreur lors de la préparation:', err.message);
    statementsReady = false;
    return false;
  }
}

module.exports = {
  prepareStatements,
  get stmtStats() { return stmtStats; },
  get stmtFinancialSummary() { return stmtFinancialSummary; },
  get stmtRecentOrders() { return stmtRecentOrders; },
  get stmtRecentExpenses() { return stmtRecentExpenses; },
  get stmtRecentClients() { return stmtRecentClients; },
  get stmtQuickStats() { return stmtQuickStats; },
  get stmtChartCommandes() { return stmtChartCommandes; },
  get stmtChartEntrees() { return stmtChartEntrees; },
  get stmtChartSorties() { return stmtChartSorties; },
  get stmtChartStockEntrees() { return stmtChartStockEntrees; },
  get stmtChartStockSorties() { return stmtChartStockSorties; },
  get stmtChartTopClients() { return stmtChartTopClients; },
  get stmtChartDepensesCategorie() { return stmtChartDepensesCategorie; },
  get stmtChartCommandesStatut() { return stmtChartCommandesStatut; },
  get statementsReady() { return statementsReady; },
};