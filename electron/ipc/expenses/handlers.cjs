// electron/ipc/expenses/handlers.cjs
// ⭐ FIX: expenses:get-stats → returns topCategories ho an'ny global footer
'use strict';

const { getDb } = require('../../database/connection.cjs');
const { log, error } = require('./logger.cjs');
const { validateExpense } = require('./validation.cjs');
const { buildExpensesQuery, buildExpensesCountQuery } = require('./queries.cjs');
const {
  prepareStatements,
  getStmtGetById,
  getStmtGetByPeriod,
  getStmtGetByCategory,
  getStmtGetByMode,
  getStmtGetSummaryWithDates,
  getStmtGetSummary,
  getStmtGetTopCategoriesWithDates,
  getStmtGetTopCategories,
  getStmtGetStats,
  getStmtDeleteById,
  getStmtGetByIdForBulk,
  getStmtInsertExpense,
  getStmtUpdateExpense,
} = require('./statements.cjs');

let emitFinancialChanged = null;
try {
  const financialModule = require('../financial.cjs');
  if (financialModule && typeof financialModule.emitFinancialChanged === 'function') emitFinancialChanged = financialModule.emitFinancialChanged;
  else emitFinancialChanged = () => {};
} catch (_) { emitFinancialChanged = () => {}; }

function logAudit(action, expenseId, category, amount, userId, details = '') {
  try {
    const db = getDb(); if (!db || !db.open) return;
    const stmt = db.prepare(`INSERT INTO audit_logs (action, entity, entity_id, entity_name, user_id, details, created_at) VALUES (?, 'depense', ?, ?, ?, ?, datetime('now'))`);
    stmt.run(action, expenseId, category, userId, `${details} Montant: ${amount}`);
  } catch (_) { /* ignore */ }
}

function withDbCheck(fn) {
  return (event, ...args) => {
    const db = getDb();
    if (!db || !db.open) { error('❌ [expenses] Database connection is not open'); return { success: false, error: 'Database connection is not open' }; }
    try {
      const ok = prepareStatements();
      if (!ok) return { success: false, error: 'Erreur préparation des statements' };
    } catch (err) { error('❌ [expenses] prepareStatements error:', err.message); return { success: false, error: 'Erreur préparation des statements' }; }
    return fn(db, event, ...args);
  };
}

