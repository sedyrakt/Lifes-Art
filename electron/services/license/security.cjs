// ============================================================
// electron/services/license/security.cjs
// ⭐ FIX: Ampiana ny chemin ho an'ny production (dist-electron)
// ============================================================

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { 
  isPackaged, 
  RESOURCES_PATH, 
  EXCLUDED_FILES, 
  MAX_TAMPER_ATTEMPTS,
  DEVTOOLS_LOCKOUT_FILE,
} = require('./constants.cjs');
const { getLicensePath, getPublicKeyHash, canonicalizeJSON } = require('./utils.cjs');
const { PUBLIC_KEY } = require('./crypto.cjs');

const EFFECTIVE_RESOURCES_PATH = RESOURCES_PATH || path.join(__dirname, '../../');

let originalFs = null;
try {
  originalFs = require('original-fs');
} catch (e) {
  originalFs = fs;
}

let INTEGRITY_HASHES = {};
let INTEGRITY_METADATA = {};
let INTEGRITY_SIGNATURE = null;

let integrityCache = null;
let integrityCacheTime = 0;
const INTEGRITY_CACHE_TTL = 60000;

function loadIntegrityData() {
  try {
    const hashPaths = [
      path.join(EFFECTIVE_RESOURCES_PATH, 'generated/hashes.json'),
      path.join(EFFECTIVE_RESOURCES_PATH, 'app.asar.unpacked', 'generated/hashes.json'),
      path.join(EFFECTIVE_RESOURCES_PATH, 'app', 'generated/hashes.json'),
      path.join(__dirname, '../../generated/hashes.json'),
      path.join(process.cwd(), 'generated/hashes.json'),
      path.join(__dirname, '../../dist-electron/generated/hashes.json'),
      path.join(process.resourcesPath, 'dist-electron/generated/hashes.json'),
      // ⭐ FIX: Fanampiana paths ho an'ny production
      path.join(process.resourcesPath, 'app.asar.unpacked', 'dist-electron', 'generated', 'hashes.json'),
      path.join(process.resourcesPath, 'dist-electron', 'generated', 'hashes.json'),
    ];
    
    let hashFound = false;
    let rawData = null;
    for (const hashPath of hashPaths) {
      if (fs.existsSync(hashPath)) {
        rawData = originalFs.readFileSync(hashPath, 'utf8');
        hashFound = true;
        console.log(`✅ hashes.json chargé depuis: ${hashPath}`);
        break;
      }
    }
    
    if (!hashFound) {
      console.warn('⚠️ hashes.json tsy hita');
      return false;
    }
    
    const parsed = JSON.parse(rawData);
    INTEGRITY_METADATA = parsed.metadata || {};
    INTEGRITY_HASHES = parsed.files || {};
    
    console.log(`   Version: ${INTEGRITY_METADATA.version || 'inconnue'}`);
    console.log(`   Fichiers: ${Object.keys(INTEGRITY_HASHES).length}`);
    
    const sigPaths = [
      path.join(EFFECTIVE_RESOURCES_PATH, 'generated/hashes.sig'),
      path.join(EFFECTIVE_RESOURCES_PATH, 'app.asar.unpacked', 'generated/hashes.sig'),
      path.join(EFFECTIVE_RESOURCES_PATH, 'app', 'generated/hashes.sig'),
      path.join(__dirname, '../../generated/hashes.sig'),
      path.join(process.cwd(), 'generated/hashes.sig'),
      path.join(__dirname, '../../dist-electron/generated/hashes.sig'),
      path.join(process.resourcesPath, 'dist-electron/generated/hashes.sig'),
      // ⭐ FIX: Fanampiana paths ho an'ny production
      path.join(process.resourcesPath, 'app.asar.unpacked', 'dist-electron', 'generated', 'hashes.sig'),
      path.join(process.resourcesPath, 'dist-electron', 'generated', 'hashes.sig'),
    ];
    
    for (const sigPath of sigPaths) {
      if (fs.existsSync(sigPath)) {
        INTEGRITY_SIGNATURE = originalFs.readFileSync(sigPath, 'utf8').trim();
        console.log(`✅ hashes.sig chargé depuis: ${sigPath}`);
        break;
      }
    }
    
    return true;
  } catch (error) {
    console.warn('⚠️ Erreur chargement integrity:', error.message);
    return false;
  }
}

loadIntegrityData();

function verifyIntegritySignature() {
  if (!INTEGRITY_SIGNATURE) {
    console.error('❌ hashes.sig manquant');
    return false;
  }
  
  try {
    const canonicalData = canonicalizeJSON({
      metadata: INTEGRITY_METADATA,
      files: INTEGRITY_HASHES
    });
    const hashesJson = JSON.stringify(canonicalData);
    
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(hashesJson);
    verifier.end();
    
    const isValid = verifier.verify({
      key: PUBLIC_KEY,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 32,
    }, INTEGRITY_SIGNATURE, 'base64');
    
    if (!isValid) {
      console.error('❌ Signature hashes.sig invalide');
      return false;
    }
    return true;
  } catch (error) {
    console.error('❌ Erreur vérification signature:', error.message);
    return false;
  }
}

