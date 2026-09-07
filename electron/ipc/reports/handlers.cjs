'use strict';

const { getDb } = require('../../database/connection.cjs');
const { log, error } = require('../../database/utils.cjs');

function withLiveDb(fn) {
  return (...args) => {
    try {
      const db = getDb();
      if (!db || !db.open) {
        error('❌ [reports] Database connection is not open');
        return { success: false, error: 'Database connection is not open' };
      }
      return fn(db, ...args);
    } catch (err) {
      error('❌ [reports] Live DB error:', err.message);
      return { success: false, error: err.message };
    }
  };
}

function tableExists(db, table) {
  try {
    const result = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`).get(table);
    return !!result;
  } catch { return false; }
}

function columnExists(db, table, column) {
  try {
    if (!tableExists(db, table)) return false;
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    return columns.some(item => item.name === column);
  } catch { return false; }
}

function registerReportsHandlers(ipcMain) {
  log('📊 ==========================================');
  log('📊 REGISTER RAPPORTS IPC HANDLERS');
  log('📊 ==========================================');
  if (!ipcMain) { error('❌ ipcMain est null/undefined'); return false; }

  const channels = [
    'reports:get-summary', 'reports:get-ventes-par-mois',
    'reports:get-top-produits', 'reports:get-repartition-categorie',
    'reports:get-commandes-recentes', 'reports:get-benefice',
    'reports:get-stock-value', 'reports:get-stock-status',
    'reports:get-entrees-stock', 'reports:get-sorties-stock',
    'reports:get-top-clients', 'reports:get-depenses-par-categorie',
    'reports:get-commandes-statut'
  ];
  for (const ch of channels) { try { ipcMain.removeHandler(ch); } catch (_) {} }

  // SUMMARY
  ipcMain.handle('reports:get-summary', withLiveDb(db => {
    try {
      const hasCommandes = tableExists(db, 'commandes');
      const hasClients = tableExists(db, 'clients');
      if (!hasCommandes) {
        return { success: true, data: { chiffre_affaires: 0, total_commandes: 0, clients_uniques: 0 } };
      }
      // ⭐ FIX: statut_paiement != 'Non payé' (au lieu de statut != 'Annulée')
      const chiffreAffaires = db.prepare(`SELECT COALESCE(SUM(total_ttc), 0) AS chiffre_affaires FROM commandes WHERE statut_paiement != 'Non payé'`).get();
      const totalCommandes = db.prepare(`SELECT COUNT(*) AS total_commandes FROM commandes WHERE statut_paiement != 'Non payé'`).get();
      let clientsUniques = { clients_uniques: 0 };
      if (hasClients && columnExists(db, 'commandes', 'client_id')) {
        clientsUniques = db.prepare(`SELECT COUNT(DISTINCT client_id) AS clients_uniques FROM commandes WHERE statut_paiement != 'Non payé' AND client_id IS NOT NULL`).get();
      }
      return { success: true, data: { chiffre_affaires: Number(chiffreAffaires?.chiffre_affaires || 0), total_commandes: Number(totalCommandes?.total_commandes || 0), clients_uniques: Number(clientsUniques?.clients_uniques || 0) } };
    } catch (err) { error('❌ reports:get-summary', err); return { success: false, error: err.message }; }
  }));

  // VENTES PAR MOIS
  ipcMain.handle('reports:get-ventes-par-mois', withLiveDb((db, _event, year) => {
    try {
      const targetYear = Number(year || new Date().getFullYear());
      // ⭐ FIX: statut_paiement != 'Non payé'
      const rows = db.prepare(`SELECT strftime('%m', date_commande) AS mois, COUNT(*) AS nb_commandes, COALESCE(SUM(total_ttc), 0) AS total_ventes, CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_ttc), 0) / COUNT(*) ELSE 0 END AS panier_moyen FROM commandes WHERE statut_paiement != 'Non payé' AND strftime('%Y', date_commande) = ? GROUP BY strftime('%m', date_commande) ORDER BY mois ASC`).all(String(targetYear));
      return { success: true, data: rows };
    } catch (err) { error('❌ reports:get-ventes-par-mois', err); return { success: false, error: err.message }; }
  }));

  // TOP PRODUITS
  ipcMain.handle('reports:get-top-produits', withLiveDb((db, _event, options = {}) => {
    try {
      const limit = Math.max(1, Math.min(Number(options?.limit || 10), 100));
      if (!tableExists(db, 'details_commandes')) return { success: true, data: [] };
      // ⭐ FIX: cmd.statut_paiement != 'Non payé'
      const rows = db.prepare(`SELECT p.id, p.nom, COALESCE(p.code, '') AS code, COALESCE(SUM(d.quantite), 0) AS total_vendu, COALESCE(SUM(CASE WHEN d.total IS NOT NULL THEN d.total ELSE d.quantite * COALESCE(d.prix_unitaire, 0) END), 0) AS total_ventes, COUNT(DISTINCT d.commande_id) AS nb_commandes, COALESCE(p.prix_vente, 0) AS prix_vente, COALESCE(c.nom, 'Sans catégorie') AS categorie_nom FROM produits p INNER JOIN details_commandes d ON d.produit_id = p.id INNER JOIN commandes cmd ON cmd.id = d.commande_id LEFT JOIN categories c ON c.id = p.categorie_id WHERE cmd.statut_paiement != 'Non payé' GROUP BY p.id, p.nom, p.code, p.prix_vente, c.nom ORDER BY total_vendu DESC LIMIT ?`).all(limit);
      const total = rows.reduce((acc, row) => acc + Number(row.total_vendu || 0), 0);
      const data = rows.map(row => ({ ...row, total_vendu: Number(row.total_vendu || 0), total_ventes: Number(row.total_ventes || 0), pourcentage: total > 0 ? (Number(row.total_vendu || 0) / total) * 100 : 0 }));
      return { success: true, data };
    } catch (err) { error('❌ reports:get-top-produits', err); return { success: false, error: err.message }; }
  }));

  // REPARTITION CATEGORIES
  ipcMain.handle('reports:get-repartition-categorie', withLiveDb(db => {
    try {
      if (!tableExists(db, 'produits')) return { success: true, data: [] };
      const hasCategories = tableExists(db, 'categories');
      const hasPrixVente = columnExists(db, 'produits', 'prix_vente');
      const hasPrixAchat = columnExists(db, 'produits', 'prix_achat');
      let sql;
      if (hasCategories) {
        sql = `SELECT c.id, COALESCE(c.nom, 'Sans catégorie') AS nom, COUNT(p.id) AS total_produits, COALESCE(SUM(p.quantite_stock), 0) AS total_stock, ${hasPrixVente ? `COALESCE(SUM(COALESCE(p.quantite_stock,0) * COALESCE(p.prix_vente,0)), 0)` : '0'} AS valeur_vente, ${hasPrixAchat ? `COALESCE(SUM(COALESCE(p.quantite_stock,0) * COALESCE(p.prix_achat,0)), 0)` : '0'} AS valeur_achat FROM produits p LEFT JOIN categories c ON c.id = p.categorie_id WHERE p.status = 'actif' GROUP BY c.id, c.nom ORDER BY valeur_vente DESC, total_produits DESC`;
      } else {
        sql = `SELECT NULL AS id, 'Sans catégorie' AS nom, COUNT(p.id) AS total_produits, COALESCE(SUM(p.quantite_stock), 0) AS total_stock, ${hasPrixVente ? `COALESCE(SUM(COALESCE(p.quantite_stock,0) * COALESCE(p.prix_vente,0)), 0)` : '0'} AS valeur_vente, ${hasPrixAchat ? `COALESCE(SUM(COALESCE(p.quantite_stock,0) * COALESCE(p.prix_achat,0)), 0)` : '0'} AS valeur_achat FROM produits p WHERE p.status = 'actif'`;
      }
      const rows = db.prepare(sql).all();
      const totalValue = rows.reduce((acc, row) => acc + Number(row.valeur_vente || 0), 0);
      const totalProducts = rows.reduce((acc, row) => acc + Number(row.total_produits || 0), 0);
      const data = rows.map(row => {
        const value = Number(row.valeur_vente || 0);
        const percentage = totalValue > 0 ? (value / totalValue) * 100 : totalProducts > 0 ? (Number(row.total_produits || 0) / totalProducts) * 100 : 0;
        return { id: row.id, nom: row.nom || 'Sans catégorie', total_produits: Number(row.total_produits || 0), total_stock: Number(row.total_stock || 0), valeur_vente: value, valeur_achat: Number(row.valeur_achat || 0), pourcentage: percentage };
      });
      return { success: true, data };
    } catch (err) { error('❌ reports:get-repartition-categorie', err); return { success: false, error: err.message }; }
  }));

  // COMMANDES RECENTES
  ipcMain.handle('reports:get-commandes-recentes', withLiveDb((db, _event, limit = 5) => {
    try {
      const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 50));
      const hasClientId = columnExists(db, 'commandes', 'client_id');
      const hasCommandeNumero = columnExists(db, 'commandes', 'commande_numero');
      let rows;
      if (hasClientId && tableExists(db, 'clients')) {
        if (hasCommandeNumero) {
          // ⭐ FIX: cmd.statut_paiement au lieu de cmd.statut
          rows = db.prepare(`SELECT cmd.id, COALESCE(cmd.commande_numero, 'CMD-' || printf('%06d', cmd.id)) AS commande_numero, COALESCE(c.nom, 'Client comptoir') AS client_nom, cmd.date_commande, COALESCE(cmd.total_ttc, 0) AS total_ttc, COALESCE(cmd.statut_paiement, 'Non payé') AS statut, (SELECT COUNT(*) FROM details_commandes d WHERE d.commande_id = cmd.id) AS nb_produits FROM commandes cmd LEFT JOIN clients c ON c.id = cmd.client_id ORDER BY cmd.date_commande DESC LIMIT ?`).all(safeLimit);
        } else {
          rows = db.prepare(`SELECT cmd.id, 'CMD-' || printf('%06d', cmd.id) AS commande_numero, COALESCE(c.nom, 'Client comptoir') AS client_nom, cmd.date_commande, COALESCE(cmd.total_ttc, 0) AS total_ttc, COALESCE(cmd.statut_paiement, 'Non payé') AS statut, (SELECT COUNT(*) FROM details_commandes d WHERE d.commande_id = cmd.id) AS nb_produits FROM commandes cmd LEFT JOIN clients c ON c.id = cmd.client_id ORDER BY cmd.date_commande DESC LIMIT ?`).all(safeLimit);
        }
      } else {
        if (hasCommandeNumero) {
          rows = db.prepare(`SELECT cmd.id, COALESCE(cmd.commande_numero, 'CMD-' || printf('%06d', cmd.id)) AS commande_numero, 'Client comptoir' AS client_nom, cmd.date_commande, COALESCE(cmd.total_ttc, 0) AS total_ttc, COALESCE(cmd.statut_paiement, 'Non payé') AS statut, (SELECT COUNT(*) FROM details_commandes d WHERE d.commande_id = cmd.id) AS nb_produits FROM commandes cmd ORDER BY cmd.date_commande DESC LIMIT ?`).all(safeLimit);
        } else {
          rows = db.prepare(`SELECT cmd.id, 'CMD-' || printf('%06d', cmd.id) AS commande_numero, 'Client comptoir' AS client_nom, cmd.date_commande, COALESCE(cmd.total_ttc, 0) AS total_ttc, COALESCE(cmd.statut_paiement, 'Non payé') AS statut, (SELECT COUNT(*) FROM details_commandes d WHERE d.commande_id = cmd.id) AS nb_produits FROM commandes cmd ORDER BY cmd.date_commande DESC LIMIT ?`).all(safeLimit);
        }
      }
      return { success: true, data: rows };
    } catch (err) { error('❌ reports:get-commandes-recentes', err); return { success: false, error: err.message }; }
  }));

  // BENEFICE
  ipcMain.handle('reports:get-benefice', withLiveDb((db, _event, year) => {
    try {
      const targetYear = Number(year || new Date().getFullYear());
      // ⭐ FIX: statut_paiement != 'Non payé'
      const ca = db.prepare(`SELECT COALESCE(SUM(total_ttc), 0) AS ca FROM commandes WHERE statut_paiement != 'Non payé' AND strftime('%Y', date_commande) = ?`).get(String(targetYear));
      const depenses = tableExists(db, 'depenses') ? db.prepare(`SELECT COALESCE(SUM(montant), 0) AS total FROM depenses WHERE strftime('%Y', date_depense) = ?`).get(String(targetYear)) : { total: 0 };
      const salaires = tableExists(db, 'paiements_employes') ? db.prepare(`SELECT COALESCE(SUM(montant), 0) AS total FROM paiements_employes WHERE strftime('%Y', date_paiement) = ?`).get(String(targetYear)) : { total: 0 };
      const chiffreAffaires = Number(ca?.ca || 0); const totalDepenses = Number(depenses?.total || 0); const totalSalaires = Number(salaires?.total || 0);
      const beneficeNet = chiffreAffaires - totalDepenses - totalSalaires;
      return { success: true, data: { chiffre_affaires: chiffreAffaires, depenses: totalDepenses, salaires: totalSalaires, benefice_net: beneficeNet } };
    } catch (err) { error('❌ reports:get-benefice', err); return { success: false, error: err.message }; }
  }));

  // STOCK VALUE
  ipcMain.handle('reports:get-stock-value', withLiveDb(db => {
    try {
      if (!tableExists(db, 'produits')) return { success: true, data: { total_produits: 0, stock_total: 0, valeur_stock: 0 } };
      const hasPrixVente = columnExists(db, 'produits', 'prix_vente');
      const result = db.prepare(`SELECT COUNT(CASE WHEN status != 'archive' THEN 1 END) AS total_produits, COALESCE(SUM(quantite_stock), 0) AS stock_total, ${hasPrixVente ? `COALESCE(SUM(quantite_stock * COALESCE(prix_vente, 0)), 0)` : '0'} AS valeur_stock FROM produits`).get();
      return { success: true, data: { total_produits: Number(result?.total_produits || 0), stock_total: Number(result?.stock_total || 0), valeur_stock: Number(result?.valeur_stock || 0) } };
    } catch (err) { error('❌ reports:get-stock-value', err); return { success: false, error: err.message }; }
  }));

  // STOCK STATUS
  ipcMain.handle('reports:get-stock-status', withLiveDb(db => {
    try {
      const result = db.prepare(`SELECT COUNT(CASE WHEN quantite_stock > quantite_minimale THEN 1 END) AS en_stock, COUNT(CASE WHEN quantite_stock > 0 AND quantite_stock <= quantite_minimale THEN 1 END) AS stock_bas, COUNT(CASE WHEN quantite_stock <= 0 THEN 1 END) AS rupture FROM produits WHERE status = 'actif'`).get();
      return { success: true, data: { en_stock: Number(result?.en_stock || 0), stock_bas: Number(result?.stock_bas || 0), rupture: Number(result?.rupture || 0) } };
    } catch (err) { error('❌ reports:get-stock-status', err); return { success: false, error: err.message }; }
  }));

  // ENTREES STOCK
  ipcMain.handle('reports:get-entrees-stock', withLiveDb((db, _event, options = {}) => {
    try {
      if (!tableExists(db, 'entrees_stock')) return { success: true, data: [] };
      const start = options?.startDate || `${new Date().getFullYear()}-01-01`;
      const end = options?.endDate || new Date().toISOString().slice(0, 10);
      const rows = db.prepare(`SELECT date(date_entree) AS date, COALESCE(SUM(quantite), 0) AS total_quantite FROM entrees_stock WHERE date(date_entree) BETWEEN date(?) AND date(?) GROUP BY date(date_entree) ORDER BY date ASC`).all(start, end);
      return { success: true, data: rows };
    } catch (err) { error('❌ reports:get-entrees-stock', err); return { success: false, error: err.message }; }
  }));

  // SORTIES STOCK
  ipcMain.handle('reports:get-sorties-stock', withLiveDb((db, _event, options = {}) => {
    try {
      if (!tableExists(db, 'sorties_stock')) return { success: true, data: [] };
      const start = options?.startDate || `${new Date().getFullYear()}-01-01`;
      const end = options?.endDate || new Date().toISOString().slice(0, 10);
      const rows = db.prepare(`SELECT date(date_sortie) AS date, COALESCE(SUM(quantite), 0) AS total_quantite FROM sorties_stock WHERE date(date_sortie) BETWEEN date(?) AND date(?) GROUP BY date(date_sortie) ORDER BY date ASC`).all(start, end);
      return { success: true, data: rows };
    } catch (err) { error('❌ reports:get-sorties-stock', err); return { success: false, error: err.message }; }
  }));

  // TOP CLIENTS
  ipcMain.handle('reports:get-top-clients', withLiveDb((db, _event, options = {}) => {
    try {
      if (!tableExists(db, 'clients')) return { success: true, data: [] };
      const limit = Math.max(1, Math.min(Number(options?.limit || 5), 50));
      const start = options?.startDate || `${new Date().getFullYear()}-01-01`;
      const end = options?.endDate || new Date().toISOString().slice(0, 10);
      // ⭐ FIX: cmd.statut_paiement != 'Non payé'
      const rows = db.prepare(`SELECT c.nom AS client_nom, COALESCE(SUM(cmd.total_ttc), 0) AS total_achats FROM clients c INNER JOIN commandes cmd ON cmd.client_id = c.id WHERE cmd.statut_paiement != 'Non payé' AND date(cmd.date_commande) BETWEEN date(?) AND date(?) GROUP BY c.id, c.nom ORDER BY total_achats DESC LIMIT ?`).all(start, end, limit);
      return { success: true, data: rows };
    } catch (err) { error('❌ reports:get-top-clients', err); return { success: false, error: err.message }; }
  }));

  // DEPENSES PAR CATEGORIE
  ipcMain.handle('reports:get-depenses-par-categorie', withLiveDb((db, _event, options = {}) => {
    try {
      if (!tableExists(db, 'depenses')) return { success: true, data: [] };
      const start = options?.startDate || `${new Date().getFullYear()}-01-01`;
      const end = options?.endDate || new Date().toISOString().slice(0, 10);
      const hasCategorie = columnExists(db, 'depenses', 'categorie');
      if (!hasCategorie) {
        const result = db.prepare(`SELECT 'Autre' AS categorie, COALESCE(SUM(montant), 0) AS total FROM depenses WHERE date(date_depense) BETWEEN date(?) AND date(?)`).get(start, end);
        return { success: true, data: Number(result?.total || 0) > 0 ? [result] : [] };
      }
      const rows = db.prepare(`SELECT COALESCE(NULLIF(categorie, ''), 'Autre') AS categorie, COALESCE(SUM(montant), 0) AS total FROM depenses WHERE date(date_depense) BETWEEN date(?) AND date(?) GROUP BY COALESCE(NULLIF(categorie, ''), 'Autre') ORDER BY total DESC`).all(start, end);
      return { success: true, data: rows };
    } catch (err) { error('❌ reports:get-depenses-par-categorie', err); return { success: false, error: err.message }; }
  }));

  // COMMANDES PAR STATUT
  ipcMain.handle('reports:get-commandes-statut', withLiveDb(db => {
    try {
      if (!tableExists(db, 'commandes')) return { success: true, data: [] };
      // ⭐ FIX: statut_paiement au lieu de statut
      const rows = db.prepare(`SELECT COALESCE(statut_paiement, 'Non payé') AS statut, COUNT(*) AS nb FROM commandes GROUP BY statut_paiement ORDER BY nb DESC`).all();
      return { success: true, data: rows };
    } catch (err) { error('❌ reports:get-commandes-statut', err); return { success: false, error: err.message }; }
  }));

  log('📊 ==========================================');
  log('✅ RAPPORTS IPC READY');
  log('📊 ==========================================');
  return true;
}

module.exports = { registerReportsHandlers };