// electron/ipc/license.cjs

const licenseService = require('../services/license/index.cjs');
const activation = require('../services/license/activation.cjs');
const revocationService = require('../services/revocation.service.cjs');

const DEBUG = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
function log(...args) { if (DEBUG) console.log(...args); }
function error(...args) { console.error(...args); }

const registerLicenseHandlers = (ipcMain) => {
  log('🔑 [license.cjs] ENREGISTREMENT HANDLERS');

  if (!ipcMain) {
    error('❌ ipcMain null');
    return false;
  }

  // Supprimer les anciens handlers
  const channels = [
    'license:load', 'license:save', 'license:reset',
    'license:check-status', 'license:get-path', 'license:get-status-code',
    'license:validate', 'license:get-machine-id',
    'license:verify-checksum', 'license:get-packages',
    'license:security-check', 'license:get-integrity-hashes',
    'license:get-current', 'license:deactivate',
    'license:list-database', 'license:clear-cache',
    'license:refresh-timer', 'license:get-expiration',
    'license:revocation:check', 'license:revocation:stats',
    'license:revocation:revoke', 'license:revocation:unrevoke',
    'license:activate-with-code', 'license:verify-code'
    // ⭐ Esorina: 'license:verify', 'license:activate', 'license:generate-code'
  ];
  for (const ch of channels) {
    try { ipcMain.removeHandler(ch); } catch (_) {}
  }

  // ✅ NOUVEAU: ACTIVATION PAR CODE
  ipcMain.handle('license:activate-with-code', (event, code) => {
    try { return activation.activateWithCode(code); }
    catch (err) { return { success: false, message: err.message }; }
  });

  // ✅ NOUVEAU: VERIFY CODE
  ipcMain.handle('license:verify-code', (event, code) => {
    try {
      return activation.verifyCode(code);
    } catch (err) {
      return { valid: false, message: err.message };
    }
  });

  // HANDLERS EXISTANTS
  ipcMain.handle('license:load', () => {
    try { const data = licenseService.loadLicense(); return { success: true, data }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('license:save', (event, data) => {
    try { return licenseService.saveLicenseFile(data); }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('license:reset', () => {
    try { return licenseService.resetLicense(); }
    catch (err) { return { success: false, error: err.message }; }
  });

  // CHECK-STATUS
  ipcMain.handle('license:check-status', () => {
    try { 
      const result = licenseService.checkLicenseStatus(); 
      return result; 
    }
    catch (err) { 
      return { exists: false, isValid: false, error: err.message }; 
    }
  });

  ipcMain.handle('license:get-path', () => licenseService.getLicensePath());
  ipcMain.handle('license:get-status-code', () => licenseService.getLicenseStatusCode());

  ipcMain.handle('license:validate', (event, context) => {
    try { licenseService.validateLicense(context || 'general'); return { success: true }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('license:get-machine-id', () => licenseService.getMachineId());

  ipcMain.handle('license:verify-checksum', (event, licenseKey) => {
    return licenseService.verifyChecksum(licenseKey);
  });

  ipcMain.handle('license:get-packages', () => licenseService.PACKAGES || {});
  ipcMain.handle('license:security-check', () => licenseService.securityCheck());
  ipcMain.handle('license:get-integrity-hashes', () => licenseService.INTEGRITY_HASHES || {});

  ipcMain.handle('license:get-current', () => {
    try { const data = licenseService.loadLicense(); return { success: true, data }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('license:deactivate', () => {
    try { return licenseService.resetLicense(); }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('license:list-database', () => {
    try { const db = activation.loadLicensesDatabase(); return { success: true, data: db }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('license:clear-cache', () => ({ success: true }));
  ipcMain.handle('license:refresh-timer', () => ({ success: true }));

  ipcMain.handle('license:get-expiration', () => {
    try {
      const status = licenseService.checkLicenseStatus();
      return {
        success: true,
        expirationDate: status.expirationDate || null,
        daysRemaining: status.daysRemaining || 0,
        minutesRemaining: status.minutesRemaining || 0,
        isTest: status.isTest || false,
        isLifetime: status.isLifetime || false,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // REVOCATION
  ipcMain.handle('license:revocation:check', (event, licenseKey, activationId) => {
    try { return { revoked: revocationService.isRevoked(licenseKey, activationId) }; }
    catch (err) { return { revoked: false, error: err.message }; }
  });

  ipcMain.handle('license:revocation:stats', () => {
    try { const stats = revocationService.getStats(); return { success: true, data: stats }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('license:revocation:revoke', (event, licenseKey, reason) => {
    try { const result = revocationService.revokeLicense(licenseKey, reason || 'Révocation'); return { success: result }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('license:revocation:unrevoke', (event, licenseKey) => {
    try { const result = revocationService.unrevokeLicense(licenseKey); return { success: result }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  log('✅ License handlers enregistrés (synchronous)');
  return true;
};

module.exports = { registerLicenseHandlers };