function verifyPublicKeyInMetadata() {
  const expectedHash = INTEGRITY_METADATA.publicKeyHash;
  if (!expectedHash) {
    console.warn('⚠️ publicKeyHash tsy hita ao amin\'ny metadata');
    return false;
  }
  const currentHash = getPublicKeyHash();
  if (currentHash !== expectedHash) {
    console.error('❌ Public key hash mismatch');
    return false;
  }
  return true;
}

function checkIntegrity(skipIfNoLicense = false) {
  if (!isPackaged) {
    console.log('ℹ️ Integrity check désactivé en développement');
    return true;
  }

  const now = Date.now();

  if (integrityCache !== null && (now - integrityCacheTime) < INTEGRITY_CACHE_TTL) {
    return integrityCache;
  }

  try {
    if (skipIfNoLicense) {
      const licensePath = getLicensePath();
      if (!fs.existsSync(licensePath)) {
        integrityCache = true;
        integrityCacheTime = now;
        return true;
      }
    }

    if (!verifyIntegritySignature()) {
      integrityCache = false;
      integrityCacheTime = now;
      return false;
    }

    if (!verifyPublicKeyInMetadata()) {
      integrityCache = false;
      integrityCacheTime = now;
      return false;
    }

    if (Object.keys(INTEGRITY_HASHES).length === 0) {
      integrityCache = false;
      integrityCacheTime = now;
      return false;
    }

    let allValid = true;
    let checked = 0;
    for (const [file, hash] of Object.entries(INTEGRITY_HASHES)) {
      const fileBaseName = path.basename(file);
      if (EXCLUDED_FILES.includes(fileBaseName) || EXCLUDED_FILES.includes(file)) {
        continue;
      }

      const possiblePaths = [
        path.join(EFFECTIVE_RESOURCES_PATH, 'app.asar.unpacked', file),
        path.join(EFFECTIVE_RESOURCES_PATH, 'app', file),
        path.join(EFFECTIVE_RESOURCES_PATH, file),
        path.join(__dirname, '../../', file),
        path.join(process.cwd(), file),
        path.join(__dirname, '../../dist-electron', file),
        path.join(process.resourcesPath, 'dist-electron', file),
        // ⭐ FIX: Fanampiana paths ho an'ny production
        path.join(process.resourcesPath, 'app.asar.unpacked', 'dist-electron', file),
      ];

      let found = false;
      let currentHash = '';
      for (const filePath of possiblePaths) {
        if (originalFs.existsSync(filePath)) {
          try {
            const data = originalFs.readFileSync(filePath);
            currentHash = crypto.createHash('sha256').update(data).digest('hex');
            found = true;
            break;
          } catch (e) { continue; }
        }
      }

      if (!found) {
        allValid = false;
        continue;
      }

      if (currentHash !== hash) {
        allValid = false;
      } else {
        checked++;
      }
    }

    console.log(`✅ Integrity check: ${checked}/${Object.keys(INTEGRITY_HASHES).length} fichiers vérifiés`);
    integrityCache = allValid;
    integrityCacheTime = now;
    return allValid;
  } catch (error) {
    integrityCache = false;
    integrityCacheTime = now;
    return false;
  }
}

let devToolsOpen = false;
let devToolsOpenCount = 0;
let devToolsCheckInterval = null;

function checkDevToolsLock() {
  try {
    if (fs.existsSync(DEVTOOLS_LOCKOUT_FILE)) {
      const data = JSON.parse(fs.readFileSync(DEVTOOLS_LOCKOUT_FILE, 'utf8'));
      const lockUntil = new Date(data.lockUntil);
      if (lockUntil > new Date()) {
        return { locked: true, until: lockUntil };
      }
      fs.unlinkSync(DEVTOOLS_LOCKOUT_FILE);
    }
    return { locked: false };
  } catch {
    return { locked: false };
  }
}

function setDevToolsLock() {
  try {
    const lockUntil = new Date();
    lockUntil.setHours(lockUntil.getHours() + 24);
    fs.writeFileSync(DEVTOOLS_LOCKOUT_FILE, JSON.stringify({
      lockUntil: lockUntil.toISOString(),
      reason: 'DevTools detection'
    }));
  } catch (e) {}
}

function unlockDevTools() {
  try {
    if (fs.existsSync(DEVTOOLS_LOCKOUT_FILE)) {
      fs.unlinkSync(DEVTOOLS_LOCKOUT_FILE);
    }
  } catch (e) {}
}

function isDevToolsOpened(webContents) {
  try {
    if (webContents && typeof webContents.isDevToolsOpened === 'function') {
      return webContents.isDevToolsOpened();
    }
    return devToolsOpen;
  } catch {
    return devToolsOpen;
  }
}

function checkDevTools() {
  const lock = checkDevToolsLock();
  if (lock.locked) return false;
  return !devToolsOpen;
}

function checkDevToolsReal(win) {
  try {
    if (win && win.webContents && typeof win.webContents.isDevToolsOpened === 'function') {
      return !win.webContents.isDevToolsOpened();
    }
    return checkDevTools();
  } catch {
    return checkDevTools();
  }
}

