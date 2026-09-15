// ============================================================
// electron/ipc/fournisseurs/queries.cjs — FINAL FIX
// ⭐ MAX_LIMIT = 200000 (ho an'ny export)
// ⭐ FIX: NESORINA NY image
// ============================================================

const MAX_LIMIT = 200000;
const DEFAULT_LIMIT = 8;

function normalizePage(page) {
  const n = Number(page);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function normalizeLimit(limit, fallback = DEFAULT_LIMIT) {
  const n = Number.parseInt(limit, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, MAX_LIMIT);
}

function buildFournisseursQuery(options = {}) {
  const { search, sort, email, telephone, dateFrom, dateTo } = options;
  let query = `SELECT f.id, f.nom, f.contact, f.telephone, f.email, f.adresse, f.created_at, f.updated_at FROM fournisseurs f WHERE 1=1`;
  const params = [];
  if (search) {
    query += ' AND (f.nom LIKE ? OR f.contact LIKE ? OR f.email LIKE ? OR f.telephone LIKE ?)';
    const s = `%${search.trim()}%`;
    params.push(s, s, s, s);
  }
  if (email) { query += ' AND f.email LIKE ?'; params.push(`%${email}%`); }
  if (telephone) { query += ' AND f.telephone LIKE ?'; params.push(`%${telephone}%`); }
  if (dateFrom) { query += ' AND f.created_at >= ?'; params.push(dateFrom); }
  if (dateTo) { query += ' AND f.created_at < date(?, "+1 day")'; params.push(dateTo); }

  const sortField = (sort && ['nom', 'contact', 'telephone', 'email', 'created_at'].includes(sort.field))
    ? sort.field
    : 'nom';
  const sortDir = (sort && sort.direction === 'DESC') ? 'DESC' : 'ASC';
  const limit = normalizeLimit(options.limit, DEFAULT_LIMIT);
  const page = normalizePage(options.page);
  const offset = (page - 1) * limit;

  query += ` ORDER BY f.${sortField} ${sortDir} LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  return { query, params };
}

function buildFournisseursCountQuery(options = {}) {
  const { search, email, telephone, dateFrom, dateTo } = options;
  let query = 'SELECT COUNT(*) as total FROM fournisseurs f WHERE 1=1';
  const params = [];
  if (search) {
    query += ' AND (f.nom LIKE ? OR f.contact LIKE ? OR f.email LIKE ? OR f.telephone LIKE ?)';
    const s = `%${search.trim()}%`;
    params.push(s, s, s, s);
  }
  if (email) { query += ' AND f.email LIKE ?'; params.push(`%${email}%`); }
  if (telephone) { query += ' AND f.telephone LIKE ?'; params.push(`%${telephone}%`); }
  if (dateFrom) { query += ' AND f.created_at >= ?'; params.push(dateFrom); }
  if (dateTo) { query += ' AND f.created_at < date(?, "+1 day")'; params.push(dateTo); }
  return { query, params };
}

module.exports = { MAX_LIMIT, DEFAULT_LIMIT, buildFournisseursQuery, buildFournisseursCountQuery, normalizeLimit, normalizePage };