// ============================================================
// electron/ipc/orders/index.cjs - Entry point
// ⭐ FIX: ESRINA NY TSY IL AINA
// ============================================================

'use strict';

const { registerOrdersHandlers } = require('./handlers.cjs');
const { VALID_PAIEMENT_STATUSES, normalizePaiement } = require('./validation.cjs');

module.exports = {
  registerOrdersHandlers,
  VALID_PAIEMENT_STATUSES,
  normalizePaiement,
};