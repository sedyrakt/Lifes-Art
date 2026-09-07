// electron/services/license/machine.cjs
// ⭐ STRONG HARDWARE ID (Offline) - 100% STABLE
// ⭐ FIX: NESORINA NY MAC ADDRESS SY HOSTNAME (Mety hiova isaky ny reboot)

'use strict';

const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const DEBUG = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';
function log(...args) { if (DEBUG) console.log(...args); }

function safeExec(cmd, options = {}) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      timeout: 3000,
      stdio: ['ignore', 'pipe', 'ignore'],
      ...options,
    }).trim();
  } catch {
    return '';
  }
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch (err) {
    return '';
  }
}

function getHardwareInfo() {
  const info = {
    platform: os.platform(),
    arch: os.arch(),
    // ⭐ NESORINA NY hostname
    // cpus: os.cpus().length,
    // cpuModel: os.cpus()[0]?.model || 'unknown',
    // totalMem: os.totalmem(),
    // release: os.release(),
  };

  try {
    if (process.platform === 'win32') {
      const usePowerShell = process.env.USE_POWERSHELL === 'true' || !safeExec('wmic os get serialnumber');

      if (usePowerShell) {
        info.biosSerial = safeExec('powershell -Command "(Get-WmiObject Win32_BIOS).SerialNumber"');
        info.baseBoard = safeExec('powershell -Command "(Get-WmiObject Win32_BaseBoard).SerialNumber"');
        info.uuid = safeExec('powershell -Command "(Get-WmiObject Win32_ComputerSystemProduct).UUID"');
        info.diskSerial = safeExec('powershell -Command "(Get-WmiObject Win32_DiskDrive).SerialNumber"');
      } else {
        info.biosSerial = safeExec('wmic bios get serialnumber').split('\n')[1]?.trim() || '';
        info.baseBoard = safeExec('wmic baseboard get serialnumber').split('\n')[1]?.trim() || '';
        info.uuid = safeExec('wmic csproduct get uuid').split('\n')[1]?.trim() || '';
        info.diskSerial = safeExec('wmic diskdrive get serialnumber').split('\n')[1]?.trim() || '';
      }
    } else if (process.platform === 'linux') {
      // ⭐ IRETO NO STABLE COMPONENTS (tsy miova)
      info.machineId = readFileSafe('/etc/machine-id');
      info.productUuid = readFileSafe('/sys/class/dmi/id/product_uuid');
      info.boardSerial = readFileSafe('/sys/class/dmi/id/board_serial');
      info.productSerial = readFileSafe('/sys/class/dmi/id/product_serial');
    } else if (process.platform === 'darwin') {
      // macOS
      info.uuid = safeExec('system_profiler SPHardwareDataType | grep "Hardware UUID"').split(':')[1]?.trim() || '';
      info.serial = safeExec('system_profiler SPHardwareDataType | grep "Serial Number"').split(':')[1]?.trim() || '';
    }
  } catch (err) {
    log('⚠️ Hardware collection partial:', err.message);
  }

  return info;
}

function getMachineId() {
  try {
    const info = getHardwareInfo();

    // ⭐ IRETO IHANY NO AMPIASIANA (Stable Components)
    const parts = [
      info.platform,                  // Windows / Linux / Darwin
      info.arch,                      // x64 / arm64
      info.uuid || info.machineId || info.productUuid || '', // UUID (Tena Stable)
      info.biosSerial || info.boardSerial || info.productSerial || '', // BIOS / Board Serial
      info.diskSerial || '',          // Disk Serial
    ];

    const raw = parts.filter(Boolean).join('||');
    const hash = crypto.createHash('sha512').update(raw).digest('hex');

    return hash.substring(0, 64).toUpperCase();
  } catch (err) {
    console.error('❌ getMachineId failed:', err.message);
    // Fallback tsara (mampiasa platform + arch ihany)
    const fallback = `${os.platform()}|${os.arch()}`;
    return crypto.createHash('sha512').update(fallback).digest('hex').substring(0, 64).toUpperCase();
  }
}

function verifyMachineBinding(storedMachineId) {
  if (!storedMachineId) return false;
  const current = getMachineId();
  return storedMachineId === current;
}

function getMachineFingerprint() {
  return getMachineId().substring(0, 16);
}

module.exports = {
  getHardwareInfo,
  getMachineId,
  verifyMachineBinding,
  getMachineFingerprint,
};