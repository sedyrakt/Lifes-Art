

const path = require('path');


const DEBUG = false;

// ============================================================
// ⭐ IS PACKAGED
// ============================================================

const isPackaged = true;

// ============================================================
// ⭐ CONSTANTES GÉNÉRALES
// ============================================================

// ⭐ FANITSARA: Hardcoded mba tsy ho very rehefa packaged
const SALT_ROUNDS = 12;

// ⭐ FIX: BACKUP_DIR mifanaraka amin'ny electron/ipc/backup.cjs
const BACKUP_DIR = process.env.DB_BACKUP_PATH || path.join(__dirname, '..', 'backups');

// ============================================================
// ⭐ CONSTANTES SQLITE / DATABASE
// ============================================================

const DB_JOURNAL_MODE = 'WAL';
const DB_SYNCHRONOUS = 'NORMAL';
const DB_CACHE_SIZE = 10000;
const DB_MMAP_SIZE = 268435456;
const DB_JOURNAL_SIZE_LIMIT = 10485760;
const DB_BUSY_TIMEOUT = 30000;

// ============================================================
// ⭐ RETRY & SECURITY
// ============================================================

const MAX_RETRIES = 3;
const MAX_BUSY_RETRIES = 5;
const RETRY_DELAY_MS = 50;

// ============================================================
// ⭐ MOTS-CLÉS SQL INTERDITS
// ============================================================

const SQL_FORBIDDEN_KEYWORDS = [
  'DROP',
  'ALTER',
  'DELETE',
  'UPDATE',
  'INSERT',
  'TRUNCATE',
  'CREATE',
  'REPLACE',
  'RENAME',
  'ATTACH',
  'DETACH',
  'REINDEX',
  'VACUUM',
];



const EXCLUDED_FILES = [];



const ALLOWED_TABLES = new Set([
  'utilisateurs',
  'categories',
  'fournisseurs',
  'produits',
  'entrees_stock',
  'sorties_stock',
  'mouvements_stock',
  'commandes',
  'details_commandes',
  'clients',
  'employes',
  'depenses',
  'paiements',
  'sessions',
  'security_logs',
  'schema_migrations',
  'audit_logs',
  'settings',
  'achats',
  'details_achats',
  'devis',
  'details_devis',
  'factures',
  'details_factures',
  'paiements_employes',
]);

// ============================================================
// ⭐ EXPORTS
// ============================================================

module.exports = {
  DEBUG,
  isPackaged,
  SALT_ROUNDS,
  BACKUP_DIR,
  DB_JOURNAL_MODE,
  DB_SYNCHRONOUS,
  DB_CACHE_SIZE,
  DB_MMAP_SIZE,
  DB_JOURNAL_SIZE_LIMIT,
  DB_BUSY_TIMEOUT,
  MAX_RETRIES,
  MAX_BUSY_RETRIES,
  RETRY_DELAY_MS,
  SQL_FORBIDDEN_KEYWORDS,
  EXCLUDED_FILES,
  ALLOWED_TABLES,
};