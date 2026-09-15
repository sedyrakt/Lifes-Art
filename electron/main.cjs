// ============================================================
// electron/main.cjs - Lifes-Art ERP
// ⭐ VERSION FINALE - LICENSE + BACKUP FORCE + LOCALE FR + PARAMETRES PAIE
// ⭐ NOUVEAU: Snapshot automatique du stock (démarrage + 6h + quit)
// ⭐ NOUVEAU: Backfill snapshots au premier démarrage
// ⭐ NOUVEAU: Prune snapshots (garder 2 ans)
// ⭐ FIX: DASHBOARD → utilise ./ipc/dashboard/index.cjs (module)
// ⭐ FIX: Détection auto dossier vs fichier pour DASHBOARD et STOCK
// ⭐ FIX: registerHandlerModule — support registerPaymentHandlers + registerPaymentsHandlers
// ⭐ FIX: Suppression des blocs FORCE REGISTRATION redondants
// ⭐ FIX: registeredModules Set pour éviter les doubles enregistrements
// ⭐ FIX: No handler registered for 'payments:get-by-employe'
// ⭐ FIX: safeHandle pour TOUS les handlers inline (utils:save-file, db:*, etc.)
// ============================================================
'use strict';

const { app, BrowserWindow, ipcMain, session, shell, protocol, Menu, dialog } = require('electron');
const path = require('path'), fs = require('fs');
const dotenv = require('dotenv');

// ⭐⭐⭐ LOCALE FRANÇAIS (24h, format FR) ⭐⭐⭐
app.commandLine.appendSwitch('lang', 'fr-FR');
// ⭐⭐⭐ FIN LOCALE ⭐⭐⭐

dotenv.config({ path: path.join(app.getAppPath(), '.env') });

// ⭐ CONSTANTES
const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';
const APP_ROOT = path.resolve(__dirname, '..');
const BASE_PATH = !isDev && fs.existsSync(path.join(__dirname, '..', 'dist-electron'))
  ? path.join(__dirname, '..', 'dist-electron')
  : path.resolve(__dirname, '.');

const PRELOAD_PATH = path.join(BASE_PATH, 'preload.cjs');
const DIST_PATH = path.join(APP_ROOT, 'dist');
const DIST_INDEX = path.join(DIST_PATH, 'index.html');
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

// ⭐ DATABASE MODULES
const { initDatabase, closeDatabase } = require('./database/init.cjs');
const { getDb, getDbPath, getDatabaseDebugInfo } = require('./database/connection.cjs');
const { log, warn, error } = require('./database/utils.cjs');

// ⭐⭐⭐ STOCK SNAPSHOTS MODULE ⭐⭐⭐
const {
  saveTodaySnapshot,
  pruneOldSnapshots,
  backfillSnapshots,
} = require('./database/stockSnapshots.cjs');

// ⭐ VARIABLES D'ÉTAT
let mainWindow = null;
let databaseInitialized = false;
let handlersRegistered = false;
let isQuitting = false;
let windowShown = false;
let snapshotInterval = null;

// ⭐⭐⭐ SET POUR ÉVITER LES DOUBLES ENREGISTREMENTS DE MODULES IPC ⭐⭐⭐
const registeredModules = new Set();

// ⭐ LOGGING
function mainLog(...args) { console.log('[MAIN]', ...args); }
function mainWarn(...args) { console.warn('[MAIN]', ...args); }
function mainError(...args) { console.error('[MAIN]', ...args); }

// ⭐⭐⭐ HELPER safeHandle — évite les erreurs "second handler" ⭐⭐⭐
function safeHandle(channel, handler) {
  try {
    ipcMain.removeHandler(channel);
  } catch (_) {}
  ipcMain.handle(channel, handler);
  return true;
}