function registerExpensesHandlers(ipcMain) {
  log('💸 [expenses.handlers] ENREGISTREMENT');
  if (!ipcMain) { error('❌ ipcMain null'); return false; }

  const channels = [
    'expenses:get-all',
    'expenses:get-by-id',
    'expenses:create',
    'expenses:update',
    'expenses:delete',
    'expenses:get-by-period',
    'expenses:get-by-category',
    'expenses:get-summary',
    'expenses:get-stats',
    'expenses:bulk-delete',
    'expenses:get-by-mode',
  ];
  for (const ch of channels) { try { ipcMain.removeHandler(ch); } catch (_) {} }

  // ═══════════════════════════════════════════════════════════
  // ⭐ GET ALL
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('expenses:get-all', withDbCheck((db, event, options = {}) => {
    try {
      const { query, params, limit, offset } = buildExpensesQuery(options);
      const data = db.prepare(query).all(params);
      const { query: countQuery, params: countParams } = buildExpensesCountQuery(options);
      const countResult = db.prepare(countQuery).get(countParams);
      return {
        success: true,
        data,
        pagination: {
          total: countResult?.total || 0,
          limit,
          offset,
          page: options.page || 1,
          totalPages: Math.ceil((countResult?.total || 0) / limit) || 1,
        },
      };
    } catch (err) { error('❌ [expenses:get-all]', err.message); return { success: false, error: err.message }; }
  }));

  // ═══════════════════════════════════════════════════════════
  // ⭐ GET BY ID
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('expenses:get-by-id', withDbCheck((db, event, id) => {
    try {
      const expense = getStmtGetById(db).get(id);
      if (!expense) return { success: false, error: 'Dépense non trouvée' };
      return { success: true, data: expense };
    } catch (err) { error('❌ [expenses:get-by-id]', err.message); return { success: false, error: err.message }; }
  }));

  // ═══════════════════════════════════════════════════════════
  // ⭐ CREATE
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('expenses:create', withDbCheck((db, event, data, userId = null) => {
    try {
      const validation = validateExpense(data);
      if (!validation.valid) return { success: false, error: validation.errors.join(', ') };
      const expenseData = validation.data;
      const dateDepense = expenseData.date_depense || new Date().toISOString().split('T')[0];
      const cols = getStmtGetById(db).columns ? Object.keys(getStmtGetById(db).columns) : [];
      const fields = ['categorie', 'description', 'montant', 'date_depense'];
      const placeholders = ['?', '?', '?', '?'];
      const params = [expenseData.categorie, expenseData.description, expenseData.montant, dateDepense];
      if (cols.includes('mode_paiement')) { fields.push('mode_paiement'); placeholders.push('?'); params.push(expenseData.mode_paiement); }
      if (cols.includes('reference')) { fields.push('reference'); placeholders.push('?'); params.push(expenseData.reference); }
      if (cols.includes('observation')) { fields.push('observation'); placeholders.push('?'); params.push(expenseData.observation); }
      if (cols.includes('fournisseur_id')) { fields.push('fournisseur_id'); placeholders.push('?'); params.push(expenseData.fournisseur_id); }
      if (cols.includes('fournisseur_nom')) { fields.push('fournisseur_nom'); placeholders.push('?'); params.push(expenseData.fournisseur_nom); }
      fields.push('created_at'); placeholders.push('CURRENT_TIMESTAMP');
      const insertStmt = getStmtInsertExpense(db, fields, placeholders);
      const result = insertStmt.run(...params);
      const expenseId = result.lastInsertRowid;
      if (userId) logAudit('create', expenseId, expenseData.categorie, expenseData.montant, userId, `Description: ${expenseData.description?.substring(0, 50) || ''}`);
      if (emitFinancialChanged) emitFinancialChanged({ type: 'expense_created', id: expenseId, montant: expenseData.montant });
      return { success: true, data: { id: Number(expenseId), ...expenseData, date_depense: dateDepense } };
    } catch (err) { error('❌ [expenses:create]', err.message); return { success: false, error: err.message }; }
  }));

  // ═══════════════════════════════════════════════════════════
  // ⭐ UPDATE
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('expenses:update', withDbCheck((db, event, id, data, userId = null) => {
    try {
      const expenseId = Number(id);
      if (!expenseId || expenseId <= 0) return { success: false, error: 'ID invalide' };
      const existing = getStmtGetById(db).get(expenseId);
      if (!existing) return { success: false, error: 'Dépense non trouvée' };
      const validation = validateExpense(data);
      if (!validation.valid) return { success: false, error: validation.errors.join(', ') };
      const expenseData = validation.data;
      const dateDepense = expenseData.date_depense || new Date().toISOString().split('T')[0];
      const cols = getStmtGetById(db).columns ? Object.keys(getStmtGetById(db).columns) : [];
      const setFields = ['categorie = ?', 'description = ?', 'montant = ?', 'date_depense = ?'];
      const params = [expenseData.categorie, expenseData.description, expenseData.montant, dateDepense];
      if (cols.includes('mode_paiement')) { setFields.push('mode_paiement = ?'); params.push(expenseData.mode_paiement); }
      if (cols.includes('reference')) { setFields.push('reference = ?'); params.push(expenseData.reference); }
      if (cols.includes('observation')) { setFields.push('observation = ?'); params.push(expenseData.observation); }
      if (cols.includes('fournisseur_id')) { setFields.push('fournisseur_id = ?'); params.push(expenseData.fournisseur_id); }
      if (cols.includes('fournisseur_nom')) { setFields.push('fournisseur_nom = ?'); params.push(expenseData.fournisseur_nom); }
      setFields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(expenseId);
      const updateStmt = getStmtUpdateExpense(db, setFields);
      updateStmt.run(...params);
      if (userId) logAudit('update', expenseId, expenseData.categorie, expenseData.montant, userId, `Ancien: ${existing.categorie} - ${existing.montant} Ar`);
      if (emitFinancialChanged) emitFinancialChanged({ type: 'expense_updated', id: expenseId, montant: expenseData.montant });
      return { success: true, data: { id: expenseId, ...expenseData, date_depense: dateDepense } };
    } catch (err) { error('❌ [expenses:update]', err.message); return { success: false, error: err.message }; }
  }));

  // ═══════════════════════════════════════════════════════════
  // ⭐ DELETE
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('expenses:delete', withDbCheck((db, event, id, userId = null) => {
    try {
      const expenseId = Number(id);
      if (!expenseId || expenseId <= 0) return { success: false, error: 'ID invalide' };
      const existing = getStmtGetById(db).get(expenseId);
      if (!existing) return { success: false, error: 'Dépense non trouvée' };
      if (userId) logAudit('delete', expenseId, existing.categorie, existing.montant, userId);
      getStmtDeleteById(db).run(expenseId);
      if (emitFinancialChanged) emitFinancialChanged({ type: 'expense_deleted', id: expenseId, montant: existing.montant });
      return { success: true, data: { id: expenseId, categorie: existing.categorie, montant: existing.montant } };
    } catch (err) { error('❌ [expenses:delete]', err.message); return { success: false, error: err.message }; }
  }));

  // ═══════════════════════════════════════════════════════════
  // ⭐ GET BY PERIOD / CATEGORY / MODE
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('expenses:get-by-period', withDbCheck((db, event, startDate, endDate) => {
    try { const data = getStmtGetByPeriod(db).all(startDate, endDate); return { success: true, data }; }
    catch (err) { error('❌ [expenses:get-by-period]', err.message); return { success: false, error: err.message }; }
  }));

  ipcMain.handle('expenses:get-by-category', withDbCheck((db, event, categorie) => {
    try { const data = getStmtGetByCategory(db).all(categorie); return { success: true, data }; }
    catch (err) { error('❌ [expenses:get-by-category]', err.message); return { success: false, error: err.message }; }
  }));

  ipcMain.handle('expenses:get-by-mode', withDbCheck((db, event, mode) => {
    try { const data = getStmtGetByMode(db).all(mode); return { success: true, data }; }
    catch (err) { error('❌ [expenses:get-by-mode]', err.message); return { success: false, error: err.message }; }
  }));

  // ═══════════════════════════════════════════════════════════
  // ⭐ GET SUMMARY
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('expenses:get-summary', withDbCheck((db, event, startDate, endDate) => {
    try {
      let summary, topCategories;
      if (startDate && endDate) {
        summary = getStmtGetSummaryWithDates(db).get(startDate, endDate);
        topCategories = getStmtGetTopCategoriesWithDates(db).all(startDate, endDate);
      } else {
        summary = getStmtGetSummary(db).get();
        topCategories = getStmtGetTopCategories(db).all();
      }
      return {
        success: true,
        data: {
          summary: {
            total: summary?.total_count || 0,
            totalAmount: summary?.total_amount || 0,
            average: summary?.average_amount || 0,
            max: summary?.max_amount || 0,
            min: summary?.min_amount || 0,
            categories: summary?.categories_count || 0,
          },
          topCategories: topCategories || [],
        },
      };
    } catch (err) { error('❌ [expenses:get-summary]', err.message); return { success: false, error: err.message }; }
  }));

  // ═══════════════════════════════════════════════════════════
  // ⭐⭐⭐ GET STATS — misy TOP CATEGORIES ⭐⭐⭐
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('expenses:get-stats', withDbCheck((db, event) => {
    try {
      // Stats globales
      const rawStats = getStmtGetStats(db).get() || {};

      // ⭐ Top 3 catégories (avy amin'ny DB GLOBAL, fa tsy pejy)
      const rawTopCategories = getStmtGetTopCategories(db).all() || [];
      const topCategories = rawTopCategories.slice(0, 3).map(row => ({
        categorie: row.categorie,
        count: Number(row.count || 0),
        total: Number(row.total || 0),
      }));

      // ⭐ Map ho an'ny client
      const stats = {
        // Client deja andrasana (aliases)
        total: Number(rawStats.total || 0),
        nb: Number(rawStats.nb || 0),
        moyenne: Number(rawStats.moyenne || 0),
        plusGrande: Number(rawStats.plusGrande || 0),
        plusPetite: Number(rawStats.plusPetite || 0),
        nbFournisseurs: Number(rawStats.nbFournisseurs || 0),
        mois_en_cours: Number(rawStats.mois_en_cours || 0),
        mois_dernier: Number(rawStats.mois_dernier || 0),
        // ⭐ Top catégories global (ho an'ny footer)
        topCategories,
        // Aliases snake_case (compatibilité)
        total_montant: Number(rawStats.total || 0),
        total_nb: Number(rawStats.nb || 0),
        total_moyenne: Number(rawStats.moyenne || 0),
        nb_fournisseurs: Number(rawStats.nbFournisseurs || 0),
        top_categories: topCategories,
      };

      return { success: true, data: stats };
    } catch (err) {
      error('❌ [expenses:get-stats]', err.message);
      return { success: false, error: err.message };
    }
  }));

  // ═══════════════════════════════════════════════════════════
  // ⭐ BULK DELETE
  // ═══════════════════════════════════════════════════════════
  ipcMain.handle('expenses:bulk-delete', withDbCheck((db, event, ids, userId = null) => {
    try {
      if (!Array.isArray(ids) || ids.length === 0) return { success: false, error: "Liste d'IDs invalide" };
      const safeIds = ids.slice(0, 50);
      const transaction = db.transaction(() => {
        const getStmt = getStmtGetByIdForBulk(db);
        const deleteStmt = getStmtDeleteById(db);
        for (const id of safeIds) {
          const existing = getStmt.get(id);
          if (!existing) continue;
          if (userId) logAudit('bulk_delete', id, existing.categorie, existing.montant, userId);
          deleteStmt.run(id);
        }
      });
      transaction();
      if (emitFinancialChanged) emitFinancialChanged({ type: 'expenses_bulk_deleted', count: safeIds.length });
      return { success: true, deleted: safeIds.length };
    } catch (err) { error('❌ [expenses:bulk-delete]', err.message); return { success: false, error: err.message }; }
  }));

  log('✅ [expenses.handlers] Tous les handlers enregistrés');
  return true;
}

module.exports = { registerExpensesHandlers };