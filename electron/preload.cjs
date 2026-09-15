// ============================================================
// electron/preload.cjs — Lifes-Art ERP
// ⭐ VERSION FINALE AVEC RH + VENTES + PARAMETRES PAIE
// ⭐ NOUVEAU: STOCK SNAPSHOTS (historique réel du stock)
// ⭐ NEW: payments.getLastBatch (batch tokana — esorina ny N+1)
// ⭐ NEW: ventes.getStats (stats devis + factures)
// ⭐ NEW: achats.getStats (stats globales — total rehetra)
// ============================================================
const { contextBridge, ipcRenderer } = require('electron');

console.log('🔌 PRELOAD SCRIPT - CHARGEMENT...');
if (!ipcRenderer) throw new Error('Electron IPC unavailable');
ipcRenderer.setMaxListeners(50);

const DEBUG = false;
function log(...args) { if (DEBUG) console.log(...args); }
log('🔌 Plateforme:', process.platform);

const APP_VERSION = '1.0.0';

function invoke(channel, ...args) {
  try { return ipcRenderer.invoke(channel, ...args); }
  catch (error) { console.error(`❌ IPC invoke error [${channel}]`, error); return Promise.reject(error); }
}

function on(channel, callback) {
  if (typeof callback !== 'function') return () => {};
  const listener = (_event, data) => { try { callback(data); } catch (error) { console.error(`❌ Erreur callback [${channel}]`, error); } };
  ipcRenderer.on(channel, listener);
  return () => { try { ipcRenderer.removeListener(channel, listener); } catch (error) { console.warn(`⚠️ Impossible de supprimer listener [${channel}]`, error); } };
}

