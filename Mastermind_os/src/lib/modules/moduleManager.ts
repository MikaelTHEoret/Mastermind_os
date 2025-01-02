import { Module } from './types';

export class ModuleManager {
  private loadedModules: Map<string, Module> = new Map();

  async loadModule(modulePath: string): Promise<Module> {
    try {
      // Dynamically import the module
      const module = await import(modulePath);
      
      // Validate the module structure
      if (!module.default || typeof module.default.init !== 'function') {
        throw new Error('Invalid module structure - missing default export with init function');
      }

      // Initialize the module
      const initializedModule = await module.default.init();
      
      // Store the module
      this.loadedModules.set(modulePath, initializedModule);

      return initializedModule;
    } catch (error) {
      console.error(`Failed to load module from ${modulePath}:`, error);
      throw error;
    }
  }

  getModule(modulePath: string): Module | undefined {
    return this.loadedModules.get(modulePath);
  }

  unloadModule(modulePath: string): boolean {
    return this.loadedModules.delete(modulePath);
  }

  getLoadedModules(): Map<string, Module> {
    return new Map(this.loadedModules);
  }
}

export const moduleManager = new ModuleManager();