// ⭐ DATABASE INITIALIZATION
async function initializeDatabase() {
  if (databaseInitialized) { mainLog('ℹ️ Database déjà initialisée'); return true; }
  try {
    mainLog('🔄 Initialisation de la database...');
    const result = await initDatabase();
    if (!result || !result.success) throw new Error('initDatabase() a échoué');
    const db = getDb();
    if (!db || !db.open) throw new Error('SQLite database non ouverte après initDatabase()');
    databaseInitialized = true;
    mainLog('✅ DATABASE READY');
    return true;
  } catch (err) {
    databaseInitialized = false;
    mainError('❌ DATABASE INITIALIZATION FAILED:', err.message);
    throw err;
  }
}

function shutdownDatabase() {
  if (!databaseInitialized) return;
  try {
    closeDatabase();
    databaseInitialized = false;
    mainLog('✅ Database fermée');
  } catch (err) { mainWarn('⚠️ Erreur fermeture DB:', err.message); }
}

// ⭐⭐⭐ SNAPSHOT SCHEDULER ⭐⭐⭐
function startSnapshotScheduler() {
  try {
    saveTodaySnapshot();
    mainLog('📸 Snapshot initial du stock enregistré');
  } catch (err) {
    mainError('❌ Snapshot initial:', err.message);
  }

  try {
    pruneOldSnapshots(730);
  } catch (err) {
    mainWarn('⚠️ Prune snapshots:', err.message);
  }

  try {
    const db = getDb();
    if (db && db.open) {
      const count = db.prepare(`SELECT COUNT(*) AS c FROM stock_snapshots`).get();
      const existingCount = Number(count?.c) || 0;
      if (existingCount <= 1) {
        mainLog('🔧 Backfill snapshots (30 derniers jours)...');
        const today = new Date();
        const from = new Date(today.getTime() - 30 * 86400000);
        const fmt = (d) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };
        const inserted = backfillSnapshots(fmt(from), fmt(today));
        mainLog(`✅ Backfill terminé: ${inserted} snapshot(s) créé(s)`);
      } else {
        mainLog(`ℹ️ Backfill ignoré (${existingCount} snapshots existants)`);
      }
    }
  } catch (err) {
    mainWarn('⚠️ Backfill snapshots:', err.message);
  }

  if (snapshotInterval) clearInterval(snapshotInterval);
  snapshotInterval = setInterval(() => {
    try {
      saveTodaySnapshot();
      mainLog('📸 Snapshot périodique (6h) enregistré');
    } catch (err) {
      mainError('❌ Snapshot périodique:', err.message);
    }
  }, 6 * 60 * 60 * 1000);

  mainLog('⏰ Snapshot scheduler démarré (interval: 6h)');
}

function stopSnapshotScheduler() {
  if (snapshotInterval) {
    clearInterval(snapshotInterval);
    snapshotInterval = null;
    mainLog('⏹️ Snapshot scheduler arrêté');
  }
}

// ⭐ PROTOCOLE LOCAL-IMAGE
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon', '.bmp': 'image/bmp', '.avif': 'image/avif'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

