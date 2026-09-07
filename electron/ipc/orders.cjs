// ============================================================
// electron/ipc/orders.cjs - Module principal
// ============================================================

'use strict';

const { registerOrdersHandlers } = require('./orders/handlers.cjs');
const { VALID_PAIEMENT_STATUSES, normalizePaiement } = require('./orders/validation.cjs');

module.exports = {
  registerOrdersHandlers,
  VALID_PAIEMENT_STATUSES,
  normalizePaiement,
};

console.log('📦 [orders.cjs] Module principal chargé (version modulaire)');