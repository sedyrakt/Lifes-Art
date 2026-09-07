'use strict';

const path = require('path');
const os = require('os');

// ============================================================
// PACKAGES (with validity info)
// ============================================================

const PACKAGES = {
  test: {
    id: 'test',
    name: 'Test (30 min)',
    prefix: 'TS',
    validityMinutes: 30,          // 30 minitra
    maxUsers: 1,
    maxProducts: 5,
    maxClients: 3,
    isTest: true,
    isLifetime: false,
    defaultQuantity: 100,
  },
  testpro: {
    id: 'testpro',
    name: 'Test Pro (24h)',
    prefix: 'TP',
    validityMinutes: 24 * 60,     // 24 ora
    maxUsers: 1,
    maxProducts: 100,
    maxClients: 50,
    isTest: true,
    isLifetime: false,
    defaultQuantity: 100,
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    prefix: 'BS',
    validityDays: 30,             // 30 andro
    maxUsers: 1,
    maxProducts: 100,
    maxClients: 50,
    isTest: false,
    isLifetime: false,
    defaultQuantity: 100,
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    prefix: 'ST',
    validityDays: 60,
    maxUsers: 3,
    maxProducts: 500,
    maxClients: 200,
    isTest: false,
    isLifetime: false,
    defaultQuantity: 100,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    prefix: 'PR',
    validityDays: 365,
    maxUsers: 10,
    maxProducts: -1,
    maxClients: -1,
    isTest: false,
    isLifetime: false,
    defaultQuantity: 100,
  },
  national: {
    id: 'national',
    name: 'National',
    prefix: 'NA',
    validityDays: 730,
    maxUsers: 25,
    maxProducts: -1,
    maxClients: -1,
    isTest: false,
    isLifetime: false,
    defaultQuantity: 100,
  },
  centralized: {
    id: 'centralized',
    name: 'Centralized',
    prefix: 'CE',
    validityDays: -1,             // -1 = lifetime (tsy misy expiration)
    maxUsers: -1,
    maxProducts: -1,
    maxClients: -1,
    isTest: false,
    isLifetime: true,
    defaultQuantity: 1,
  },
};

const VALID_PACKAGES = Object.keys(PACKAGES);
const GRACE_PERIOD_DAYS = 0; // ✅ OVANA: TSY MISY GRACE PERIOD
const MAX_TAMPER_ATTEMPTS = 5;
const TAMPER_LOCKOUT_MINUTES = 60;
const MAX_RESET_ATTEMPTS = 5;
const RESET_LOCKOUT_MINUTES = 15;
const DEVTOOLS_LOCKOUT_FILE = path.join(os.homedir(), '.fitaia_devtools_lock');

const EXCLUDED_FILES = [
  'license.lic',
  '.fitaia_lockout',
  '.fitaia_time.dat',
  '.fitaia_machine_id',
  '.fitaia_reset_lock',
  '.fitaia_devtools_lock',
];

const APP_VERSION = process.env.npm_package_version || process.env.APP_VERSION || '1.0.0';

const isPackaged =
  process.env.NODE_ENV === 'production' ||
  (process.defaultApp !== undefined && !process.defaultApp && process.resourcesPath !== undefined);

const RESOURCES_PATH =
  isPackaged && process.resourcesPath
    ? process.resourcesPath
    : path.join(__dirname, '../../');

const PUBLIC_KEY_PATHS = [
  // 1. ExtraResources (production - azo antoka indrindra)
  ...(process.resourcesPath
    ? [path.join(process.resourcesPath, 'keys/public.pem')]
    : []),

  // 2. Asar unpacked
  ...(process.resourcesPath
    ? [path.join(process.resourcesPath, 'app.asar.unpacked', 'keys/public.pem')]
    : []),

  // 3. Development / source
  path.join(__dirname, '../../keys/public.pem'),
  path.join(__dirname, '../keys/public.pem'),
  path.join(__dirname, '../../../keys/public.pem'),
  path.join(process.cwd(), 'electron/keys/public.pem'),
  path.join(process.cwd(), 'keys/public.pem'),
  // ⭐ FIX: Ampiana ny chemin ho an'ny dist-electron
  path.join(__dirname, '../../dist-electron/keys/public.pem'),
  path.join(__dirname, '../../../dist-electron/keys/public.pem'),
];

// ============================================================
// OFFICIAL ACTIVATION CODE FORMAT
// ============================================================

const ACTIVATION_CODE_FORMAT = /^LA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const ACTIVATION_CODE_PREFIX = 'LA';
const ACTIVATION_CODE_LENGTH = 17;

module.exports = {
  PACKAGES,
  VALID_PACKAGES,
  GRACE_PERIOD_DAYS, // ✅ 0
  MAX_TAMPER_ATTEMPTS,
  TAMPER_LOCKOUT_MINUTES,
  MAX_RESET_ATTEMPTS,
  RESET_LOCKOUT_MINUTES,
  DEVTOOLS_LOCKOUT_FILE,
  EXCLUDED_FILES,
  APP_VERSION,
  isPackaged,
  PUBLIC_KEY_PATHS,
  RESOURCES_PATH,
  ACTIVATION_CODE_FORMAT,
  ACTIVATION_CODE_PREFIX,
  ACTIVATION_CODE_LENGTH,
};