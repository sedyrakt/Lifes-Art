'use strict';
const licenseService = require('../services/license/index.cjs');
const activation = require('../services/license/activation.cjs');
const revocationService = require('../services/revocation.service.cjs');

function registerLicenseHandlers(ipcMain) {
  if (!ipcMain) return false;
  try {
    const channels = [
      'license:load', 'license:save', 'license:reset', 'license:check-status',
      'license:get-path', 'license:get-status-code', 'license:validate',
      'license:get-machine-id', 'license:verify', 'license:activate',
      'license:verify-checksum', 'license:get-packages', 'license:security-check',
      'license:get-integrity-hashes', 'license:get-current', 'license:deactivate',
      'license:list-database', 'license:clear-cache', 'license:refresh-timer',
      'license:get-expiration', 'license:revocation:check', 'license:revocation:stats',
      'license:revocation:revoke', 'license:revocation:unrevoke',
      'license:activate-with-code', 'license:generate-code', 'license:verify-code'
    ];
    for (const channel of channels) {
      try { ipcMain.removeHandler(channel); } catch (_) {}
    }

    ipcMain.handle('license:activate-with-code', (e, code) => {
      try {
        if (typeof code !== 'string' || !code.trim()) return { success: false, message: 'Code manquant' };
        const result = activation.activateWithCode(code.trim());
        return result;
      } catch (err) { return { success: false, message: err.message }; }
    });

    ipcMain.handle('license:verify-code', (e, code) => {
      try {
        if (typeof code !== 'string' || !code.trim()) return { valid: false, message: 'Code manquant' };
        return activation.verifyCode(code.trim());
      } catch (err) { return { valid: false, message: err.message }; }
    });

    ipcMain.handle('license:load', () => {
      try { return { success: true, data: licenseService.loadLicense() }; }
      catch (err) { return { success: false, error: err.message }; }
    });

    ipcMain.handle('license:save', (e, data) => {
      try { return licenseService.saveLicenseFile(data); }
      catch (err) { return { success: false, error: err.message }; }
    });

    ipcMain.handle('license:reset', () => {
      try { return licenseService.resetLicense(); }
      catch (err) { return { success: false, error: err.message }; }
    });

    ipcMain.handle('license:check-status', () => {
      try { return licenseService.checkLicenseStatus(); }
      catch (err) { return { exists: false, isValid: false, error: err.message }; }
    });

    ipcMain.handle('license:get-path', () => {
      try { return licenseService.getLicensePath(); }
      catch (err) { return { success: false, error: err.message }; }
    });

    ipcMain.handle('license:get-status-code', () => {
      try { return licenseService.getLicenseStatusCode(); }
      catch (err) { return { success: false, error: err.message }; }
    });

    ipcMain.handle('license:validate', (e, context) => {
      try { licenseService.validateLicense(context || 'general'); return { success: true }; }
      catch (err) { return { success: false, error: err.message }; }
    });

    ipcMain.handle('license:get-machine-id', () => {
      try { return licenseService.getMachineId(); }
      catch (err) { return { success: false, error: err.message }; }
    });

    ipcMain.handle('license:verify-checksum', (e, licenseKey) => {
      try { return licenseService.verifyChecksum(licenseKey); }
      catch (err) { return { valid: false, error: err.message }; }
    });

    ipcMain.handle('license:get-packages', () => licenseService.PACKAGES || {});
    ipcMain.handle('license:security-check', () => {
      try { return licenseService.securityCheck(); }
      catch (err) { return { success: false, error: err.message }; }
    });
    ipcMain.handle('license:get-integrity-hashes', () => licenseService.INTEGRITY_HASHES || {});

    ipcMain.handle('license:get-current', () => {
      try { return { success: true, data: licenseService.loadLicense() }; }
      catch (err) { return { success: false, error: err.message }; }
    });

    ipcMain.handle('license:deactivate', () => {
      try { return licenseService.resetLicense(); }
      catch (err) { return { success: false, error: err.message }; }
    });

    ipcMain.handle('license:list-database', () => {
      try { return { success: true, data: activation.loadLicensesDatabase() }; }
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
          isLifetime: status.isLifetime || false
        };
      } catch (err) { return { success: false, error: err.message }; }
    });

    ipcMain.handle('license:revocation:check', (e, licenseKey, activationId) => {
      try { return { revoked: revocationService.isRevoked(licenseKey, activationId) }; }
      catch (err) { return { revoked: false, error: err.message }; }
    });

    ipcMain.handle('license:revocation:stats', () => {
      try { return { success: true, data: revocationService.getStats() }; }
      catch (err) { return { success: false, error: err.message }; }
    });

    ipcMain.handle('license:revocation:revoke', (e, licenseKey, reason) => {
      try { return { success: revocationService.revokeLicense(licenseKey, reason || 'Révocation') }; }
      catch (err) { return { success: false, error: err.message }; }
    });

    ipcMain.handle('license:revocation:unrevoke', (e, licenseKey) => {
      try { return { success: revocationService.unrevokeLicense(licenseKey) }; }
      catch (err) { return { success: false, error: err.message }; }
    });

    return true;
  } catch (err) {
    return false;
  }
}

module.exports = { registerLicenseHandlers };