const api = {
  db: {
    query: (sql, params) => invoke('db:query', sql, params),
    run: (sql, params) => invoke('db:run', sql, params),
    getOne: (sql, params) => invoke('db:get-one', sql, params),
    queryAsync: (sql, params) => invoke('db:query-async', sql, params),
    runAsync: (sql, params) => invoke('db:run-async', sql, params),
    getOneAsync: (sql, params) => invoke('db:get-one-async', sql, params),
  },
  auth: {
    login: (email, password, ip, userAgent) => invoke('auth:login', email, password, ip, userAgent),
    logout: (token) => invoke('auth:logout', token),
    verifyToken: (token) => invoke('auth:verify-token', token),
    hashPassword: (password) => invoke('auth:hash-password', password),
    verifyPassword: (password, hashedPassword) => invoke('auth:verify-password', password, hashedPassword),
    changePassword: (data) => invoke('auth:change-password', data),
    generate2FA: (email) => invoke('auth:generate-2fa', email),
    verify2FA: (userId, secret, token) => invoke('auth:verify-2fa', userId, secret, token),
    disable2FA: (userId) => invoke('auth:disable-2fa', userId),
    verify2FALogin: (userId, token) => invoke('auth:verify-2fa-login', userId, token),
  },
  users: {
    getAll: () => invoke('users:get-all'),
    getById: (id) => invoke('users:get-by-id', id),
    getByEmail: (email) => invoke('users:get-by-email', email),
    create: (data) => invoke('users:create', data),
    update: (id, data) => invoke('users:update', id, data),
    delete: (id) => invoke('users:delete', id),
  },
  products: {
    getAll: (options) => invoke('products:get-all', options),
    getById: (id) => invoke('products:get-by-id', id),
    getByCode: (code) => invoke('products:get-by-code', code),
    create: (data) => invoke('products:create', data),
    update: (id, data) => invoke('products:update', id, data),
    delete: (id) => invoke('products:delete', id),
    getStats: () => invoke('products:get-stats'),
    getAlertes: () => invoke('products:get-alertes'),
    getTop: (limit) => invoke('products:get-top', limit),
    getByCategorie: (categorieId) => invoke('products:get-by-categorie', categorieId),
    search: (term) => invoke('products:search', term),
    updateStock: (id, quantite, type, userId) => invoke('products:update-stock', id, quantite, type, userId),
    uploadImage: (base64Data) => invoke('images:upload', base64Data, 'produits'),
    deleteImage: (path) => invoke('images:delete', path),
    getImageUrl: (path) => invoke('images:get-url', path),
    bulkUpdateStatus: (ids, newStatus) => invoke('products:bulk-update-status', ids, newStatus),
    bulkDelete: (ids) => invoke('products:bulk-delete', ids),
    onChanged: (callback) => on('products:changed', callback),
  },
  clients: {
    getAll: (options) => invoke('clients:get-all', options),
    getById: (id) => invoke('clients:get-by-id', id),
    create: (data) => invoke('clients:create', data),
    update: (id, data) => invoke('clients:update', id, data),
    delete: (id) => invoke('clients:delete', id),
    search: (term) => invoke('clients:search', term),
    getByEmail: (email) => invoke('clients:get-by-email', email),
    getByType: (type) => invoke('clients:get-by-type', type),
    getStats: () => invoke('clients:get-stats'),
    uploadImage: (base64Data) => invoke('images:upload', base64Data, 'clients'),
    deleteImage: (path) => invoke('images:delete', path),
    getImageUrl: (path) => invoke('images:get-url', path),
    bulkUpdateType: (ids, newType) => invoke('clients:bulk-update-type', ids, newType),
    bulkDelete: (ids) => invoke('clients:bulk-delete', ids),
    onChanged: (callback) => on('clients:changed', callback),
  },
  fournisseurs: {
    getAll: (options) => invoke('fournisseurs:get-all', options),
    getById: (id) => invoke('fournisseurs:get-by-id', id),
    create: (data) => invoke('fournisseurs:create', data),
    update: (id, data) => invoke('fournisseurs:update', id, data),
    delete: (id) => invoke('fournisseurs:delete', id),
    getProducts: (id) => invoke('fournisseurs:get-products', id),
    search: (term) => invoke('fournisseurs:search', term),
    getStats: () => invoke('fournisseurs:get-stats'),
    bulkDelete: (ids) => invoke('fournisseurs:bulk-delete', ids),
  },
  orders: {
    getAll: (options) => invoke('orders:get-all', options),
    getById: (id) => invoke('orders:get-by-id', id),
    create: (data) => invoke('orders:create', data),
    update: (id, data) => invoke('orders:update', id, data),
    delete: (id) => invoke('orders:delete', id),
    getDetails: (commandeId) => invoke('orders:get-details', commandeId),
    getByClient: (clientNom) => invoke('orders:get-by-client', clientNom),
    getByStatus: (statut) => invoke('orders:get-by-status', statut),
    getByDateRange: (startDate, endDate) => invoke('orders:get-by-date-range', startDate, endDate),
    getStats: () => invoke('orders:get-stats'),
    getProducts: (commandeId) => invoke('orders:get-products', commandeId),
    getWithDetails: (commandeId) => invoke('orders:get-with-details', commandeId),
    getTotal: (commandeId) => invoke('orders:get-total', commandeId),
    getByNumber: (numero) => invoke('orders:get-by-number', numero),
    getJournalieres: (options) => invoke('orders:get-journalieres', options),
    bulkUpdateStatus: (ids, newStatus) => invoke('orders:bulk-update-status', ids, newStatus),
    bulkDelete: (ids) => invoke('orders:bulk-delete', ids),
    updatePaiement: (id, data) => invoke('orders:update-paiement', id, data),
    getDetteStats: () => invoke('orders:get-dette-stats'),
    getOverdue: () => invoke('orders:get-overdue'),
    onChanged: (callback) => on('orders:changed', callback),
  },
  stock: {
    getEntrees: (options) => invoke('stock:get-entrees', options),
    getSorties: (options) => invoke('stock:get-sorties', options),
    getMouvements: (options) => invoke('stock:get-mouvements', options),
    getStats: () => invoke('stock:get-stats'),
    getEntreesByProduit: (produitId, options) => invoke('stock:get-entrees-by-produit', produitId, options),
    getSortiesByProduit: (produitId, options) => invoke('stock:get-sorties-by-produit', produitId, options),
    getMouvementsByProduit: (produitId, options) => invoke('stock:get-mouvements-by-produit', produitId, options),
    createEntree: (data, userId) => invoke('stock:create-entree', data, userId),
    createSortie: (data, userId) => invoke('stock:create-sortie', data, userId),
    getStockActuel: (options) => invoke('stock:get-stock-actuel', options),
    getEntreesStats: () => invoke('stock:get-entrees-stats'),
    getSortiesStats: () => invoke('stock:get-sorties-stats'),
    bulkDeleteMouvements: (ids) => invoke('stock:bulk-delete-mouvements', ids),
    bulkDeleteEntrees: (ids) => invoke('stock:bulk-delete-entrees', ids),
    bulkDeleteSorties: (ids) => invoke('stock:bulk-delete-sorties', ids),
    onMouvementAdded: (callback) => on('stock:mouvement-added', callback),
  },
  employes: {
    getAll: (options) => invoke('employes:get-all', options),
    getById: (id) => invoke('employes:get-by-id', id),
    create: (data) => invoke('employes:create', data),
    update: (id, data) => invoke('employes:update', id, data),
    delete: (id) => invoke('employes:delete', id),
    search: (term) => invoke('employes:search', term),
    getStats: () => invoke('employes:get-stats'),
    bulkUpdateStatus: (ids, newStatus) => invoke('employes:bulk-update-status', ids, newStatus),
    bulkDelete: (ids) => invoke('employes:bulk-delete', ids),
    onChanged: (callback) => on('employes:changed', callback),
    getPaiementCountsBatch: (ids) => invoke('employes:get-paiement-counts-batch', ids),
    getTotalSalairesPayes: (annee) => invoke('employes:get-total-salaires-payes', annee),
    getPresence: (employeId, mois, annee) => invoke('employes:get-presence', employeId, mois, annee),
    updatePresence: (data) => invoke('employes:update-presence', data),
    getSalaryHistory: (employeId) => invoke('employes:get-salary-history', employeId),
    updateSalary: (employeId, newSalary, raison) => invoke('employes:update-salary', employeId, newSalary, raison),
    getPresenceJournaliere: (employeId, date) => invoke('employes:get-presence-journaliere', employeId, date),
    updatePresenceJournaliere: (data) => invoke('employes:update-presence-journaliere', data),
    deletePresenceJournaliere: (id) => invoke('employes:delete-presence-journaliere', id),
    getPresenceJournaliereMois: (mois, annee) => invoke('employes:get-presence-journaliere-mois', mois, annee),
    bulkUpdatePresenceJournaliere: (data) => invoke('employes:bulk-update-presence-journaliere', data),
    getPresenceHistorique: (options) => invoke('employes:get-presence-historique', options),
    getPlanning: (employeId) => invoke('employes:get-planning', employeId),
    updatePlanning: (employeId, planningData) => invoke('employes:update-planning', employeId, planningData),
    deletePlanning: (id) => invoke('employes:delete-planning', id),
  },
  expenses: {
    getAll: (options) => invoke('expenses:get-all', options),
    getById: (id) => invoke('expenses:get-by-id', id),
    create: (data) => invoke('expenses:create', data),
    update: (id, data) => invoke('expenses:update', id, data),
    delete: (id) => invoke('expenses:delete', id),
    getByPeriod: (startDate, endDate) => invoke('expenses:get-by-period', startDate, endDate),
    getByCategory: (categorie) => invoke('expenses:get-by-category', categorie),
    getSummary: (startDate, endDate) => invoke('expenses:get-summary', startDate, endDate),
    getStats: () => invoke('expenses:get-stats'),
    bulkDelete: (ids) => invoke('expenses:bulk-delete', ids),
  },
  payments: {
    getAll: (options) => invoke('payments:get-all', options),
    getById: (id) => invoke('payments:get-by-id', id),
    create: (data) => invoke('payments:create', data),
    update: (id, data) => invoke('payments:update', id, data),
    delete: (id) => invoke('payments:delete', id),
    getByEmploye: (employeId) => invoke('payments:get-by-employe', employeId),
    getByPeriod: (mois, annee) => invoke('payments:get-by-period', mois, annee),
    getHistorique: (employeId, mois, annee) => invoke('payments:get-historique', employeId, mois, annee),
    getSalaireMensuel: (employeId, mois, annee) => invoke('payments:get-salaire-mensuel', employeId, mois, annee),
    countByEmploye: (employeId) => invoke('payments:count-by-employe', employeId),
    getStats: () => invoke('payments:get-stats'),
    getEmployeStats: (employeId) => invoke('payments:get-employe-stats', employeId),
    bulkCreate: (data) => invoke('payments:bulk-create', data),
    getAbsencesCount: (employeId, mois, annee) => invoke('payments:get-absences-count', employeId, mois, annee),
    getLastBatch: (employeIds) => invoke('payments:get-last-batch', employeIds),
    getPayrollParameters: () => invoke('payments:get-payroll-parameters'),
    savePayrollParameters: (data) => invoke('payments:save-payroll-parameters', data),
  },
  parametresPaie: {
    get: () => invoke('parametres-paie:get'),
    update: (data) => invoke('parametres-paie:update', data),
    reset: () => invoke('parametres-paie:reset'),
  },
  categories: {
    getAll: (options) => invoke('categories:get-all', options),
    getById: (id) => invoke('categories:get-by-id', id),
    create: (data) => invoke('categories:create', data),
    update: (id, data) => invoke('categories:update', id, data),
    delete: (id) => invoke('categories:delete', id),
    getStats: () => invoke('categories:get-stats'),
    bulkDelete: (ids) => invoke('categories:bulk-delete', ids),
    onChanged: (callback) => on('categories:changed', callback),
  },
  dashboard: {
    getStats: (options) => invoke('dashboard:get-stats', options),
    getFinancialSummary: () => invoke('dashboard:get-financial-summary'),
    getChartData: (options) => invoke('dashboard:get-chart-data', options),
    onChanged: (callback) => on('dashboard:changed', callback),
  },
  stockSnapshots: {
    saveToday: () => invoke('stock-snapshots:save-today'),
    getAtDate: (dateStr) => invoke('stock-snapshots:get-at-date', dateStr),
    getRange: (options) => invoke('stock-snapshots:get-range', options),
    getSeries: (options) => invoke('stock-snapshots:get-series', options),
    getCurrent: () => invoke('stock-snapshots:current'),
    getRotation: (days = 30) => invoke('stock-snapshots:rotation', days),
    backfill: (options) => invoke('stock-snapshots:backfill', options),
    prune: (daysToKeep = 730) => invoke('stock-snapshots:prune', daysToKeep),
  },
  images: {
    upload: (base64Data, folder) => invoke('images:upload', base64Data, folder),
    delete: (imagePath) => invoke('images:delete', imagePath),
    getUrl: (imagePath) => invoke('images:get-url', imagePath),
    getImageAsBase64: (imagePath) => invoke('images:get-image-as-base64', imagePath),
  },
  reports: {
    getSummary: (options) => invoke('reports:get-summary', options),
    getVentesParMois: (annee) => invoke('reports:get-ventes-par-mois', annee),
    getTopProduits: (options) => invoke('reports:get-top-produits', options),
    getRepartitionCategorie: () => invoke('reports:get-repartition-categorie'),
    getVentesParCategorie: (options) => invoke('reports:get-ventes-par-categorie', options),
    getVentesParClient: (options) => invoke('reports:get-ventes-par-client', options),
    getTopClients: (options) => invoke('reports:get-top-clients', options),
    getStockValue: () => invoke('reports:get-stock-value'),
    getBenefice: (annee) => invoke('reports:get-benefice', annee),
    getDepensesParCategorie: (options) => invoke('reports:get-depenses-par-categorie', options),
    getChiffreAffaires: (options) => invoke('reports:get-chiffre-affaires', options),
    getCommandesStatut: () => invoke('reports:get-commandes-statut'),
    getVentesJournalieres: (options) => invoke('reports:get-ventes-journalieres', options),
    getSynthese: (annee) => invoke('reports:get-synthese', annee),
    getCommandesRecentes: (limit) => invoke('reports:get-commandes-recentes', limit),
    getEntreesStock: (options) => invoke('reports:get-entrees-stock', options),
    getSortiesStock: (options) => invoke('reports:get-sorties-stock', options),
    getEmployesStats: () => invoke('reports:get-employes-stats'),
    getStockStatus: () => invoke('reports:get-stock-status'),
    onChanged: (callback) => on('reports:changed', callback),
  },
  settings: {
    getAll: () => invoke('settings:get-all'),
    getById: (id) => invoke('settings:get-by-id', id),
    getByKey: (key) => invoke('settings:get-by-key', key),
    set: (key, value) => invoke('settings:set', key, value),
    update: (id, data) => invoke('settings:update', id, data),
    delete: (id) => invoke('settings:delete', id),
    reset: () => invoke('settings:reset'),
  },
  navigation: {
    navigateTo: (path) => invoke('navigation:navigate-to', path),
    openExternal: (url) => {
      if (typeof url !== 'string') return Promise.reject(new Error('URL invalide'));
      const allowedProtocols = ['https:', 'http:'];
      try {
        const parsed = new URL(url);
        if (!allowedProtocols.includes(parsed.protocol)) return Promise.reject(new Error('Protocole non autorisé'));
        const hostname = parsed.hostname.toLowerCase();
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || parsed.protocol === 'file:') {
          return Promise.reject(new Error('Accès local interdit'));
        }
      } catch (error) { return Promise.reject(new Error('URL mal formée')); }
      return invoke('navigation:open-external', url);
    },
    openInApp: (url) => invoke('navigation:open-in-app', url),
    getCurrentUrl: () => invoke('navigation:get-current-url'),
    reload: () => invoke('navigation:reload'),
    goBack: () => invoke('navigation:go-back'),
  },
  backup: {
    database: () => invoke('backup:database'),
    restore: (backupPath) => invoke('backup:restore', backupPath),
    vacuum: () => invoke('backup:vacuum'),
    optimize: () => invoke('backup:optimize'),
    list: (limit) => invoke('backup:list', limit),
    delete: (backupPath) => invoke('backup:delete', backupPath),
    auto: () => invoke('backup:auto'),
    status: () => invoke('backup:status'),
    exportJson: () => invoke('backup:export-json'),
  },
  dialog: {
    showOpenDialog: (options) => invoke('dialog:show-open-dialog', options),
    showSaveDialog: (options) => invoke('dialog:show-save-dialog', options),
  },
  utils: {
    exportData: (data, format) => invoke('utils:export-data', data, format),
    print: () => invoke('utils:print'),
    saveFile: (data, defaultPath, filters) => invoke('utils:save-file', data, defaultPath, filters),
    saveFileToDirectory: (data, directory, filename) => invoke('utils:save-file-to-directory', data, directory, filename),
  },
  platform: {
    name: process.platform,
    arch: process.arch,
    electron: process.versions.electron,
    node: process.versions.node,
    app: "Lifes-Art",
    version: APP_VERSION,
  },
};

