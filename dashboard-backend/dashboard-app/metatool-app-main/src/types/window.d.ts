interface IpcRenderer {
  invoke(channel: string, ...args: any[]): Promise<any>;
  on(channel: string, listener: (...args: any[]) => void): void;
  off(channel: string, listener: (...args: any[]) => void): void;
}

interface ElectronAPI {
  ipcRenderer: IpcRenderer;
}

interface OsBridge {
  getSystemInfo(): Promise<SystemInfo>;
  openExternal(url: string): Promise<void>;
  showItemInFolder(path: string): Promise<void>;
  
  // Module management
  registerModule(moduleId: string, config: ModuleConfig): Promise<void>;
  getModules(): Promise<Module[]>;
  activateModule(moduleId: string): Promise<void>;
  getServices(): Promise<Service[]>;
  
  // MCP server query
  queryMcpServer(serverName: string, query?: any): Promise<any>;
}

interface ModuleConfig {
  name: string;
  description: string;
  icon?: string;
}

interface Module {
  id: string;
  name: string;
  description: string;
  status: 'active'|'inactive'|'error';
  server?: any;
}

interface Service {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
}

interface Window {
  electron: ElectronAPI;
  osBridge: OsBridge;
}
