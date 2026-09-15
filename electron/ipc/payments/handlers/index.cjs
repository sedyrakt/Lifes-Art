// electron/ipc/payments/handlers/index.cjs
'use strict';

const { registerPayrollHandlers } = require('./payrollHandlers.cjs');
const { registerGetAllHandlers } = require('./getAllHandlers.cjs');
const { registerCreateHandlers } = require('./createHandlers.cjs');
const { registerQueryHandlers } = require('./queryHandlers.cjs');
const { registerStatsHandlers } = require('./statsHandlers.cjs');
const { registerBulkHandlers } = require('./bulkHandlers.cjs');
const { registerBatchHandlers } = require('./batchHandlers.cjs');

let alreadyRegistered = false;

function registerAllHandlers(ipcMain) {
  if (alreadyRegistered) {
    console.log('[PAYMENTS] ⚠️ registerAllHandlers: déjà enregistré, skip');
    return true;
  }

  console.log('[PAYMENTS] 📦 registerAllHandlers: début');

  const steps = [
    ['payrollHandlers', registerPayrollHandlers],
    ['getAllHandlers', registerGetAllHandlers],
    ['createHandlers', registerCreateHandlers],
    ['queryHandlers', registerQueryHandlers],
    ['statsHandlers', registerStatsHandlers],
    ['bulkHandlers', registerBulkHandlers],
    ['batchHandlers', registerBatchHandlers],
  ];

  for (const [label, fn] of steps) {
    try {
      fn(ipcMain);
      console.log(`[PAYMENTS] ✅ ${label}`);
    } catch (err) {
      console.error(`[PAYMENTS] ❌ ${label} a échoué:`, err.message, err.stack);
    }
  }

  alreadyRegistered = true;
  console.log('[PAYMENTS] ✅ registerAllHandlers: terminé');
  return true;
}

module.exports = { registerAllHandlers };