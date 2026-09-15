// electron/database/tables/migrations/users.cjs
'use strict';

const { tableExists, addColumnIfMissing } = require('../helpers.cjs');

function migrateUsers(db) {
  if (!tableExists(db, 'utilisateurs')) return;
  addColumnIfMissing(db, 'utilisateurs', 'companyName', 'TEXT');
  addColumnIfMissing(db, 'utilisateurs', 'phone', 'TEXT');
  addColumnIfMissing(db, 'utilisateurs', 'status', "TEXT DEFAULT 'actif'");
  addColumnIfMissing(db, 'utilisateurs', 'twoFactorEnabled', 'INTEGER DEFAULT 0');
  addColumnIfMissing(db, 'utilisateurs', 'twoFactorSecret', 'TEXT');
  addColumnIfMissing(db, 'utilisateurs', 'lastLogin', 'TEXT');
  addColumnIfMissing(db, 'utilisateurs', 'loginAttempts', 'INTEGER DEFAULT 0');
  addColumnIfMissing(db, 'utilisateurs', 'lockedUntil', 'TEXT');
  addColumnIfMissing(db, 'utilisateurs', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
  addColumnIfMissing(db, 'utilisateurs', 'image', 'TEXT');
}

module.exports = { migrateUsers };