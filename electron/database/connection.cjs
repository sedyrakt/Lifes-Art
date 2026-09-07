'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { log, warn, error, getEncryptionKey } = require('./utils.cjs');

let dbInstance = null;

function getDbPath() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'stock.db');
  
  console.log('============================================================');
  console.log('📦 LIFE\'S ART DATABASE DEBUG');
  console.log('============================================================');
  console.log('📁 app.getPath("userData") :', userDataPath);
  console.log('📁 Database path            :', dbPath);
  console.log('📊 Database exists          :', fs.existsSync(dbPath));
  console.log('============================================================');
  
  return dbPath;
}

function createConnection() {
  const dbPath = getDbPath();
  const dbDir = path.dirname(dbPath);
  
  if (!fs.existsSync(dbDir)) {
    try {
      fs.mkdirSync(dbDir, { recursive: true });
      log(`📁 Dossier DB créé: ${dbDir}`);
    } catch (mkdirErr) {
      error(`❌ [connection] Impossible de créer '${dbDir}':`, mkdirErr.message);
      return null;
    }
  }
  
  let encryptionKey = null;
  try {
    encryptionKey = getEncryptionKey();
  } catch (keyErr) {
    warn('⚠️ Impossible récupérer encryption key:', keyErr.message);
  }
  
  try {
    const options = encryptionKey ? { key: encryptionKey } : {};
    const newDb = new Database(dbPath, options);
    
    // ⭐ FIX: Aza atao ON satria misy olana amin'ny foreign keys
    // newDb.pragma('foreign_keys = ON');
    
    try {
      newDb.pragma('journal_mode = WAL');
    } catch (pragmaErr) {
      warn('⚠️ journal_mode pragma:', pragmaErr.message);
    }
    
    try {
      newDb.pragma('busy_timeout = 30000');
    } catch (pragmaErr) {
      warn('⚠️ busy_timeout pragma:', pragmaErr.message);
    }
    
    try {
      newDb.pragma('optimize');
    } catch (pragmaErr) {
      warn('⚠️ optimize pragma:', pragmaErr.message);
    }
    
    const connectionTest = newDb.prepare('SELECT 1 AS ok').get();
    if (!connectionTest || Number(connectionTest.ok) !== 1) {
      throw new Error('SQLite connection test failed');
    }
    
    console.log('============================================================');
    console.log('✅ SQLITE DATABASE CONNECTED');
    console.log('============================================================');
    console.log('📁 Path       :', dbPath);
    console.log('📦 Size       :', fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0, 'bytes');
    console.log('🔐 Encrypted  :', encryptionKey ? 'YES' : 'NO');
    console.log('🟢 Open       :', newDb.open);
    console.log('============================================================');
    
    return newDb;
  } catch (err) {
    error(`❌ [connection] Erreur ouverture DB:`, err.message);
    return null;
  }
}

function getDb() {
  if (dbInstance && dbInstance.open) {
    return dbInstance;
  }
  dbInstance = createConnection();
  return dbInstance;
}

function closeDatabase() {
  try {
    if (dbInstance) {
      if (dbInstance.open) {
        dbInstance.close();
      }
      dbInstance = null;
    }
  } catch (err) {
    warn('⚠️ [connection] Erreur fermeture:', err.message);
    dbInstance = null;
  }
}

module.exports = { getDb, getDbPath, closeDatabase };