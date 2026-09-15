// electron/ipc/payments/helpers.cjs
'use strict';

const { getDb } = require('../../database/connection.cjs');

function withLiveDb(callback) {
  const db = getDb();
  if (!db) throw new Error('Connexion SQLite indisponible.');
  return callback(db);
}

function normalizeMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.round(number);
}

function normalizeDecimal(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return number;
}

function normalizeBoolean(value, fallback = false) {
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  return fallback;
}

function normalizeDate(value) {
  if (!value) return null;
  const string = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(string)) return string;
  const date = new Date(string);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function nextMonthStart(month, year) {
  if (month === 12) return `${year + 1}-01-01`;
  return `${year}-${String(month + 1).padStart(2, '0')}-01`;
}

function firstDayOfMonth(month, year) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function columnExists(db, table, column) {
  try {
    const rows = db.prepare(`PRAGMA table_info(${table})`).all();
    return rows.some((row) => row.name === column);
  } catch {
    return false;
  }
}

function tableExists(db, table) {
  try {
    const row = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`).get(table);
    return !!row;
  } catch {
    return false;
  }
}

function safeJsonParse(value, fallback = null) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(String(value)); } catch { return fallback; }
}

function normalizeMode(value) {
  const { PAYMENT_MODES } = require('./constants.cjs');
  const mode = String(value || '').trim();
  return PAYMENT_MODES.includes(mode) ? mode : 'Espèces';
}

function normalizeStatusForWrite(value, montant) {
  const status = String(value || '').trim();
  if (status === 'Brouillon') return 'Brouillon';
  if (status === 'Payé' || status === 'Partiel') return montant > 0 ? 'Payé' : 'Non payé';
  if (status === 'Non payé') return 'Non payé';
  return montant > 0 ? 'Payé' : 'Non payé';
}

/**
 * ⭐ Enregistre un handler IPC de façon idempotente.
 * Empêche l'erreur "Attempted to register a second handler".
 */
function safeHandle(ipcMain, channel, handler) {
  try {
    ipcMain.removeHandler(channel);
  } catch (_) {}
  ipcMain.handle(channel, handler);
  return true;
}

module.exports = {
  withLiveDb,
  normalizeMoney,
  normalizeDecimal,
  normalizeBoolean,
  normalizeDate,
  nextMonthStart,
  firstDayOfMonth,
  columnExists,
  tableExists,
  safeJsonParse,
  normalizeMode,
  normalizeStatusForWrite,
  safeHandle,
};