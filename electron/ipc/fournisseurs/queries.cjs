// ============================================================
// electron/ipc/fournisseurs/queries.cjs - PAGE-BASED (8)
// ⭐ FIX: fallback = 8
// ⭐ FIX: NESORINA NY image
// ============================================================

function normalizePage(page) { const n = Number(page); return Number.isFinite(n) && n > 0 ? n : 1; }
function normalizeLimit(limit, fallback=8) { // ⭐ fallback ovaina ho 8
  const n = Number.parseInt(limit, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 100);
}

function buildFournisseursQuery(options = {}) {
  const { search, sort, email, telephone, dateFrom, dateTo } = options;
  // ⭐ NESORINA NY f.image
  let query = `SELECT f.id, f.nom, f.contact, f.telephone, f.email, f.adresse, f.created_at, f.updated_at FROM fournisseurs f WHERE 1=1`;
  const params = [];
  if (search) { query += ' AND (f.nom LIKE ? OR f.contact LIKE ? OR f.email LIKE ? OR f.telephone LIKE ?)'; const s = `%${search.trim()}%`; params.push(s, s, s, s); }
  if (email) { query += ' AND f.email LIKE ?'; params.push(`%${email}%`); }
  if (telephone) { query += ' AND f.telephone LIKE ?'; params.push(`%${telephone}%`); }
  if (dateFrom) { query += ' AND f.created_at >= ?'; params.push(dateFrom); }
  if (dateTo) { query += ' AND f.created_at < date(?, "+1 day")'; params.push(dateTo); }
  const sortField = (sort && ['nom', 'contact', 'telephone', 'email', 'created_at'].includes(sort.field)) ? sort.field : 'nom';
  const sortDir = (sort && sort.direction === 'DESC') ? 'DESC' : 'ASC';
  const limit = normalizeLimit(options.limit, 8);
  const page = normalizePage(options.page); const offset = (page - 1) * limit;
  query += ` ORDER BY f.${sortField} ${sortDir} LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  return { query, params };
}

function buildFournisseursCountQuery(options = {}) {
  const { search, email, telephone, dateFrom, dateTo } = options;
  let query = 'SELECT COUNT(*) as total FROM fournisseurs f WHERE 1=1'; const params = [];
  if (search) { query += ' AND (f.nom LIKE ? OR f.contact LIKE ? OR f.email LIKE ? OR f.telephone LIKE ?)'; const s = `%${search.trim()}%`; params.push(s, s, s, s); }
  if (email) { query += ' AND f.email LIKE ?'; params.push(`%${email}%`); }
  if (telephone) { query += ' AND f.telephone LIKE ?'; params.push(`%${telephone}%`); }
  if (dateFrom) { query += ' AND f.created_at >= ?'; params.push(dateFrom); }
  if (dateTo) { query += ' AND f.created_at < date(?, "+1 day")'; params.push(dateTo); }
  return { query, params };
}

module.exports = { buildFournisseursQuery, buildFournisseursCountQuery };