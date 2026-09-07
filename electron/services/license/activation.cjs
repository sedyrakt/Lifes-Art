// electron/services/license/activation.cjs
// ⭐ FIX #1: Canonical String MIARAKA AMIN'NY ADMIN (Signature RSA mitovy)
// ⭐ FIX #2: Activation Log amin'ny SQLite (Tsy azo averina ny code efa nampiasaina na lany)
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { PACKAGES, ACTIVATION_CODE_FORMAT } = require('./constants.cjs');
const { encryptData, decryptData, verifyRSASignature } = require('./crypto.cjs');
const { getMachineId, verifyMachineBinding, getMachineFingerprint } = require('./machine.cjs');
const { getLicensePath } = require('./utils.cjs');

// ⭐ SQLite database connection (ho an'ny activation log)
const { getDb } = require('../../database/connection.cjs');

const DEBUG = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';
function log(...args) { if (DEBUG) console.log(...args); }

const CODES_DB_SECRET = 'njkwrfkxiszaqplmwert_7gH4%jK9#pL2$mN6@qR8&sT3*vW5!xY1+zA0=bC4-eF7';
const CODES_DB_SALT = Buffer.from('FITAIA-CODES-SALT-V1', 'utf8');

function getCodesAESKey() {
  return crypto.pbkdf2Sync(CODES_DB_SECRET, CODES_DB_SALT, 210000, 32, 'sha512');
}

