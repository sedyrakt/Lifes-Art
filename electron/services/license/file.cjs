// ============================================================
// electron/services/license/file.cjs
// ⭐ License file operations (machine-bound AES)
// ============================================================

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const { encryptData, decryptData } = require('./crypto.cjs');
const { getLicensePath } = require('./utils.cjs');
const { detectDebugger, checkIntegrity } = require('./security.cjs');
const { getMachineId, verifyMachineBinding } = require('./machine.cjs');

function createBackup(filePath) {
  try {
    const baseDir = path.dirname(filePath);
    const backupDir = path.join(baseDir, '.backup');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `license_${timestamp}.lic.enc`);

    const data = fs.readFileSync(filePath, 'utf8');
    const encrypted = encryptData(data); // re-encrypt with current machine key
    if (encrypted) {
      const metadata = {
        createdAt: new Date().toISOString(),
        hash: crypto.createHash('sha256').update(data).digest('hex'),
      };
      const backupData = { metadata, data: encrypted };
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
      return backupPath;
    }
    return null;
  } catch (e) {
    console.warn('⚠️ Erreur backup:', e.message);
    return null;
  }
}

function loadLicenseDataSync() {
  try {
    const filePath = getLicensePath();
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath, 'utf-8');
    return decryptData(data); // machine-bound → null if wrong machine
  } catch {
    return null;
  }
}

function loadLicense() {
  try {
    if (detectDebugger()) {
      return { success: false, error: 'Debugger détecté' };
    }

    const isFirstActivation = !fs.existsSync(getLicensePath());
    if (!checkIntegrity(isFirstActivation)) {
      return { success: false, error: 'Intégrité compromise' };
    }

    const filePath = getLicensePath();
    if (!fs.existsSync(filePath)) {
      return { success: false, message: 'Licence non trouvée' };
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    const decrypted = decryptData(data);

    if (!decrypted) {
      return {
        success: false,
        error: 'Données corrompues ou licence liée à une autre machine',
      };
    }

    // Extra check
    if (decrypted.machineId && !verifyMachineBinding(decrypted.machineId)) {
      return {
        success: false,
        error: 'Licence non valide pour cette machine',
      };
    }

    return {
      success: true,
      data: JSON.stringify(decrypted),
      path: filePath,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function saveLicenseFile(data, options = {}) {
  try {
    if (detectDebugger()) {
      return { success: false, error: 'Debugger détecté' };
    }

    const isFirstActivation = !fs.existsSync(getLicensePath());
    if (!checkIntegrity(isFirstActivation)) {
      return { success: false, error: 'Intégrité compromise' };
    }

    const filePath = getLicensePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const licenseData = typeof data === 'string' ? JSON.parse(data) : data;

    if (!licenseData.expirationDate) {
      return { success: false, error: "Date d'expiration obligatoire" };
    }

    // Force current machine binding
    licenseData.machineId = getMachineId();

    const encrypted = encryptData(licenseData);
    if (!encrypted) {
      return { success: false, error: 'Erreur encryption' };
    }

    fs.writeFileSync(filePath, encrypted, 'utf-8');
    return { success: true, path: filePath };
  } catch (error) {
    console.error('❌ Erreur saveLicenseFile:', error);
    return { success: false, error: error.message };
  }
}

function resetLicense(adminPassword = null, recoveryCode = null) {
  try {
    const isFirstActivation = !fs.existsSync(getLicensePath());
    if (!checkIntegrity(isFirstActivation)) {
      return { success: false, error: 'Intégrité du système compromise' };
    }

    const filePath = getLicensePath();
    if (fs.existsSync(filePath)) {
      const backupPath = createBackup(filePath);
      fs.unlinkSync(filePath);
      return {
        success: true,
        deleted: 1,
        backupPath,
        message: `Licence supprimée, backup: ${backupPath}`,
      };
    }
    return { success: true, deleted: 0, message: 'Aucune licence à supprimer' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  createBackup,
  loadLicenseDataSync,
  loadLicense,
  saveLicenseFile,
  resetLicense,
};