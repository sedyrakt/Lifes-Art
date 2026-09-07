// electron/services/license/crypto.cjs
// ⭐ FIX: Canonical String + RSA Padding/SaltLength MITOVY amin'ny generate-activation-code.cjs
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { PUBLIC_KEY_PATHS } = require('./constants.cjs');
const { createCanonicalString } = require('./utils.cjs'); // ⭐ MIARAKA AMIN'NY ADMIN
const { getMachineId } = require('./machine.cjs');

const DEBUG = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';
function log(...args) { if (DEBUG) console.log(...args); }

let PUBLIC_KEY = '';
let PUBLIC_KEY_FOUND = false;

const RESOURCES_PATH = process.resourcesPath
  ? process.resourcesPath
  : path.join(__dirname, '../../');

const extendedPaths = [
  ...PUBLIC_KEY_PATHS,
  path.join(RESOURCES_PATH, 'keys/public.pem'),
  path.join(RESOURCES_PATH, 'app.asar.unpacked/keys/public.pem'),
  path.join(__dirname, '../../keys/public.pem'),
  path.join(__dirname, '../keys/public.pem'),
  path.join(process.cwd(), 'electron/keys/public.pem'),
  path.join(process.cwd(), 'keys/public.pem'),
  path.join(__dirname, '../../dist-electron/keys/public.pem'),
  path.join(__dirname, '../../../dist-electron/keys/public.pem'),
  path.join(process.resourcesPath, 'dist-electron', 'keys', 'public.pem'),
  path.join(process.resourcesPath, 'app.asar.unpacked', 'dist-electron', 'keys', 'public.pem'),
];

const uniquePaths = [...new Set(extendedPaths.filter(Boolean))];

for (const pkPath of uniquePaths) {
  try {
    if (fs.existsSync(pkPath)) {
      PUBLIC_KEY = fs.readFileSync(pkPath, 'utf8');
      PUBLIC_KEY_FOUND = true;
      console.log(`✅ Public Key chargée depuis: ${pkPath}`);
      break;
    }
  } catch (_) {}
}

if (!PUBLIC_KEY_FOUND) {
  console.error('❌ Public key not found');
  uniquePaths.forEach(p => console.error(`   - ${p}`));
}

const MASTER_SECRET = 'kjrvawrtxbrewertbn27_9fK2#mP8$vL5@xQ7&wR3*zT6!nB4^cY1+hJ0=uE9-dA2';

function getDerivedAESKey() {
  try {
    const machineId = getMachineId();
    const salt = Buffer.from('FITAIA-SALT-V3-2026-SECURE', 'utf8');
    return crypto.pbkdf2Sync(
      MASTER_SECRET + '|' + machineId,
      salt,
      310000,
      32,
      'sha512'
    );
  } catch (err) {
    console.error('❌ AES_KEY derivation failed:', err.message);
    throw err;
  }
}

function encryptData(data) {
  try {
    const AES_KEY = getDerivedAESKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    return iv.toString('base64') + ':' + authTag.toString('base64') + ':' + encrypted;
  } catch (error) {
    console.error('❌ Erreur encryption:', error.message);
    return null;
  }
}

function decryptData(encrypted) {
  try {
    if (typeof encrypted !== 'string' || encrypted.length > 50000) return null;

    const parts = encrypted.split(':');
    if (parts.length !== 3) return null;

    const AES_KEY = getDerivedAESKey();
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const cipherText = parts[2];

    const decipher = crypto.createDecipheriv('aes-256-gcm', AES_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(cipherText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (e) {
    console.warn('⚠️ Erreur decrypt (machine mismatch or corrupted):', e.message);
    console.warn('   → Raha niova ny machine, dia mila reactivation.');
    console.warn('   → Raha corrupted, esory ny license.lic ary avereno ny activation.');
    return null;
  }
}

// ⭐ RSA Signature Verification (MIARAKA 100% amin'ny signing)
function verifyRSASignature(payload, signature) {
  if (!signature) {
    console.error('❌ Signature manquante');
    return false;
  }
  if (!PUBLIC_KEY_FOUND || !PUBLIC_KEY) {
    console.error('❌ Public key non disponible');
    return false;
  }

  const canonicalString = createCanonicalString(payload);

  try {
    const verifier = crypto.createVerify('SHA256');
    verifier.update(canonicalString);
    verifier.end();

    const isValid = verifier.verify({
      key: PUBLIC_KEY,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 32,
    }, signature, 'base64');

    if (!isValid) {
      console.error('❌ Signature RSA invalide');
    } else {
      log('✅ Signature RSA valide');
    }
    return isValid;
  } catch (error) {
    console.error('❌ Erreur verification signature:', error.message);
    return false;
  }
}

const APP_BUILD_ID = process.env.APP_BUILD_ID ||
  crypto.createHash('sha256')
    .update(PUBLIC_KEY || MASTER_SECRET)
    .digest('hex')
    .substring(0, 16);

module.exports = {
  PUBLIC_KEY,
  PUBLIC_KEY_FOUND,
  APP_BUILD_ID,
  encryptData,
  decryptData,
  verifyRSASignature,
  getDerivedAESKey,
};