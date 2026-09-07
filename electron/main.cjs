// ============================================================
// electron/main.cjs - TahiryPro ERP
// ⭐ VERSION AMÉLIORÉE - FIX HANDLER REGISTRATION
// ⭐ FIX: NAMPIANA NY LICENSE HANDLER
// ⭐ FIX: Mampiasa dist-electron/ rehefa production
// ⭐ FIX: ESORINA NY COMPTABILITE (TSY ILAINA)
// ⭐ FIX: NAMPIANA NY 'utils:save-file-to-directory' HO AN'NY BULK
// ============================================================
'use strict';

const {app,BrowserWindow,ipcMain,session,shell,protocol,Menu,dialog}=require('electron');
const path=require('path'),fs=require('fs');
const dotenv = require('dotenv');

dotenv.config({
  path: path.join(app.getAppPath(), '.env')
});

// ============================================================
// ⭐ FIX: Mampiasa dist-electron/ rehefa production
// ============================================================

const isDev=!app.isPackaged||process.env.NODE_ENV==='development';
const APP_ROOT=path.resolve(__dirname,'..');

// ⭐ FIX: Raha production, ampiasao ny dist-electron/ fa tsy ny electron/
const BASE_PATH = !isDev && fs.existsSync(path.join(__dirname, '..', 'dist-electron'))
  ? path.join(__dirname, '..', 'dist-electron')
  : path.resolve(__dirname, '.');

const PRELOAD_PATH = path.join(BASE_PATH, 'preload.cjs');
const DIST_PATH = path.join(APP_ROOT, 'dist');
const DIST_INDEX = path.join(DIST_PATH, 'index.html');
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

const {initDatabase,closeDatabase}=require('./database/init.cjs');
const {getDb,getDbPath,getDatabaseDebugInfo}=require('./database/connection.cjs');
const {log,warn,error}=require('./database/utils.cjs');

let mainWindow=null,databaseInitialized=false,handlersRegistered=false,isQuitting=false,windowShown=false;

function mainLog(...args){console.log('[MAIN]',...args);}
function mainWarn(...args){console.warn('[MAIN]',...args);}
function mainError(...args){console.error('[MAIN]',...args);}

mainLog('🔐 JWT_SECRET loaded:', Boolean(process.env.JWT_SECRET));
mainLog('📦 APP PATH:', app.getAppPath());
mainLog('📄 ENV PATH:', path.join(app.getAppPath(), '.env'));
mainLog('📁 BASE_PATH:', BASE_PATH);
mainLog('📁 PRELOAD_PATH:', PRELOAD_PATH);
mainLog('📁 DIST_PATH:', DIST_PATH);

function printDatabaseInfo(){
  try{
    const dbPath=getDbPath();
    console.log('');
    console.log('============================================================');
    console.log("📦 TahiryPro - DATABASE PATH");
    console.log('============================================================');
    console.log('📁 userData :',app.getPath('userData'));
    console.log('📁 DB       :',dbPath);
    console.log('📦 exists   :',fs.existsSync(dbPath));
    if(fs.existsSync(dbPath)){
      try{
        const stat=fs.statSync(dbPath);
        console.log('📊 size     :',stat.size,'bytes');
        console.log('🕒 modified :',stat.mtime.toISOString());
      }catch(statErr){mainWarn('⚠️ Impossible lire stat DB:',statErr.message);}
    }
    console.log('============================================================');
    console.log('');
  }catch(err){mainError('❌ Impossible récupérer le chemin DB:',err.message);}
}

async function initializeDatabase(){
  if(databaseInitialized){mainLog('ℹ️ Database déjà initialisée');return true;}
  try{
    mainLog('🔄 Initialisation de la database...');
    printDatabaseInfo();
    const result=await initDatabase();
    if(!result||!result.success)throw new Error('initDatabase() a échoué');
    const db=getDb();
    if(!db||!db.open)throw new Error('SQLite database non ouverte après initDatabase()');
    databaseInitialized=true;
    mainLog('============================================================');
    mainLog('✅ DATABASE READY');
    mainLog('📁 Path:',getDbPath());
    mainLog('🟢 Open:',db.open);
    mainLog('============================================================');
    try{
      const debugInfo=getDatabaseDebugInfo();
      if(debugInfo?.success){
        mainLog('📊 Produits total:',debugInfo.totalProduits);
        mainLog('🟢 Produits actifs:',debugInfo.produitsActifs);
        mainLog('📦 Produits archivés:',debugInfo.produitsArchives);
      }
    }catch(debugErr){mainWarn('⚠️ Database debug ignoré:',debugErr.message);}
    return true;
  }catch(err){
    databaseInitialized=false;
    mainError('============================================================');
    mainError('❌ DATABASE INITIALIZATION FAILED');
    mainError(err.message);
    if(err.stack)mainError(err.stack);
    mainError('============================================================');
    throw err;
  }
}

