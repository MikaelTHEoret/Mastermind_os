import { app, BrowserWindow } from 'electron';
import path from 'path';
import { ModuleManager } from './module-manager';
import { MCPDirectoryScanner } from '../services/DiscoveryService';

// Global reference to mainWindow to prevent GC
let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Initialize MCP services
  const scanner = new MCPDirectoryScanner();
  const servers = await scanner.findServers();
  
  const moduleManager = ModuleManager.getInstance();
  
  try {
    await moduleManager.registerModule('mcp-manager', {
      name: 'MCP Manager',
      description: 'Core MCP server management',
      icon: 'server'
    });
    
    await moduleManager.registerModule('ollama', {
      name: 'Ollama MCP Server',
      description: 'Interface with local Ollama models',
      icon: 'brain-circuit'
    });

    // Activate core modules
    await moduleManager.activateModule('mcp-manager');
  } catch (err) {
    console.error('Failed to initialize modules:', err);
  }

  // Window event handlers
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
