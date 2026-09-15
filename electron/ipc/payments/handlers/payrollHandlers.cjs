// electron/ipc/payments/handlers/payrollHandlers.cjs
'use strict';

const { withLiveDb, safeHandle } = require('../helpers.cjs');
const { logAudit } = require('../audit.cjs');
const { readPayrollParameters, savePayrollParameters } = require('../payrollParameters.cjs');

function registerPayrollHandlers(ipcMain) {
  safeHandle(ipcMain, 'payments:get-payroll-parameters', async () => {
    return withLiveDb((db) => readPayrollParameters(db));
  });

  safeHandle(ipcMain, 'payments:save-payroll-parameters', async (_event, data = {}) => {
    return withLiveDb((db) => {
      const result = savePayrollParameters(db, data);
      logAudit(db, 'UPDATE', 'parametres_paie', null, result);
      return result;
    });
  });
}

module.exports = { registerPayrollHandlers };