function registerLocalImageProtocol() {
  try {
    protocol.handle('local-image', async request => {
      try {
        let pathname = request.url.replace(/^local-image:\/\//i, '');
        try { pathname = decodeURIComponent(pathname); } catch (_) {}
        pathname = pathname.replace(/^\/+/, '');
        const queryIndex = pathname.indexOf('?');
        if (queryIndex !== -1) pathname = pathname.substring(0, queryIndex);
        const uploadsDir = path.resolve(app.getPath('userData'), 'uploads');
        const requestedPath = path.resolve(uploadsDir, pathname);
        const normalizedUploads = path.resolve(uploadsDir);

        if (requestedPath !== normalizedUploads && !requestedPath.startsWith(normalizedUploads + path.sep)) {
          mainWarn('🚫 Tentative accès fichier interdit:', pathname);
          return new Response('Forbidden', { status: 403 });
        }
        if (!fs.existsSync(requestedPath)) return new Response('Image not found', { status: 404 });
        const stat = await fs.promises.stat(requestedPath);
        if (!stat.isFile()) return new Response('Not a file', { status: 400 });

        return new Response(await fs.promises.readFile(requestedPath), {
          status: 200,
          headers: { 'Content-Type': getMimeType(requestedPath), 'Cache-Control': 'public, max-age=31536000, immutable' }
        });
      } catch (err) {
        mainError('❌ local-image:// error:', err.message);
        return new Response('Internal Server Error', { status: 500 });
      }
    });
    mainLog('✅ local-image:// protocol enregistré');
  } catch (err) { mainError('❌ Impossible enregistrer local-image://:', err.message); }
}

// ⭐ WINDOW
function showMainWindow(reason = 'unknown') {
  if (windowShown || !mainWindow || mainWindow.isDestroyed()) return;
  windowShown = true;
  try {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    mainLog(`🟢 Window affichée - ${reason}`);
    if (isDev) {
      mainLog('🛠️ DEVTOOLS mode');
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } catch (err) { mainError('❌ Impossible afficher BrowserWindow:', err.message); }
}

function createMainWindow() {
  if (mainWindow) {
    if (!mainWindow.isDestroyed()) { mainWindow.show(); mainWindow.focus(); }
    return mainWindow;
  }

  mainLog('🪟 Création BrowserWindow...');
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1100, minHeight: 700, show: true, backgroundColor: '#0A1222', autoHideMenuBar: true,
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: !isDev,
      allowRunningInsecureContent: isDev,
      devTools: isDev
    }
  });

  try {
    mainWindow.setMenuBarVisibility(false);
    mainWindow.setAutoHideMenuBar(true);
  } catch (err) { mainWarn('⚠️ Impossible masquer menu:', err.message); }

  mainWindow.webContents.on('did-finish-load', () => {
    mainLog('✅ Renderer: did-finish-load');
    showMainWindow('did-finish-load');
  });

  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !windowShown) {
      mainWarn('⚠️ Timeout - affichage forcé');
      showMainWindow('timeout-fallback');
    }
  }, 5000);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isDev && url.startsWith(DEV_SERVER_URL)) return;
    if (url.startsWith('file://') || url.startsWith('local-image://')) return;
    event.preventDefault();
    if (url.startsWith('https:') || url.startsWith('http:')) shell.openExternal(url);
  });

  if (!isDev) {
    mainWindow.webContents.on('devtools-opened', () => {
      try { mainWindow.webContents.closeDevTools(); } catch (_) {}
    });
  }

  mainWindow.on('closed', () => setImmediate(() => { mainWindow = null; }));
  loadFrontend();
  return mainWindow;
}

async function loadFrontend() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    if (isDev) { await mainWindow.loadURL(DEV_SERVER_URL); return; }
    if (!fs.existsSync(DIST_INDEX)) throw new Error(`Frontend production introuvable: ${DIST_INDEX}`);
    await mainWindow.loadFile(DIST_INDEX);
  } catch (err) { mainError('❌ Erreur chargement frontend:', err.message); }
}

