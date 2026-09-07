// ============================================================
// electron/ipc/utils.cjs - HANDLERS HO AN'NY UTILITAIRES
// ⭐ FANITSARA VAOVAO: Nampidirina ny console.log ho an'ny debug
// ⭐ FIX: Mamerina `true` mba tsy hiteraka ilay "function returned false"
// ⭐ NEW: Handler "utils:save-file-to-directory" (BULK BULLETIN)
// ============================================================

const { app, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ⭐ FANITSARA: Hardcoded ny DEBUG mba tsy hiankina amin'ny process.env.NODE_ENV
const DEBUG = false;

function log(...args) { if (DEBUG) console.log(...args); }
function error(...args) { console.error(...args); }

function registerUtilsHandlers(ipcMain, getMainWindow) {
  log('🔌 [utils.cjs] Enregistrement des handlers...');

  // EXPORT DATA
  ipcMain.handle('utils:export-data', async (event, data, format) => {
    try {
      log('🛠️ utils:export-data appelé, format:', format);
      if (!data) return { success: false, error: 'Aucune donnée à exporter' };
      let result;
      switch (format) {
        case 'json': result = JSON.stringify(data, null, 2); break;
        case 'csv':
          if (Array.isArray(data) && data.length > 0) {
            const headers = Object.keys(data[0]);
            const rows = data.map(row => headers.map(h => {
              const val = row[h];
              if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) return `"${val.replace(/"/g, '""')}"`;
              return val !== undefined && val !== null ? val : '';
            }).join(','));
            result = [headers.join(','), ...rows].join('\n');
          } else result = JSON.stringify(data, null, 2);
          break;
        case 'txt':
        default: result = typeof data === 'string' ? data : JSON.stringify(data, null, 2); break;
      }
      const tempDir = os.tmpdir(); const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `export_${timestamp}.${format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'txt'}`;
      const filePath = path.join(tempDir, filename);
      fs.writeFileSync(filePath, result, 'utf8');
      log(`✅ Export sauvegardé: ${filePath}`);
      return { success: true, data: result, path: filePath, filename, size: result.length };
    } catch (err) { error('❌ utils:export-data error:', err); return { success: false, error: err.message }; }
  });

  // PRINT
  ipcMain.handle('utils:print', async (event, content) => {
    try {
      log('🖨️ utils:print appelé');
      return { success: true, message: 'Impression simulée', content: content || 'Aucun contenu' };
    } catch (err) { error('❌ utils:print error:', err); return { success: false, error: err.message }; }
  });

  // SYSTEM INFO
  ipcMain.handle('utils:system-info', async () => {
    try {
      return { success: true, data: { platform: process.platform, arch: process.arch, node: process.version, electron: process.versions.electron, cpus: os.cpus().length, memory: os.totalmem(), freeMemory: os.freemem(), hostname: os.hostname(), uptime: os.uptime() } };
    } catch (err) { error('❌ utils:system-info error:', err); return { success: false, error: err.message }; }
  });

  // SAVE FILE (AVEC DIALOG)
  ipcMain.handle('utils:save-file', async (event, data, defaultPath) => {
    try {
      log('🛠️ utils:save-file BAIKO TONGANY! defaultPath:', defaultPath);
      const win = getMainWindow();
      if (win && !win.isDestroyed()) win.focus();
      console.log("========== AVANT DIALOG ==========");
      const downloadsPath = app.getPath('downloads');
      const fullDefaultPath = path.join(downloadsPath, defaultPath);
      const result = await dialog.showSaveDialog(win || null, { defaultPath: fullDefaultPath, filters: [{ name: 'PDF Files', extensions: ['pdf'] }], title: 'Enregistrer la facture sous...', buttonLabel: 'Enregistrer' });
      console.log("========== APRES DIALOG =========="); console.log('📂 Dialog result:', result);
      if (!result || typeof result !== 'object') return { success: false, error: 'Erreur inattendue lors de l\'ouverture du dialogue' };
      const { canceled, filePath } = result;
      if (canceled || !filePath) { log('ℹ️ utils:save-file annulé par l\'utilisateur'); return { success: false, canceled: true }; }
      const buffer = Buffer.from(data); fs.writeFileSync(filePath, buffer);
      log(`✅ Fichier sauvegardé avec succès: ${filePath}`);
      return { success: true, filePath };
    } catch (err) { error('❌ utils:save-file error:', err.message); return { success: false, error: err.message }; }
  });

  // ⭐ NEW: SAVE FILE TO DIRECTORY (TSY MISY DIALOG)
  ipcMain.handle('utils:save-file-to-directory', async (event, data, directory, filename) => {
    try {
      log('🛠️ utils:save-file-to-directory appelé. Directory:', directory, 'Filename:', filename);
      if (!directory || !filename) return { success: false, error: 'Directory ou filename manquant' };

      // Mamorona ny dossier raha tsy mbola misy
      fs.mkdirSync(directory, { recursive: true });
      const filePath = path.join(directory, filename);
      const buffer = Buffer.from(data);
      fs.writeFileSync(filePath, buffer);
      log(`✅ Fichier sauvegardé dans le dossier: ${filePath}`);
      return { success: true, filePath };
    } catch (err) { error('❌ utils:save-file-to-directory error:', err.message); return { success: false, error: err.message }; }
  });

  log('   ✅ utils:export-data enregistré'); log('   ✅ utils:print enregistré'); log('   ✅ utils:system-info enregistré'); log('   ✅ utils:save-file enregistré'); log('   ✅ utils:save-file-to-directory enregistré');
  return true; // ⭐ FIX: Mamerina true
}

module.exports = { registerUtilsHandlers };