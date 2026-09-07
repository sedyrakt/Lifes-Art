'use strict';
const { normalizeStatus } = require('./validation.cjs');
const ALLOWED_SORTS = new Set(['id', 'nom', 'prenom', 'poste', 'salaire', 'date_embauche', 'status', 'created_at', 'updated_at']);

function normalizeSort(sort = {}) { 
  const field = ALLOWED_SORTS.has(sort?.field) ? sort.field : 'id'; 
  const direction = sort?.direction === 'ASC' ? 'ASC' : 'DESC'; 
  return { field, direction }; 
}

function normalizeLimit(limit, fallback = 8) { 
  const n = Number(limit); 
  return Number.isInteger(n) && n > 0 ? Math.min(n, 200) : fallback; 
}

function normalizePage(page) { 
  const n = Number(page); 
  return Number.isFinite(n) && n > 0 ? n : 1; 
}

function buildEmployesFilters(options = {}) {
  const { search, departement, status, salaireMin, salaireMax, dateFrom, dateTo } = options;
  let where = ' WHERE e.status != ? '; 
  const params = ['licencie'];

  if (search && String(search).trim()) { 
    const s = `%${String(search).trim()}%`; 
    where += ' AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.email LIKE ?)'; 
    params.push(s, s, s); 
  }

  if (departement && String(departement).trim()) { 
    where += ' AND e.departement = ?'; 
    params.push(departement); 
  }

  if (status && status !== 'Tous') { 
    const normalized = normalizeStatus(status); 
    where += ' AND e.status = ?'; 
    params.push(normalized); 
  }

  if (salaireMin !== undefined && salaireMin !== '' && Number.isFinite(Number(salaireMin))) { 
    where += ' AND e.salaire >= ?'; 
    params.push(Number(salaireMin)); 
  }

  if (salaireMax !== undefined && salaireMax !== '' && Number.isFinite(Number(salaireMax))) { 
    where += ' AND e.salaire <= ?'; 
    params.push(Number(salaireMax)); 
  }

  if (dateFrom) { 
    where += ' AND e.date_embauche >= ?'; 
    params.push(dateFrom); 
  }

  if (dateTo) { 
    where += ' AND e.date_embauche < ?'; 
    params.push(dateTo); 
  }

  return { where, params };
}

function buildEmployesQuery(options = {}) {
  const limit = normalizeLimit(options.limit, 8);
  const page = normalizePage(options.page); 
  const offset = (page - 1) * limit;
  const { where, params } = buildEmployesFilters(options); 
  const sort = normalizeSort(options.sort);

  // ⭐ NESORINA NY e.image
  const query = `SELECT e.id, e.nom, e.prenom, e.email, e.telephone, e.poste, e.departement, e.date_embauche, e.salaire, e.status, e.created_at, e.updated_at 
  FROM employes e ${where} 
  ORDER BY e.${sort.field} ${sort.direction}, e.id ASC 
  LIMIT ? OFFSET ?`;

  params.push(limit, offset);
  return { query, params };
}

function buildEmployesCountQuery(options = {}) {
  const { where, params } = buildEmployesFilters(options);
  return { query: `SELECT COUNT(*) AS total FROM employes e ${where}`, params };
}

module.exports = { 
  buildEmployesQuery, 
  buildEmployesCountQuery 
};