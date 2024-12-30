import type { Module, ModuleManager } from './types';
import { useModuleStore } from '../../stores/moduleStore';
import { useLogStore } from '../../stores/logStore';
import { EventEmitter } from '../events/EventEmitter';

class ModuleManagerImpl extends EventEmitter implements ModuleManager {
  private store = useModuleStore.getState();
  private logger = useLogStore.getState();

  constructor() {
    super();
    this.setMaxListeners(20); // Increase max listeners if needed
  }

  async loadModule(moduleId: string): Promise<void> {
    try {
      const module = this.store.modules.find((m) => m.id === moduleId);
      if (!module) {
        throw new Error(`Module ${moduleId} not found`);
      }

      // Dynamic import of module entry point
      const moduleEntry = await import(/* @vite-ignore */ module.entry);
      
      // Initialize module
      await moduleEntry.default?.initialize?.(module.config);
      
      // Update module status
      this.store.updateModuleConfig(moduleId, { status: 'active' });
      this.store.toggleModule(moduleId);
      
      this.logger.addLog({
        source: 'ModuleManager',
        type: 'info',
        message: `Module ${module.name} loaded successfully`,
      });

      // Emit module loaded event
      this.emit('moduleLoaded', module);
    } catch (error) {
      this.logger.addLog({
        source: 'ModuleManager',
        type: 'error',
        message: `Failed to load module ${moduleId}: ${error.message}`,
      });
      throw error;
    }
  }

  async unloadModule(moduleId: string): Promise<void> {
    try {
      const module = this.store.modules.find((m) => m.id === moduleId);
      if (!module) {
        throw new Error(`Module ${moduleId} not found`);
      }

      // Dynamic import of module entry point
      const moduleEntry = await import(/* @vite-ignore */ module.entry);
      
      // Cleanup module
      await moduleEntry.default?.cleanup?.();
      
      // Update module status
      this.store.updateModuleConfig(moduleId, { status: 'inactive' });
      this.store.toggleModule(moduleId);
      
      this.logger.addLog({
        source: 'ModuleManager',
        type: 'info',
        message: `Module ${module.name} unloaded successfully`,
      });

      // Emit module unloaded event
      this.emit('moduleUnloaded', module);
    } catch (error) {
      this.logger.addLog({
        source: 'ModuleManager',
        type: 'error',
        message: `Failed to unload module ${moduleId}: ${error.message}`,
      });
      throw error;
    }
  }

  async importModule(module: Module): Promise<void> {
    try {
      // Validate module structure
      this.validateModule(module);
      
      // Add module to store
      this.store.addModule(module);
      
      this.logger.addLog({
        source: 'ModuleManager',
        type: 'info',
        message: `Module ${module.name} imported successfully`,
      });

      // Emit module import event
      this.emit('moduleImport', module);
    } catch (error) {
      this.logger.addLog({
        source: 'ModuleManager',
        type: 'error',
        message: `Failed to import module: ${error.message}`,
      });
      throw error;
    }
  }

  private validateModule(module: Module): void {
    // Add module validation logic here
    if (!module.id || !module.name || !module.entry) {
      throw new Error('Invalid module structure');
    }
  }

  getModule(moduleId: string): Module | undefined {
    return this.store.modules.find((m) => m.id === moduleId);
  }

  listModules(): Module[] {
    return this.store.modules;
  }

  async updateModuleConfig(
    moduleId: string,
    config: Record<string, any>
  ): Promise<void> {
    try {
      const module = this.getModule(moduleId);
      if (!module) {
        throw new Error(`Module ${moduleId} not found`);
      }

      this.store.updateModuleConfig(moduleId, config);
      
      // If module is active, reload it with new config
      if (this.store.activeModules.has(moduleId)) {
        await this.unloadModule(moduleId);
        await this.loadModule(moduleId);
      }
      
      this.logger.addLog({
        source: 'ModuleManager',
        type: 'info',
        message: `Module ${module.name} configuration updated`,
      });

      // Emit config updated event
      this.emit('moduleConfigUpdated', { moduleId, config });
    } catch (error) {
      this.logger.addLog({
        source: 'ModuleManager',
        type: 'error',
        message: `Failed to update module ${moduleId} config: ${error.message}`,
      });
      throw error;
    }
  }
}

export const moduleManager = new ModuleManagerImpl();