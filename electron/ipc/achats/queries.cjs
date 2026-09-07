// electron/ipc/achats/queries.cjs — ACHATS QUERIES
'use strict';

const ALLOWED_SORTS = new Set(['id', 'date_achat', 'total_ttc', 'fournisseur_nom', 'reference', 'statut_paiement']);

function normalizeSort(sort = {}) {
  const field = ALLOWED_SORTS.has(sort?.field) ? sort.field : 'id';
  const direction = sort?.direction === 'ASC' ? 'ASC' : 'DESC';
  return { field, direction };
}

function normalizeLimit(limit, fallback = 8) {
  const n = Number(limit);
  if (!Number.isInteger(n) || n <= 0) return fallback;
  return Math.min(n, 200);
}

function normalizePage(page) {
  const n = Number(page);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function buildAchatsFilters(options = {}) {
  const { search, fournisseur, startDate, endDate, montantMin, montantMax, statutPaiement } = options;
  let where = ' WHERE 1=1 ';
  const params = [];

  if (search !== undefined && search !== null && String(search).trim()) {
    const value = `%${String(search).trim()}%`;
    where += ` AND (a.reference LIKE ? OR a.designation LIKE ? OR a.observation LIKE ? OR f.nom LIKE ?)`;
    params.push(value, value, value, value);
  }

  if (fournisseur !== undefined && fournisseur !== null && String(fournisseur).trim() !== '') {
    const fournisseurId = Number(fournisseur);
    if (Number.isInteger(fournisseurId) && fournisseurId > 0) {
      where += ` AND a.fournisseur_id = ?`;
      params.push(fournisseurId);
    }
  }

  if (startDate) {
    where += ` AND a.date_achat >= ?`;
    params.push(`${startDate} 00:00:00`);
  }

  if (endDate) {
    where += ` AND a.date_achat <= ?`;
    params.push(`${endDate} 23:59:59`);
  }

  if (montantMin !== undefined && montantMin !== null && montantMin !== '' && Number.isFinite(Number(montantMin))) {
    where += ` AND a.total_ttc >= ?`;
    params.push(Number(montantMin));
  }

  if (montantMax !== undefined && montantMax !== null && montantMax !== '' && Number.isFinite(Number(montantMax))) {
    where += ` AND a.total_ttc <= ?`;
    params.push(Number(montantMax));
  }

  if (statutPaiement !== undefined && statutPaiement !== null && String(statutPaiement).trim()) {
    where += ` AND a.statut_paiement = ?`;
    params.push(String(statutPaiement).trim());
  }

  return { where, params };
}

function buildAchatsQuery(options = {}) {
  const limit = normalizeLimit(options.limit, 8);
  const page = normalizePage(options.page);
  const offset = (page - 1) * limit;
  const { where, params } = buildAchatsFilters(options);
  const sort = normalizeSort(options.sort);
  const sortColumn = sort.field === 'fournisseur_nom' ? 'f.nom' : `a.${sort.field}`;

  const query = `
    SELECT a.id, a.reference, a.fournisseur_id, a.date_achat, a.total_ht, a.total_ttc,
      a.designation, a.nombre_produits, a.statut_paiement, a.montant_paye, a.montant_restant,
      a.observation, a.created_at, COALESCE(f.nom, 'Aucun fournisseur') AS fournisseur_nom
    FROM achats a
    LEFT JOIN fournisseurs f ON f.id = a.fournisseur_id
    ${where}
    ORDER BY ${sortColumn} ${sort.direction}, a.id DESC
    LIMIT ? OFFSET ?
  `;

  params.push(limit, offset);
  return { query, params, limit, page, offset };
}

function buildAchatsCountQuery(options = {}) {
  const { where, params } = buildAchatsFilters(options);
  return { query: `SELECT COUNT(*) AS total FROM achats a LEFT JOIN fournisseurs f ON f.id = a.fournisseur_id ${where}`, params };
}

module.exports = { buildAchatsQuery, buildAchatsCountQuery };