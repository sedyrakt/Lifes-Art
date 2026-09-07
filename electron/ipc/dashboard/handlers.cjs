'use strict';

const { getDb } = require('../../database/connection.cjs');
const { log, error } = require('../../database/utils.cjs');

function withLiveDb(fn) {
  return (...args) => {
    const db = getDb();
    if (!db || !db.open) {
      error('❌ [dashboard] Database connection is not open');
      return { success: false, error: 'Database connection is not open' };
    }
    return fn(db, ...args);
  };
}

function registerDashboardHandlers(ipcMain) {
  log('📊 ==========================================');
  log('📊 REGISTER DASHBOARD IPC HANDLERS');
  log('📊 ==========================================');

  if (!ipcMain) { error('❌ ipcMain est null/undefined'); return false; }

  const channels = ['dashboard:get-stats', 'dashboard:get-financial-summary', 'dashboard:get-chart-data'];
  for (const ch of channels) { try { ipcMain.removeHandler(ch); } catch (_) {} }

  ipcMain.handle('dashboard:get-stats', withLiveDb((db) => {
    try {
      const statsStmt = db.prepare(`SELECT (SELECT COUNT(*) FROM produits WHERE status != 'archive') AS totalProduits, (SELECT COALESCE(SUM(quantite_stock), 0) FROM produits) AS stockTotal, (SELECT COUNT(*) FROM commandes) AS commandesTotal, (SELECT COALESCE(SUM(total_ttc), 0) FROM commandes WHERE statut_paiement != 'Non payé') AS chiffreAffaires, (SELECT COALESCE(SUM(montant), 0) FROM depenses) AS depenses, (SELECT COALESCE(SUM(montant), 0) FROM paiements_employes) AS salaires, (SELECT COUNT(*) FROM clients) AS totalClients`);
      const stats = statsStmt.get();
      const quickStmt = db.prepare(`SELECT (SELECT COUNT(*) FROM commandes WHERE statut_paiement = 'Non payé') AS commandesEnAttente, (SELECT COUNT(*) FROM produits WHERE quantite_stock <= 0 AND status = 'actif') AS ruptureStock, (SELECT COUNT(*) FROM produits WHERE quantite_stock > 0 AND quantite_stock <= quantite_minimale AND status = 'actif') AS alertesStock, (SELECT COUNT(*) FROM produits WHERE quantite_stock > quantite_minimale AND status = 'actif') AS stockNormal`);
      const quick = quickStmt.get();
      return { success: true, data: { ...stats, ...quick, totalPaiements: 0 } };
    } catch (err) { error('❌ [dashboard:get-stats]', err); return { success: false, error: err.message }; }
  }));

  ipcMain.handle('dashboard:get-financial-summary', withLiveDb((db) => {
    try {
      const stmt = db.prepare(`SELECT COALESCE((SELECT SUM(total_ttc) FROM commandes WHERE statut_paiement != 'Non payé'), 0) AS chiffreAffaires, COALESCE((SELECT SUM(montant) FROM depenses), 0) AS depenses, COALESCE((SELECT SUM(montant) FROM paiements_employes), 0) AS salaires`);
      return { success: true, data: stmt.get() };
    } catch (err) { error('❌ [dashboard:get-financial-summary]', err); return { success: false, error: err.message }; }
  }));

  ipcMain.handle('dashboard:get-chart-data', withLiveDb((db, _event, options = {}) => {
    try {
      const { type, year = new Date().getFullYear(), limit = 5 } = options;
      let data;
      switch (type) {
        case 'ventes-par-mois': {
          const stmt = db.prepare(`SELECT strftime('%m', date_commande) AS mois, COUNT(*) AS nb_commandes, COALESCE(SUM(total_ttc), 0) AS total_ventes FROM commandes WHERE statut_paiement != 'Non payé' AND strftime('%Y', date_commande) = ? GROUP BY strftime('%m', date_commande) ORDER BY mois`);
          data = stmt.all(String(year)); break;
        }
        case 'top-produits': {
          const stmt = db.prepare(`SELECT p.id, p.nom, SUM(d.quantite) AS total_vendu, SUM(d.total) AS total_ventes FROM produits p INNER JOIN details_commandes d ON d.produit_id = p.id INNER JOIN commandes c ON c.id = d.commande_id WHERE c.statut_paiement != 'Non payé' GROUP BY p.id, p.nom ORDER BY total_vendu DESC LIMIT ?`);
          data = stmt.all(limit); break;
        }
        case 'repartition-categories': {
          const stmt = db.prepare(`SELECT c.id, COALESCE(c.nom, 'Sans catégorie') AS nom, COUNT(p.id) AS total_produits, COALESCE(SUM(p.quantite_stock), 0) AS total_stock FROM produits p LEFT JOIN categories c ON c.id = p.categorie_id WHERE p.status = 'actif' GROUP BY c.id, c.nom ORDER BY total_produits DESC`);
          data = stmt.all(); break;
        }
        case 'stock-status': {
          const stmt = db.prepare(`SELECT COUNT(CASE WHEN quantite_stock > quantite_minimale THEN 1 END) AS en_stock, COUNT(CASE WHEN quantite_stock > 0 AND quantite_stock <= quantite_minimale THEN 1 END) AS stock_bas, COUNT(CASE WHEN quantite_stock <= 0 THEN 1 END) AS rupture FROM produits WHERE status = 'actif'`);
          data = stmt.get(); break;
        }
        case 'entrees-stock': {
          const stmt = db.prepare(`SELECT date(date_entree) AS date, COALESCE(SUM(quantite), 0) AS total_quantite FROM entrees_stock GROUP BY date(date_entree) ORDER BY date_entree ASC`);
          data = stmt.all(); break;
        }
        case 'sorties-stock': {
          const stmt = db.prepare(`SELECT date(date_sortie) AS date, COALESCE(SUM(quantite), 0) AS total_quantite FROM sorties_stock GROUP BY date(date_sortie) ORDER BY date_sortie ASC`);
          data = stmt.all(); break;
        }
        case 'top-clients': {
          const stmt = db.prepare(`SELECT c.nom AS client_nom, COALESCE(SUM(cmd.total_ttc), 0) AS total_achats FROM clients c INNER JOIN commandes cmd ON c.id = cmd.client_id WHERE cmd.statut_paiement != 'Non payé' GROUP BY c.id, c.nom ORDER BY total_achats DESC LIMIT 5`);
          data = stmt.all(); break;
        }
        case 'depenses-categorie': {
          const stmt = db.prepare(`SELECT categorie, COALESCE(SUM(montant), 0) AS total FROM depenses WHERE categorie IS NOT NULL AND categorie != '' GROUP BY categorie ORDER BY total DESC`);
          data = stmt.all(); break;
        }
        case 'commandes-statut': {
          const stmt = db.prepare(`SELECT statut_paiement, COUNT(*) AS nb FROM commandes GROUP BY statut_paiement`);
          data = stmt.all(); break;
        }
        default: return { success: false, error: `Type de chart inconnu: ${type}` };
      }
      return { success: true, data };
    } catch (err) { error('❌ [dashboard:get-chart-data]', err); return { success: false, error: err.message }; }
  }));

  log('✅ dashboard:get-stats REGISTERED'); log('✅ dashboard:get-financial-summary REGISTERED'); log('✅ dashboard:get-chart-data REGISTERED');
  log('📊 =========================================='); log('✅ DASHBOARD IPC READY'); log('📊 ==========================================');
  return true;
}

module.exports = { registerDashboardHandlers };