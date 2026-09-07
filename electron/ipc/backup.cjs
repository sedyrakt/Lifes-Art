'use strict';

const path = require('path');
const fs = require('fs');
const { getDb } = require('../database/connection.cjs');
const { log, error } = require('../database/utils.cjs');

const BACKUP_ENABLED = process.env.BACKUP_ENABLED !== 'false';
const BACKUP_AUTO_INTERVAL_HOURS = parseInt(process.env.BACKUP_AUTO_INTERVAL_HOURS) || 24;
const BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
const BACKUP_COMPRESS = process.env.BACKUP_COMPRESS !== 'false';
const BACKUP_DIR = process.env.DB_BACKUP_PATH || path.join(__dirname, '../../backups');

function getDbPath() {
  try {
    const db = getDb();
    const row = db.prepare('PRAGMA database_list').get();
    return row ? row.file : null;
  } catch (err) {
    error('⚠️ Erreur getDbPath:', err.message);
    return null;
  }
}

function logSecurityEventSync(action, entity, ip, userAgent, status, details = '') {
  try {
    const db = getDb();
    const stmt = db.prepare(`INSERT INTO audit_logs (action, entity, entity_id, entity_name, user_id, details, created_at) VALUES (?, ?, 0, ?, 0, ?, datetime('now'))`);
    stmt.run(action, entity, details);
  } catch (err) {
    error('⚠️ Erreur audit log:', err.message);
  }
}

function cleanupOldBackups() {
  if (!BACKUP_ENABLED) return;
  try {
    const now = Date.now();
    const retentionMs = BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    if (!fs.existsSync(BACKUP_DIR)) return;
    const files = fs.readdirSync(BACKUP_DIR);
    let deleted = 0;
    for (const file of files) {
      const filePath = path.join(BACKUP_DIR, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) continue;
        if (file.endsWith('.db') || file.endsWith('.db.gz') || file.endsWith('.db.backup') || file.endsWith('.json')) {
          const age = now - stat.mtimeMs;
          if (age > retentionMs) {
            fs.unlinkSync(filePath);
            deleted++;
          }
        }
      } catch (_) {}
    }
    if (deleted > 0) log(`✅ Nettoyage: ${deleted} fichier(s) supprimé(s)`);
  } catch (err) {
    error('⚠️ Erreur cleanup:', err.message);
  }
}

function backupDatabaseSync() {
  if (!BACKUP_ENABLED) return { success: false, error: 'Backup désactivé' };
  try {
    const db = getDb();
    if (!db || !db.open) return { success: false, error: 'Base de données non disponible' };
    const dbPath = getDbPath();
    if (!dbPath || !fs.existsSync(dbPath)) return { success: false, error: 'Fichier DB introuvable' };
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let backupPath = path.join(BACKUP_DIR, `backup_${timestamp}.db`);
    db.exec(`VACUUM INTO '${backupPath}'`);
    log(`📦 Backup physique créé: ${backupPath}`);
    if (BACKUP_COMPRESS) {
      try {
        const zlib = require('zlib');
        const data = fs.readFileSync(backupPath);
        const compressed = zlib.gzipSync(data);
        const gzPath = backupPath + '.gz';
        fs.writeFileSync(gzPath, compressed);
        fs.unlinkSync(backupPath);
        backupPath = gzPath;
        log(`📦 Backup compressé: ${backupPath}`);
      } catch (err) {
        error('⚠️ Erreur compression:', err.message);
      }
    }
    logSecurityEventSync('backup_created', 'system', '127.0.0.1', 'Electron', 1, `Path: ${backupPath}`);
    cleanupOldBackups();
    return { success: true, path: backupPath };
  } catch (err) {
    error('❌ Erreur backup:', err.message);
    logSecurityEventSync('backup_failed', 'system', '127.0.0.1', 'Electron', 0, err.message);
    return { success: false, error: err.message };
  }
}

