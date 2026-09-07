// ============================================================
// electron/main.cjs - TahiryPro ERP
// ⭐ VERSION FINALE - LICENSE HANDLER EXPLICITE
// ⭐ FIX: Mampiditra mivantana ny registerLicenseHandlers
// ============================================================
'use strict';

const {app,BrowserWindow,ipcMain,session,shell,protocol,Menu,dialog}=require('electron');
const path=require('path'),fs=require('fs');
const dotenv = require('dotenv');

dotenv.config({
  path: path.join(app.getAppPath(), '.env')
});

// ============================================================
// ⭐ CONSTANTES
// ============================================================

const isDev=!app.isPackaged||process.env.NODE_ENV==='development';
const APP_ROOT=path.resolve(__dirname,'..');

// ⭐ Raha production, ampiasao ny dist-electron/
const BASE_PATH = !isDev && fs.existsSync(path.join(__dirname, '..', 'dist-electron'))
  ? path.join(__dirname, '..', 'dist-electron')
  : path.resolve(__dirname, '.');

const PRELOAD_PATH = path.join(BASE_PATH, 'preload.cjs');
const DIST_PATH = path.join(APP_ROOT, 'dist');
const DIST_INDEX = path.join(DIST_PATH, 'index.html');
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

// ============================================================
// ⭐ DATABASE MODULES
// ============================================================
const {initDatabase,closeDatabase}=require('./database/init.cjs');
const {getDb,getDbPath,getDatabaseDebugInfo}=require('./database/connection.cjs');
const {log,warn,error}=require('./database/utils.cjs');

// ============================================================
// ⭐ VARIABLES D'ÉTAT
// ============================================================
let mainWindow=null;
let databaseInitialized=false;
let handlersRegistered=false;
let isQuitting=false;
let windowShown=false;

// ============================================================
// ⭐ LOGGING
// ============================================================
function mainLog(...args){console.log('[MAIN]',...args);}
function mainWarn(...args){console.warn('[MAIN]',...args);}
function mainError(...args){console.error('[MAIN]',...args);}

// ============================================================
// ⭐ DATABASE INITIALIZATION
// ============================================================
async function initializeDatabase(){
  if(databaseInitialized){mainLog('ℹ️ Database déjà initialisée');return true;}
  try{
    mainLog('🔄 Initialisation de la database...');
    const result=await initDatabase();
    if(!result||!result.success)throw new Error('initDatabase() a échoué');
    const db=getDb();
    if(!db||!db.open)throw new Error('SQLite database non ouverte après initDatabase()');
    databaseInitialized=true;
    mainLog('✅ DATABASE READY');
    return true;
  }catch(err){
    databaseInitialized=false;
    mainError('❌ DATABASE INITIALIZATION FAILED:',err.message);
    throw err;
  }
}

function shutdownDatabase(){
  if(!databaseInitialized)return;
  try{
    closeDatabase();
    databaseInitialized=false;
    mainLog('✅ Database fermée');
  }catch(err){
    mainWarn('⚠️ Erreur fermeture DB:',err.message);
  }
}

