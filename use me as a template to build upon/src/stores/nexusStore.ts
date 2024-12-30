import { create } from 'zustand';
import type { NexusCore, NexusAgent, TaskEvaluation } from '../lib/nexus/types';
import { centralNexus } from '../lib/nexus/CentralNexus';
import { JohnnyGoGetter } from '../lib/nexus/JohnnyGoGetter';
import { SirExecutor } from '../lib/nexus/SirExecutor';
import { workerPool } from '../lib/nexus/WorkerPool';
import { useLogStore } from './logStore';
import { memoryManager } from '../lib/memory/MemoryManager';
import { AppError } from '../lib/utils/errors';

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
  initialize: () => Promise<void>;
  submitTask: (task: string) => Promise<string>;
  evaluateTask: (task: string) => Promise<TaskEvaluation>;
  executeScript: (script: string) => Promise<any>;
}

export const useNexusStore = create<NexusStore>((set, get) => ({
  core: null,
  agents: new Map(),
  activeTask: null,
  nexus: centralNexus,

  initialize: async () => {
    try {
      // Initialize memory system first
      await memoryManager.initialize();
      useLogStore.getState().addLog({
        source: 'NexusStore',
        type: 'info',
        message: 'Memory system initialized successfully',
      });

      // Then initialize Nexus system
      if (!centralNexus.isInitialized()) {
        await centralNexus.initialize();
      }

      // Initialize agents
      await JohnnyGoGetter.initialize();
      await SirExecutor.initialize();

      // Update core state after all initializations
      const core = centralNexus.getState();
      core.status = 'active'; // Ensure core is marked as active

      const agents = new Map();
      agents.set(JohnnyGoGetter.id, JohnnyGoGetter);
      agents.set(SirExecutor.id, SirExecutor);

      set({
        core,
        agents,
      });

      useLogStore.getState().addLog({
        source: 'NexusStore',
        type: 'info',
        message: 'Agents initialized successfully'
      });

      useLogStore.getState().addLog({
        source: 'NexusStore',
        type: 'info',
        message: 'Nexus system initialized successfully',
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
}));
