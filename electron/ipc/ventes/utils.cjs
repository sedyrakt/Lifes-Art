'use strict';

const { BrowserWindow } = require('electron');

const DEBUG = true;

function log(...args) {
  if (DEBUG) console.log('[ventes]', ...args);
}

function error(...args) {
  console.error('[ventes]', ...args);
}

function emitVentesChanged(data = {}) {
  try {
    const windows = BrowserWindow.getAllWindows();
    if (!windows.length) return;

    for (const win of windows) {
      if (!win || win.isDestroyed()) continue;
      try {
        win.webContents.send('ventes:changed', data);
        if (DEBUG) log(`📤 Event ventes:changed émis: ${data.type || 'N/A'} - ${data.id || 'N/A'}`);
      } catch (err) {
        error('❌ Erreur émission:', err.message);
      }
    }
  } catch (err) {
    error('❌ emitVentesChanged:', err.message);
  }
}

module.exports = { DEBUG, log, error, emitVentesChanged };