function shutdownDatabase(){
  try{
    if(!databaseInitialized)return;
    mainLog('🔌 Fermeture de la database...');
    closeDatabase();
    databaseInitialized=false;
    mainLog('✅ Database fermée');
  }catch(err){
    mainWarn('⚠️ Erreur fermeture DB:',err.message);
    databaseInitialized=false;
  }
}

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
        console.log(`[local-image] 🔍 Demande (sans query): ${pathname}`);
        const uploadsDir=path.resolve(app.getPath('userData'),'uploads');
        const requestedPath=path.resolve(uploadsDir,pathname);
        const normalizedUploads=path.resolve(uploadsDir);

        if(requestedPath!==normalizedUploads&&!requestedPath.startsWith(normalizedUploads+path.sep)){
          mainWarn('🚫 Tentative accès fichier interdit:',pathname);
          return new Response('Forbidden',{status:403});
        }

        if(!fs.existsSync(requestedPath)){
          console.log(`[local-image] ❌ Image introuvable: ${requestedPath}`);
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

function isAllowedExternalUrl(url){
  try{
    const parsed=new URL(url);
    return parsed.protocol==='https:'||parsed.protocol==='http:';
  }catch(_){return false;}
}

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

  mainWindow.webContents.on('did-start-loading',()=>mainLog('🔄 Renderer: did-start-loading'));
  mainWindow.webContents.on('did-stop-loading',()=>mainLog('🛑 Renderer: did-stop-loading'));
  mainWindow.webContents.on('dom-ready',()=>mainLog('✅ Renderer: DOM ready'));

  mainWindow.webContents.on('did-finish-load',()=>{
    mainLog('✅ Renderer: did-finish-load');
    showMainWindow('did-finish-load');
    if(isDev)mainLog('🛠️ Vite frontend totalement chargé');
  });

  setTimeout(()=>{
    if(mainWindow&&!mainWindow.isDestroyed()&&!windowShown){
      mainWarn('⚠️ ready-to-show/did-finish-load tsy tonga ara-potoana');
      showMainWindow('timeout-fallback');
    }
  },5000);

  mainWindow.webContents.setWindowOpenHandler(({url})=>{
    if(isAllowedExternalUrl(url))shell.openExternal(url);
    else mainWarn('🚫 URL externe bloquée:',url);
    return {action:'deny'};
  });

  mainWindow.webContents.on('will-navigate',(event,url)=>{
    try{
      const currentUrl=mainWindow.webContents.getURL();
      if(isDev&&url.startsWith(DEV_SERVER_URL))return;
      if(url.startsWith('file://'))return;
      if(url.startsWith('local-image://'))return;
      if(currentUrl&&url.startsWith(currentUrl.split('#')[0]))return;
      event.preventDefault();
      if(isAllowedExternalUrl(url))shell.openExternal(url);
    }catch(err){
      event.preventDefault();
      mainWarn('⚠️ Navigation bloquée:',err.message);
    }
  });

  if(!isDev){
    mainWindow.webContents.on('devtools-opened',()=>{
      try{mainWindow.webContents.closeDevTools();}catch(_){}
    });
  }

  mainWindow.webContents.on('render-process-gone',(event,details)=>mainError('❌ Renderer process gone:',details));
  mainWindow.webContents.on('unresponsive',()=>mainWarn('⚠️ Renderer unresponsive'));
  mainWindow.webContents.on('responsive',()=>mainLog('🟢 Renderer responsive'));

  mainWindow.on('closed',()=>setImmediate(()=>{mainWindow=null;}));
  mainWindow.on('close',()=>{if(!isQuitting){}});
  loadFrontend();

  return mainWindow;
}

