// electron/ipc/ventes/queries.cjs
// ⭐ FIX: Date filter misy DATE() normalization
//         → Mandaitra na "2026-09-14" na "2026-09-14 00:00:00" ny date_commande/date_devis/date_facture
// ⭐ FIX: Nampiana startDate / endDate ary koa filterPeriod

'use strict';

const SORTS = {
  devis: new Set([
    'id', 'reference', 'date_devis', 'total_ht', 'total_ttc',
    'client_nom', 'statut_paiement', 'montant_paye', 'montant_restant'
  ]),
  factures: new Set([
    'id', 'reference', 'date_facture', 'total_ht', 'total_ttc',
    'client_nom', 'statut_paiement', 'montant_paye', 'montant_restant'
  ])
};

function normalizeSort(table, sort = {}) {
  const allowed = SORTS[table] || SORTS.devis;
  const field = allowed.has(sort?.field) ? sort.field : 'id';
  const direction = sort?.direction === 'ASC' ? 'ASC' : 'DESC';
  return { field, direction };
}

function normalizeLimit(limit, fallback = 20) {
  const n = Number(limit);
  if (!Number.isInteger(n) || n <= 0) return fallback;
  return Math.min(n, 200000);
}

function normalizePage(page) {
  const n = Number(page);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

// ⭐ FIX: Alaina foana ny YYYY-MM-DD (esorina ny ora raha misy)
function normalizeDateBoundary(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (!s) return null;
  // Alaina ny 10 premiers caractères (YYYY-MM-DD)
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : s;
}

function buildVentesFilters(table, options = {}) {
  const { search, statutPaiement, clientId, startDate, endDate } = options;
  const params = [];
  let where = ' WHERE 1=1 ';

  if (search && String(search).trim()) {
    const value = `%${String(search).trim()}%`;
    where += ` AND (${table}.reference LIKE ? OR ${table}.client_nom LIKE ?)`;
    params.push(value, value);
  }

  if (statutPaiement && statutPaiement !== 'Tous') {
    where += ` AND ${table}.statut_paiement = ?`;
    params.push(String(statutPaiement));
  }

  if (clientId !== undefined && clientId !== null && Number(clientId) > 0) {
    where += ` AND ${table}.client_id = ?`;
    params.push(Number(clientId));
  }

  // ⭐⭐⭐ FIX: Date filters misy DATE() normalization ⭐⭐⭐
  const dateCol = table === 'devis' ? 'date_devis' : 'date_facture';

  const start = normalizeDateBoundary(startDate);
  if (start) {
    where += ` AND DATE(${table}.${dateCol}) >= DATE(?)`;
    params.push(start);
  }

  const end = normalizeDateBoundary(endDate);
  if (end) {
    where += ` AND DATE(${table}.${dateCol}) <= DATE(?)`;
    params.push(end);
  }

  return { where, params };
}

function buildVentesQuery(table, options = {}) {
  const limit = normalizeLimit(options.limit, 20);
  const page = normalizePage(options.page);
  const offset = (page - 1) * limit;
  const { where, params } = buildVentesFilters(table, options);
  const sort = normalizeSort(table, options.sort);

  return {
    query: `
      SELECT *
      FROM ${table}
      ${where}
      ORDER BY ${sort.field} ${sort.direction}
      LIMIT ? OFFSET ?
    `,
    params: [...params, limit, offset],
    limit,
    page,
    offset
  };
}

function buildDevisQuery(options = {}) {
  return buildVentesQuery('devis', options);
}

function buildFacturesQuery(options = {}) {
  return buildVentesQuery('factures', options);
}

module.exports = {
  buildDevisQuery,
  buildFacturesQuery,
  buildVentesFilters,
  normalizeSort,
  normalizeLimit,
  normalizePage,
  normalizeDateBoundary
};