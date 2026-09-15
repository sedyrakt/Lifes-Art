// electron/ipc/clients/handlers.cjs
// ⭐ FIX: clients:get-stats manampy `total_commandes`
'use strict';

const { BrowserWindow } = require('electron');
const { getDb } = require('../../database/connection.cjs');
const { log, error } = require('./utils.cjs');
const {
  buildClientsQuery,
  buildClientsCountQuery,
  buildClientsStatsQuery,
  buildClientsTotalAchatsQuery,
} = require('./queries.cjs');
const { prepareStatements, getStatements } = require('./statements.cjs');
const { logAudit } = require('./audit.cjs');

function withDbCheck(fn) {
  return (event, ...args) => {
    try {
      const db = getDb();
      if (!db || !db.open) {
        error('❌ [clients] Database connection is not open');
        return { success: false, error: 'Database connection is not open' };
      }
      if (!prepareStatements()) {
        return { success: false, error: 'Failed to prepare statements' };
      }
      const stmts = getStatements();
      if (!stmts || !stmts.getById) {
        return { success: false, error: 'Statements not available' };
      }
      return fn(db, stmts, event, ...args);
    } catch (err) {
      error('❌ [clients] IPC error:', err?.message);
      return { success: false, error: err?.message || 'Erreur interne clients' };
    }
  };
}

function emitClientsChanged(data) {
  const windows = BrowserWindow.getAllWindows();
  if (!windows.length) return;
  for (const win of windows) {
    if (!win || win.isDestroyed()) continue;
    try { win.webContents.send('clients:changed', data); } catch (err) {
      error('❌ clients:changed:', err?.message);
    }
  }
}

function normalizeId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeIds(ids, max = 50) {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.map(normalizeId).filter(Boolean))].slice(0, max);
}