// ⭐⭐⭐ IPC MODULE LOADER (CORRIGÉ) ⭐⭐⭐
function registerHandlerModule(label, modulePath) {
  const key = `${label}:${modulePath}`;

  if (registeredModules.has(key)) {
    mainWarn(`⚠️ IPC ${label} déjà enregistré, skip`);
    return true;
  }

  try {
    const absolutePath = path.resolve(BASE_PATH, modulePath);
    mainLog(`🔎 IPC ${label}:`, absolutePath);

    if (!fs.existsSync(absolutePath)) {
      mainError(`❌ IPC ${label} introuvable:`, absolutePath);
      return false;
    }

    const handler = require(absolutePath);
    mainLog(`📦 IPC ${label} module chargé. Exports:`, Object.keys(handler));

    let result = false;

    if (typeof handler === 'function') {
      result = handler(ipcMain);
    } else if (handler && typeof handler.register === 'function') {
      result = handler.register(ipcMain);
    } else if (handler && typeof handler.registerHandlers === 'function') {
      result = handler.registerHandlers(ipcMain);
    } else if (handler && typeof handler.registerLicenseHandlers === 'function') {
      result = handler.registerLicenseHandlers(ipcMain);
    } else if (handler && typeof handler.registerPaymentsHandlers === 'function') {
      result = handler.registerPaymentsHandlers(ipcMain);
    } else if (handler && typeof handler.registerPaymentHandlers === 'function') {
      result = handler.registerPaymentHandlers(ipcMain);
    } else if (handler && typeof handler.registerEmployesHandlers === 'function') {
      result = handler.registerEmployesHandlers(ipcMain);
    } else if (handler && typeof handler.registerParametresPaieHandlers === 'function') {
      result = handler.registerParametresPaieHandlers(ipcMain);
    } else if (handler && typeof handler.registerStockHandlers === 'function') {
      result = handler.registerStockHandlers(ipcMain);
    } else if (handler && typeof handler.registerDashboardHandlers === 'function') {
      result = handler.registerDashboardHandlers(ipcMain);
    } else if (handler && typeof handler.registerStockSnapshotsHandlers === 'function') {
      result = handler.registerStockSnapshotsHandlers(ipcMain);
    } else if (handler && typeof handler === 'object') {
      for (const key2 of Object.keys(handler)) {
        if (typeof handler[key2] === 'function' && key2.toLowerCase().includes('register')) {
          result = handler[key2](ipcMain);
          if (result) break;
        }
      }
    }

    if (!result) {
      mainError(`❌ IPC ${label} - Aucune fonction d'enregistrement valide ou retour false`);
      return false;
    }

    registeredModules.add(key);
    mainLog(`✅ IPC ${label} enregistré avec succès`);
    return true;
  } catch (err) {
    mainError(`❌ Erreur IPC ${label}:`, err.message, err.stack);
    return false;
  }
}

// ⭐ DÉTECTION AUTOMATIQUE DES CHEMINS
function resolveModulePath(preferredPath, fallbackPath) {
  const preferred = path.resolve(BASE_PATH, preferredPath);
  if (fs.existsSync(preferred)) return preferredPath;
  const fallback = path.resolve(BASE_PATH, fallbackPath);
  if (fs.existsSync(fallback)) return fallbackPath;
  return preferredPath;
}

