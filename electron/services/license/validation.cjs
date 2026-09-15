// electron/services/license/validation.cjs
// ⭐ FIX: testpro 48h (2880 min) fa tsy 24h (1440 min)
// ⭐ FIX: Mampiseho activatedAt ao amin'ny status
'use strict';

const fs = require('fs');
const { GRACE_PERIOD_DAYS } = require('./constants.cjs');
const { getLicensePath } = require('./utils.cjs');
const { decryptData, verifyRSASignature } = require('./crypto.cjs');
const { verifyMachineBinding } = require('./machine.cjs');

// ⭐ FIX: Test pro 48h fa tsy 24h
const TEST_PRO_MAX_MINUTES = 48 * 60;   // 2880 min
const TEST_BASIC_MAX_MINUTES = 30;      // 30 min (raha misy test 30 min amin'ny ho avy)

function checkExpiration(expirationDate, packageType = null, activatedAt = null) {
  if (!expirationDate) return { valid: false, status: 'invalid', daysRemaining: 0 };

  const now = new Date();
  const isTest = (packageType === 'test' || packageType === 'testpro');

  if (isTest) {
    // Raha test, dia mampiasa activatedAt na issuedAt
    const effectiveActivation = activatedAt || null;
    if (!effectiveActivation) {
      const expDate = new Date(expirationDate);
      if (expDate > now) {
        const minutesRemaining = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60));
        return { valid: true, status: 'active', daysRemaining: 0, minutesRemaining, isTest: true };
      }
      return { valid: false, status: 'expired', daysRemaining: 0, isTest: true, minutesRemaining: 0 };
    }

    const activationTime = new Date(effectiveActivation);
    const elapsedMinutes = (now.getTime() - activationTime.getTime()) / (1000 * 60);

    // ⭐ FIX: testpro = 48h (2880 min)
    let maxMinutes = TEST_BASIC_MAX_MINUTES;
    if (packageType === 'testpro') maxMinutes = TEST_PRO_MAX_MINUTES;

    const minutesRemaining = Math.ceil(maxMinutes - elapsedMinutes);

    if (minutesRemaining > 0) {
      return { valid: true, status: 'active', daysRemaining: 0, minutesRemaining, isTest: true };
    }
    return { valid: false, status: 'expired', daysRemaining: 0, isTest: true, minutesRemaining: 0 };
  }

  const expDate = new Date(expirationDate);
  const graceEnd = getGracePeriodEnd(expirationDate);

  if (packageType === 'centralized') {
    if (expDate.getFullYear() >= 2099) return { valid: true, status: 'lifetime', daysRemaining: 9999, isLifetime: true };
  }

  if (now > graceEnd) return { valid: false, status: 'expired', daysRemaining: 0 };
  if (now > expDate) {
    const daysRemaining = Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { valid: true, status: 'grace', daysRemaining };
  }

  const daysRemaining = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { valid: true, status: 'active', daysRemaining };
}

function getGracePeriodEnd(expirationDate) {
  if (!expirationDate) return null;
  const exp = new Date(expirationDate);
  const grace = new Date(exp);
  grace.setDate(grace.getDate() + GRACE_PERIOD_DAYS);
  return grace;
}

function checkSignature(licenseData) {
  if (!licenseData || !licenseData.signature) return false;

  const payload = licenseData.signedPayload || {
    licenseId: licenseData.licenseId || '',
    activationId: licenseData.activationId || '',
    licenseKey: licenseData.licenseKey || '',
    packageType: licenseData.packageType || 'national',
    expirationDate: licenseData.expirationDate || new Date().toISOString(),
    issuedAt: licenseData.issuedAt || new Date().toISOString(),
    maxUsers: licenseData.maxUsers ?? 1,
    maxProducts: licenseData.maxProducts ?? -1,
    maxClients: licenseData.maxClients ?? -1,
  };

  return verifyRSASignature(payload, licenseData.signature);
}

function checkLicenseStatus() {
  try {
    const filePath = getLicensePath();
    if (!fs.existsSync(filePath)) return { success: true, exists: false, message: 'Aucune licence trouvée' };

    const data = fs.readFileSync(filePath, 'utf-8');
    const decrypted = decryptData(data);

    if (!decrypted) return { success: false, error: 'Données corrompues ou licence liée à une autre machine' };

    if (decrypted.machineId && !verifyMachineBinding(decrypted.machineId)) {
      return { success: true, exists: true, isValid: false, message: 'Licence non valide pour cette machine' };
    }

    if (!decrypted.signature) return { success: true, exists: true, isValid: false, message: 'Signature RSA manquante' };

    if (!checkSignature(decrypted)) return { success: true, exists: true, isValid: false, message: 'Signature RSA invalide' };

    const activatedAt = decrypted.activatedAt || decrypted.issuedAt || null;
    const expiration = checkExpiration(decrypted.expirationDate, decrypted.packageType, activatedAt);

    let isValid = expiration.valid;
    let message = 'Licence valide';
    let daysRemaining = expiration.daysRemaining;
    let minutesRemaining = expiration.minutesRemaining;

    if (!isValid) message = 'Licence expirée';
    else if (expiration.isTest) {
      // ⭐ FIX: testpro 48h
      if (decrypted.packageType === 'testpro') {
        const hours = Math.floor((minutesRemaining || 0) / 60);
        const mins = (minutesRemaining || 0) % 60;
        message = `🧪 TEST-PRO: ${hours}h ${mins}min restantes (48h)`;
      } else {
        message = `🧪 TEST: ${minutesRemaining} min restantes`;
      }
    } else if (expiration.status === 'grace') message = `⚠️ Grace period: ${daysRemaining} jours restants`;
    else if (expiration.status === 'lifetime') message = '✅ Licence illimitée (Lifetime)';
    else if (daysRemaining <= 7) message = `⚠️ Licence expire dans ${daysRemaining} jours`;

    // ✅ FIX: Ampiana activatedAt
    return {
      success: true,
      exists: true,
      path: filePath,
      isValid,
      status: expiration.status,
      message,
      daysRemaining,
      minutesRemaining,
      isTest: expiration.isTest || false,
      isLifetime: expiration.isLifetime || false,
      packageType: decrypted.packageType || null,
      licenseKey: decrypted.licenseKey || null,
      activationId: decrypted.activationId || null,
      signature: decrypted.signature || null,
      expirationDate: decrypted.expirationDate || null,
      activatedAt: decrypted.activatedAt || null,
      machineFingerprint: decrypted.machineFingerprint || null,
    };
  } catch (error) {
    console.error('❌ Erreur checkLicenseStatus:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  checkExpiration,
  getGracePeriodEnd,
  checkSignature,
  checkLicenseStatus,
  TEST_PRO_MAX_MINUTES,
  TEST_BASIC_MAX_MINUTES,
};