function registerClientsHandlers(ipcMain) {
  log('👥 [clients.handlers] ENREGISTREMENT');
  if (!ipcMain) { error('❌ ipcMain null'); return false; }
  if (!prepareStatements()) {
    error('❌ [clients.handlers] Statements non préparés');
    return false;
  }

  const channels = [
    'clients:get-all', 'clients:get-by-id', 'clients:create', 'clients:update',
    'clients:delete', 'clients:search', 'clients:get-stats',
    'clients:bulk-update-type', 'clients:bulk-delete',
    'clients:get-by-type', 'clients:get-by-email'
  ];
  for (const ch of channels) try { ipcMain.removeHandler(ch); } catch (_) {}

  // ═══════════════════════════════════════════════════════════
  // ⭐ GET ALL
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('clients:get-all', withDbCheck((db, stmts, event, options = {}) => {
    const safeOptions = options && typeof options === 'object' ? options : {};
    const { query, params, limit, page } = buildClientsQuery(safeOptions);
    const data = db.prepare(query).all(params);
    const { query: countQuery, params: countParams } = buildClientsCountQuery(safeOptions);
    const countResult = db.prepare(countQuery).get(countParams);
    const total = Number(countResult?.total) || 0;
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
    return {
      success: true,
      data: Array.isArray(data) ? data : [],
      pagination: { total, totalPages, limit, page },
    };
  }));

  // ═══════════════════════════════════════════════════════════
  // ⭐ GET BY ID
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('clients:get-by-id', withDbCheck((db, stmts, event, id) => {
    const clientId = normalizeId(id);
    if (!clientId) return { success: false, error: 'ID client invalide' };
    const data = stmts.getById.get(clientId);
    if (!data) return { success: false, error: 'Client non trouvé' };
    return { success: true, data };
  }));

  // ═══════════════════════════════════════════════════════════
  // ⭐ CREATE
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('clients:create', withDbCheck((db, stmts, event, data, userId = null) => {
    if (!data || typeof data !== 'object') return { success: false, error: 'Données du client manquantes' };
    const { nom, email, telephone, adresse, ville, code_postal, pays, type } = data;
    const safeNom = String(nom || '').trim();
    if (!safeNom) return { success: false, error: 'Le nom est obligatoire' };
    const safeEmail = email ? String(email).trim() : null;
    if (safeEmail) {
      const existing = stmts.checkEmail.get(safeEmail);
      if (existing) return { success: false, error: 'Cet email est déjà utilisé' };
    }
    const result = stmts.create.run(
      safeNom, safeEmail, telephone || null, adresse || null,
      ville || null, code_postal || null, pays || 'Madagascar', type || 'Particulier'
    );
    const id = Number(result.lastInsertRowid);
    const auditUser = userId || event?.sender?.user?.id || null;
    if (auditUser) logAudit('create', id, safeNom, auditUser, 'Client créé');
    const newClient = stmts.getById.get(id);
    emitClientsChanged({ type: 'create', id, client: newClient });
    return { success: true, data: newClient };
  }));

  // ═══════════════════════════════════════════════════════════
  // ⭐ UPDATE
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('clients:update', withDbCheck((db, stmts, event, id, data, userId = null) => {
    const clientId = normalizeId(id);
    if (!clientId) return { success: false, error: 'ID client invalide' };
    if (!data || typeof data !== 'object') return { success: false, error: 'Données du client manquantes' };
    const existing = stmts.getById.get(clientId);
    if (!existing) return { success: false, error: 'Client non trouvé' };
    const { nom, email, telephone, adresse, ville, code_postal, pays, type } = data;
    const safeNom = String(nom || '').trim();
    if (!safeNom) return { success: false, error: 'Le nom est obligatoire' };
    const safeEmail = email ? String(email).trim() : null;
    if (safeEmail && safeEmail !== existing.email) {
      const duplicate = stmts.checkEmail.get(safeEmail);
      if (duplicate && Number(duplicate.id) !== clientId) {
        return { success: false, error: 'Cet email est déjà utilisé' };
      }
    }
    stmts.update.run(
      safeNom, safeEmail, telephone || null, adresse || null,
      ville || null, code_postal || null, pays || 'Madagascar', type || 'Particulier',
      clientId
    );
    const auditUser = userId || event?.sender?.user?.id || null;
    if (auditUser) logAudit('update', clientId, safeNom, auditUser, 'Client mis à jour');
    const updated = stmts.getById.get(clientId);
    emitClientsChanged({ type: 'update', id: clientId, client: updated });
    return { success: true, data: updated };
  }));

  // ═══════════════════════════════════════════════════════════
  // ⭐ DELETE
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('clients:delete', withDbCheck((db, stmts, event, id, userId = null) => {
    const clientId = normalizeId(id);
    if (!clientId) return { success: false, error: 'ID client invalide' };
    const existing = stmts.getById.get(clientId);
    if (!existing) return { success: false, error: 'Client non trouvé' };
    const auditUser = userId || event?.sender?.user?.id || null;
    stmts.delete.run(clientId);
    if (auditUser) logAudit('delete', clientId, existing.nom, auditUser, 'Client supprimé');
    emitClientsChanged({ type: 'delete', id: clientId });
    return { success: true, data: { id: clientId } };
  }));

  // ═══════════════════════════════════════════════════════════
  // ⭐ SEARCH
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('clients:search', withDbCheck((db, stmts, event, searchTerm) => {
    const value = String(searchTerm || '').trim();
    if (!value) return { success: true, data: [] };
    const pattern = `%${value}%`;
    const data = stmts.search.all(pattern, pattern, pattern, pattern);
    return { success: true, data };
  }));

  // ═══════════════════════════════════════════════════════════
  // ⭐ GET BY TYPE / EMAIL
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('clients:get-by-type', withDbCheck((db, stmts, event, type) => {
    const safeType = String(type || '').trim();
    if (!['Particulier', 'Entreprise'].includes(safeType)) return { success: false, error: 'Type client invalide' };
    const data = stmts.getByType.all(safeType);
    return { success: true, data };
  }));

  ipcMain.handle('clients:get-by-email', withDbCheck((db, stmts, event, email) => {
    const safeEmail = String(email || '').trim();
    if (!safeEmail) return { success: true, data: null };
    const data = stmts.getByEmail.get(safeEmail);
    return { success: true, data: data || null };
  }));

  // ═══════════════════════════════════════════════════════════
  // ⭐⭐⭐ GET STATS — misy `total_commandes` VAOVAO ⭐⭐⭐
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('clients:get-stats', withDbCheck((db, stmts) => {
    try {
      // Total, particuliers, entreprises, villes, avec_telephone
      const { query: statsQuery, params: statsParams } = buildClientsStatsQuery();
      const raw = db.prepare(statsQuery).get(...statsParams);

      // Total achats avy amin'ny commandes (tsy misy JOIN)
      const { query: achatsQuery, params: achatsParams } = buildClientsTotalAchatsQuery();
      const achatsRow = db.prepare(achatsQuery).get(...achatsParams);

      // ⭐ VAOVAO: Total commandes (avy amin'ny commandes)
      const commandesRow = db.prepare('SELECT COUNT(*) AS total FROM commandes').get();

      return {
        success: true,
        data: {
          total: Number(raw?.total) || 0,
          particuliers: Number(raw?.particuliers) || 0,
          entreprises: Number(raw?.entreprises) || 0,
          villes: Number(raw?.villes) || 0,
          avec_telephone: Number(raw?.avec_telephone) || 0,
          total_achats: Number(achatsRow?.total_achats) || 0,
          total_commandes: Number(commandesRow?.total) || 0,   // ⭐ NOUVEAU
        },
      };
    } catch (err) {
      error('❌ [clients:get-stats]', err.message);
      return {
        success: false,
        error: err.message,
        data: {
          total: 0, particuliers: 0, entreprises: 0, villes: 0,
          avec_telephone: 0, total_achats: 0, total_commandes: 0,
        },
      };
    }
  }));

  // ═══════════════════════════════════════════════════════════
  // ⭐ BULK UPDATE TYPE
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('clients:bulk-update-type', withDbCheck((db, stmts, event, ids, newType) => {
    const safeIds = normalizeIds(ids);
    if (safeIds.length === 0) return { success: false, error: 'Aucun client sélectionné' };
    const safeType = String(newType || '').trim();
    if (!['Particulier', 'Entreprise'].includes(safeType)) return { success: false, error: 'Type client invalide' };
    const placeholders = safeIds.map(() => '?').join(',');
    const stmt = db.prepare(`UPDATE clients SET type = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`);
    const result = stmt.run(safeType, ...safeIds);
    emitClientsChanged({ type: 'bulk_update_type', ids: safeIds, clientType: safeType });
    return { success: true, changes: result.changes };
  }));

  // ═══════════════════════════════════════════════════════════
  // ⭐ BULK DELETE
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('clients:bulk-delete', withDbCheck((db, stmts, event, ids) => {
    const safeIds = normalizeIds(ids);
    if (safeIds.length === 0) return { success: false, error: 'Aucun client sélectionné' };
    const placeholders = safeIds.map(() => '?').join(',');
    const stmt = db.prepare(`DELETE FROM clients WHERE id IN (${placeholders})`);
    const result = stmt.run(...safeIds);
    emitClientsChanged({ type: 'bulk_delete', ids: safeIds });
    return { success: true, deleted: result.changes };
  }));

  log('✅ [clients.handlers] Enregistrés');
  return true;
}

module.exports = { registerClientsHandlers, emitClientsChanged };