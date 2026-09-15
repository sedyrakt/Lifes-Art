'use strict';
// ============================================================
// electron/ipc/stock-snapshots.cjs
// LIFE'S ART ERP — IPC Handlers pour les snapshots de stock
// ⭐ Expose les snapshots au renderer (debug, admin, analytics)
// ============================================================

const { getDb } = require('../database/connection.cjs');
const { log, error } = require('../database/utils.cjs');
const {
  saveTodaySnapshot,
  getSnapshotAtDate,
  getSnapshotsInRange,
  getSnapshotSeries,
  computeCurrentSnapshot,
  computeRotationRate,
  backfillSnapshots,
  pruneOldSnapshots,
} = require('../database/stockSnapshots.cjs');

function withLiveDb(fn) {
  return (...args) => {
    try {
      const db = getDb();
      if (!db || !db.open) {
        return { success: false, error: 'Database connection is not open' };
      }
      return fn(db, ...args);
    } catch (err) {
      error('❌ [stock-snapshots] withLiveDb:', err);
      return { success: false, error: err?.message || 'Stock snapshots error' };
    }
  };
}

function registerStockSnapshotsHandlers(ipcMain) {
  if (!ipcMain) { error('❌ [stock-snapshots] ipcMain null'); return false; }

  const channels = [
    'stock-snapshots:save-today',
    'stock-snapshots:get-at-date',
    'stock-snapshots:get-range',
    'stock-snapshots:get-series',
    'stock-snapshots:current',
    'stock-snapshots:rotation',
    'stock-snapshots:backfill',
    'stock-snapshots:prune',
  ];
  for (const ch of channels) { try { ipcMain.removeHandler(ch); } catch (_) {} }

  // ⭐ Save today snapshot (manual)
  ipcMain.handle('stock-snapshots:save-today', withLiveDb((_db) => {
    const ok = saveTodaySnapshot();
    return { success: ok };
  }));

  // ⭐ Get snapshot at (or before) a date
  ipcMain.handle('stock-snapshots:get-at-date', withLiveDb((db, _event, dateStr) => {
    const snapshot = getSnapshotAtDate(db, dateStr);
    return { success: true, data: snapshot };
  }));

  // ⭐ Get snapshots in range
  ipcMain.handle('stock-snapshots:get-range', withLiveDb((db, _event, options = {}) => {
    const { startDate, endDate } = options;
    const data = getSnapshotsInRange(db, startDate, endDate);
    return { success: true, data };
  }));

  // ⭐ Get series (sparklines)
  ipcMain.handle('stock-snapshots:get-series', withLiveDb((db, _event, options = {}) => {
    const { startDate, endDate, points = 12 } = options;
    const data = getSnapshotSeries(db, { startDate, endDate, points });
    return { success: true, data };
  }));

  // ⭐ Current snapshot (live)
  ipcMain.handle('stock-snapshots:current', withLiveDb((db) => {
    const data = computeCurrentSnapshot(db);
    return { success: true, data };
  }));

  // ⭐ Current rotation
  ipcMain.handle('stock-snapshots:rotation', withLiveDb((db, _event, days = 30) => {
    const value = computeRotationRate(db, days);
    return { success: true, data: { rotationRate: value } };
  }));

  // ⭐ Backfill
  ipcMain.handle('stock-snapshots:backfill', withLiveDb((_db, _event, options = {}) => {
    const { fromDate, toDate } = options;
    if (!fromDate || !toDate) return { success: false, error: 'fromDate et toDate requis' };
    const inserted = backfillSnapshots(fromDate, toDate);
    return { success: true, data: { inserted } };
  }));

  // ⭐ Prune
  ipcMain.handle('stock-snapshots:prune', withLiveDb((_db, _event, daysToKeep = 730) => {
    const removed = pruneOldSnapshots(daysToKeep);
    return { success: true, data: { removed } };
  }));

  log('✅ [stock-snapshots] IPC handlers enregistrés');
  return true;
}

module.exports = { registerStockSnapshotsHandlers };