import { WorkerAgent, FileWorker, ScriptWorker } from './Worker';
import type { NexusAgent } from './types';
import { useLogStore } from '../../stores/logStore';

export class WorkerPool {
  private workers: Map<string, WorkerAgent> = new Map();
  private logger = useLogStore.getState();
  private maxWorkers: number = 10;

  constructor() {
    this.initializeDefaultWorkers();
  }

  private initializeDefaultWorkers() {
    // Initialize with basic worker types
    this.createWorker(FileWorker);
    this.createWorker(ScriptWorker);
  }

  createWorker(template: NexusAgent): WorkerAgent {
    if (this.workers.size >= this.maxWorkers) {
      throw new Error('Worker pool capacity reached');
    }

    const workerId = `${template.type}-${Date.now()}`;
    const worker = new WorkerAgent(workerId, template.type);
    
    this.workers.set(workerId, worker);
    this.logger.addLog({
      source: 'WorkerPool',
      type: 'info',
      message: `Created new worker: ${workerId}`
    });

    return worker;
  }

  async executeTask(type: string, script: string, context: any = {}): Promise<any> {
    // Find available worker of requested type
    const worker = this.findAvailableWorker(type);
    if (!worker) {
      throw new Error(`No available workers of type: ${type}`);
    }

    try {
      return await worker.executeScript(script, context);
    } catch (error) {
      this.logger.addLog({
        source: 'WorkerPool',
        type: 'error',
        message: `Task execution failed: ${error.message}`
      });
      throw error;
    }
  }

  private findAvailableWorker(type: string): WorkerAgent | undefined {
    return Array.from(this.workers.values()).find(
      worker => worker.type === type
    );
  }

  getWorkerCount(): number {
    return this.workers.size;
  }

  getWorkerStatus(): Array<{ id: string; type: string; status: string }> {
    return Array.from(this.workers.entries()).map(([id, worker]) => ({
      id,
      type: worker.type,
      status: 'active' // Add actual status tracking if needed
    }));
  }
}

export const workerPool = new WorkerPool();