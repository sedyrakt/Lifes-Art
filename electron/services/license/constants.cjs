// electron/services/license/constants.cjs
// ⭐ FIX: 3 PACKAGES IHANY (testpro 48h, national 50 ans, centralized à vie)
'use strict';

const path = require('path');
const os = require('os');

// ============================================================
// PACKAGES — 3 IHANY (mitovy amin'ny admin-tools sy ny UI)
// ============================================================

const PACKAGES = {
  testpro: {
    id: 'testpro',
    name: 'Test Pro (48h)',
    prefix: 'TP',
    validityMinutes: 48 * 60,     // 48 ora = 2880 minitra
    maxUsers: 1,
    maxProducts: 100,
    maxClients: 50,
    isTest: true,
    isLifetime: false,
    defaultQuantity: 1000,
  },
  national: {
    id: 'national',
    name: 'National',
    prefix: 'NA',
    validityDays: 18250,          // 50 ans = 50 × 365
    maxUsers: 25,
    maxProducts: -1,
    maxClients: -1,
    isTest: false,
    isLifetime: false,
    defaultQuantity: 1000,
  },
  centralized: {
    id: 'centralized',
    name: 'Centralized',
    prefix: 'CE',
    validityDays: -1,             // -1 = lifetime
    maxUsers: -1,
    maxProducts: -1,
    maxClients: -1,
    isTest: false,
    isLifetime: true,
    defaultQuantity: 1000,
  },
};

const VALID_PACKAGES = Object.keys(PACKAGES);
const GRACE_PERIOD_DAYS = 0; // ✅ TSY MISY GRACE PERIOD
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

  // 4. dist-electron (build)
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
  GRACE_PERIOD_DAYS,
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