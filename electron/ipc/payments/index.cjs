// electron/ipc/payments/index.cjs
'use strict';

const { registerPaymentHandlers, registerHandlers, register } = require('./register.cjs');
const { calculatePayroll, calculateIRSA, getAbsencesData } = require('./calculations.cjs');
const { readPayrollParameters, savePayrollParameters } = require('./payrollParameters.cjs');
const { assertNoDuplicatePayment } = require('./crud.cjs');

module.exports = {
  registerPaymentHandlers,
  registerHandlers,
  register,
  registerPaymentsHandlers: registerPaymentHandlers,
  calculatePayroll,
  calculateIRSA,
  getAbsencesData,
  readPayrollParameters,
  savePayrollParameters,
  assertNoDuplicatePayment,
};