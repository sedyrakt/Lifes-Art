
'use strict';

const { dialog } = require('electron');

function registerDialogHandlers(ipcMain) {
  if (!ipcMain) return;
  

  try { ipcMain.removeHandler('dialog:show-open-dialog'); } catch (_) {}

  ipcMain.handle('dialog:show-open-dialog', async (event, options = {}) => {
    try {
      const win = event.sender ? event.sender.getOwnerBrowserWindow() : null;
      const result = await dialog.showOpenDialog(win, options);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, error: err.message, canceled: true };
    }
  });

  console.log('✅ Dialog handlers enregistrés');
  return true; // ⭐ FIX: Mamerina true!
}

module.exports = { registerDialogHandlers };