function decryptCodesDB(encrypted) {
  try {
    if (typeof encrypted !== 'string') return null;
    const parts = encrypted.split(':');
    if (parts.length !== 3) return null;

    const key = getCodesAESKey();
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const cipherText = parts[2];

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(cipherText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (e) {
    console.warn('⚠️ decryptCodesDB failed:', e.message);
    return null;
  }
}

function getCodesDatabasePath() {
  if (process.resourcesPath) {
    const p1 = path.join(process.resourcesPath, 'keys', 'codes.db.enc');
    if (fs.existsSync(p1)) return p1;
    const p2 = path.join(process.resourcesPath, 'codes.db.enc');
    if (fs.existsSync(p2)) return p2;
    const p3 = path.join(process.resourcesPath, 'dist-electron', 'keys', 'codes.db.enc');
    if (fs.existsSync(p3)) return p3;
  }

  const devPaths = [
    path.join(__dirname, '../../keys/codes.db.enc'),
    path.join(__dirname, '../keys/codes.db.enc'),
    path.join(process.cwd(), 'electron/keys/codes.db.enc'),
    path.join(process.cwd(), 'keys/codes.db.enc'),
  ];

  for (const p of devPaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function loadCodesDatabase() {
  try {
    const dbPath = getCodesDatabasePath();
    if (!dbPath) {
      log('ℹ️ codes.db.enc tsy hita');
      return null;
    }
    const encrypted = fs.readFileSync(dbPath, 'utf8');
    const db = decryptCodesDB(encrypted);
    if (db) {
      log(`✅ codes.db.enc chargé (${db.total || Object.keys(db.codes || {}).length} codes)`);
    }
    return db;
  } catch (err) {
    console.warn('⚠️ Impossible de charger codes.db:', err.message);
    return null;
  }
}

function resolveCode(code) {
  const db = loadCodesDatabase();
  if (db && db.codes && db.codes[code]) {
    return db.codes[code];
  }
  return null;
}

function computeExpirationDate(payload, now = new Date()) {
  if (payload.validityMinutes) {
    return new Date(now.getTime() + payload.validityMinutes * 60 * 1000).toISOString();
  } else if (payload.validityDays) {
    if (payload.validityDays === -1) {
      return '2099-12-31T23:59:59.999Z';
    }
    return new Date(now.getTime() + payload.validityDays * 24 * 60 * 60 * 1000).toISOString();
  } else if (payload.expirationDate) {
    return payload.expirationDate;
  }
  return null;
}

// ============================================================
// ⭐ ACTIVATION LOG (SQLite) - Fisorohana code efa nampiasaina
// ============================================================

function ensureActivationLogTable() {
  try {
    const db = getDb();
    if (!db || !db.open) {
      console.warn('⚠️ Activation log: DB tsy misokatra, tsy azo atao ny log');
      return false;
    }
    db.exec(`CREATE TABLE IF NOT EXISTS activation_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      machine_id TEXT NOT NULL,
      activated_at TEXT NOT NULL,
      package_type TEXT,
      UNIQUE(code, machine_id)
    )`);
    log('✅ Activation log table ok');
    return true;
  } catch (err) {
    console.warn('⚠️ Erreur création activation log:', err.message);
    return false;
  }
}

function isCodeAlreadyUsed(code, machineId) {
  try {
    const db = getDb();
    if (!db || !db.open) return false;
    const stmt = db.prepare('SELECT 1 FROM activation_log WHERE code = ? AND machine_id = ? LIMIT 1');
    return !!stmt.get(code, machineId);
  } catch (err) {
    console.warn('⚠️ Erreur vérification activation log:', err.message);
    return false;
  }
}

function logActivation(code, machineId, packageType) {
  try {
    const db = getDb();
    if (!db || !db.open) return;
    db.prepare('INSERT OR IGNORE INTO activation_log (code, machine_id, activated_at, package_type) VALUES (?, ?, ?, ?)')
      .run(code, machineId, new Date().toISOString(), packageType);
    log(`✅ Activation log enregistré pour ${code}`);
  } catch (err) {
    console.warn('⚠️ Erreur enregistrement activation log:', err.message);
  }
}

// ============================================================
// ⭐ ACTIVATION FUNCTION (Misy fanamarinana code efa nampiasaina)
// ============================================================

function activateWithCode(code) {
  try {
    if (!code || typeof code !== 'string') {
      return { success: false, message: 'Code d\'activation manquant' };
    }
    const cleanCode = code.trim().toUpperCase();

    if (!ACTIVATION_CODE_FORMAT.test(cleanCode)) {
      return { success: false, message: 'Format de code invalide (attendu: LA-XXXX-XXXX-XXXX)' };
    }

    const resolved = resolveCode(cleanCode);
    if (!resolved || !resolved.payload || !resolved.signature) {
      return {
        success: false,
        message: 'Code inconnu ou base de codes inaccessible',
      };
    }

    const { payload, signature } = resolved;

    if (!verifyRSASignature(payload, signature)) {
      return { success: false, message: 'Signature RSA invalide – code contrefait' };
    }

    if (!payload.packageType || !PACKAGES[payload.packageType]) {
      return { success: false, message: 'Package type invalide' };
    }

    const machineId = getMachineId();

    // ⭐ FANAMARIHANA RAHA EFA NAMPIASAINA TAMIN'IO MACHINE IO
    if (isCodeAlreadyUsed(cleanCode, machineId)) {
      return {
        success: false,
        message: 'Ce code a déjà été utilisé sur cette machine. Veuillez contacter l\'administrateur.',
      };
    }

    const now = new Date();
    const expirationDate = computeExpirationDate(payload, now);
    if (!expirationDate) {
      return { success: false, message: 'Date d\'expiration ou validité manquante' };
    }

    const exp = new Date(expirationDate);
    if (exp < now && payload.packageType !== 'centralized') {
      return { success: false, message: 'Ce code a déjà expiré' };
    }

    const licenseData = {
      licenseId: payload.licenseId,
      activationId: payload.activationId || crypto.randomBytes(16).toString('hex'),
      licenseKey: cleanCode,
      packageType: payload.packageType,
      expirationDate: expirationDate,
      issuedAt: payload.issuedAt || new Date().toISOString(),
      activatedAt: new Date().toISOString(),
      maxUsers: payload.maxUsers ?? 1,
      maxProducts: payload.maxProducts ?? -1,
      maxClients: payload.maxClients ?? -1,
      signature: signature,
      signedPayload: payload,
      machineId: machineId,
      machineFingerprint: getMachineFingerprint(),
    };

    const encrypted = encryptData(licenseData);
    if (!encrypted) {
      return { success: false, message: 'Erreur lors du chiffrement de la licence' };
    }

    const filePath = getLicensePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, encrypted, 'utf8');

    // ⭐ ENREGISTRER AO AMIN'NY ACTIVATION LOG ILAY CODE
    ensureActivationLogTable();
    logActivation(cleanCode, machineId, payload.packageType);

    log('✅ Licence activée et liée à la machine:', machineId.substring(0, 16) + '...');

    return {
      success: true,
      message: 'Licence activée avec succès',
      data: {
        packageType: licenseData.packageType,
        packageName: PACKAGES[licenseData.packageType]?.name || licenseData.packageType,
        expirationDate: licenseData.expirationDate,
        machineFingerprint: licenseData.machineFingerprint,
        activationId: licenseData.activationId,
      },
    };
  } catch (err) {
    console.error('❌ activateWithCode error:', err);
    return { success: false, message: err.message || 'Erreur interne d\'activation' };
  }
}

function verifyCode(code) {
  try {
    const cleanCode = (code || '').trim().toUpperCase();

    if (!ACTIVATION_CODE_FORMAT.test(cleanCode)) {
      return { valid: false, message: 'Format invalide' };
    }

    const resolved = resolveCode(cleanCode);
    if (!resolved || !resolved.payload || !resolved.signature) {
      return { valid: false, message: 'Code inconnu' };
    }

    if (!verifyRSASignature(resolved.payload, resolved.signature)) {
      return { valid: false, message: 'Signature invalide' };
    }

    const pkg = PACKAGES[resolved.payload.packageType];
    return {
      valid: true,
      packageType: resolved.payload.packageType,
      packageName: pkg?.name || resolved.payload.packageType,
      expirationDate: null,
      validityMinutes: resolved.payload.validityMinutes || null,
      validityDays: resolved.payload.validityDays || null,
      maxUsers: resolved.payload.maxUsers,
    };
  } catch (err) {
    return { valid: false, message: err.message };
  }
}

function isLicenseBoundToThisMachine() {
  try {
    const filePath = getLicensePath();
    if (!fs.existsSync(filePath)) return false;
    const encrypted = fs.readFileSync(filePath, 'utf8');
    const data = decryptData(encrypted);
    if (!data || !data.machineId) return false;
    return verifyMachineBinding(data.machineId);
  } catch {
    return false;
  }
}

function loadLicensesDatabase() {
  return {};
}

module.exports = {
  activateWithCode,
  verifyCode,
  isLicenseBoundToThisMachine,
  loadLicensesDatabase,
  resolveCode,
  loadCodesDatabase,
  isCodeAlreadyUsed,
};