async function loadFrontend(){
  if(!mainWindow||mainWindow.isDestroyed())return;

  try{
    if(isDev){
      mainLog('🌐 Loading Vite:',DEV_SERVER_URL);
      await mainWindow.loadURL(DEV_SERVER_URL);
      mainLog('✅ Vite frontend chargé');
      return;
    }

    if(!fs.existsSync(DIST_INDEX))throw new Error(`Frontend production introuvable: ${DIST_INDEX}`);

    mainLog('📦 Production frontend:',DIST_INDEX);
    await mainWindow.loadFile(DIST_INDEX);
    mainLog('✅ Production frontend chargé');
  }catch(err){
    mainError('❌ Erreur chargement frontend:',err.message);
    if(err.stack)mainError(err.stack);

    if(isDev&&mainWindow&&!mainWindow.isDestroyed()){
      mainWarn('⚠️ Frontend mbola tsy loaded correctly');
      try{showMainWindow('load-error-fallback');}
      catch(fallbackErr){mainError('❌ Impossible afficher fallback:',fallbackErr.message);}
    }
  }
}

// ============================================================
// IPC HANDLER MODULE LOADER - VOAAMBOARINA
// ============================================================

function registerHandlerModule(label,modulePath){
  try{
    const absolutePath=path.resolve(__dirname,modulePath);
    mainLog(`🔎 IPC ${label}:`,absolutePath);

    if(!fs.existsSync(absolutePath)){
      mainError(`❌ IPC ${label} introuvable:`,absolutePath);
      return false;
    }

    const handler=require(absolutePath);
    mainLog(`📦 IPC ${label} module chargé`);
    mainLog(`📦 Exports:`, Object.keys(handler));

    let result=false;

    if(typeof handler==='function'){
      mainLog(`🔧 Appel direct de la fonction...`);
      result=handler(ipcMain);
    }
    else if(handler&&typeof handler.register==='function'){
      mainLog(`🔧 Appel de register(ipcMain)...`);
      result=handler.register(ipcMain);
    }
    else if(handler&&typeof handler.registerHandlers==='function'){
      mainLog(`🔧 Appel de registerHandlers(ipcMain)...`);
      result=handler.registerHandlers(ipcMain);
    }
    else if(handler&&typeof handler==='object'){
      const keys=Object.keys(handler);
      mainLog(`📦 IPC ${label} exports:`,keys);

      for(const key of keys){
        if(typeof handler[key]==='function' && (
          key.toLowerCase().includes('register') || 
          key.toLowerCase().includes('handler')
        )){
          mainLog(`🔧 Appel de ${key}(ipcMain)...`);
          try {
            result = handler[key](ipcMain);
            mainLog(`✅ IPC ${label} enregistré via: ${key}, résultat: ${result}`);
            if(result) break;
          } catch (handlerErr) {
            mainError(`❌ Erreur dans ${key}:`, handlerErr.message);
          }
        }
      }
    }
    else if(handler&&handler.default&&typeof handler.default==='function'){
      mainLog(`🔧 Appel de default(ipcMain)...`);
      result=handler.default(ipcMain);
    }

    if(!result){
      mainError(`❌ IPC ${label} - Aucune fonction d'enregistrement trouvée ou retour false`);
      return false;
    }

    mainLog(`✅ IPC ${label} enregistré avec succès`);
    return true;
  }catch(err){
    mainError(`❌ Erreur IPC ${label}:`,err.message);
    if(err.stack)mainError(err.stack);
    return false;
  }
}