// ⭐ REGISTER ALL IPC (CORRIGÉ - SANS FORCE REGISTRATION)
function registerAllIPC() {
  if (handlersRegistered) { mainLog('ℹ️ IPC handlers déjà enregistrés'); return true; }

  mainLog('============================================================');
  mainLog('🔌 ENREGISTREMENT IPC HANDLERS');
  mainLog('============================================================');

  const dashboardPath = resolveModulePath('./ipc/dashboard/index.cjs', './ipc/dashboard.cjs');
  const stockPath = resolveModulePath('./ipc/stock/index.cjs', './ipc/stock.cjs');
  const paymentsPath = resolveModulePath('./ipc/payments/index.cjs', './ipc/payments.cjs');

  mainLog(`📌 DASHBOARD path: ${dashboardPath}`);
  mainLog(`📌 STOCK path: ${stockPath}`);
  mainLog(`📌 PAYMENTS path: ${paymentsPath}`);

  const handlerModules = [
    ['AUTH', './ipc/auth.cjs'],
    ['USERS', './ipc/users.cjs'],
    ['PRODUCTS', './ipc/products.cjs'],
    ['CATEGORIES', './ipc/categories.cjs'],
    ['FOURNISSEURS', './ipc/fournisseurs.cjs'],
    ['CLIENTS', './ipc/clients.cjs'],
    ['ORDERS', './ipc/orders.cjs'],
    ['STOCK', stockPath],
    ['ACHATS', './ipc/achats.cjs'],
    ['EMPLOYES', './ipc/employes.cjs'],
    ['DEPENSES', './ipc/expenses.cjs'],
    ['PAIEMENTS', paymentsPath],
    ['DASHBOARD', dashboardPath],
    ['REPORTS', './ipc/reports.cjs'],
    ['IMAGES', './ipc/images.cjs'],
    ['SETTINGS', './ipc/settings.cjs'],
    ['BACKUP', './ipc/backup.cjs'],
    ['DIALOG', './ipc/dialog.cjs'],
    ['LICENSE', './ipc/license.cjs'],
    ['VENTES', './ipc/ventes.cjs'],
    ['PARAMETRES_PAIE', './ipc/parametres-paie.cjs'],
    ['STOCK_SNAPSHOTS', './ipc/stock-snapshots.cjs'],
  ];

  let successCount = 0;
  const failedModules = [];

  for (const [label, modulePath] of handlerModules) {
    mainLog(`\n🔧 Enregistrement du module ${label}...`);
    const success = registerHandlerModule(label, modulePath);
    if (success) { successCount++; }
    else { failedModules.push(label); }
  }

  // ════════════════════════════════════════════════════════════
  // ⭐ HANDLERS INLINE — Utilise safeHandle (idempotent)
  // ════════════════════════════════════════════════════════════

  // ⭐ DB debug handlers
  safeHandle('db:getPath', () => ({ success: true, path: getDbPath() }));
  safeHandle('db:debug', () => getDatabaseDebugInfo());
  mainLog('✅ IPC db:getPath + db:debug enregistrés');

  // ⭐ App info
  safeHandle('app:getInfo', () => ({
    success: true,
    name: app.getName(),
    version: app.getVersion(),
    isPackaged: app.isPackaged,
    isDev,
    userData: app.getPath('userData'),
    dbPath: getDbPath(),
  }));
  mainLog('✅ IPC app:getInfo enregistré');

  // ⭐ Dialog ShowSaveDialog
  safeHandle('dialog:show-save-dialog', async (event, options) => {
    try { return await dialog.showSaveDialog(options); }
    catch (err) { return { canceled: true, error: err.message }; }
  });
  mainLog('✅ IPC dialog:show-save-dialog enregistré');

  // ⭐ Utils save-file
  safeHandle('utils:save-file', async (event, data, defaultPath, filters) => {
    try {
      if (data === undefined || data === null) {
        return { success: false, error: 'Aucune donnée à enregistrer.' };
      }

      let parentWindow = null;
      try { parentWindow = BrowserWindow.fromWebContents(event.sender); } catch (_) { parentWindow = null; }

      const safeFilters = Array.isArray(filters) && filters.length > 0
        ? filters
            .filter(f => f && typeof f.name === 'string' && Array.isArray(f.extensions) && f.extensions.length > 0)
            .map(f => ({
              name: f.name,
              extensions: f.extensions
                .filter(ext => typeof ext === 'string')
                .map(ext => ext.replace(/^\./, ''))
            }))
            .filter(f => f.extensions.length > 0)
        : [{ name: 'Tous les fichiers', extensions: ['*'] }];

      let safeDefaultPath = typeof defaultPath === 'string' && defaultPath.trim()
        ? defaultPath.trim().replace(/\0/g, '')
        : 'document';

      const dialogOptions = {
        title: 'Enregistrer le fichier',
        defaultPath: safeDefaultPath,
        filters: safeFilters,
        properties: ['createDirectory', 'showOverwriteConfirmation']
      };

      const result = parentWindow
        ? await dialog.showSaveDialog(parentWindow, dialogOptions)
        : await dialog.showSaveDialog(dialogOptions);

      if (!result || result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      const filePath = result.filePath;

      let buffer;
      if (Buffer.isBuffer(data)) buffer = data;
      else if (data instanceof ArrayBuffer) buffer = Buffer.from(new Uint8Array(data));
      else if (ArrayBuffer.isView(data)) buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
      else if (typeof data === 'string') buffer = Buffer.from(data, 'utf8');
      else if (Array.isArray(data)) buffer = Buffer.from(data);
      else return { success: false, error: `Type de données non supporté: ${typeof data}` };

      const directory = path.dirname(filePath);
      await fs.promises.mkdir(directory, { recursive: true });
      await fs.promises.writeFile(filePath, buffer);

      const stat = await fs.promises.stat(filePath);
      if (!stat.isFile()) return { success: false, error: 'Le fichier n\'a pas été créé correctement.' };

      return { success: true, canceled: false, filePath, size: stat.size };
    } catch (err) {
      return {
        success: false,
        canceled: false,
        error: err?.message || 'Erreur inconnue lors de l\'enregistrement.'
      };
    }
  });
  mainLog('✅ IPC utils:save-file enregistré');

  // ⭐ Utils save-file-to-directory
  safeHandle('utils:save-file-to-directory', async (event, data, directory, filename) => {
    try {
      if (!directory || !filename) return { success: false, error: 'Directory ou filename manquant' };
      fs.mkdirSync(directory, { recursive: true });
      const filePath = path.join(directory, filename);
      await fs.promises.writeFile(filePath, Buffer.from(data));
      return { success: true, filePath };
    } catch (err) { return { success: false, error: err.message }; }
  });
  mainLog('✅ IPC utils:save-file-to-directory enregistré');

  handlersRegistered = true;
  mainLog('============================================================');
  mainLog(`✅ IPC READY: ${successCount}/${handlerModules.length} modules`);
  if (failedModules.length > 0) mainWarn(`⚠️ Modules échoués: ${failedModules.join(', ')}`);
  mainLog('============================================================');
  return true;
}

// ⭐ SECURITY
function configureSecurity() {
  try {
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      callback(new Set(['notifications']).has(permission));
    });
  } catch (err) { mainWarn('⚠️ Permission handler:', err.message); }
}

