// ============================================================
// electron/ipc/reports/queries.cjs - BUILDERS DYNAMIQUES (10/10)
// ⭐ FANITSARA: Fix validateYear, runVentesParCategorie
// ============================================================

const { getStatement } = require('./statements.cjs');
const { validateYear, validateLimit } = require('./utils.cjs');

// ============================================================
// ⭐ BUILDERS HO AN'NY REQUÊTE DYNAMIQUE
// ============================================================

function runTopProduits(db, options) {
  const { limit = 10, startDate, endDate, categorieId } = options;
  const safeLimit = validateLimit(limit, 10, 100);

  if (categorieId && startDate && endDate) {
    const stmt = getStatement(db, `
      SELECT
        p.id,
        COALESCE(p.nom, 'Produit supprimé') AS nom,
        COALESCE(p.code, 'N/A') AS code,
        COALESCE(p.prix_vente, 0) as prix_vente,
        COALESCE(SUM(d.quantite), 0) as total_vendu,
        COALESCE(SUM(d.total), 0) as total_ventes,
        COUNT(DISTINCT d.commande_id) as nb_commandes,
        COALESCE(AVG(d.quantite), 0) as moyenne_par_commande,
        COALESCE(c.nom, 'Sans catégorie') as categorie_nom
      FROM details_commandes d
      INNER JOIN produits p ON d.produit_id = p.id
      LEFT JOIN commandes cmd ON d.commande_id = cmd.id
      LEFT JOIN categories c ON p.categorie_id = c.id
      WHERE LOWER(cmd.statut_paiement) != 'non payé'
        AND date(cmd.date_commande) >= ? AND date(cmd.date_commande) <= ?
        AND p.categorie_id = ?
      GROUP BY p.id
      ORDER BY total_vendu DESC, total_ventes DESC, p.nom ASC
      LIMIT ?
    `);
    return stmt.all(startDate, endDate, categorieId, safeLimit);
  } else if (categorieId) {
    const stmt = getStatement(db, `
      SELECT
        p.id,
        COALESCE(p.nom, 'Produit supprimé') AS nom,
        COALESCE(p.code, 'N/A') AS code,
        COALESCE(p.prix_vente, 0) as prix_vente,
        COALESCE(SUM(d.quantite), 0) as total_vendu,
        COALESCE(SUM(d.total), 0) as total_ventes,
        COUNT(DISTINCT d.commande_id) as nb_commandes,
        COALESCE(AVG(d.quantite), 0) as moyenne_par_commande,
        COALESCE(c.nom, 'Sans catégorie') as categorie_nom
      FROM details_commandes d
      INNER JOIN produits p ON d.produit_id = p.id
      LEFT JOIN commandes cmd ON d.commande_id = cmd.id
      LEFT JOIN categories c ON p.categorie_id = c.id
      WHERE LOWER(cmd.statut_paiement) != 'non payé'
        AND p.categorie_id = ?
      GROUP BY p.id
      ORDER BY total_vendu DESC, total_ventes DESC, p.nom ASC
      LIMIT ?
    `);
    return stmt.all(categorieId, safeLimit);
  } else if (startDate && endDate) {
    const stmt = getStatement(db, `
      SELECT
        p.id,
        COALESCE(p.nom, 'Produit supprimé') AS nom,
        COALESCE(p.code, 'N/A') AS code,
        COALESCE(p.prix_vente, 0) as prix_vente,
        COALESCE(SUM(d.quantite), 0) as total_vendu,
        COALESCE(SUM(d.total), 0) as total_ventes,
        COUNT(DISTINCT d.commande_id) as nb_commandes,
        COALESCE(AVG(d.quantite), 0) as moyenne_par_commande,
        COALESCE(c.nom, 'Sans catégorie') as categorie_nom
      FROM details_commandes d
      INNER JOIN produits p ON d.produit_id = p.id
      LEFT JOIN commandes cmd ON d.commande_id = cmd.id
      LEFT JOIN categories c ON p.categorie_id = c.id
      WHERE LOWER(cmd.statut_paiement) != 'non payé'
        AND date(cmd.date_commande) >= ? AND date(cmd.date_commande) <= ?
      GROUP BY p.id
      ORDER BY total_vendu DESC, total_ventes DESC, p.nom ASC
      LIMIT ?
    `);
    return stmt.all(startDate, endDate, safeLimit);
  } else {
    const stmt = getStatement(db, `
      SELECT
        p.id,
        COALESCE(p.nom, 'Produit supprimé') AS nom,
        COALESCE(p.code, 'N/A') AS code,
        COALESCE(p.prix_vente, 0) as prix_vente,
        COALESCE(SUM(d.quantite), 0) as total_vendu,
        COALESCE(SUM(d.total), 0) as total_ventes,
        COUNT(DISTINCT d.commande_id) as nb_commandes,
        COALESCE(AVG(d.quantite), 0) as moyenne_par_commande,
        COALESCE(c.nom, 'Sans catégorie') as categorie_nom
      FROM details_commandes d
      INNER JOIN produits p ON d.produit_id = p.id
      LEFT JOIN commandes cmd ON d.commande_id = cmd.id
      LEFT JOIN categories c ON p.categorie_id = c.id
      WHERE LOWER(cmd.statut_paiement) != 'non payé'
      GROUP BY p.id
      ORDER BY total_vendu DESC, total_ventes DESC, p.nom ASC
      LIMIT ?
    `);
    return stmt.all(safeLimit);
  }
}

