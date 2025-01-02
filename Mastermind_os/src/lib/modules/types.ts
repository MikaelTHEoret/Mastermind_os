import type { EventEmitter } from '../events/EventEmitter';

export type ModuleStatus = 'active' | 'inactive' | 'error';
export type ModuleType = 'tool' | 'agent' | 'integration';

export interface Module {
  id: string;
  name: string;
  entry: string;
  config: Record<string, unknown>;
  status: ModuleStatus;
  version: string;
  description: string;
  author: string;
  type: ModuleType;
  capabilities: string[];
  init: () => Promise<void>;
  cleanup: () => Promise<void>;
}

export interface ModuleManager extends EventEmitter {
  loadModule: (moduleId: string) => Promise<void>;
  unloadModule: (moduleId: string) => Promise<void>;
  importModule: (module: Module) => Promise<void>;
  getModule: (moduleId: string) => Module | undefined;
  listModules: () => Module[];
  updateModuleConfig: (moduleId: string, config: Record<string, any>) => Promise<void>;
}
