const { contextBridge, ipcRenderer } = require('electron');

// Whitelist of valid channels
const validChannels = [
  'get-modules',
  'activate-module',
  'register-module',
  'get-services',
  'os:getSystemInfo',
  'os:openExternal',
  'os:showItemInFolder',
  'query-mcp-server'
];

contextBridge.exposeInMainWorld('osBridge', {
  // System methods
  getSystemInfo: () => ipcRenderer.invoke('os:getSystemInfo'),
  openExternal: (url) => ipcRenderer.invoke('os:openExternal', url),
  showItemInFolder: (path) => ipcRenderer.invoke('os:showItemInFolder', path),

  // Module management
  getModules: () => ipcRenderer.invoke('get-modules'),
  registerModule: (moduleId, config) => {
    if (typeof moduleId !== 'string') {
      throw new Error('Invalid module ID');
    }
    return ipcRenderer.invoke('register-module', moduleId, config);
  },
  activateModule: (moduleId) => {
    if (typeof moduleId !== 'string') {
      throw new Error('Invalid module ID');
    }
    return ipcRenderer.invoke('activate-module', moduleId);
  },
  getServices: () => ipcRenderer.invoke('get-services'),
  
  // MCP server query
  queryMcpServer: (serverName, query = {}) => {
    if (typeof serverName !== 'string') {
      throw new Error('Invalid server name');
    }
    return ipcRenderer.invoke('query-mcp-server', { serverName, query });
  }
});

// Security - validate all IPC channels
ipcRenderer.on('error', (event, error) => {
  console.error('IPC Error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});