function runVentesParCategorie(db, options) {
  const { startDate, endDate, annee } = options;
  const year = validateYear(annee || new Date().getFullYear());

  if (startDate && endDate) {
    const stmt = getStatement(db, `
      SELECT
        COALESCE(c.nom, 'Sans catégorie') as categorie_nom,
        COUNT(DISTINCT d.commande_id) as nb_commandes,
        COALESCE(SUM(d.quantite), 0) as quantite_vendue,
        COALESCE(SUM(d.total), 0) as total_ventes
      FROM details_commandes d
      LEFT JOIN produits p ON d.produit_id = p.id
      LEFT JOIN categories c ON p.categorie_id = c.id
      LEFT JOIN commandes cmd ON d.commande_id = cmd.id
      WHERE LOWER(cmd.statut_paiement) != 'non payé'
        AND date(cmd.date_commande) >= ? AND date(cmd.date_commande) <= ?
      GROUP BY c.id
      ORDER BY total_ventes DESC
    `);
    return stmt.all(startDate, endDate);
  } else {
    const stmt = getStatement(db, `
      SELECT
        COALESCE(c.nom, 'Sans catégorie') as categorie_nom,
        COUNT(DISTINCT d.commande_id) as nb_commandes,
        COALESCE(SUM(d.quantite), 0) as quantite_vendue,
        COALESCE(SUM(d.total), 0) as total_ventes
      FROM details_commandes d
      LEFT JOIN produits p ON d.produit_id = p.id
      LEFT JOIN categories c ON p.categorie_id = c.id
      LEFT JOIN commandes cmd ON d.commande_id = cmd.id
      WHERE LOWER(cmd.statut_paiement) != 'non payé'
        AND strftime('%Y', cmd.date_commande) = ?
      GROUP BY c.id
      ORDER BY total_ventes DESC
    `);
    return stmt.all(String(year));
  }
}

function runVentesParClient(db, options) {
  const { limit = 10, startDate, endDate } = options;
  const safeLimit = validateLimit(limit, 10, 100);
  if (startDate && endDate) {
    const stmt = getStatement(db, `
      SELECT
        client_nom,
        COUNT(*) as nb_commandes,
        COALESCE(SUM(total_ttc), 0) as total_achats,
        COALESCE(AVG(total_ttc), 0) as panier_moyen,
        MIN(date_commande) as premiere_commande,
        MAX(date_commande) as derniere_commande
      FROM commandes
      WHERE LOWER(statut_paiement) != 'non payé'
        AND date(date_commande) >= ? AND date(date_commande) <= ?
      GROUP BY client_nom
      ORDER BY total_achats DESC
      LIMIT ?
    `);
    return stmt.all(startDate, endDate, safeLimit);
  } else {
    const stmt = getStatement(db, `
      SELECT
        client_nom,
        COUNT(*) as nb_commandes,
        COALESCE(SUM(total_ttc), 0) as total_achats,
        COALESCE(AVG(total_ttc), 0) as panier_moyen,
        MIN(date_commande) as premiere_commande,
        MAX(date_commande) as derniere_commande
      FROM commandes
      WHERE LOWER(statut_paiement) != 'non payé'
      GROUP BY client_nom
      ORDER BY total_achats DESC
      LIMIT ?
    `);
    return stmt.all(safeLimit);
  }
}

function runTopClients(db, options) {
  const { limit = 10, startDate, endDate } = options;
  const safeLimit = validateLimit(limit, 10, 100);
  if (startDate && endDate) {
    const stmt = getStatement(db, `
      SELECT
        client_nom,
        COUNT(*) as nb_commandes,
        COALESCE(SUM(total_ttc), 0) as total_achats,
        COALESCE(AVG(total_ttc), 0) as panier_moyen
      FROM commandes
      WHERE LOWER(statut_paiement) != 'non payé'
        AND date(date_commande) >= ? AND date(date_commande) <= ?
      GROUP BY client_nom
      ORDER BY total_achats DESC
      LIMIT ?
    `);
    return stmt.all(startDate, endDate, safeLimit);
  } else {
    const stmt = getStatement(db, `
      SELECT
        client_nom,
        COUNT(*) as nb_commandes,
        COALESCE(SUM(total_ttc), 0) as total_achats,
        COALESCE(AVG(total_ttc), 0) as panier_moyen
      FROM commandes
      WHERE LOWER(statut_paiement) != 'non payé'
      GROUP BY client_nom
      ORDER BY total_achats DESC
      LIMIT ?
    `);
    return stmt.all(safeLimit);
  }
}

module.exports = {
  runTopProduits,
  runVentesParCategorie,
  runVentesParClient,
  runTopClients,
};