// ============================================================
// electron/services/license/index.cjs - RE-EXPORT
// ⭐ CommonJS + Bytenode loader (optional)
// ============================================================

'use strict';

const fs = require('fs');
const path = require('path');

// ============================================================
// ⭐ BYTENODE LOADER (raha misy .jsc)
// ============================================================
try {
  require('bytenode'); // register .jsc extension
} catch (e) {
  // bytenode tsy installed → mbola mampiasa .cjs (normal)
}

/**
 * Load module (.jsc prioritaire, sinon .cjs)
 */
function loadLicenseModule(name) {
  const base = path.join(__dirname, name);
  const jscPath = base + '.jsc';
  const cjsPath = base + '.cjs';

  if (fs.existsSync(jscPath)) {
    return require(jscPath);
  }
  return require(cjsPath);
}

// ============================================================
// LOAD MODULES
// ============================================================

const constants = loadLicenseModule('constants');
const crypto = loadLicenseModule('crypto');
const activation = loadLicenseModule('activation');
const security = loadLicenseModule('security');

let utils = {};
try {
  utils = loadLicenseModule('utils');
} catch (e) {
  console.warn('⚠️ license/utils tsy hita:', e.message);
}

let machine = {};
try {
  machine = loadLicenseModule('machine');
} catch (e) {
  console.warn('⚠️ license/machine tsy hita:', e.message);
}

let file = {};
try {
  file = loadLicenseModule('file');
} catch (e) {
  console.warn('⚠️ license/file tsy hita:', e.message);
}

let validation = {};
try {
  validation = loadLicenseModule('validation');
} catch (e) {
  console.warn('⚠️ license/validation tsy hita:', e.message);
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  ...constants,
  ...utils,
  ...crypto,
  ...machine,
  ...security,
  ...file,
  ...validation,
  ...activation,
};

// Export explicite
module.exports.getPackages = () => constants.PACKAGES;
module.exports.activateWithCode = activation.activateWithCode;
module.exports.verifyCode = activation.verifyCode;
module.exports.isLicenseBoundToThisMachine = activation.isLicenseBoundToThisMachine;

console.log('✅ license/index.cjs - Tous les modules chargés (CommonJS' +
  (fs.existsSync(path.join(__dirname, 'crypto.jsc')) ? ' + Bytenode' : '') +
  ')');