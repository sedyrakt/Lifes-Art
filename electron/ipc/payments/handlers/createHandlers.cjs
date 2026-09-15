// electron/ipc/payments/handlers/createHandlers.cjs
'use strict';

const {
  withLiveDb,
  columnExists,
  normalizeMoney,
  normalizeDate,
  normalizeMode,
  normalizeStatusForWrite,
  safeHandle,
} = require('../helpers.cjs');
const { logAudit } = require('../audit.cjs');
const { readPayrollParameters } = require('../payrollParameters.cjs');
const { calculatePayroll, getAbsencesData } = require('../calculations.cjs');
const { getPaymentById, assertNoDuplicatePayment } = require('../crud.cjs');

function registerCreateHandlers(ipcMain) {
  console.log('[PAYMENTS] 🔧 registerCreateHandlers');

  safeHandle(ipcMain, 'payments:create', async (_event, data = {}) => {
    return withLiveDb((db) => {
      if (!data.employe_id) throw new Error('Employé obligatoire.');

      const employeId = Number(data.employe_id);
      const mois = Number(data.mois);
      const annee = Number(data.annee);

      if (mois < 1 || mois > 12) throw new Error('Mois invalide.');
      if (!Number.isInteger(annee) || annee < 2000) throw new Error('Année invalide.');

      assertNoDuplicatePayment(db, employeId, mois, annee, null);

      const parameters = readPayrollParameters(db);
      const presence = getAbsencesData(db, employeId, mois, annee);

      const mergedInput = {
        ...data,
        absences_count: data.absences_count != null ? data.absences_count : presence.jours_absences,
        retards: data.retards != null ? data.retards : presence.retards,
        heures_sup: data.heures_sup != null ? data.heures_sup : presence.heures_sup,
      };

      const calculation = calculatePayroll(mergedInput, parameters);
      const montant = data.montant != null ? normalizeMoney(data.montant) : calculation.net;
      const statut = normalizeStatusForWrite(data.statut, montant);
      const mode = normalizeMode(data.mode_paiement);
      const datePaiement = normalizeDate(data.date_paiement);

      const columns = [
        'employe_id', 'mois', 'annee', 'montant', 'mode_paiement', 'statut',
        'reference', 'observation', 'date_paiement',
      ];
      const values = [
        employeId, mois, annee, montant, mode, statut,
        data.reference || null, data.observation || null, datePaiement,
      ];

      // ─── Colonnes optionnelles (vérifiées une par une) ───
      const optionalColumns = [
        ['salaire_base', calculation.salaire_base],
        ['salaire_brut', calculation.salaire_brut],
        ['heures_sup', calculation.heures_sup],
        ['heures_sup_montant', calculation.heures_sup_montant],
        ['hs_montant', calculation.heures_sup_montant],
        ['prime_anciennete', calculation.prime_anciennete],
        ['prime_logement', calculation.prime_logement],
        ['prime_cherte_vie', calculation.prime_cherte_vie],
        ['indemnite_transport', calculation.indemnite_transport],
        ['autres_primes', calculation.autres_primes],
        ['cnaps', calculation.cnaps],
        ['ostie', calculation.ostie],
        ['irsa', calculation.irsa],
        ['avance', calculation.avance],
        ['absences_deduction', calculation.absences_deduction],
        ['absences_count', calculation.absences_count],
        ['retards', Number(mergedInput.retards || 0)],
        ['autres_retenues', calculation.autres_retenues],
        ['net_imposable', calculation.net_imposable],
        ['cnaps_actif', calculation.cnaps_actif ? 1 : 0],
        ['ostie_actif', calculation.ostie_actif ? 1 : 0],
        ['irsa_actif', calculation.irsa_actif ? 1 : 0],
        ['cnaps_taux', calculation.cnaps_taux],
        ['ostie_taux', calculation.ostie_taux],
        ['payroll_parameters_snapshot', JSON.stringify({
          ...parameters,
          cnaps_actif: calculation.cnaps_actif,
          ostie_actif: calculation.ostie_actif,
          irsa_actif: calculation.irsa_actif,
          cnaps_taux: calculation.cnaps_taux,
          ostie_taux: calculation.ostie_taux,
        })],
      ];

      for (const [name, value] of optionalColumns) {
        if (columnExists(db, 'paiements_employes', name)) {
          columns.push(name);
          values.push(value);
        }
      }

      const placeholders = columns.map(() => '?').join(', ');
      const result = db.prepare(`INSERT INTO paiements_employes (${columns.join(', ')}) VALUES (${placeholders})`).run(...values);
      const id = Number(result.lastInsertRowid);

      logAudit(db, 'CREATE', 'paiements_employes', id, { employe_id: employeId, mois, annee, montant, statut, calculation });

      return getPaymentById(db, id);
    });
  });

  safeHandle(ipcMain, 'payments:update', async (_event, id, data = {}) => {
    return withLiveDb((db) => {
      const paymentId = Number(id);
      const existing = getPaymentById(db, paymentId);
      if (!existing) throw new Error('Paiement introuvable.');

      const employeId = Number(data.employe_id ?? existing.employe_id);
      const mois = Number(data.mois ?? existing.mois);
      const annee = Number(data.annee ?? existing.annee);

      assertNoDuplicatePayment(db, employeId, mois, annee, paymentId);

      const parameters = readPayrollParameters(db);
      const presence = getAbsencesData(db, employeId, mois, annee);

      const mergedInput = {
        ...existing,
        ...data,
        employe_id: employeId,
        mois,
        annee,
        absences_count: data.absences_count != null ? data.absences_count : (existing.absences_count ?? presence.jours_absences),
        retards: data.retards != null ? data.retards : (existing.retards ?? presence.retards),
        heures_sup: data.heures_sup != null ? data.heures_sup : (existing.heures_sup ?? presence.heures_sup),
      };

      const calculation = calculatePayroll(mergedInput, parameters);
      const montant = data.montant != null ? normalizeMoney(data.montant) : normalizeMoney(existing.montant);
      const statut = normalizeStatusForWrite(data.statut ?? existing.statut, montant);
      const mode = normalizeMode(data.mode_paiement ?? existing.mode_paiement);
      const datePaiement = normalizeDate(data.date_paiement ?? existing.date_paiement);

      const updates = [
        'employe_id = ?', 'mois = ?', 'annee = ?', 'montant = ?',
        'mode_paiement = ?', 'statut = ?', 'reference = ?', 'observation = ?',
        'date_paiement = ?',
      ];
      const values = [
        employeId, mois, annee, montant, mode, statut,
        data.reference !== undefined ? data.reference || null : existing.reference || null,
        data.observation !== undefined ? data.observation || null : existing.observation || null,
        datePaiement,
      ];

      const optionalUpdates = [
        ['salaire_base', calculation.salaire_base],
        ['salaire_brut', calculation.salaire_brut],
        ['heures_sup', calculation.heures_sup],
        ['heures_sup_montant', calculation.heures_sup_montant],
        ['hs_montant', calculation.heures_sup_montant],
        ['prime_anciennete', calculation.prime_anciennete],
        ['prime_logement', calculation.prime_logement],
        ['prime_cherte_vie', calculation.prime_cherte_vie],
        ['indemnite_transport', calculation.indemnite_transport],
        ['autres_primes', calculation.autres_primes],
        ['cnaps', calculation.cnaps],
        ['ostie', calculation.ostie],
        ['irsa', calculation.irsa],
        ['avance', calculation.avance],
        ['absences_deduction', calculation.absences_deduction],
        ['absences_count', calculation.absences_count],
        ['retards', Number(mergedInput.retards || 0)],
        ['autres_retenues', calculation.autres_retenues],
        ['net_imposable', calculation.net_imposable],
        ['cnaps_actif', calculation.cnaps_actif ? 1 : 0],
        ['ostie_actif', calculation.ostie_actif ? 1 : 0],
        ['irsa_actif', calculation.irsa_actif ? 1 : 0],
        ['cnaps_taux', calculation.cnaps_taux],
        ['ostie_taux', calculation.ostie_taux],
        ['payroll_parameters_snapshot', JSON.stringify({
          ...parameters,
          cnaps_actif: calculation.cnaps_actif,
          ostie_actif: calculation.ostie_actif,
          irsa_actif: calculation.irsa_actif,
          cnaps_taux: calculation.cnaps_taux,
          ostie_taux: calculation.ostie_taux,
        })],
      ];

      for (const [name, value] of optionalUpdates) {
        if (columnExists(db, 'paiements_employes', name)) {
          updates.push(`${name} = ?`);
          values.push(value);
        }
      }

      values.push(paymentId);
      const before = getPaymentById(db, paymentId);
      db.prepare(`UPDATE paiements_employes SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      const after = getPaymentById(db, paymentId);

      logAudit(db, 'UPDATE', 'paiements_employes', paymentId, { before, after, calculation });

      return after;
    });
  });

  safeHandle(ipcMain, 'payments:delete', async (_event, id) => {
    return withLiveDb((db) => {
      const paymentId = Number(id);
      const existing = getPaymentById(db, paymentId);
      if (!existing) throw new Error('Paiement introuvable.');

      db.prepare(`DELETE FROM paiements_employes WHERE id = ?`).run(paymentId);

      logAudit(db, 'DELETE', 'paiements_employes', paymentId, { payment: existing });

      return { success: true, id: paymentId };
    });
  });
}

module.exports = { registerCreateHandlers };