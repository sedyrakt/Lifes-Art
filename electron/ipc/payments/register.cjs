// electron/ipc/payments/register.cjs
'use strict';

const { log } = require('../../database/utils.cjs');
const { registerAllHandlers } = require('./handlers/index.cjs');

function registerPaymentHandlers(ipcMain) {
  if (!ipcMain || typeof ipcMain.handle !== 'function') {
    throw new Error('ipcMain.handle indisponible.');
  }

  registerAllHandlers(ipcMain);

  log('[PAYMENTS] IPC handlers enregistrés.');
  return true;
}

module.exports = {
  registerPaymentHandlers,
  registerHandlers: registerPaymentHandlers,
  register: registerPaymentHandlers,
};