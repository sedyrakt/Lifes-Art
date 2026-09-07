'use strict';

const { getDb } = require('../../database/connection.cjs');
const { BrowserWindow } = require('electron');
const { log, error } = require('./logger.cjs');
const { logAudit } = require('./audit.cjs');
const { validateFournisseur } = require('./validation.cjs');
const { buildFournisseursQuery, buildFournisseursCountQuery } = require('./queries.cjs');
const statementsModule = require('./statements.cjs');

function withDbCheck(fn) {
  return (event, ...args) => {
    const db = getDb();
    if (!db || !db.open) { error('❌ [fournisseurs] Database connection is not open'); return { success: false, error: 'Database connection is not open' }; }
    try { statementsModule.prepareStatements(); } catch (err) { error('❌ [fournisseurs] prepareStatements error:', err.message); return { success: false, error: 'Erreur préparation des statements' }; }
    return fn(db, event, ...args);
  };
}

function emitFournisseursChanged(data) {
  const windows = BrowserWindow.getAllWindows(); if (windows.length === 0) return;
  windows.forEach((win) => { if (!win.isDestroyed()) { try { win.webContents.send('fournisseurs:changed', data); } catch (err) { error('❌ Erreur émission:', err.message); } } });
}

function registerFournisseursHandlers(ipcMain) {
  if (!ipcMain) { error('❌ ipcMain null/undefined!'); return false; }
  statementsModule.prepareStatements();

  const channels = ['fournisseurs:get-all','fournisseurs:get-by-id','fournisseurs:create','fournisseurs:update','fournisseurs:delete','fournisseurs:get-products','fournisseurs:search','fournisseurs:get-stats','fournisseurs:bulk-delete','fournisseurs:get-by-email'];
  for (const channel of channels) { try { ipcMain.removeHandler(channel); } catch (_) {} }

  ipcMain.handle('fournisseurs:get-all', withDbCheck((db, event, options = {}) => {
    try {
      const { query, params } = buildFournisseursQuery(options);
      const data = db.prepare(query).all(params);
      let total = 0, totalPages = 1;
      const { query: countQuery, params: countParams } = buildFournisseursCountQuery(options);
      const countResult = db.prepare(countQuery).get(countParams);
      total = Number(countResult?.total || 0); const limit = options.limit ? Math.min(Number(options.limit), 100) : 8;
      totalPages = Math.ceil(total / limit) || 1;
      return { success: true, data, pagination: { total, limit, totalPages, page: options.page || 1 } };
    } catch (err) { error('❌ [fournisseurs:get-all] Erreur:', err.message); return { success: false, error: err.message }; }
  }));

  ipcMain.handle('fournisseurs:get-by-id', withDbCheck((db, event, id) => {
    try {
      if (!statementsModule.stmtGetById) return { success: false, error: 'Service de base de données non disponible' };
      if (!id || isNaN(id) || parseInt(id) <= 0) return { success: false, error: 'ID invalide' };
      const data = statementsModule.stmtGetById.get(parseInt(id));
      if (!data) return { success: false, error: 'Fournisseur non trouvé' };
      const productCount = statementsModule.stmtProductCount.get(parseInt(id));
      data.product_count = productCount?.total || 0;
      return { success: true, data };
    } catch (err) { return { success: false, error: err.message }; }
  }));

  ipcMain.handle('fournisseurs:create', withDbCheck((db, event, data, userId = null) => {
    try {
      if (!statementsModule.stmtCreate) return { success: false, error: 'Service de base de données non disponible' };
      const validation = validateFournisseur(data);
      if (!validation.valid) return { success: false, error: validation.errors.join(', ') };
      const fd = validation.data;
      if (statementsModule.stmtGetByName.get(fd.nom)) return { success: false, error: 'Ce fournisseur existe déjà' };
      if (fd.email && statementsModule.stmtGetByEmail.get(fd.email)) return { success: false, error: 'Email déjà utilisé' };
      // ⭐ NESORINA NY image
      const result = statementsModule.stmtCreate.run(fd.nom, fd.contact, fd.telephone, fd.email, fd.adresse);
      const id = result.lastInsertRowid;
      const auditUser = userId || event.sender?.user?.id || null;
      if (auditUser) logAudit('create', id, fd.nom, auditUser);
      emitFournisseursChanged({ type: 'create', id, nom: fd.nom });
      return { success: true, data: statementsModule.stmtGetById.get(id) };
    } catch (err) { return { success: false, error: err.message }; }
  }));

  ipcMain.handle('fournisseurs:update', withDbCheck((db, event, id, data, userId = null) => {
    try {
      if (!statementsModule.stmtUpdate) return { success: false, error: 'Service de base de données non disponible' };
      if (!id || isNaN(id) || parseInt(id) <= 0) return { success: false, error: 'ID invalide' };
      const fid = parseInt(id); const existing = statementsModule.stmtGetById.get(fid);
      if (!existing) return { success: false, error: 'Fournisseur non trouvé' };
      const validation = validateFournisseur(data);
      if (!validation.valid) return { success: false, error: validation.errors.join(', ') };
      const fd = validation.data;
      if (statementsModule.stmtGetByNameExcept.get(fd.nom, fid)) return { success: false, error: 'Nom déjà utilisé' };
      if (fd.email && statementsModule.stmtGetByEmailExcept.get(fd.email, fid)) return { success: false, error: 'Email déjà utilisé' };
      // ⭐ NESORINA NY image
      statementsModule.stmtUpdate.run(fd.nom, fd.contact, fd.telephone, fd.email, fd.adresse, fid);
      const auditUser = userId || event.sender?.user?.id || null;
      if (auditUser) logAudit('update', fid, fd.nom, auditUser);
      emitFournisseursChanged({ type: 'update', id: fid, nom: fd.nom });
      return { success: true, data: statementsModule.stmtGetById.get(fid) };
    } catch (err) { return { success: false, error: err.message }; }
  }));

  ipcMain.handle('fournisseurs:delete', withDbCheck((db, event, id, userId = null) => {
    try {
      if (!statementsModule.stmtDelete) return { success: false, error: 'Service de base de données non disponible' };
      if (!id || isNaN(id) || parseInt(id) <= 0) return { success: false, error: 'ID invalide' };
      const fid = parseInt(id); const existing = statementsModule.stmtGetById.get(fid);
      if (!existing) return { success: false, error: 'Fournisseur non trouvé' };
      if ((statementsModule.stmtProductCount.get(fid)?.total || 0) > 0) return { success: false, error: `Impossible de supprimer "${existing.nom}". ${statementsModule.stmtProductCount.get(fid)?.total} produit(s) utilisent ce fournisseur.` };
      if ((statementsModule.stmtExpenseCount.get(fid)?.total || 0) > 0) return { success: false, error: `Impossible de supprimer "${existing.nom}". ${statementsModule.stmtExpenseCount.get(fid)?.total} dépense(s) utilisent ce fournisseur.` };
      const auditUser = userId || event.sender?.user?.id || null;
      if (auditUser) logAudit('delete', fid, existing.nom, auditUser);
      statementsModule.stmtDelete.run(fid);
      emitFournisseursChanged({ type: 'delete', id: fid, nom: existing.nom });
      return { success: true, data: { id: fid, nom: existing.nom } };
    } catch (err) { return { success: false, error: err.message }; }
  }));

  ipcMain.handle('fournisseurs:get-products', withDbCheck((db, event, id) => {
    if (!statementsModule.stmtGetProductsByFournisseur) return { success: false, error: 'Service de base de données non disponible' };
    if (!id || isNaN(id)) return { success: false, error: 'ID invalide' };
    const products = statementsModule.stmtGetProductsByFournisseur.all(parseInt(id));
    return { success: true, data: products };
  }));

  ipcMain.handle('fournisseurs:search', withDbCheck((db, event, searchTerm) => {
    if (!statementsModule.stmtSearch) return { success: false, error: 'Service de base de données non disponible' };
    if (!searchTerm || searchTerm.length < 2) return { success: false, error: 'Le terme de recherche doit contenir au moins 2 caractères' };
    const data = statementsModule.stmtSearch.all(`%${searchTerm.trim()}%`, `%${searchTerm.trim()}%`, `%${searchTerm.trim()}%`, `%${searchTerm.trim()}%`);
    return { success: true, data };
  }));

  ipcMain.handle('fournisseurs:get-stats', withDbCheck((db, event) => {
    if (!statementsModule.stmtGetStats) return { success: false, error: 'Service de base de données non disponible' };
    return { success: true, data: statementsModule.stmtGetStats.get() };
  }));

  ipcMain.handle('fournisseurs:bulk-delete', withDbCheck((db, event, ids, userId = null) => {
    if (!ids || !Array.isArray(ids) || ids.length === 0) return { success: false, error: "Liste d'IDs invalide" };
    const deleted = [], errors = [];
    const transaction = db.transaction(() => {
      for (const id of ids) {
        const existing = statementsModule.stmtGetById.get(id);
        if (!existing) { errors.push({ id, error: 'Fournisseur non trouvé' }); continue; }
        if ((statementsModule.stmtProductCount.get(id)?.total || 0) > 0) { errors.push({ id, nom: existing.nom, error: `${statementsModule.stmtProductCount.get(id)?.total} produit(s)` }); continue; }
        if ((statementsModule.stmtExpenseCount.get(id)?.total || 0) > 0) { errors.push({ id, nom: existing.nom, error: `${statementsModule.stmtExpenseCount.get(id)?.total} dépense(s)` }); continue; }
        const auditUser = userId || event.sender?.user?.id || null;
        if (auditUser) logAudit('bulk_delete', id, existing.nom, auditUser);
        db.prepare('DELETE FROM fournisseurs WHERE id = ?').run(id);
        deleted.push({ id, nom: existing.nom });
      }
    });
    transaction();
    if (deleted.length > 0) emitFournisseursChanged({ type: 'bulk_delete', count: deleted.length });
    return { success: true, data: { deleted, errors, total: ids.length, deletedCount: deleted.length, errorCount: errors.length } };
  }));

  ipcMain.handle('fournisseurs:get-by-email', withDbCheck((db, event, email) => {
    if (!statementsModule.stmtGetByEmail) return { success: false, error: 'Service de base de données non disponible' };
    if (!email?.trim()) return { success: false, error: 'Email requis' };
    return { success: true, data: statementsModule.stmtGetByEmail.get(email.trim().toLowerCase()) || null };
  }));

  log('✅ [fournisseurs.handlers] Enregistrés avec withDbCheck');
  return true;
}

module.exports = { registerFournisseursHandlers };