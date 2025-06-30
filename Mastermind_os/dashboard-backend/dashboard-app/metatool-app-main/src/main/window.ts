import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';

export function createWindow() {
  const mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Mastermind_OS integration hook
  if (process.env.OS_MODULE_API_VERSION) {
    mainWindow.hide();
    ipcMain.on('activate-metatool', () => {
      mainWindow.show();
    });
  } else {
    mainWindow.show();
  }

  return mainWindow;
}