// ============================================================
// REGISTER ALL IPC - VOAAMBOARINA
// ⭐ FIX: ESORINA NY COMPTABILITE (TSY ILAINA)
// ⭐ FIX: NAMPIANA NY HANDLER saveFileToDirectory
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
    ['LICENSE', './ipc/license.cjs'],
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
      if(label==='AUTH'){
        mainError('❌ AUTH IPC registration failed - application mety tsy hiasa');
      }
    }
  }

  if(failedModules.length > 0){
    mainWarn(`\n⚠️ ${failedModules.length} module(s) tsy voasoratra: ${failedModules.join(', ')}`);
  }

  // ⭐ REGISTRATION DB PATH / DEBUG
  try{
    if(!ipcMain.listenerCount('db:getPath')){
      ipcMain.handle('db:getPath',async()=>{
        try{return {success:true,path:getDbPath()};}
        catch(err){return {success:false,error:err.message};}
      });
    }

    if(!ipcMain.listenerCount('db:debug')){
      ipcMain.handle('db:debug',async()=>{
        try{return getDatabaseDebugInfo();}
        catch(err){return {success:false,error:err.message};}
      });
    }

    mainLog('✅ IPC DB debug enregistré');
  }catch(err){mainWarn('⚠️ IPC DB debug:',err.message);}

  // ⭐ REGISTRATION APP INFO
  try{
    if(!ipcMain.listenerCount('app:getInfo')){
      ipcMain.handle('app:getInfo',async()=>({
        success:true,
        name:app.getName(),
        version:app.getVersion(),
        isPackaged:app.isPackaged,
        isDev,
        userData:app.getPath('userData'),
        dbPath:getDbPath()
      }));
    }

    mainLog('✅ IPC app:getInfo enregistré');
  }catch(err){mainWarn('⚠️ IPC app:getInfo:',err.message);}

  // ⭐ REGISTRATION UTILS:SAVE-FILE (AVEC DIALOG)
  try{
    if(!ipcMain.listenerCount('utils:save-file')){
      ipcMain.handle('utils:save-file',async(event,data,defaultPath)=>{
        try{
          mainLog('📄 Demande de sauvegarde de fichier...');

          const result=await dialog.showSaveDialog({
            title:'Enregistrer le fichier',
            defaultPath:defaultPath||'document.pdf',
            filters:[
              {name:'PDF',extensions:['pdf']},
              {name:'Tous les fichiers',extensions:['*']}
            ],
            properties:['createDirectory','showOverwriteConfirmation']
          });

          if(result.canceled){
            mainLog('📄 Enregistrement annulé par l\'utilisateur');
            return {canceled:true};
          }

          if(!result.filePath)return {canceled:true};

          const buffer=Buffer.from(data);
          await fs.promises.writeFile(result.filePath,buffer);

          mainLog(`✅ Fichier enregistré avec succès: ${result.filePath}`);

          return {success:true,filePath:result.filePath};
        }catch(err){
          mainError('❌ Erreur lors de la sauvegarde du fichier:',err.message);
          return {success:false,error:err.message};
        }
      });

      mainLog('✅ IPC utils:save-file enregistré avec succès');
    }else mainLog('ℹ️ IPC utils:save-file déjà enregistré');
  }catch(err){mainWarn('⚠️ IPC utils:save-file:',err.message);}

  // ⭐⭐ VAOVAO: REGISTRATION UTILS:SAVE-FILE-TO-DIRECTORY (TSY MISY DIALOG)
  try{
    if(!ipcMain.listenerCount('utils:save-file-to-directory')){
      ipcMain.handle('utils:save-file-to-directory', async (event, data, directory, filename) => {
        try{
          if(!directory || !filename) return { success:false, error:'Directory ou filename manquant' };
          fs.mkdirSync(directory, { recursive: true });
          const filePath = path.join(directory, filename);
          const buffer = Buffer.from(data);
          await fs.promises.writeFile(filePath, buffer);
          return { success:true, filePath };
        }catch(err){
          mainError('❌ Erreur utils:save-file-to-directory:', err.message);
          return { success:false, error: err.message };
        }
      });
      mainLog('✅ IPC utils:save-file-to-directory enregistré avec succès');
    }else mainLog('ℹ️ IPC utils:save-file-to-directory déjà enregistré');
  }catch(err){ mainWarn('⚠️ IPC utils:save-file-to-directory:', err.message); }

  handlersRegistered=true;

  mainLog('============================================================');
  mainLog(`✅ IPC READY: ${successCount}/${handlerModules.length} modules`);
  if(failedModules.length > 0){
    mainWarn(`⚠️ Modules échoués: ${failedModules.join(', ')}`);
  }
  mainLog('============================================================');

  return true;
}

// ============================================================
// SECURITY CONFIGURATION
// ============================================================

function configureSecurity(){
  try{
    session.defaultSession.setPermissionRequestHandler((webContents,permission,callback)=>{
      callback(new Set(['notifications']).has(permission));
    });
  }catch(err){mainWarn('⚠️ Permission handler:',err.message);}

  try{
    session.defaultSession.webRequest.onBeforeRequest(
      {urls:['http://*/*','https://*/*']},
      (details,callback)=>{
        if(isDev&&details.url.startsWith(DEV_SERVER_URL)){
          callback({cancel:false});
          return;
        }
        callback({cancel:false});
      }
    );
  }catch(err){mainWarn('⚠️ webRequest config:',err.message);}
}

// ============================================================
// SINGLE INSTANCE
// ============================================================

