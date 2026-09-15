'use strict';

const { normalizePaiement } = require('./validation.cjs');

const ALLOWED_SORTS = new Set(['id', 'date_commande', 'total_ttc', 'client_nom', 'statut_paiement', 'montant_restant']);

function normalizeSort(sort = {}) {
  const field = ALLOWED_SORTS.has(sort?.field) ? sort.field : 'id';
  const direction = sort?.direction === 'ASC' ? 'ASC' : 'DESC';
  return { field, direction };
}

function normalizeLimit(limit, fallback = 8) {
  const n = Number(limit);
  if (!Number.isInteger(n) || n <= 0) return fallback;
  return Math.min(n, 200000);
}

function normalizePage(page) {
  const n = Number(page);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

// ⭐ FIX: Alaina foana ny YYYY-MM-DD
function normalizeDateBoundary(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (!s) return null;
  // Alaina ny 10 premiers caractères (YYYY-MM-DD) rehefa misy datetime
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : s;
}

function buildOrdersFilters(options = {}) {
  const { search, statutPaiement, startDate, endDate, montantMin, montantMax, modePaiement } = options;
  let where = ' WHERE 1 = 1 ';
  const params = [];

  if (search !== undefined && search !== null && String(search).trim()) {
    const s = `%${String(search).trim()}%`;
    where += ` AND (c.client_nom LIKE ? OR EXISTS (
      SELECT 1 FROM details_commandes dc_search
      INNER JOIN produits p_search ON p_search.id = dc_search.produit_id
      WHERE dc_search.commande_id = c.id AND (p_search.nom LIKE ? OR p_search.code LIKE ?)
    ))`;
    params.push(s, s, s);
  }

  if (statutPaiement && statutPaiement !== 'Tous') {
    const normalized = normalizePaiement(statutPaiement);
    if (normalized) {
      where += ` AND c.statut_paiement = ?`;
      params.push(normalized);
    }
  }

  // ⭐⭐⭐ FIX: DATE() amin'ny lafiny roa ⭐⭐⭐
  const start = normalizeDateBoundary(startDate);
  if (start) {
    where += ` AND DATE(c.date_commande) >= DATE(?)`;
    params.push(start);
  }

  const end = normalizeDateBoundary(endDate);
  if (end) {
    where += ` AND DATE(c.date_commande) <= DATE(?)`;
    params.push(end);
  }

  if (montantMin !== undefined && montantMin !== null && montantMin !== '' && Number.isFinite(Number(montantMin))) {
    where += ` AND c.total_ttc >= ?`;
    params.push(Number(montantMin));
  }

  if (montantMax !== undefined && montantMax !== null && montantMax !== '' && Number.isFinite(Number(montantMax))) {
    where += ` AND c.total_ttc <= ?`;
    params.push(Number(montantMax));
  }

  if (modePaiement && String(modePaiement).trim()) {
    where += ` AND c.mode_paiement = ?`;
    params.push(String(modePaiement).trim());
  }

  return { where, params };
}

function buildOrdersQuery(options = {}) {
  const limit = normalizeLimit(options.limit, 8);
  const page = normalizePage(options.page);
  const offset = (page - 1) * limit;
  const { where, params } = buildOrdersFilters(options);
  const sort = normalizeSort(options.sort);

  const query = `
    SELECT c.id, c.client_id, c.client_nom, c.total_ht, c.total_ttc, c.total,
      c.statut_paiement, c.montant_paye, c.montant_restant, c.date_limite_paiement,
      c.mode_paiement, c.modalite_paiement, c.frais_livraison,
      c.date_commande, c.created_at,
      cl.telephone AS client_telephone,
      GROUP_CONCAT(p.nom || ' (x' || dc.quantite || ')', ', ') AS produits_noms
    FROM commandes c
    LEFT JOIN clients cl ON cl.id = c.client_id
    LEFT JOIN details_commandes dc ON dc.commande_id = c.id
    LEFT JOIN produits p ON p.id = dc.produit_id
    ${where}
    GROUP BY c.id
    ORDER BY c.${sort.field} ${sort.direction}
    LIMIT ? OFFSET ?
  `;

  params.push(limit, offset);
  return { query, params, limit, page, offset };
}

function buildOrdersCountQuery(options = {}) {
  const { where, params } = buildOrdersFilters(options);
  return { query: `SELECT COUNT(*) AS total FROM commandes c ${where}`, params };
}

module.exports = { buildOrdersQuery, buildOrdersCountQuery };