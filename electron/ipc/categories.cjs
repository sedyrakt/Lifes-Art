'use strict';

const { getDb } = require('../database/connection.cjs');
const { BrowserWindow } = require('electron');

const DEBUG = false;

function log(...args) { if (DEBUG) console.log(...args); }
function error(...args) { console.error(...args); }

function getMainWindow() {
  const windows = BrowserWindow.getAllWindows();
  return windows.length > 0 ? windows[0] : null;
}

function emitCategoriesChanged(data) {
  const mainWindow = getMainWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('categories:changed', data);
  }
}

function withLiveDb(fn) {
  return (event, ...args) => {
    const db = getDb();
    if (!db || !db.open) {
      error('❌ [categories] Database connection is not open');
      return { success: false, error: 'Database connection is not open' };
    }
    return fn(db, ...args);
  };
}

function buildCategoriesQuery(db, options = {}) {
  const { limit, offset, page, search } = options;

  let sortField = 'nom';
  let sortDirection = 'ASC';

  if (options.sort && typeof options.sort === 'object') {
    sortField = options.sort.field || sortField;
    sortDirection = options.sort.direction === 'DESC' ? 'DESC' : 'ASC';
  } else if (options.sortBy) {
    sortField = options.sortBy;
    sortDirection = options.sortOrder === 'DESC' ? 'DESC' : 'ASC';
  }

  const allowedFields = ['nom', 'description', 'created_at', 'id'];
  if (!allowedFields.includes(sortField)) {
    sortField = 'nom';
  }

  let query = `
    SELECT c.*, 
      (SELECT COUNT(*) FROM produits WHERE categorie_id = c.id) AS produits_count
    FROM categories c
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ' AND (c.nom LIKE ? OR c.description LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s);
  }

  query += ` ORDER BY c.${sortField} ${sortDirection}`;

  let finalLimit = limit ? Math.max(1, Math.min(parseInt(limit) || 8, 100)) : 8;
  let finalOffset = 0;

  if (page) {
    const p = Math.max(parseInt(page), 1);
    finalOffset = (p - 1) * finalLimit;
  } else if (offset !== undefined) {
    finalOffset = Math.max(0, parseInt(offset) || 0);
  }

  query += ' LIMIT ? OFFSET ?';
  params.push(finalLimit, finalOffset);

  return { query, params };
}

function buildCategoriesCountQuery(db, options = {}) {
  const { search } = options;
  let query = 'SELECT COUNT(*) as total FROM categories c WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (c.nom LIKE ? OR c.description LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s);
  }

  return { query, params };
}

function validateCategory(data) {
  const errors = [];
  const nom = data.nom?.trim() || '';
  const description = data.description?.trim() || '';

  if (!nom) errors.push('Le nom de la catégorie est obligatoire');
  else if (nom.length < 2) errors.push('Le nom doit contenir au moins 2 caractères');
  else if (nom.length > 100) errors.push('Le nom ne peut pas dépasser 100 caractères');

  if (description && description.length > 500) errors.push('La description ne peut pas dépasser 500 caractères');

  return { valid: errors.length === 0, errors, data: { nom, description } };
}

function logAudit(action, categoryId, categoryName, userId, details = '') {
  try {
    const db = getDb();
    if (!db) return;
    const stmt = db.prepare(`
      INSERT INTO audit_logs (action, entity, entity_id, entity_name, user_id, details, created_at)
      VALUES (?, 'categorie', ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(action, categoryId, categoryName, userId, details);
  } catch (err) {
    error('⚠️ Erreur audit log:', err.message);
  }
}

