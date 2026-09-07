// electron/ipc/ventes.cjs
'use strict';

const { registerVentesHandlers } = require('./ventes/handlers.cjs');

function register(ipcMain) {
  const result = registerVentesHandlers(ipcMain);
  return result;
}

module.exports = { register };