function setupSingleInstance(){
  const gotLock=app.requestSingleInstanceLock();

  if(!gotLock){
    mainWarn('⚠️ Une autre instance de LIFE\'S ART est déjà ouverte.');
    app.quit();
    return false;
  }

  app.on('second-instance',(event,commandLine,workingDirectory)=>{
    mainLog('ℹ️ Deuxième instance détectée');

    if(mainWindow&&!mainWindow.isDestroyed()){
      if(mainWindow.isMinimized())mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  return true;
}

// ============================================================
// ELECTRON READY
// ============================================================

app.whenReady().then(async()=>{
  mainLog('============================================================');
  mainLog("🚀 TahiryPro ELECTRON START");
  mainLog('============================================================');
  mainLog('📦 Electron:',process.versions.electron);
  mainLog('🟢 Node:',process.versions.node);
  mainLog('🟢 Chromium:',process.versions.chrome);
  mainLog('📦 Packaged:',app.isPackaged);
  mainLog('🛠️ Development:',isDev);
  mainLog('📁 userData:',app.getPath('userData'));
  mainLog('📁 __dirname:',__dirname);
  mainLog('📁 BASE_PATH:',BASE_PATH);
  mainLog('📁 preload:',PRELOAD_PATH);
  mainLog('📁 dist:',DIST_PATH);

  try{Menu.setApplicationMenu(null);}
  catch(err){mainWarn('⚠️ Impossible supprimer menu:',err.message);}

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
    const ipcReady=registerAllIPC();
    if(!ipcReady){
      mainWarn('⚠️ IPC registration incomplete, mais on continue');
    }
  }catch(ipcErr){
    mainError('❌ IPC INITIALIZATION FAILED:',ipcErr.message);
    if(ipcErr.stack)mainError(ipcErr.stack);
  }

  createMainWindow();

  app.on('activate',()=>{
    if(BrowserWindow.getAllWindows().length===0)createMainWindow();
  });

  mainLog('============================================================');
  mainLog("🟢 TahiryPro READY");
  mainLog('============================================================');
}).catch(err=>{
  mainError('============================================================');
  mainError('❌ ELECTRON STARTUP FAILED');
  mainError(err.message);
  if(err.stack)mainError(err.stack);
  mainError('============================================================');
  app.quit();
});

// ============================================================
// APP LIFECYCLE
// ============================================================

app.on('before-quit',()=>{
  if(isQuitting)return;
  isQuitting=true;
  mainLog('🛑 before-quit');
  shutdownDatabase();
});

app.on('window-all-closed',()=>{
  mainLog('🪟 Toutes les fenêtres sont fermées');

  if(process.platform!=='darwin'){
    if(!isQuitting)isQuitting=true;
    shutdownDatabase();
    app.quit();
  }
});

app.on('will-quit',()=>{
  mainLog('🛑 will-quit');
  shutdownDatabase();
});

process.on('SIGINT',()=>{
  mainLog('🛑 SIGINT reçu');
  shutdownDatabase();

  if(!isQuitting){
    isQuitting=true;
    app.quit();
  }
});

process.on('SIGTERM',()=>{
  mainLog('🛑 SIGTERM reçu');
  shutdownDatabase();

  if(!isQuitting){
    isQuitting=true;
    app.quit();
  }
});

process.on('uncaughtException',err=>{
  mainError('============================================================');
  mainError('❌ UNCAUGHT EXCEPTION');
  mainError(err.message);
  if(err.stack)mainError(err.stack);
  mainError('============================================================');
});

process.on('unhandledRejection',reason=>{
  mainError('============================================================');
  mainError('❌ UNHANDLED REJECTION');

  if(reason instanceof Error){
    mainError(reason.message);
    if(reason.stack)mainError(reason.stack);
  }else mainError(reason);

  mainError('============================================================');
});

// ============================================================
// DEV DEBUG
// ============================================================

if(isDev){
  mainLog('🛠️ main.cjs chargé en mode development');
  mainLog('📁 APP_ROOT:',APP_ROOT);
  mainLog('📁 BASE_PATH:',BASE_PATH);
  mainLog('📁 PRELOAD:',PRELOAD_PATH);
  mainLog('📁 DIST:',DIST_PATH);
}

// ============================================================
// EXPORTS
// ============================================================

module.exports={createMainWindow,initializeDatabase,shutdownDatabase,registerAllIPC,registerLocalImageProtocol,loadFrontend,getMimeType};