function registerCategoriesHandlers(ipcMain) {
  if (DEBUG) log('📑 [categories.cjs] ENREGISTREMENT HANDLERS');
  if (!ipcMain) {
    error('❌ ipcMain est null/undefined!');
    return false;
  }

  const channels = [
    'categories:get-all',
    'categories:get-by-id',
    'categories:create',
    'categories:update',
    'categories:delete',
    'categories:get-products-count',
    'categories:search',
    'categories:bulk-delete',
    'categories:get-stats'
  ];
  channels.forEach(ch => {
    try { ipcMain.removeHandler(ch); } catch (_) {}
  });

  ipcMain.handle('categories:get-all', withLiveDb((db, options = {}) => {
    const { query, params } = buildCategoriesQuery(db, options);
    const data = db.prepare(query).all(params);

    const { query: countQuery, params: countParams } = buildCategoriesCountQuery(db, options);
    const countResult = db.prepare(countQuery).get(countParams);

    return {
      success: true,
      data: data,
      pagination: {
        total: countResult?.total || 0,
        limit: options.limit ? Math.min(parseInt(options.limit), 100) : data.length,
        offset: options.offset ? parseInt(options.offset) : 0,
        page: parseInt(options.page) || 1
      }
    };
  }));

  ipcMain.handle('categories:get-by-id', withLiveDb((db, id) => {
    if (!id || isNaN(id) || parseInt(id) <= 0) return { success: false, error: 'ID de catégorie invalide' };
    const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    const data = stmt.get(parseInt(id));
    if (!data) return { success: false, error: 'Catégorie non trouvée' };
    return { success: true, data };
  }));

  ipcMain.handle('categories:create', withLiveDb((db, data, userId = null) => {
    const validation = validateCategory(data);
    if (!validation.valid) return { success: false, error: validation.errors.join(', ') };

    const { nom, description } = validation.data;
    const checkStmt = db.prepare('SELECT id FROM categories WHERE LOWER(nom) = LOWER(?)');
    const existing = checkStmt.get(nom);
    if (existing) return { success: false, error: `La catégorie "${nom}" existe déjà` };

    const insertStmt = db.prepare('INSERT INTO categories (nom, description) VALUES (?, ?)');
    const result = insertStmt.run(nom, description);
    const categoryId = result.lastInsertRowid;

    if (userId) logAudit('create', categoryId, nom, userId);
    emitCategoriesChanged({ type: 'create', id: categoryId, nom });

    return { success: true, data: { id: categoryId, nom, description } };
  }));

  ipcMain.handle('categories:update', withLiveDb((db, id, data, userId = null) => {
    if (!id || isNaN(id) || parseInt(id) <= 0) return { success: false, error: 'ID de catégorie invalide' };
    const categoryId = parseInt(id);

    const getStmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    const existing = getStmt.get(categoryId);
    if (!existing) return { success: false, error: 'Catégorie non trouvée' };

    const validation = validateCategory(data);
    if (!validation.valid) return { success: false, error: validation.errors.join(', ') };

    const { nom, description } = validation.data;
    const checkStmt = db.prepare('SELECT id FROM categories WHERE LOWER(nom) = LOWER(?) AND id != ?');
    const duplicate = checkStmt.get(nom, categoryId);
    if (duplicate) return { success: false, error: `La catégorie "${nom}" existe déjà` };

    const updateStmt = db.prepare('UPDATE categories SET nom = ?, description = ? WHERE id = ?');
    updateStmt.run(nom, description, categoryId);

    if (userId) logAudit('update', categoryId, nom, userId, `Ancien nom: ${existing.nom}`);
    emitCategoriesChanged({ type: 'update', id: categoryId, nom });

    return { success: true, data: { id: categoryId, nom, description } };
  }));

  ipcMain.handle('categories:delete', withLiveDb((db, id, userId = null) => {
    if (!id || isNaN(id) || parseInt(id) <= 0) return { success: false, error: 'ID de catégorie invalide' };
    const categoryId = parseInt(id);

    const getStmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    const existing = getStmt.get(categoryId);
    if (!existing) return { success: false, error: 'Catégorie non trouvée' };

    const productCountStmt = db.prepare('SELECT COUNT(*) as total FROM produits WHERE categorie_id = ?');
    const productCount = productCountStmt.get(categoryId);
    if (productCount && productCount.total > 0) {
      return {
        success: false,
        error: `Impossible de supprimer "${existing.nom}". ${productCount.total} produit(s) l'utilisent.`,
        data: { productsCount: productCount.total }
      };
    }

    if (userId) logAudit('delete', categoryId, existing.nom, userId);
    const deleteStmt = db.prepare('DELETE FROM categories WHERE id = ?');
    deleteStmt.run(categoryId);
    emitCategoriesChanged({ type: 'delete', id: categoryId, nom: existing.nom });

    return { success: true, data: { id: categoryId, nom: existing.nom } };
  }));

  ipcMain.handle('categories:get-products-count', withLiveDb((db, id) => {
    if (!id || isNaN(id)) return { success: false, error: 'ID invalide' };
    const stmt = db.prepare('SELECT COUNT(*) as total FROM produits WHERE categorie_id = ?');
    const result = stmt.get(parseInt(id));
    return { success: true, data: { count: result?.total || 0 } };
  }));

  ipcMain.handle('categories:search', withLiveDb((db, searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) return { success: false, error: 'Le terme de recherche doit contenir au moins 2 caractères' };
    const stmt = db.prepare('SELECT * FROM categories WHERE nom LIKE ? ORDER BY nom LIMIT 50');
    const data = stmt.all(`%${searchTerm}%`);
    return { success: true, data };
  }));

  ipcMain.handle('categories:bulk-delete', withLiveDb((db, ids, userId = null) => {
    if (!ids || !Array.isArray(ids) || ids.length === 0) return { success: false, error: "Liste d'IDs invalide" };

    const deleted = [];
    const errors = [];

    const transaction = db.transaction((idsToDelete) => {
      const getCatStmt = db.prepare('SELECT id, nom FROM categories WHERE id = ?');
      const productCountStmt = db.prepare('SELECT COUNT(*) as total FROM produits WHERE categorie_id = ?');
      const deleteStmt = db.prepare('DELETE FROM categories WHERE id = ?');

      for (const id of idsToDelete) {
        const existing = getCatStmt.get(id);
        if (!existing) {
          errors.push({ id, error: 'Catégorie non trouvée' });
          continue;
        }
        const productCount = productCountStmt.get(id);
        if (productCount && productCount.total > 0) {
          errors.push({ id, nom: existing.nom, error: `${productCount.total} produit(s) l'utilisent` });
          continue;
        }
        if (userId) logAudit('bulk_delete', id, existing.nom, userId);
        deleteStmt.run(id);
        deleted.push({ id, nom: existing.nom });
      }
    });

    transaction(ids);

    if (deleted.length > 0) emitCategoriesChanged({ type: 'bulk_delete', count: deleted.length });

    return {
      success: true,
      data: {
        deleted,
        errors,
        total: ids.length,
        deletedCount: deleted.length,
        errorCount: errors.length
      }
    };
  }));

  // ═══════════════════════════════════════════════════════════
  // ⭐⭐⭐ GET STATS — misy `sansDescription` + `categoriesVides` ⭐⭐⭐
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('categories:get-stats', withLiveDb((db) => {
    const stmt = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM categories) AS total,
        (SELECT COUNT(*) FROM categories WHERE description IS NOT NULL AND TRIM(description) != '') AS avecDescription,
        (SELECT COUNT(*) FROM categories WHERE description IS NULL OR TRIM(description) = '') AS sansDescription,
        (SELECT COUNT(*) FROM produits) AS totalProduits,
        (SELECT COUNT(*) FROM categories c WHERE NOT EXISTS (
          SELECT 1 FROM produits p WHERE p.categorie_id = c.id
        )) AS categoriesVides,
        (SELECT COALESCE(SUM(quantite_stock), 0) FROM produits) AS totalStock,
        (SELECT COALESCE(SUM(quantite_stock * prix_vente), 0) FROM produits) AS valeurStock
    `);

    const data = stmt.get() || {};

    return {
      success: true,
      data: {
        total: Number(data.total) || 0,
        avecDescription: Number(data.avecDescription) || 0,
        sansDescription: Number(data.sansDescription) || 0,
        totalProduits: Number(data.totalProduits) || 0,
        categoriesVides: Number(data.categoriesVides) || 0,
        totalStock: Number(data.totalStock) || 0,
        valeurStock: Number(data.valeurStock) || 0,
        // Aliases snake_case (compatibilité)
        avec_description: Number(data.avecDescription) || 0,
        sans_description: Number(data.sansDescription) || 0,
        total_produits: Number(data.totalProduits) || 0,
        categories_vides: Number(data.categoriesVides) || 0,
        total_stock: Number(data.totalStock) || 0,
        valeur_stock: Number(data.valeurStock) || 0,
      },
    };
  }));

  if (DEBUG) log('📋 [categories.cjs] Tous les handlers sont enregistrés avec succès');
  return true;
}

module.exports = { registerCategoriesHandlers, emitCategoriesChanged };