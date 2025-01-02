import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NexusCore, NexusAgent, TaskEvaluation } from '../lib/nexus/types';
import { centralNexus } from '../lib/nexus/CentralNexus';
import { JohnnyGoGetter } from '../lib/nexus/JohnnyGoGetter';
import { SirExecutor } from '../lib/nexus/SirExecutor';
import { workerPool } from '../lib/nexus/WorkerPool';
import { useLogStore } from './logStore';
import { memoryManager } from '../lib/memory/MemoryManager';
import { AppError } from '../lib/utils/errors';
import { Module } from '../lib/modules/types';

interface ProcessingAgent extends NexusAgent {
  evaluateTask: (task: string) => Promise<TaskEvaluation>;
  processTask: (task: string) => Promise<string>;
  translateTask?: (task: string) => Promise<string>;
}

interface NexusStore {
  core: NexusCore | null;
  agents: Map<string, NexusAgent>;
  activeTask: string | null;
  nexus: typeof centralNexus;
  loadedModules: Module[];
  initialize: () => Promise<void>;
  submitTask: (task: string) => Promise<string>;
  evaluateTask: (task: string) => Promise<TaskEvaluation>;
  executeScript: (script: string) => Promise<any>;
  loadModule: (module: Module) => Promise<void>;
}

type PersistedState = {
  core: { id: string; status: 'error' | 'active' | 'standby' } | null;
  agents: Map<string, NexusAgent>;
  activeTask: string | null;
  nexus: typeof centralNexus;
  loadedModules: Module[];
};

export const useNexusStore = create<NexusStore>()(
  persist(
    (set, get) => ({
      core: null,
      agents: new Map(),
      activeTask: null,
      nexus: centralNexus,
      loadedModules: [],

      initialize: async () => {
        const logError = (error: unknown, context: string) => {
          const message = error instanceof Error ? error.message : String(error);
          useLogStore.getState().addLog({
            source: 'NexusStore',
            type: 'error',
            message: `${context}: ${message}`,
          });
        };

        try {
          // Initialize memory system first
          try {
            await memoryManager.initialize();
          } catch (error) {
            logError(error, 'Memory system initialization failed (non-critical)');
            // Continue initialization despite memory system failure
          }

          // Initialize Nexus system
          if (!centralNexus.isInitialized()) {
            await centralNexus.initialize();
          }

          // Get initialized state from Central Nexus
          const core = centralNexus.getState();
          const agents = centralNexus.getAgents();

          // Batch state updates to reduce re-renders
          set({
            core,
            agents,
          });

          // Single log entry for successful initialization
          useLogStore.getState().addLog({
            source: 'NexusStore',
            type: 'info',
            message: 'System initialization completed',
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          useLogStore.getState().addLog({
            source: 'NexusStore',
            type: 'error',
            message: `Failed to initialize Nexus system: ${message}`,
          });
          throw new AppError('Failed to initialize Nexus system', 'NexusStore', error);
        }
      },

      submitTask: async (task: string) => {
        const { agents } = get();
        const johnny = agents.get(JohnnyGoGetter.id) as ProcessingAgent;
        
        if (!johnny) {
          throw new AppError('Johnny Go Getter not initialized', 'NexusStore');
        }

        set({ activeTask: task });

        try {
          // Let Johnny evaluate and process the task
          const evaluation = await johnny.evaluateTask(task);
          
          if (evaluation.recommendedProcessor.type === 'api') {
            // Handle API-based processing
            return await johnny.processTask(task);
          } else {
            // Handle local processing through Sir Executor
            const executor = agents.get(SirExecutor.id) as ProcessingAgent;
            if (!executor) {
              throw new AppError('Sir Executor not initialized', 'NexusStore');
            }

            if (!executor.translateTask) {
              throw new AppError('Sir Executor does not support task translation', 'NexusStore');
            }

            const script = await executor.translateTask(task);
            return await workerPool.executeTask('script', script);
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          useLogStore.getState().addLog({
            source: 'NexusStore',
            type: 'error',
            message: `Task execution failed: ${message}`,
          });
          throw new AppError('Task execution failed', 'NexusStore', error);
        } finally {
          set({ activeTask: null });
        }
      },

      evaluateTask: async (task: string) => {
        const { agents } = get();
        const johnny = agents.get(JohnnyGoGetter.id) as ProcessingAgent;
        
        if (!johnny) {
          throw new AppError('Johnny Go Getter not initialized', 'NexusStore');
        }

        return johnny.evaluateTask(task);
      },

      executeScript: async (script: string) => {
        const { agents } = get();
        const executor = agents.get(SirExecutor.id) as ProcessingAgent;
        
        if (!executor) {
          throw new AppError('Sir Executor not initialized', 'NexusStore');
        }

        return workerPool.executeTask('script', script);
      },

      loadModule: async (module: Module) => {
        try {
          // Initialize the module
          await module.init();
          
          // Add to loaded modules
          set((state) => ({
            loadedModules: [...state.loadedModules, module]
          }));

          useLogStore.getState().addLog({
            source: 'NexusStore',
            type: 'info',
            message: `Module ${module.name} v${module.version} loaded successfully`
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          useLogStore.getState().addLog({
            source: 'NexusStore',
            type: 'error',
            message: `Failed to load module ${module.name}: ${message}`,
          });
          throw new AppError('Failed to load module', 'NexusStore', error);
        }
      }
    }),
    {
      name: 'nexus-store',
      partialize: (state: NexusStore): PersistedState => ({
        core: state.core ? {
          id: state.core.id,
          status: state.core.status
        } : null,
        agents: new Map(),
        activeTask: null,
        nexus: centralNexus,
        loadedModules: state.loadedModules
      })
    }
  )
);
