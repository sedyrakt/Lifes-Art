// ============================================================
// electron/ipc/clients/queries.cjs — FINAL FIX v3
// ⭐ FIX: buildClientsStatsQuery() vaovao (tsisy JOIN → tsy misy duplicates)
// ⭐ FIX: buildClientsTotalAchatsQuery() vaovao (total_achats avy amin'ny commandes)
// ⭐ FIX: buildClientsCountQuery() mampiasa COUNT(DISTINCT c.id)
// ⭐ MAX_LIMIT = 200000 (ho an'ny export)
// ⭐ ALLOWED_SORTS misy 'total_achats' + 'nombre_commandes'
// ⭐ buildWhere misy préfixe 'c.' foana
// ⭐ FIX: ORDER BY amin'ny aggregate (SUM/COUNT) — tsy azo antoka amin'ny SQLite
//         → ampiasaina alias + subquery raha ilaina
// ⭐ FIX: COUNT(DISTINCT co.id) → COUNT(co.id) tsotra (hafainganana)
// ============================================================

const MAX_LIMIT = 200000;
const DEFAULT_LIMIT = 8;

const ALLOWED_SORTS = {
  nom:              { field: 'nom',              expression: "COALESCE(c.nom, '')" },
  email:            { field: 'email',            expression: "COALESCE(c.email, '')" },
  ville:            { field: 'ville',            expression: "COALESCE(c.ville, '')" },
  type:             { field: 'type',             expression: "COALESCE(c.type, '')" },
  created_at:       { field: 'created_at',       expression: "COALESCE(c.created_at, '')" },
  id:               { field: 'id',               expression: 'c.id' },
  total_achats:     { field: 'total_achats',     expression: "COALESCE(SUM(co.total_ttc), 0)" },
  nombre_commandes: { field: 'nombre_commandes', expression: "COUNT(co.id)" },
};

function normalizeLimit(limit) {
  const value = Number.parseInt(limit, 10);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_LIMIT;
  return Math.min(value, MAX_LIMIT);
}

function normalizePage(page) {
  const n = Number.parseInt(page, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

function normalizeSort(options = {}) {
  let sortBy = options.sortBy;
  if (options.sort?.field) sortBy = options.sort.field;
  if (!ALLOWED_SORTS[sortBy]) sortBy = 'nom';

  let sortOrder = options.sortOrder;
  if (options.sort?.direction) sortOrder = options.sort.direction;
  sortOrder = String(sortOrder || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  return {
    sortBy,
    sortOrder,
    field: ALLOWED_SORTS[sortBy].field,
    expression: ALLOWED_SORTS[sortBy].expression,
  };
}

function buildWhere(options = {}, alias = 'c') {
  const { search, type, ville, pays, dateFrom, dateTo } = options;
  const prefix = alias ? `${alias}.` : '';
  const where = [];
  const params = [];

  if (typeof search === 'string' && search.trim()) {
    const value = search.trim();
    const pattern = `%${value}%`;
    where.push(`(${prefix}nom LIKE ? OR ${prefix}email LIKE ? OR ${prefix}telephone LIKE ? OR ${prefix}ville LIKE ?)`);
    params.push(pattern, pattern, pattern, pattern);
  }
  if (type && type !== 'Tous' && ['Particulier', 'Entreprise'].includes(type)) {
    where.push(`${prefix}type = ?`);
    params.push(type);
  }
  if (typeof ville === 'string' && ville.trim()) {
    where.push(`${prefix}ville = ?`);
    params.push(ville.trim());
  }
  if (typeof pays === 'string' && pays.trim()) {
    where.push(`${prefix}pays = ?`);
    params.push(pays.trim());
  }
  if (dateFrom) {
    where.push(`${prefix}created_at >= ?`);
    params.push(dateFrom);
  }
  if (dateTo) {
    where.push(`${prefix}created_at <= ?`);
    params.push(dateTo);
  }

  return { where, params };
}

function buildClientsQuery(options = {}) {
  const { where, params } = buildWhere(options, 'c');
  const { sortOrder, expression } = normalizeSort(options);
  const safeLimit = normalizeLimit(options.limit);
  const safePage = normalizePage(options.page);
  const offset = (safePage - 1) * safeLimit;
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const query = `
    SELECT
      c.id,
      c.nom,
      c.email,
      c.telephone,
      c.adresse,
      c.ville,
      c.code_postal,
      c.pays,
      c.type,
      c.created_at,
      c.updated_at,
      COALESCE(SUM(co.total_ttc), 0) AS total_achats,
      COUNT(co.id) AS nombre_commandes
    FROM clients c
    LEFT JOIN commandes co ON co.client_id = c.id
    ${whereClause}
    GROUP BY c.id
    ORDER BY ${expression} ${sortOrder}, c.id ${sortOrder}
    LIMIT ? OFFSET ?
  `;

  params.push(safeLimit, offset);
  return { query, params, limit: safeLimit, page: safePage, offset };
}

// ⭐ FIX: COUNT(DISTINCT c.id) mba tsy hisy duplicates raha misy JOIN
function buildClientsCountQuery(options = {}) {
  const { where, params } = buildWhere(options, 'c');
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  return {
    query: `SELECT COUNT(DISTINCT c.id) AS total FROM clients c ${whereClause}`,
    params,
  };
}

// ⭐ NOUVEAU: Stats query tsy misy JOIN (mba tsy hisy duplicates)
// Ny total_achats dia alaina avy amin'ny table commandes misaraka
function buildClientsStatsQuery() {
  return {
    query: `
      SELECT 
        COUNT(*) AS total,
        COUNT(CASE WHEN type = 'Particulier' THEN 1 END) AS particuliers,
        COUNT(CASE WHEN type = 'Entreprise' THEN 1 END) AS entreprises,
        COUNT(DISTINCT ville) AS villes,
        COUNT(CASE WHEN telephone IS NOT NULL AND TRIM(telephone) != '' THEN 1 END) AS avec_telephone
      FROM clients
    `,
    params: [],
  };
}

// ⭐ NOUVEAU: Total achats avy amin'ny commandes (tsy misy JOIN)
function buildClientsTotalAchatsQuery() {
  return {
    query: `SELECT COALESCE(SUM(total_ttc), 0) AS total_achats FROM commandes`,
    params: [],
  };
}

module.exports = {
  MAX_LIMIT,
  DEFAULT_LIMIT,
  buildClientsQuery,
  buildClientsCountQuery,
  buildClientsStatsQuery,
  buildClientsTotalAchatsQuery,
  normalizeLimit,
  normalizeSort,
  normalizePage,
};