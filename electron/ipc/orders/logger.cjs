// ============================================================
// electron/ipc/orders/logger.cjs - LOGGING
// ⭐ FIX: DEBUG true
// ============================================================

const DEBUG = true;

function log(...args) {
  if (DEBUG) console.log('[📦 orders]', ...args);
}

function error(...args) {
  console.error('[❌ orders]', ...args);
}

module.exports = { log, error, DEBUG };