function startDevToolsMonitoring(win) {
  if (!win || !win.webContents) return;
  
  const ALLOW_SUPPORT_MODE = process.env.ALLOW_SUPPORT_MODE === 'true';
  const MAX_DEVTOOLS_OPEN = parseInt(process.env.MAX_DEVTOOLS_OPEN) || 10;
  
  win.webContents.on('devtools-opened', () => {
    devToolsOpen = true;
    
    if (isPackaged && !ALLOW_SUPPORT_MODE) {
      try {
        win.webContents.closeDevTools();
      } catch {}
    }
    
    devToolsOpenCount++;
    if (devToolsOpenCount >= MAX_DEVTOOLS_OPEN && isPackaged && !ALLOW_SUPPORT_MODE) {
      setDevToolsLock();
    }
  });
  
  win.webContents.on('devtools-closed', () => {
    devToolsOpen = false;
  });
  
  if (devToolsCheckInterval) {
    clearInterval(devToolsCheckInterval);
  }
  
  devToolsCheckInterval = setInterval(() => {
    try {
      if (win.webContents.isDevToolsOpened()) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          devToolsOpenCount++;
          
          if (isPackaged && !ALLOW_SUPPORT_MODE) {
            try {
              win.webContents.closeDevTools();
            } catch {}
          }
          
          if (devToolsOpenCount >= MAX_DEVTOOLS_OPEN && isPackaged && !ALLOW_SUPPORT_MODE) {
            setDevToolsLock();
          }
        }
      } else {
        devToolsOpen = false;
      }
    } catch {}
  }, 2000);
}

function stopDevToolsMonitoring() {
  if (devToolsCheckInterval) {
    clearInterval(devToolsCheckInterval);
    devToolsCheckInterval = null;
  }
}

function detectDebugger() {
  try {
    const args = process.execArgv;
    if (args.some(arg => 
      arg.includes('--inspect') || 
      arg.includes('--inspect-brk') ||
      arg.includes('--remote-debugging-port')
    )) return true;
    const argv = process.argv;
    if (argv.some(arg => 
      arg.includes('--inspect') || 
      arg.includes('--inspect-brk') ||
      arg.includes('--remote-debugging-port')
    )) return true;
    return false;
  } catch {
    return false;
  }
}

function checkDebugger() {
  return !detectDebugger();
}

let tamperAttempts = 0;
let tamperLockoutUntil = null;

try {
  const lockoutPath = path.join(os.homedir(), '.fitaia_lockout');
  if (fs.existsSync(lockoutPath)) {
    const date = new Date(fs.readFileSync(lockoutPath, 'utf8'));
    if (date > new Date()) {
      tamperLockoutUntil = date;
    } else {
      fs.unlinkSync(lockoutPath);
    }
  }
} catch {}

function handleTamperAttempt() {
  tamperAttempts++;
  
  if (tamperAttempts >= MAX_TAMPER_ATTEMPTS) {
    tamperLockoutUntil = new Date();
    tamperLockoutUntil.setMinutes(tamperLockoutUntil.getMinutes() + 60);
    
    try {
      const lockoutPath = path.join(os.homedir(), '.fitaia_lockout');
      fs.writeFileSync(lockoutPath, tamperLockoutUntil.toISOString());
    } catch {}
  }
}

const TIME_FILE = path.join(os.homedir(), '.fitaia_time.dat');

function getLastRunTime() {
  try {
    if (fs.existsSync(TIME_FILE)) {
      const data = fs.readFileSync(TIME_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.lastRun ? new Date(parsed.lastRun) : null;
    }
    return null;
  } catch {
    return null;
  }
}

function updateLastRunTime() {
  try {
    const data = {
      lastRun: new Date().toISOString(),
      version: '12.0'
    };
    fs.writeFileSync(TIME_FILE, JSON.stringify(data, null, 2));
  } catch {}
}

function checkClockTampering(shouldUpdate = false) {
  const lastRun = getLastRunTime();
  const now = new Date();
  
  if (lastRun) {
    if (now.getTime() < lastRun.getTime()) {
      return { valid: false, error: 'Clock tampering detected' };
    }
  }
  
  if (shouldUpdate) {
    updateLastRunTime();
  }
  
  return { valid: true };
}

module.exports = {
  INTEGRITY_HASHES,
  INTEGRITY_METADATA,
  INTEGRITY_SIGNATURE,
  loadIntegrityData,
  verifyIntegritySignature,
  verifyPublicKeyInMetadata,
  checkIntegrity,
  checkDevToolsLock,
  setDevToolsLock,
  unlockDevTools,
  isDevToolsOpened,
  checkDevTools,
  checkDevToolsReal,
  startDevToolsMonitoring,
  stopDevToolsMonitoring,
  detectDebugger,
  checkDebugger,
  handleTamperAttempt,
  tamperAttempts,
  tamperLockoutUntil,
  checkClockTampering,
  getLastRunTime,
  updateLastRunTime,
};