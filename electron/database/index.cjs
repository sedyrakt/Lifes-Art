// ============================================================
// database/index.cjs - RE-EXPORT (CommonJS)
// ⭐ Re-export rehetra avy amin'ny components
// ⭐ FIX: ESRINA NY database/backup.cjs (TSY AMPIASANA)
// ============================================================

const config = require('./config.cjs');
const utils = require('./utils.cjs');
const connection = require('./connection.cjs');
const queries = require('./queries.cjs');

const tables = require('./tables.cjs');
const financial = require('./financial.cjs');

// ============================================================
// ⭐ Re-export tsirairay avy amin'ny modules (CommonJS safe)
// ============================================================

// Config
module.exports.ALLOWED_TABLES = config.ALLOWED_TABLES;
module.exports.DB_JOURNAL_MODE = config.DB_JOURNAL_MODE;
module.exports.DB_SYNCHRONOUS = config.DB_SYNCHRONOUS;
module.exports.DB_CACHE_SIZE = config.DB_CACHE_SIZE;
module.exports.DB_MMAP_SIZE = config.DB_MMAP_SIZE;
module.exports.DB_JOURNAL_SIZE_LIMIT = config.DB_JOURNAL_SIZE_LIMIT;
module.exports.DB_BUSY_TIMEOUT = config.DB_BUSY_TIMEOUT;
module.exports.DEBUG = config.DEBUG;
module.exports.isPackaged = config.isPackaged; // ⭐ Nampiana

// Utils
module.exports.log = utils.log;
module.exports.warn = utils.warn;
module.exports.error = utils.error;
module.exports.getEncryptionKey = utils.getEncryptionKey;
module.exports.setDatabasePermissions = utils.setDatabasePermissions;
module.exports.verifyDatabaseIntegrity = utils.verifyDatabaseIntegrity;
module.exports.createFolders = utils.createFolders;
module.exports.hashPassword = utils.hashPassword;
module.exports.verifyPassword = utils.verifyPassword;
module.exports.normalizeRow = utils.normalizeRow;      // ⭐ Nampiana
module.exports.normalizeRows = utils.normalizeRows;    // ⭐ Nampiana

// Connection
module.exports.getDb = connection.getDb;
module.exports.getDatabasePath = connection.getDatabasePath;
module.exports.getDbPath = connection.getDbPath;
module.exports.createConnection = connection.createConnection;
module.exports.closeDatabase = connection.closeDatabase;
module.exports.dbInstance = connection.dbInstance;
module.exports.dbPath = connection.dbPath;
module.exports.sqlCipherActive = connection.sqlCipherActive;

// Queries
module.exports.validateTable = queries.validateTable;
module.exports.getTableColumns = queries.getTableColumns;
module.exports.columnExists = queries.columnExists;
module.exports.buildInsertQuery = queries.buildInsertQuery;
module.exports.buildUpdateQuery = queries.buildUpdateQuery;
module.exports.buildSelectQuery = queries.buildSelectQuery;
module.exports.buildCountQuery = queries.buildCountQuery;

// ⭐ FIX: ESRINA NY BACKUP RE-EXPORTS (TSY AMPIASANA)
// module.exports.createBackup = backup.createBackup;
// module.exports.restoreBackup = backup.restoreBackup;
// module.exports.listBackups = backup.listBackups;
// module.exports.deleteBackup = backup.deleteBackup;

// Tables
module.exports.ensureTables = tables.ensureTables;
module.exports.tableExists = tables.tableExists;
module.exports.getTableInfo = tables.getTableInfo;
module.exports.addColumnIfNotExists = tables.addColumnIfNotExists;

// Financial
module.exports.getFinancialSummary = financial.getFinancialSummary;
module.exports.getMonthlyRevenue = financial.getMonthlyRevenue;
module.exports.getExpensesBreakdown = financial.getExpensesBreakdown;

// ============================================================
// ⭐ Fonction initDatabase
// ============================================================
module.exports.initDatabase = () => {
  const db = connection.getDb();
  if (!db || !db.open) {
    throw new Error('Connexion à la base de données non disponible');
  }
  const success = tables.ensureTables();
  if (!success) {
    throw new Error('Erreur lors de la création des tables/indexes');
  }
  return { success: true, db };
};

console.log('✅ database/index.cjs - Tous les modules chargés (CommonJS)');
console.log('   - ensureTables disponible');
console.log('   - backup module ESRINA (tsy ampiasaina)');