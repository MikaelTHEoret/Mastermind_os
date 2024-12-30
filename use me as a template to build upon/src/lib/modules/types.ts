import type { EventEmitter } from '../events/EventEmitter';

export interface Module {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  status: 'active' | 'inactive' | 'error';
  type: 'tool' | 'agent' | 'integration';
  capabilities: string[];
  entry: string;
  config?: Record<string, any>;
}

export interface ModuleManager extends EventEmitter {
  loadModule: (moduleId: string) => Promise<void>;
  unloadModule: (moduleId: string) => Promise<void>;
  importModule: (module: Module) => Promise<void>;
  getModule: (moduleId: string) => Module | undefined;
  listModules: () => Module[];
  updateModuleConfig: (moduleId: string, config: Record<string, any>) => Promise<void>;
}