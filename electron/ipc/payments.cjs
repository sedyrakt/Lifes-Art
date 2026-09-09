'use strict';
const { getDb } = require('../database/connection.cjs');
const DEBUG = false;
function log(...args) { if (DEBUG) console.log('[📦 payments]', ...args); }
function error(...args) { console.error('[❌ payments]', ...args); }

function withLiveDb(fn) {
  return (event, ...args) => {
    try {
      const db = getDb();
      if (!db || !db.open) return { success: false, error: 'Database connection is not open' };
      return fn(db, ...args);
    } catch (err) {
      error('Unhandled IPC error:', err.message);
      return { success: false, error: err.message, data: [] };
    }
  };
}

function toInt(value, fallback = 0) { const n = Number.parseInt(value, 10); return Number.isFinite(n) ? n : fallback; }
function toNumber(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function normalizeMoney(value) { return Math.round(toNumber(value, 0) * 100) / 100; }
function normalizeMonth(value) { const month = toInt(value); return (month < 1 || month > 12) ? 0 : month; }
function normalizeYear(value) { const year = toInt(value); return (year < 2000 || year > 2100) ? 0 : year; }

function getTodayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
function normalizeDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  const raw = String(value).trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
    if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const frMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (frMatch) {
    const day = Number(frMatch[1]), month = Number(frMatch[2]), year = Number(frMatch[3]);
    if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return null;
}
function getDefaultPaymentDate() { return getTodayISO(); }

function columnExists(db, tableName, columnName) {
  try { const stmt = db.prepare(`PRAGMA table_info("${tableName}")`); return stmt.all().some(column => column.name === columnName); }
  catch (err) { return false; }
}

function logAudit(db, action, paymentId, employeName, userId, details = '') {
  try {
    const stmt = db.prepare(`INSERT INTO audit_logs (action, entity, entity_id, entity_name, user_id, details, created_at) VALUES (?, 'paiement', ?, ?, ?, ?, datetime('now'))`);
    stmt.run(action, paymentId, employeName || `Paiement #${paymentId}`, userId || null, details || '');
  } catch (err) { if (DEBUG) console.warn('[payments] Audit non enregistré:', err.message); }
}

function getEmployeeName(db, employeId) {
  try {
    const employee = db.prepare('SELECT id, prenom, nom FROM employes WHERE id = ? LIMIT 1').get(employeId);
    if (!employee) return `Employé #${employeId}`;
    return `${employee.prenom || ''} ${employee.nom || ''}`.trim() || `Employé #${employeId}`;
  } catch (_) { return `Employé #${employeId}`; }
}

function calculatePayroll(brut) {
  const salaireBrut = Math.max(0, normalizeMoney(brut));
  const cnaps = Math.round(salaireBrut * 0.01);
  const ostie = Math.round(salaireBrut * 0.05);
  const taxable = Math.max(0, salaireBrut - cnaps - ostie);
  let irsa = 0;
  if (taxable > 350000 && taxable <= 700000) irsa = Math.round((taxable - 350000) * 0.05);
  else if (taxable > 700000 && taxable <= 1400000) irsa = Math.round((taxable - 700000) * 0.10 + 17500);
  else if (taxable > 1400000 && taxable <= 3000000) irsa = Math.round((taxable - 1400000) * 0.15 + 87500);
  else if (taxable > 3000000) irsa = Math.round((taxable - 3000000) * 0.20 + 327500);
  const net = Math.max(0, salaireBrut - cnaps - ostie - irsa);
  return { salaire_brut: salaireBrut, cnaps, ostie, irsa, montant: net };
}

function normalizeStatus(value) {
  const allowed = ['Brouillon', 'Validé', 'Payé', 'Partiel', 'Non payé'];
  const status = String(value || '').trim();
  return allowed.includes(status) ? status : 'Payé';
}
function normalizeMode(value) {
  const allowed = ['Espèces', 'Virement', 'Chèque', 'Mobile Money'];
  const mode = String(value || '').trim();
  return allowed.includes(mode) ? mode : 'Espèces';
}

function getPaymentById(db, paymentId) {
  return db.prepare(`
    SELECT p.*, e.nom AS employe_nom, e.prenom AS employe_prenom, e.poste AS employe_poste, e.departement AS employe_departement, e.salaire AS salaire_base, e.email AS employe_email, e.telephone AS employe_telephone
    FROM paiements_employes p
    LEFT JOIN employes e ON p.employe_id = e.id
    WHERE p.id = ? LIMIT 1
  `).get(paymentId);
}

const registerPaymentsHandlers = (ipcMain) => {
  const channels = [
    'payments:get-all', 'payments:get-by-id', 'payments:create', 'payments:update', 'payments:delete',
    'payments:get-by-employe', 'payments:get-by-period', 'payments:get-historique', 'payments:get-salaire-mensuel',
    'payments:get-stats', 'payments:count-by-employe', 'payments:get-employe-stats', 'payments:bulk-create',
    'payments:get-absences-count'
  ];
  for (const channel of channels) { try { ipcMain.removeHandler(channel); } catch (_) {} }

  ipcMain.handle('payments:get-all', withLiveDb((db, options = {}) => {
    try {
      const search = String(options.search || '').trim();
      const employeId = toInt(options.employeId, 0);
      const mois = normalizeMonth(options.mois);
      const annee = normalizeYear(options.annee);
      const page = Math.max(1, toInt(options.page, 1));
      const requestedLimit = toInt(options.limit, 10);
      const limit = Math.min(Math.max(requestedLimit, 1), 10000);
      const offset = (page - 1) * limit;
      let where = `FROM paiements_employes p LEFT JOIN employes e ON p.employe_id = e.id WHERE 1 = 1`;
      const params = [];
      if (search) {
        where += ` AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.email LIKE ? OR p.reference LIKE ? OR p.observation LIKE ?)`;
        const term = `%${search}%`;
        params.push(term, term, term, term, term);
      }
      if (employeId > 0) { where += ' AND p.employe_id = ?'; params.push(employeId); }
      if (mois > 0) { where += ' AND p.mois = ?'; params.push(mois); }
      if (annee > 0) { where += ' AND p.annee = ?'; params.push(annee); }
      const totalRow = db.prepare(`SELECT COUNT(*) AS total ${where}`).get(...params);
      const total = Number(totalRow?.total || 0);
      const query = `SELECT p.*, e.nom AS employe_nom, e.prenom AS employe_prenom, e.poste AS employe_poste, e.departement AS employe_departement, e.salaire AS salaire_base, e.email AS employe_email, e.telephone AS employe_telephone ${where} ORDER BY CASE WHEN p.date_paiement IS NULL THEN 1 ELSE 0 END ASC, date(p.date_paiement) DESC, p.id DESC LIMIT ? OFFSET ?`;
      const data = db.prepare(query).all(...params, limit, offset);
      return { success: true, data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
    } catch (err) { return { success: false, error: err.message, data: [], total: 0 }; }
  }));

  ipcMain.handle('payments:get-by-id', withLiveDb((db, id) => {
    try {
      const paymentId = toInt(id);
      if (!paymentId) return { success: false, error: 'ID invalide', data: null };
      const data = getPaymentById(db, paymentId);
      return { success: true, data };
    } catch (err) { return { success: false, error: err.message, data: null }; }
  }));

  ipcMain.handle('payments:create', withLiveDb((db, data = {}) => {
    try {
      const employeId = toInt(data.employe_id);
      const mois = normalizeMonth(data.mois);
      const annee = normalizeYear(data.annee);
      const montant = normalizeMoney(data.montant);
      if (!employeId) return { success: false, error: 'Employé requis' };
      if (!mois) return { success: false, error: 'Mois invalide' };
      if (!annee) return { success: false, error: 'Année invalide' };
      if (montant < 0) return { success: false, error: 'Montant négatif' };
      const employee = db.prepare('SELECT id, prenom, nom, salaire FROM employes WHERE id = ? LIMIT 1').get(employeId);
      if (!employee) return { success: false, error: 'Employé introuvable' };
      const paymentDate = normalizeDate(data.date_paiement) || getDefaultPaymentDate();
      const modePaiement = normalizeMode(data.mode_paiement);
      const statut = normalizeStatus(data.statut);
      const reference = String(data.reference || '').trim();
      const observation = String(data.observation || '').trim();
      const salaireBrut = normalizeMoney(data.salaire_brut);
      const cnaps = normalizeMoney(data.cnaps);
      const ostie = normalizeMoney(data.ostie);
      const irsa = normalizeMoney(data.irsa);
      const avance = normalizeMoney(data.avance);
      const absencesDeduction = normalizeMoney(data.absences_deduction); // ⭐ VAOVAO
      const stmt = db.prepare(`INSERT INTO paiements_employes (employe_id, mois, annee, montant, date_paiement, mode_paiement, statut, reference, observation, salaire_brut, cnaps, ostie, irsa, avance, absences_deduction) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      const result = stmt.run(employeId, mois, annee, montant, paymentDate, modePaiement, statut, reference, observation, salaireBrut, cnaps, ostie, irsa, avance, absencesDeduction);
      const paymentId = Number(result.lastInsertRowid);
      const employeeName = `${employee.prenom || ''} ${employee.nom || ''}`.trim();
      logAudit(db, 'create', paymentId, employeeName, null, `Montant: ${montant}, Absence: ${absencesDeduction}`);
      return { success: true, data: getPaymentById(db, paymentId) };
    } catch (err) { return { success: false, error: err.message }; }
  }));

  ipcMain.handle('payments:update', withLiveDb((db, id, data = {}) => {
    try {
      const paymentId = toInt(id);
      if (!paymentId) return { success: false, error: 'ID invalide' };
      const existing = getPaymentById(db, paymentId);
      if (!existing) return { success: false, error: 'Paiement non trouvé' };
      const employeId = toInt(data.employe_id, existing.employe_id);
      const mois = normalizeMonth(data.mois || existing.mois);
      const annee = normalizeYear(data.annee || existing.annee);
      const montant = normalizeMoney(data.montant);
      if (!employeId || !mois || !annee) return { success: false, error: 'Paramètres invalides' };
      if (montant < 0) return { success: false, error: 'Montant négatif' };
      const paymentDate = normalizeDate(data.date_paiement) || normalizeDate(existing.date_paiement) || getDefaultPaymentDate();
      const modePaiement = normalizeMode(data.mode_paiement ?? existing.mode_paiement);
      const statut = normalizeStatus(data.statut ?? existing.statut);
      const reference = String(data.reference ?? existing.reference ?? '').trim();
      const observation = String(data.observation ?? existing.observation ?? '').trim();
      const salaireBrut = normalizeMoney(data.salaire_brut ?? existing.salaire_brut);
      const cnaps = normalizeMoney(data.cnaps ?? existing.cnaps);
      const ostie = normalizeMoney(data.ostie ?? existing.ostie);
      const irsa = normalizeMoney(data.irsa ?? existing.irsa);
      const avance = normalizeMoney(data.avance ?? existing.avance);
      const absencesDeduction = normalizeMoney(data.absences_deduction ?? existing.absences_deduction); // ⭐ VAOVAO
      const stmt = db.prepare(`UPDATE paiements_employes SET employe_id = ?, mois = ?, annee = ?, montant = ?, date_paiement = ?, mode_paiement = ?, statut = ?, reference = ?, observation = ?, salaire_brut = ?, cnaps = ?, ostie = ?, irsa = ?, avance = ?, absences_deduction = ? WHERE id = ?`);
      stmt.run(employeId, mois, annee, montant, paymentDate, modePaiement, statut, reference, observation, salaireBrut, cnaps, ostie, irsa, avance, absencesDeduction, paymentId);
      const employeeName = getEmployeeName(db, employeId);
      logAudit(db, 'update', paymentId, employeeName, null, 'Mise à jour');
      return { success: true, data: getPaymentById(db, paymentId) };
    } catch (err) { return { success: false, error: err.message }; }
  }));

  ipcMain.handle('payments:delete', withLiveDb((db, id) => {
    try {
      const paymentId = toInt(id);
      if (!paymentId) return { success: false, error: 'ID invalide' };
      const existing = getPaymentById(db, paymentId);
      if (!existing) return { success: false, error: 'Paiement non trouvé' };
      db.prepare('DELETE FROM paiements_employes WHERE id = ?').run(paymentId);
      logAudit(db, 'delete', paymentId, getEmployeeName(db, existing.employe_id), null, 'Suppression');
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  }));

  ipcMain.handle('payments:get-by-employe', withLiveDb((db, employeId) => {
    try {
      const id = toInt(employeId);
      if (!id) return { success: false, error: 'Employé invalide' };
      const stmt = db.prepare(`SELECT p.*, e.nom AS employe_nom, e.prenom AS employe_prenom, e.poste AS employe_poste, e.salaire AS salaire_base FROM paiements_employes p LEFT JOIN employes e ON p.employe_id = e.id WHERE p.employe_id = ? ORDER BY date(p.date_paiement) DESC, p.id DESC`);
      return { success: true, data: stmt.all(id) };
    } catch (err) { return { success: false, error: err.message, data: [] }; }
  }));

  ipcMain.handle('payments:get-by-period', withLiveDb((db, mois, annee) => {
    try {
      const month = normalizeMonth(mois), year = normalizeYear(annee);
      if (!month || !year) return { success: false, error: 'Période invalide' };
      const stmt = db.prepare(`SELECT p.*, e.nom AS employe_nom, e.prenom AS employe_prenom, e.poste AS employe_poste FROM paiements_employes p LEFT JOIN employes e ON p.employe_id = e.id WHERE p.mois = ? AND p.annee = ? ORDER BY date(p.date_paiement) DESC`);
      return { success: true, data: stmt.all(month, year) };
    } catch (err) { return { success: false, error: err.message }; }
  }));

  ipcMain.handle('payments:get-historique', withLiveDb((db, employeId) => {
    try {
      const id = toInt(employeId);
      if (!id) return { success: false, error: 'Employé invalide' };
      const stmt = db.prepare(`SELECT p.*, e.nom AS employe_nom, e.prenom AS employe_prenom, e.poste AS employe_poste, e.salaire AS salaire_base FROM paiements_employes p LEFT JOIN employes e ON p.employe_id = e.id WHERE p.employe_id = ? ORDER BY p.annee DESC, p.mois DESC, date(p.date_paiement) DESC`);
      return { success: true, data: stmt.all(id) };
    } catch (err) { return { success: false, error: err.message }; }
  }));

  ipcMain.handle('payments:get-salaire-mensuel', withLiveDb((db, employeId, mois, annee) => {
    try {
      const id = toInt(employeId), month = normalizeMonth(mois), year = normalizeYear(annee);
      if (!id || !month || !year) return { success: false, error: 'Paramètres invalides' };
      const data = db.prepare(`SELECT COUNT(*) AS nombre_paiements, COALESCE(SUM(montant), 0) AS total_montant FROM paiements_employes WHERE employe_id = ? AND mois = ? AND annee = ?`).get(id, month, year);
      return { success: true, data };
    } catch (err) { return { success: false, error: err.message }; }
  }));

  ipcMain.handle('payments:get-stats', withLiveDb((db) => {
    try {
      const data = db.prepare(`SELECT COUNT(*) AS total_paiements, COALESCE(SUM(montant), 0) AS total_montant, COUNT(DISTINCT employe_id) AS employes FROM paiements_employes`).get();
      return { success: true, data };
    } catch (err) { return { success: false, error: err.message }; }
  }));

  ipcMain.handle('payments:count-by-employe', withLiveDb((db, employeId) => {
    try {
      const id = toInt(employeId);
      if (!id) return { success: false, error: 'Employé invalide' };
      const data = db.prepare('SELECT COUNT(*) AS count FROM paiements_employes WHERE employe_id = ?').get(id);
      return { success: true, data };
    } catch (err) { return { success: false, error: err.message }; }
  }));

  ipcMain.handle('payments:get-employe-stats', withLiveDb((db, employeId) => {
    try {
      const id = toInt(employeId);
      if (!id) return { success: false, error: 'Employé invalide' };
      const data = db.prepare(`SELECT COUNT(*) AS nombre_paiements, COALESCE(SUM(montant), 0) AS total, COALESCE(AVG(montant), 0) AS moyenne, MAX(date_paiement) AS dernier_paiement FROM paiements_employes WHERE employe_id = ?`).get(id);
      return { success: true, data };
    } catch (err) { return { success: false, error: err.message }; }
  }));

  ipcMain.handle('payments:bulk-create', withLiveDb((db, data = {}) => {
    try {
      const ids = Array.isArray(data.ids) ? data.ids.map(id => toInt(id)).filter(Boolean) : [];
      const mois = normalizeMonth(data.mois), annee = normalizeYear(data.annee);
      if (!ids.length || !mois || !annee) return { success: false, error: 'Paramètres invalides' };
      const bulkDate = normalizeDate(data.date_paiement) || getDefaultPaymentDate();
      const mode = normalizeMode(data.mode_paiement);
      const statut = normalizeStatus(data.statut);
      const insertStmt = db.prepare(`INSERT INTO paiements_employes (employe_id, mois, annee, montant, date_paiement, mode_paiement, statut, reference, observation, salaire_brut, cnaps, ostie, irsa, avance, absences_deduction) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`);
      const getEmployee = db.prepare('SELECT id, salaire FROM employes WHERE id = ? LIMIT 1');
      const checkExisting = db.prepare(`SELECT id FROM paiements_employes WHERE employe_id = ? AND mois = ? AND annee = ? LIMIT 1`);
      let created = 0, skipped = 0;
      const transaction = db.transaction(() => {
        for (const id of ids) {
          const employee = getEmployee.get(id);
          if (!employee) { skipped++; continue; }
          if (checkExisting.get(id, mois, annee)) { skipped++; continue; }
          const calc = calculatePayroll(employee.salaire);
          insertStmt.run(id, mois, annee, calc.montant, bulkDate, mode, statut, '', '', calc.salaire_brut, calc.cnaps, calc.ostie, calc.irsa, 0);
          created++;
        }
      });
      transaction();
      return { success: true, data: { created, skipped } };
    } catch (err) { return { success: false, error: err.message }; }
  }));

  // ⭐ NOVAINA: Récupère les absences + retards + HS
  ipcMain.handle('payments:get-absences-count', withLiveDb((db, employeId, mois, annee) => {
    try {
      const id = toInt(employeId), month = normalizeMonth(mois), year = normalizeYear(annee);
      if (!id || !month || !year) return { success: false, error: 'Paramètres invalides' };
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      const stmt = db.prepare(`
        SELECT 
          SUM(CASE WHEN statut = 'absent' THEN 1 ELSE 0 END) AS count,
          SUM(CASE WHEN statut = 'retard' THEN 1 ELSE 0 END) AS retards,
          COALESCE(SUM(heures_sup), 0) AS heures_sup
        FROM presence_journaliere 
        WHERE employe_id = ? AND date BETWEEN ? AND ?
      `);
      const result = stmt.get(id, startDate, endDate);
      return { success: true, data: { count: Number(result?.count || 0), retards: Number(result?.retards || 0), heures_sup: Number(result?.heures_sup || 0) } };
    } catch (err) { return { success: false, error: err.message }; }
  }));

  return true;
};

module.exports = { registerPaymentsHandlers };