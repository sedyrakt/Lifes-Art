// ============================================================
// electron/ipc/clients/queries.cjs - PAGE/OFFSET FIX (DEFAULT_LIMIT 8)
// ============================================================
const MAX_LIMIT = 100; 
const DEFAULT_LIMIT = 8;
const ALLOWED_SORTS = { 
  nom: { field: 'nom', nullSafe: "COALESCE(c.nom, '')" }, 
  email: { field: 'email', nullSafe: "COALESCE(c.email, '')" }, 
  ville: { field: 'ville', nullSafe: "COALESCE(c.ville, '')" }, 
  type: { field: 'type', nullSafe: "COALESCE(c.type, '')" }, 
  created_at: { field: 'created_at', nullSafe: "COALESCE(c.created_at, '')" }, 
  id: { field: 'id', nullSafe: 'c.id' } 
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
  return { sortBy, sortOrder, field: ALLOWED_SORTS[sortBy].field, expression: ALLOWED_SORTS[sortBy].nullSafe };
}

function buildWhere(options = {}, alias = '') {
  const { search, type, ville, pays, dateFrom, dateTo } = options; 
  const prefix = alias ? `${alias}.` : '';
  const where = [], params = [];
  if (typeof search === 'string' && search.trim()) { 
    const value = search.trim(), pattern = `%${value}%`; 
    where.push(`(${prefix}nom LIKE ? OR ${prefix}email LIKE ? OR ${prefix}telephone LIKE ? OR ${prefix}ville LIKE ?)`); 
    params.push(pattern, pattern, pattern, pattern); 
  }
  if (type && ['Particulier', 'Entreprise'].includes(type)) { 
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
  const { sortBy, sortOrder, expression } = normalizeSort(options);
  const safeLimit = normalizeLimit(options.limit);
  const safePage = normalizePage(options.page);
  const offset = (safePage - 1) * safeLimit;
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const query = `
    SELECT
      c.id, c.nom, c.email, c.telephone, c.adresse, c.ville, c.code_postal, c.pays, c.type, c.created_at, c.updated_at,
      COALESCE(SUM(co.total_ttc), 0) AS total_achats,
      COUNT(DISTINCT co.id) AS nombre_commandes
    FROM clients c
    LEFT JOIN commandes co ON co.client_id = c.id
    ${whereClause}
    GROUP BY c.id
    ORDER BY ${expression} ${sortOrder}, c.id ${sortOrder}
    LIMIT ? OFFSET ?
  `;

  params.push(safeLimit, offset);
  return { query, params, limit: safeLimit, page: safePage, offset, sortBy, sortOrder };
}

function buildClientsCountQuery(options = {}) {
  const { where, params } = buildWhere(options, 'c');
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  return { query: `SELECT COUNT(*) AS total FROM clients c ${whereClause}`, params };
}

module.exports = { MAX_LIMIT, DEFAULT_LIMIT, buildClientsQuery, buildClientsCountQuery, normalizeLimit, normalizeSort, normalizePage };