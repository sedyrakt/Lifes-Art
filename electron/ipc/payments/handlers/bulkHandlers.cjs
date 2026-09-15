// electron/ipc/payments/handlers/bulkHandlers.cjs
'use strict';

const {
  withLiveDb,
  columnExists,
  normalizeMoney,
  normalizeDate,
  normalizeMode,
  safeHandle,
} = require('../helpers.cjs');
const { logAudit } = require('../audit.cjs');
const { readPayrollParameters } = require('../payrollParameters.cjs');
const { calculatePayroll, getAbsencesData } = require('../calculations.cjs');

function registerBulkHandlers(ipcMain) {
  console.log('[PAYMENTS] 🔧 registerBulkHandlers');

  safeHandle(ipcMain, 'payments:bulk-create', async (_event, data = {}) => {
    return withLiveDb((db) => {
      const mois = Number(data.mois);
      const annee = Number(data.annee);
      const employeeIds = Array.isArray(data.employe_ids)
        ? data.employe_ids
        : Array.isArray(data.ids)
          ? data.ids
          : [];

      if (employeeIds.length === 0) {
        return { success: true, created: 0, skipped: 0, items: [] };
      }

      const parameters = readPayrollParameters(db);

      const checkExisting = db.prepare(`SELECT id FROM paiements_employes WHERE employe_id = ? AND mois = ? AND annee = ? ORDER BY id DESC LIMIT 1`);
      const getEmployee = db.prepare(`SELECT id, salaire_base, salaire FROM employes WHERE id = ? LIMIT 1`);

      const created = [];
      const skipped = [];

      const transaction = db.transaction(() => {
        for (const rawId of employeeIds) {
          const employeeId = Number(rawId);
          if (!employeeId) continue;

          const existing = checkExisting.get(employeeId, mois, annee);
          if (existing) { skipped.push(employeeId); continue; }

          const employee = getEmployee.get(employeeId);
          if (!employee) { skipped.push(employeeId); continue; }

          const presence = getAbsencesData(db, employeeId, mois, annee);
          const salaire = normalizeMoney(employee.salaire_base ?? employee.salaire ?? 0);

          const calculation = calculatePayroll({
            salaire_brut: salaire,
            absences_count: presence.jours_absences,
            retards: presence.retards,
            heures_sup: presence.heures_sup,
            avance: 0,
          }, parameters);

          const date = normalizeDate(data.date_paiement);

          const columns = [
            'employe_id', 'mois', 'annee', 'montant', 'mode_paiement',
            'statut', 'date_paiement',
          ];
          const values = [
            employeeId, mois, annee, calculation.net,
            normalizeMode(data.mode_paiement),
            calculation.net > 0 ? 'Payé' : 'Non payé',
            date,
          ];

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
            ['retards', Number(presence.retards || 0)],
            ['autres_retenues', calculation.autres_retenues],
            ['net_imposable', calculation.net_imposable],
            ['cnaps_actif', calculation.cnaps_actif ? 1 : 0],
            ['ostie_actif', calculation.ostie_actif ? 1 : 0],
            ['irsa_actif', calculation.irsa_actif ? 1 : 0],
            ['cnaps_taux', calculation.cnaps_taux],
            ['ostie_taux', calculation.ostie_taux],
            ['payroll_parameters_snapshot', JSON.stringify(parameters)],
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

          created.push({ id, employe_id: employeeId, montant: calculation.net });
        }
      });

      transaction();

      logAudit(db, 'BULK_CREATE', 'paiements_employes', null, { mois, annee, created: created.length, skipped: skipped.length });

      return { success: true, created: created.length, skipped: skipped.length, items: created, skipped_ids: skipped };
    });
  });

  safeHandle(ipcMain, 'payments:get-absences-count', async (_event, employeId, mois, annee) => {
    return withLiveDb((db) => getAbsencesData(db, Number(employeId), Number(mois), Number(annee)));
  });
}

module.exports = { registerBulkHandlers };