// ============================================================
// ⭐ MODULES ERP: ACHATS
// ============================================================
api.achats = {
  getAll: (options = {}) => invoke('achats:get-all', options),
  getById: (id) => invoke('achats:get-by-id', id),
  getDetails: (achatId) => invoke('achats:get-details', achatId),
  create: (data) => invoke('achats:create', data),
  update: (id, data) => invoke('achats:update', id, data),
  delete: (id) => invoke('achats:delete', id),
  bulkDelete: (ids) => invoke('achats:bulk-delete', ids),
  updatePaiement: (id, data) => invoke('achats:update-paiement', id, data),
  getStats: (options) => invoke('achats:get-stats', options),  // ⭐ NOUVEAU
  onChanged: (callback) => on('achats:changed', callback),
};

// ============================================================
// ⭐ MODULES ERP: VENTES (Devis & Factures)
// ============================================================
api.ventes = {
  getDevis: (options) => invoke('ventes:get-devis', options),
  getDevisById: (id) => invoke('ventes:get-devis-by-id', id),
  createDevis: (data) => invoke('ventes:create-devis', data),
  updateDevis: (id, data) => invoke('ventes:update-devis', id, data),
  deleteDevis: (id) => invoke('ventes:delete-devis', id),
  getDevisDetails: (devisId) => invoke('ventes:get-devis-details', devisId),
  getFactures: (options) => invoke('ventes:get-factures', options),
  getFactureById: (id) => invoke('ventes:get-facture-by-id', id),
  createFacture: (data) => invoke('ventes:create-facture', data),
  updateFacture: (id, data) => invoke('ventes:update-facture', id, data),
  deleteFacture: (id) => invoke('ventes:delete-facture', id),
  getFactureDetails: (factureId) => invoke('ventes:get-facture-details', factureId),
  convertDevisToFacture: (devisId) => invoke('ventes:convert-devis-to-facture', devisId),
  updatePaiement: (id, data) => invoke('ventes:update-paiement', id, data),
  getStats: (options) => invoke('ventes:get-stats', options),
  onChanged: (callback) => on('ventes:changed', callback),
};