// ⭐ SINGLE INSTANCE
function setupSingleInstance() {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    mainWarn('⚠️ Instance déjà ouverte');
    app.quit();
    return false;
  }
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
  return true;
}

// ⭐ APP READY
app.whenReady().then(async () => {
  mainLog('============================================================');
  mainLog("🚀 Lifes-Art ELECTRON START");
  mainLog('============================================================');
  mainLog('📦 Electron:', process.versions.electron);
  mainLog('🟢 Node:', process.versions.node);
  mainLog('🛠️ Development:', isDev);
  mainLog('📁 BASE_PATH:', BASE_PATH);
  mainLog('🌍 Locale forcée: fr-FR (24h format)');

  try { Menu.setApplicationMenu(null); } catch (err) { mainWarn('⚠️ Menu:', err.message); }
  configureSecurity();
  registerLocalImageProtocol();

  try {
    await initializeDatabase();
  } catch (dbErr) {
    mainError('❌ Database initialization failed:', dbErr.message);
    app.quit();
    return;
  }

  try {
    registerAllIPC();
  } catch (ipcErr) {
    mainError('❌ IPC INITIALIZATION FAILED:', ipcErr.message);
  }

  try {
    startSnapshotScheduler();
  } catch (snapErr) {
    mainError('❌ Snapshot scheduler failed:', snapErr.message);
  }

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });

  mainLog("🟢 Lifes-Art READY");
}).catch(err => {
  mainError('❌ ELECTRON STARTUP FAILED:', err.message);
  app.quit();
});

// ⭐ LIFECYCLE
app.on('before-quit', () => {
  if (isQuitting) return;
  isQuitting = true;
  try {
    saveTodaySnapshot();
    mainLog('📸 Snapshot final du stock enregistré');
  } catch (err) {
    mainWarn('⚠️ Snapshot final:', err.message);
  }
  stopSnapshotScheduler();
  shutdownDatabase();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (!isQuitting) isQuitting = true;
    try { saveTodaySnapshot(); } catch (_) {}
    stopSnapshotScheduler();
    shutdownDatabase();
    app.quit();
  }
});

process.on('uncaughtException', err => {
  mainError('❌ UNCAUGHT EXCEPTION:', err.message);
});

process.on('unhandledRejection', reason => {
  mainError('❌ UNHANDLED REJECTION:', reason);
});

// ⭐ EXPORTS
module.exports = {
  createMainWindow,
  initializeDatabase,
  shutdownDatabase,
  registerAllIPC,
  registerLocalImageProtocol,
  startSnapshotScheduler,
  stopSnapshotScheduler,
};