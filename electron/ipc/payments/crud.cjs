// electron/ipc/payments/crud.cjs
'use strict';

const { MONTH_NAMES } = require('./constants.cjs');
const { tableExists, normalizeMoney } = require('./helpers.cjs');

function getEmployeeName(db, employeId) {
  try {
    if (!tableExists(db, 'employes')) return '';
    const employee = db.prepare(`SELECT nom, prenom FROM employes WHERE id = ? LIMIT 1`).get(employeId);
    if (!employee) return '';
    return `${employee.prenom || ''} ${employee.nom || ''}`.trim();
  } catch {
    return '';
  }
}

function getPaymentById(db, id) {
  const row = db.prepare(`
    SELECT
      p.*,
      e.nom AS employe_nom,
      e.prenom AS employe_prenom,
      e.poste AS employe_poste,
      COALESCE(e.salaire_base, e.salaire, 0) AS salaire_base
    FROM paiements_employes p
    LEFT JOIN employes e ON e.id = p.employe_id
    WHERE p.id = ?
    LIMIT 1
  `).get(id);
  return row || null;
}

function assertNoDuplicatePayment(db, employeId, mois, annee, excludeId = null) {
  const params = [employeId, mois, annee];
  let sql = `
    SELECT id, montant, statut
    FROM paiements_employes
    WHERE employe_id = ? AND mois = ? AND annee = ?
  `;
  if (excludeId != null) {
    sql += ' AND id != ?';
    params.push(Number(excludeId));
  }
  sql += ' ORDER BY id DESC LIMIT 1';

  const existing = db.prepare(sql).get(...params);
  if (!existing) return;

  const employeeName = getEmployeeName(db, employeId);
  const monthLabel = MONTH_NAMES[Math.min(12, Math.max(1, Number(mois))) - 1] || String(mois);

  const payload = {
    code: 'PAYMENT_ALREADY_EXISTS',
    message: `Un paiement existe déjà pour ${employeeName || 'cet employé'} — ${monthLabel} ${annee}.`,
    details: {
      employe_id: employeId,
      employe_nom: employeeName,
      mois: Number(mois),
      annee: Number(annee),
      mois_label: monthLabel,
      existing_id: Number(existing.id),
      existing_montant: normalizeMoney(existing.montant),
      existing_statut: existing.statut,
    },
  };

  throw new Error(JSON.stringify(payload));
}

module.exports = {
  getEmployeeName,
  getPaymentById,
  assertNoDuplicatePayment,
};