function exportAllDataSync() {
  try {
    const db = getDb();
    if (!db || !db.open) return { success: false, error: 'Base de données non disponible' };
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'fts%' AND name NOT LIKE '%_fts'`).all();
    const data = {};
    for (const t of tables) {
      const rows = db.prepare(`SELECT * FROM "${t.name}"`).all();
      data[t.name] = rows;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPath = path.join(BACKUP_DIR, `export_${timestamp}.json`);
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
    log(`📦 Export JSON créé: ${exportPath} (${Object.keys(data).length} tables)`);
    logSecurityEventSync('export_json', 'system', '127.0.0.1', 'Electron', 1, `Path: ${exportPath}`);
    return { success: true, path: exportPath, tables: Object.keys(data) };
  } catch (err) {
    error('❌ Erreur export JSON:', err.message);
    return { success: false, error: err.message };
  }
}

function registerBackupHandlers(ipcMain) {
  if (!ipcMain) return false;
  log('💾 Enregistrement des handlers backup...');
  const channels = ['backup:database','backup:restore','backup:vacuum','backup:optimize','backup:list','backup:delete','backup:auto','backup:status','backup:export-json'];
  for (const ch of channels) try { ipcMain.removeHandler(ch); } catch (_) {}

  ipcMain.handle('backup:database', () => {
    try {
      return backupDatabaseSync();
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('backup:restore', (event, backupPath) => {
    try {
      const normalizedPath = path.normalize(backupPath);
      if (!fs.existsSync(normalizedPath)) return { success: false, error: 'Fichier backup non trouvé. Vérifiez que le fichier existe toujours.' };
      let realPath = normalizedPath;
      if (normalizedPath.endsWith('.gz')) {
        try {
          const zlib = require('zlib');
          const compressed = fs.readFileSync(normalizedPath);
          const data = zlib.gunzipSync(compressed);
          const tempPath = normalizedPath.replace(/\.gz$/, '');
          fs.writeFileSync(tempPath, data);
          realPath = tempPath;
        } catch (decompressErr) {
          return { success: false, error: `Erreur de décompression: ${decompressErr.message}` };
        }
      }
      const dbPath = getDbPath();
      if (!dbPath) return { success: false, error: 'Impossible de localiser la base de données cible.' };
      const db = getDb();
      try { db.close(); } catch (_) {}
      fs.copyFileSync(realPath, dbPath);
      log(`✅ Restauration DB: ${realPath} -> ${dbPath}`);
      if (normalizedPath.endsWith('.gz') && realPath !== normalizedPath) try { fs.unlinkSync(realPath); } catch (_) {}
      logSecurityEventSync('restore_success', 'system', '127.0.0.1', 'Electron', 1, `Path: ${backupPath}`);
      return { success: true, message: 'Base de données restaurée avec succès. Veuillez redémarrer l\'application.' };
    } catch (err) {
      error('❌ Erreur restauration:', err.message);
      logSecurityEventSync('restore_failed', 'system', '127.0.0.1', 'Electron', 0, err.message);
      return { success: false, error: err.message || 'Erreur inattendue lors de la restauration.' };
    }
  });

  ipcMain.handle('backup:vacuum', () => {
    try {
      getDb().exec('VACUUM');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('backup:optimize', () => {
    try {
      const db = getDb();
      db.exec('ANALYZE');
      db.exec('VACUUM');
      db.exec('PRAGMA optimize');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('backup:list', (event, limit = 50) => {
    try {
      const backups = [];
      if (!fs.existsSync(BACKUP_DIR)) return { success: true, data: [], total: 0, limit };
      const files = fs.readdirSync(BACKUP_DIR);
      for (const file of files) {
        const filePath = path.join(BACKUP_DIR, file);
        try {
          const stat = fs.statSync(filePath);
          if (!stat.isDirectory() && (file.endsWith('.db') || file.endsWith('.db.gz') || file.endsWith('.db.backup') || file.endsWith('.json'))) {
            backups.push({ name: file, path: filePath, size: stat.size, sizeMB: (stat.size / (1024 * 1024)).toFixed(2), created: stat.mtime, createdISO: stat.mtime.toISOString() });
          }
        } catch (_) {}
      }
      backups.sort((a, b) => b.created.getTime() - a.created.getTime());
      return { success: true, data: backups.slice(0, limit), total: backups.length, limit };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('backup:delete', (event, backupPath) => {
    try {
      if (!backupPath || !backupPath.startsWith(BACKUP_DIR)) return { success: false, error: 'Chemin invalide' };
      if (!fs.existsSync(backupPath)) return { success: false, error: 'Fichier non trouvé' };
      fs.unlinkSync(backupPath);
      logSecurityEventSync('backup_deleted', 'system', '127.0.0.1', 'Electron', 1, `Path: ${backupPath}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('backup:auto', () => {
    try {
      return backupDatabaseSync();
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('backup:status', () => {
    try {
      const stats = { enabled: BACKUP_ENABLED, autoIntervalHours: BACKUP_AUTO_INTERVAL_HOURS, retentionDays: BACKUP_RETENTION_DAYS, compress: BACKUP_COMPRESS, backupDir: BACKUP_DIR, totalBackups: 0, totalSizeMB: 0, lastBackup: null };
      if (fs.existsSync(BACKUP_DIR)) {
        const files = fs.readdirSync(BACKUP_DIR);
        let totalSize = 0, lastBackupDate = null;
        for (const file of files) {
          const filePath = path.join(BACKUP_DIR, file);
          try {
            const stat = fs.statSync(filePath);
            if (!stat.isDirectory() && (file.endsWith('.db') || file.endsWith('.db.gz') || file.endsWith('.db.backup') || file.endsWith('.json'))) {
              totalSize += stat.size;
              if (!lastBackupDate || stat.mtime > lastBackupDate) lastBackupDate = stat.mtime;
            }
          } catch (_) {}
        }
        stats.totalBackups = files.length;
        stats.totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        stats.lastBackup = lastBackupDate ? lastBackupDate.toISOString() : null;
      }
      return { success: true, data: stats };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('backup:export-json', () => {
    try {
      return exportAllDataSync();
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  log('✅ Backup handlers enregistrés (synchronous, avec export JSON et restore corrigé)');
  return true; // ⭐ FIX: Mamerina true!
}

module.exports = { registerBackupHandlers };