// ============================================================
// ⭐ PROTOCOLE LOCAL-IMAGE
// ============================================================
function getMimeType(filePath){
  const ext=path.extname(filePath).toLowerCase();
  const mimeTypes={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.gif':'image/gif','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.bmp':'image/bmp','.avif':'image/avif'};
  return mimeTypes[ext]||'application/octet-stream';
}

function registerLocalImageProtocol(){
  try{
    protocol.handle('local-image',async request=>{
      try{
        let pathname=request.url.replace(/^local-image:\/\//i,'');
        try{pathname=decodeURIComponent(pathname);}catch(_){}
        pathname=pathname.replace(/^\/+/,'');
        const queryIndex=pathname.indexOf('?');
        if(queryIndex!==-1)pathname=pathname.substring(0,queryIndex);
        const uploadsDir=path.resolve(app.getPath('userData'),'uploads');
        const requestedPath=path.resolve(uploadsDir,pathname);
        const normalizedUploads=path.resolve(uploadsDir);

        if(requestedPath!==normalizedUploads&&!requestedPath.startsWith(normalizedUploads+path.sep)){
          mainWarn('🚫 Tentative accès fichier interdit:',pathname);
          return new Response('Forbidden',{status:403});
        }

        if(!fs.existsSync(requestedPath)){
          return new Response('Image not found',{status:404});
        }

        const stat=await fs.promises.stat(requestedPath);
        if(!stat.isFile())return new Response('Not a file',{status:400});

        return new Response(await fs.promises.readFile(requestedPath),{
          status:200,
          headers:{'Content-Type':getMimeType(requestedPath),'Cache-Control':'public, max-age=31536000, immutable'}
        });
      }catch(err){
        mainError('❌ local-image:// error:',err.message);
        return new Response('Internal Server Error',{status:500});
      }
    });
    mainLog('✅ local-image:// protocol enregistré');
  }catch(err){mainError('❌ Impossible enregistrer local-image://:',err.message);}
}

// ============================================================
// ⭐ WINDOW CREATION
// ============================================================
function showMainWindow(reason='unknown'){
  if(windowShown||!mainWindow||mainWindow.isDestroyed())return;
  windowShown=true;
  try{
    if(mainWindow.isMinimized())mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    mainLog(`🟢 Window affichée - ${reason}`);
    if(isDev){
      mainLog('🛠️ DEVTOOLS mode');
      mainWindow.webContents.openDevTools({mode:'detach'});
    }
  }catch(err){mainError('❌ Impossible afficher BrowserWindow:',err.message);}
}

function createMainWindow(){
  if(mainWindow){
    if(!mainWindow.isDestroyed()){mainWindow.show();mainWindow.focus();}
    return mainWindow;
  }

  mainLog('🪟 Création BrowserWindow...');
  mainWindow=new BrowserWindow({
    width:1440,height:900,minWidth:1100,minHeight:700,show:true,backgroundColor:'#0A1222',autoHideMenuBar:true,
    webPreferences:{preload:PRELOAD_PATH,contextIsolation:true,nodeIntegration:false,sandbox:false,webSecurity:!isDev,allowRunningInsecureContent:isDev,devTools:isDev}
  });

  try{
    mainWindow.setMenuBarVisibility(false);
    mainWindow.setAutoHideMenuBar(true);
  }catch(err){mainWarn('⚠️ Impossible masquer menu:',err.message);}

  mainWindow.webContents.on('did-finish-load',()=>{
    mainLog('✅ Renderer: did-finish-load');
    showMainWindow('did-finish-load');
  });

  setTimeout(()=>{
    if(mainWindow&&!mainWindow.isDestroyed()&&!windowShown){
      mainWarn('⚠️ Timeout - affichage forcé');
      showMainWindow('timeout-fallback');
    }
  },5000);

  mainWindow.webContents.setWindowOpenHandler(({url})=>{
    if(url.startsWith('https:')||url.startsWith('http:'))shell.openExternal(url);
    return {action:'deny'};
  });

  mainWindow.webContents.on('will-navigate',(event,url)=>{
    if(isDev&&url.startsWith(DEV_SERVER_URL))return;
    if(url.startsWith('file://')||url.startsWith('local-image://'))return;
    event.preventDefault();
    if(url.startsWith('https:')||url.startsWith('http:'))shell.openExternal(url);
  });

  if(!isDev){
    mainWindow.webContents.on('devtools-opened',()=>{
      try{mainWindow.webContents.closeDevTools();}catch(_){}
    });
  }

  mainWindow.on('closed',()=>setImmediate(()=>{mainWindow=null;}));
  loadFrontend();
  return mainWindow;
}

async function loadFrontend(){
  if(!mainWindow||mainWindow.isDestroyed())return;
  try{
    if(isDev){
      await mainWindow.loadURL(DEV_SERVER_URL);
      return;
    }
    if(!fs.existsSync(DIST_INDEX))throw new Error(`Frontend production introuvable: ${DIST_INDEX}`);
    await mainWindow.loadFile(DIST_INDEX);
  }catch(err){
    mainError('❌ Erreur chargement frontend:',err.message);
  }
}

// ============================================================
// ⭐ IPC MODULE LOADER - VERSION AMÉLIORÉE
// ============================================================

function registerHandlerModule(label,modulePath){
  try{
    const absolutePath=path.resolve(BASE_PATH,modulePath); // ⭐ Mampiasa BASE_PATH
    mainLog(`🔎 IPC ${label}:`,absolutePath);

    if(!fs.existsSync(absolutePath)){
      mainError(`❌ IPC ${label} introuvable:`,absolutePath);
      return false;
    }

    const handler=require(absolutePath);
    mainLog(`📦 IPC ${label} module chargé. Exports:`, Object.keys(handler));

    let result=false;

    // ⭐ 1. Raha fonction directe
    if(typeof handler==='function'){
      result=handler(ipcMain);
    }
    // ⭐ 2. Raha misy register
    else if(handler&&typeof handler.register==='function'){
      result=handler.register(ipcMain);
    }
    // ⭐ 3. Raha misy registerHandlers
    else if(handler&&typeof handler.registerHandlers==='function'){
      result=handler.registerHandlers(ipcMain);
    }
    // ⭐ 4. Raha misy registerLicenseHandlers (ho an'ny license)
    else if(handler&&typeof handler.registerLicenseHandlers==='function'){
      result=handler.registerLicenseHandlers(ipcMain);
    }
    // ⭐ 5. Raha object misy fonctions register*
    else if(handler&&typeof handler==='object'){
      for(const key of Object.keys(handler)){
        if(typeof handler[key]==='function' && key.toLowerCase().includes('register')){
          result=handler[key](ipcMain);
          if(result) break;
        }
      }
    }

    if(!result){
      mainError(`❌ IPC ${label} - Aucune fonction d'enregistrement valide ou retour false`);
      return false;
    }

    mainLog(`✅ IPC ${label} enregistré avec succès`);
    return true;
  }catch(err){
    mainError(`❌ Erreur IPC ${label}:`,err.message);
    return false;
  }
}

// ============================================================
// ⭐ REGISTER ALL IPC (AVEC LICENSE EXPLICITE)
// ============================================================

function registerAllIPC(){
  if(handlersRegistered){
    mainLog('ℹ️ IPC handlers déjà enregistrés');
    return true;
  }

  mainLog('============================================================');
  mainLog('🔌 ENREGISTREMENT IPC HANDLERS');
  mainLog('============================================================');

  const handlerModules = [
    ['AUTH', './ipc/auth.cjs'],
    ['USERS', './ipc/users.cjs'],
    ['PRODUCTS', './ipc/products.cjs'],
    ['CATEGORIES', './ipc/categories.cjs'],
    ['FOURNISSEURS', './ipc/fournisseurs.cjs'],
    ['CLIENTS', './ipc/clients.cjs'],
    ['ORDERS', './ipc/orders.cjs'],
    ['STOCK', './ipc/stock.cjs'],
    ['ACHATS', './ipc/achats.cjs'],
    ['EMPLOYES', './ipc/employes.cjs'],
    ['DEPENSES', './ipc/expenses.cjs'],
    ['PAIEMENTS', './ipc/payments.cjs'],
    ['DASHBOARD', './ipc/dashboard.cjs'],
    ['REPORTS', './ipc/reports.cjs'],
    ['IMAGES', './ipc/images.cjs'],
    ['SETTINGS', './ipc/settings.cjs'],
    ['BACKUP', './ipc/backup.cjs'],
    ['DIALOG', './ipc/dialog.cjs'],
    ['LICENSE', './ipc/license.cjs'],   // ⭐ License module
    ['VENTES', './ipc/ventes.cjs']
  ];

  let successCount=0;
  const failedModules=[];

  for(const [label,modulePath] of handlerModules){
    mainLog(`\n🔧 Enregistrement du module ${label}...`);
    const success=registerHandlerModule(label,modulePath);
    
    if(success){
      successCount++;
    } else {
      failedModules.push(label);
      if(label==='LICENSE'){
        mainError('❌ LICENSE HANDLER REGISTRATION FAILED - Activation code tsy handeha');
      }
    }
  }

  // ⭐ REGISTRATION MANUELLE HO AN'NY LICENSE (raha mbola tsy vita)
  try{
    const licenseModule = require(path.resolve(BASE_PATH, './ipc/license.cjs'));
    if(licenseModule && typeof licenseModule.registerLicenseHandlers === 'function'){
      const licResult = licenseModule.registerLicenseHandlers(ipcMain);
      if(licResult){
        mainLog('✅ LICENSE handlers enregistrés explicitement (mivantana)');
      } else {
        mainError('❌ LICENSE handlers retour false');
      }
    } else {
      mainError('❌ license.cjs tsy manana registerLicenseHandlers');
    }
  }catch(licErr){
    mainError('❌ Erreur lors de l\'enregistrement explicit LICENSE:', licErr.message);
  }

  // ⭐ DB debug handlers
  try{
    if(!ipcMain.listenerCount('db:getPath')){
      ipcMain.handle('db:getPath',()=>({success:true,path:getDbPath()}));
    }
    if(!ipcMain.listenerCount('db:debug')){
      ipcMain.handle('db:debug',()=>getDatabaseDebugInfo());
    }
  }catch(err){mainWarn('⚠️ IPC DB debug:',err.message);}

  // ⭐ App info
  try{
    if(!ipcMain.listenerCount('app:getInfo')){
      ipcMain.handle('app:getInfo',()=>({
        success:true,
        name:app.getName(),
        version:app.getVersion(),
        isPackaged:app.isPackaged,
        isDev,
        userData:app.getPath('userData'),
        dbPath:getDbPath()
      }));
    }
  }catch(err){mainWarn('⚠️ IPC app:getInfo:',err.message);}

  // ⭐ Utils save-file (dialog)
  try{
    if(!ipcMain.listenerCount('utils:save-file')){
      ipcMain.handle('utils:save-file',async(event,data,defaultPath)=>{
        try{
          const result=await dialog.showSaveDialog({
            title:'Enregistrer le fichier',
            defaultPath:defaultPath||'document.pdf',
            filters:[{name:'PDF',extensions:['pdf']},{name:'Tous',extensions:['*']}]
          });
          if(result.canceled)return {canceled:true};
          await fs.promises.writeFile(result.filePath,Buffer.from(data));
          return {success:true,filePath:result.filePath};
        }catch(err){
          return {success:false,error:err.message};
        }
      });
    }
  }catch(err){mainWarn('⚠️ IPC utils:save-file:',err.message);}

  // ⭐ Utils save-file-to-directory (bulk)
  try{
    if(!ipcMain.listenerCount('utils:save-file-to-directory')){
      ipcMain.handle('utils:save-file-to-directory',async(event,data,directory,filename)=>{
        try{
          if(!directory||!filename)return {success:false,error:'Directory ou filename manquant'};
          fs.mkdirSync(directory,{recursive:true});
          const filePath=path.join(directory,filename);
          await fs.promises.writeFile(filePath,Buffer.from(data));
          return {success:true,filePath};
        }catch(err){
          return {success:false,error:err.message};
        }
      });
    }
  }catch(err){mainWarn('⚠️ IPC save-file-to-directory:',err.message);}

  handlersRegistered=true;
  mainLog('============================================================');
  mainLog(`✅ IPC READY: ${successCount}/${handlerModules.length} modules`);
  if(failedModules.length>0)mainWarn(`⚠️ Modules échoués: ${failedModules.join(', ')}`);
  mainLog('============================================================');
  return true;
}

// ============================================================
// ⭐ SECURITY
// ============================================================
function configureSecurity(){
  try{
    session.defaultSession.setPermissionRequestHandler((webContents,permission,callback)=>{
      callback(new Set(['notifications']).has(permission));
    });
  }catch(err){mainWarn('⚠️ Permission handler:',err.message);}
}

// ============================================================
// ⭐ SINGLE INSTANCE
// ============================================================
function setupSingleInstance(){
  const gotLock=app.requestSingleInstanceLock();
  if(!gotLock){
    mainWarn('⚠️ Instance déjà ouverte');
    app.quit();
    return false;
  }
  app.on('second-instance',()=>{
    if(mainWindow&&!mainWindow.isDestroyed()){
      if(mainWindow.isMinimized())mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
  return true;
}

// ============================================================
// ⭐ APP READY
// ============================================================
app.whenReady().then(async()=>{
  mainLog('============================================================');
  mainLog("🚀 TahiryPro ELECTRON START");
  mainLog('============================================================');
  mainLog('📦 Electron:',process.versions.electron);
  mainLog('🟢 Node:',process.versions.node);
  mainLog('🛠️ Development:',isDev);
  mainLog('📁 BASE_PATH:',BASE_PATH);

  try{Menu.setApplicationMenu(null);}catch(err){mainWarn('⚠️ Menu:',err.message);}
  configureSecurity();
  registerLocalImageProtocol();

  try{
    await initializeDatabase();
  }catch(dbErr){
    mainError('❌ Database initialization failed:',dbErr.message);
    app.quit();
    return;
  }

  try{
    registerAllIPC();
  }catch(ipcErr){
    mainError('❌ IPC INITIALIZATION FAILED:',ipcErr.message);
  }

  createMainWindow();

  app.on('activate',()=>{
    if(BrowserWindow.getAllWindows().length===0)createMainWindow();
  });

  mainLog("🟢 TahiryPro READY");
}).catch(err=>{
  mainError('❌ ELECTRON STARTUP FAILED:',err.message);
  app.quit();
});

// ============================================================
// ⭐ LIFECYCLE
// ============================================================
app.on('before-quit',()=>{
  if(isQuitting)return;
  isQuitting=true;
  shutdownDatabase();
});

app.on('window-all-closed',()=>{
  if(process.platform!=='darwin'){
    if(!isQuitting)isQuitting=true;
    shutdownDatabase();
    app.quit();
  }
});

process.on('uncaughtException',err=>{
  mainError('❌ UNCAUGHT EXCEPTION:',err.message);
});

process.on('unhandledRejection',reason=>{
  mainError('❌ UNHANDLED REJECTION:',reason);
});

// ============================================================
// ⭐ EXPORTS
// ============================================================
module.exports={createMainWindow,initializeDatabase,shutdownDatabase,registerAllIPC,registerLocalImageProtocol};