'use strict';
// ============================================================
// electron/ipc/dashboard/index.cjs
// LIFE'S ART ERP — Point d'entrée du module dashboard
// ⭐ Expose registerDashboardHandlers + aliases
// ============================================================

const { registerDashboardHandlers } = require('./handlers.cjs');

module.exports = {
  // ⭐ Fonction principale
  registerDashboardHandlers,

  // ⭐ Aliases pour registerHandlerModule (main.cjs)
  register: registerDashboardHandlers,
  registerHandlers: registerDashboardHandlers,
};

console.log('📊 [dashboard/index.cjs] Module dashboard chargé');