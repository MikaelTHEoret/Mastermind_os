import { create } from 'zustand';
import type { Module } from '../lib/modules/types';

interface ModuleStore {
  modules: Module[];
  activeModules: Set<string>;
  addModule: (module: Module) => void;
  removeModule: (moduleId: string) => void;
  toggleModule: (moduleId: string) => void;
  updateModuleConfig: (moduleId: string, config: Record<string, any>) => void;
}

export const useModuleStore = create<ModuleStore>((set) => ({
  modules: [],
  activeModules: new Set(),
  
  addModule: (module) =>
    set((state) => ({
      modules: [...state.modules, module],
    })),
    
  removeModule: (moduleId) =>
    set((state) => ({
      modules: state.modules.filter((m) => m.id !== moduleId),
      activeModules: new Set(
        Array.from(state.activeModules).filter((id) => id !== moduleId)
      ),
    })),
    
  toggleModule: (moduleId) =>
    set((state) => {
      const newActiveModules = new Set(state.activeModules);
      if (newActiveModules.has(moduleId)) {
        newActiveModules.delete(moduleId);
      } else {
        newActiveModules.add(moduleId);
      }
      return { activeModules: newActiveModules };
    }),
    
  updateModuleConfig: (moduleId, config) =>
    set((state) => ({
      modules: state.modules.map((m) =>
        m.id === moduleId ? { ...m, config: { ...m.config, ...config } } : m
      ),
    })),
}));