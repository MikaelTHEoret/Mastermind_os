import { MCPServer } from '../services/DiscoveryService';
import { MCPDirectoryScanner } from '../services/DiscoveryService';
import { ipcMain } from 'electron';
import path from 'path';

export interface Module {
  id: string;
  name: string;
  description: string;
  server?: MCPServer;
  status: 'inactive' | 'activating' | 'active' | 'error';
}

interface Service {
  id: string;
  name: string;
  type: string;
  status: string;
}

export class ModuleManager {
  static instance: ModuleManager;
  
  static getInstance(): ModuleManager {
    if (!ModuleManager.instance) {
      ModuleManager.instance = new ModuleManager();
    }
    return ModuleManager.instance;
  }

  private modules: Map<string, Module> = new Map();
  private services: Map<string, Service> = new Map();
  private scanner: MCPDirectoryScanner;

  constructor() {
    this.scanner = new MCPDirectoryScanner();
    this.setupIPCHandlers();
  }

  private setupIPCHandlers() {
    ipcMain.handle('os:getSystemInfo', () => ({
      platform: process.platform,
      arch: process.arch,
      version: process.version
    }));

    ipcMain.handle('os:openExternal', (event, url: string) => {
      require('electron').shell.openExternal(url);
    });

    ipcMain.handle('os:showItemInFolder', (event, filePath: string) => {
      require('electron').shell.showItemInFolder(path.resolve(filePath));
    });

    ipcMain.handle('get-modules', () => this.getModules());
    ipcMain.handle('get-services', () => this.getServices());
    ipcMain.handle('register-module', (event, moduleId: string, config: any) => 
      this.registerModule(moduleId, config));
    ipcMain.handle('activate-module', (event, moduleId: string) => 
      this.activateModule(moduleId));
    
    // Add MCP server query handler with validation
    ipcMain.handle('query-mcp-server', async (event, { serverName, query = {} }) => {
      if (!serverName || typeof serverName !== 'string') {
        throw new Error('Invalid server name');
      }
      
      if (typeof query !== 'object' || query === null) {
        query = {};
      }

      try {
        if (!this.checkRateLimit(serverName)) {
          throw new Error(`Rate limit exceeded for server ${serverName}`);
        }

        const server = this.scanner.getServer(serverName);
        if (!server) {
          throw new Error(`Server ${serverName} not found`);
        }
        
        const result = await this.scanner.queryServer(serverName, query);
        if (result.status !== 'success') {
          throw new Error(`Server query failed: ${result.message || 'Unknown error'}`);
        }
        return result;
      } catch (err) {
        console.error(`MCP Server query error (${serverName}):`, err);
        throw err;
      }
    });
  }

  // Add rate limiting
  private lastQueryTimes: Map<string, number> = new Map();
  private queryRateLimit = 500; // ms between queries

  private checkRateLimit(serverName: string): boolean {
    const lastTime = this.lastQueryTimes.get(serverName) || 0;
    const now = Date.now();
    if (now - lastTime < this.queryRateLimit) {
      return false;
    }
    this.lastQueryTimes.set(serverName, now);
    return true;
  }

  async registerModule(moduleId: string, config: {
    name: string;
    description: string;
    icon?: string;
  }): Promise<Module> {
    if (this.modules.has(moduleId)) {
      throw new Error(`Module ${moduleId} already registered`);
    }

    const module: Module = {
      id: moduleId,
      name: config.name,
      description: config.description,
      status: 'inactive'
    };

    this.modules.set(moduleId, module);
    return module;
  }

  async activateModule(moduleId: string): Promise<Module> {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    module.status = 'activating';
    try {
      const servers = await this.scanner.findServers();
      const server = servers.find(s => s.id === moduleId);
      
      if (server) {
        const activeServer = await this.scanner.startServer(server.id);
        module.server = activeServer;
        module.status = 'active';
        
        // Register services from the activated module
        if (activeServer.services) {
          activeServer.services.forEach((service: any) => {
            this.services.set(service.id, {
              id: service.id,
              name: service.name,
              type: service.type,
              status: 'active'
            });
          });
        }
      } else {
        throw new Error(`No server found for module ${moduleId}`);
      }
    } catch (err) {
      module.status = 'error';
      throw err;
    }

    return module;
  }

  getModules(): Module[] {
    return Array.from(this.modules.values());
  }

  getServices(): Service[] {
    return Array.from(this.services.values());
  }
}
