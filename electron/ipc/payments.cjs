'use strict';
const { registerPaymentHandlers } = require('./payments/register.cjs');
module.exports = {
  registerPaymentHandlers,
  registerPaymentsHandlers: registerPaymentHandlers,
  registerHandlers: registerPaymentHandlers,
  register: registerPaymentHandlers,
};