// ============================================================
// ⭐ API LICENSE
// ============================================================
api.license = {
  load: () => invoke('license:load'),
  save: (data) => invoke('license:save', data),
  reset: () => invoke('license:reset'),
  checkStatus: () => invoke('license:check-status'),
  getPath: () => invoke('license:get-path'),
  getStatusCode: () => invoke('license:get-status-code'),
  validate: (context) => invoke('license:validate', context),
  getMachineId: () => invoke('license:get-machine-id'),
  verify: (licenseKey, signature, payload) => invoke('license:verify', licenseKey, signature, payload),
  activate: (licenseKey, signature, payload) => invoke('license:activate', licenseKey, signature, payload),
  verifyChecksum: (licenseKey) => invoke('license:verify-checksum', licenseKey),
  getPackages: () => invoke('license:get-packages'),
  securityCheck: () => invoke('license:security-check'),
  getIntegrityHashes: () => invoke('license:get-integrity-hashes'),
  getCurrent: () => invoke('license:get-current'),
  deactivate: () => invoke('license:deactivate'),
  listDatabase: () => invoke('license:list-database'),
  clearCache: () => invoke('license:clear-cache'),
  refreshTimer: () => invoke('license:refresh-timer'),
  getExpiration: () => invoke('license:get-expiration'),
  activateWithCode: (code) => invoke('license:activate-with-code', code),
  generateCode: (packageType) => invoke('license:generate-code', packageType),
  verifyCode: (code) => invoke('license:verify-code', code),
  onChanged: (callback) => on('license:changed', callback),
};

// ============================================================
// ⭐ API REVOCATION
// ============================================================
api.revocation = {
  check: (licenseKey, activationId) => invoke('license:revocation:check', licenseKey, activationId),
  stats: () => invoke('license:revocation:stats'),
  revoke: (licenseKey, reason) => invoke('license:revocation:revoke', licenseKey, reason),
  unrevoke: (licenseKey) => invoke('license:revocation:unrevoke', licenseKey),
};

try {
  contextBridge.exposeInMainWorld('api', api);
  console.log('✅ PRELOAD - API nampidirina soa aman-tsara tamin\'ny contextBridge');
} catch (error) {
  console.error('❌ Tsy nahomby ny fampidirana ny contextBridge:', error);
  throw error;
}

log('🔌 PRELOAD SCRIPT - CHARGÉ AVEC SUCCÈS');
console.log('✅ window.api exposé');