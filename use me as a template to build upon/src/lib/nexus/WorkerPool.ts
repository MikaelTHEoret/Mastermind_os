import { WorkerAgent, FileWorker, ScriptWorker } from './Worker';
import type { NexusAgent } from './types';
import { useLogStore } from '../../stores/logStore';

export class WorkerPool {
  private workers: Map<string, WorkerAgent> = new Map();
  private logger = useLogStore.getState();
  private maxWorkers: number = 10;
  private workerMetrics: Map<string, {
    cpuUsage: number;
    memoryUsage: number;
    taskCount: number;
    lastActive: Date;
    status: 'idle' | 'busy' | 'error';
  }> = new Map();

  constructor() {
    this.initializeDefaultWorkers();
    this.startMetricsMonitoring();
  }

  private initializeDefaultWorkers() {
    // Initialize with basic worker types
    this.createWorker(FileWorker);
    this.createWorker(ScriptWorker);
  }

  private startMetricsMonitoring() {
    setInterval(() => {
      this.updateWorkerMetrics();
    }, 5000); // Update every 5 seconds
  }

  private updateWorkerMetrics() {
    for (const [workerId, worker] of this.workers.entries()) {
      const metrics = this.workerMetrics.get(workerId) || {
        cpuUsage: 0,
        memoryUsage: 0,
        taskCount: 0,
        lastActive: new Date(),
        status: 'idle' as const
      };

      // Update metrics based on worker state
      metrics.cpuUsage = this.calculateWorkerCPU();
      metrics.memoryUsage = this.calculateWorkerMemory();
      
      this.workerMetrics.set(workerId, metrics);

      // Log if resource usage is high
      if (metrics.cpuUsage > 80 || metrics.memoryUsage > 80) {
        this.logger.addLog({
          source: 'WorkerPool',
          type: 'warning',
          message: `High resource usage for worker ${workerId}: CPU ${metrics.cpuUsage}%, Memory ${metrics.memoryUsage}%`
        });
      }
    }
  }

  private calculateWorkerCPU(): number {
    // Implementation would use actual CPU metrics
    return Math.random() * 100;
  }

  private calculateWorkerMemory(): number {
    // Implementation would use actual memory metrics
    return Math.random() * 100;
  }

  createWorker(template: NexusAgent): WorkerAgent {
    if (this.workers.size >= this.maxWorkers) {
      throw new Error('Worker pool capacity reached');
    }

    const workerId = `${template.type}-${Date.now()}`;
    const worker = new WorkerAgent(workerId, template.type);
    
    this.workers.set(workerId, worker);
    this.workerMetrics.set(workerId, {
      cpuUsage: 0,
      memoryUsage: 0,
      taskCount: 0,
      lastActive: new Date(),
      status: 'idle'
    });

    this.logger.addLog({
      source: 'WorkerPool',
      type: 'info',
      message: `Created new worker: ${workerId}`
    });

    return worker;
  }

  async executeTask(type: string, script: string, context: any = {}): Promise<any> {
    // Find available worker with lowest load
    const worker = this.findOptimalWorker(type);
    if (!worker) {
      throw new Error(`No available workers of type: ${type}`);
    }

    const workerId = worker.id;
    const metrics = this.workerMetrics.get(workerId);
    
    if (metrics) {
      metrics.status = 'busy';
      metrics.taskCount++;
      metrics.lastActive = new Date();
    }

    try {
      // Execute in isolated context
      const result = await worker.executeScript(script, {
        ...context,
        maxCPU: 80,  // CPU usage limit
        maxMemory: 512,  // Memory limit in MB
        timeout: 30000,  // Timeout in ms
        allowedModules: ['fs.promises', 'https', 'http']
      });

      if (metrics) {
        metrics.status = 'idle';
      }

      return result;
    } catch (error: unknown) {
      if (metrics) {
        metrics.status = 'error';
      }

      const message = error instanceof Error ? error.message : String(error);
      this.logger.addLog({
        source: 'WorkerPool',
        type: 'error',
        message: `Task execution failed: ${message}`
      });
      throw error;
    }
  }

  private findOptimalWorker(type: string): WorkerAgent | undefined {
    const availableWorkers = Array.from(this.workers.values())
      .filter(worker => worker.type === type)
      .filter(worker => {
        const metrics = this.workerMetrics.get(worker.id);
        return metrics && metrics.status === 'idle' && 
               metrics.cpuUsage < 80 && metrics.memoryUsage < 80;
      });

    if (availableWorkers.length === 0) {
      return undefined;
    }

    // Return worker with lowest resource usage
    return availableWorkers.reduce((best, current) => {
      const bestMetrics = this.workerMetrics.get(best.id);
      const currentMetrics = this.workerMetrics.get(current.id);

      if (!bestMetrics || !currentMetrics) {
        return best;
      }

      const bestScore = bestMetrics.cpuUsage + bestMetrics.memoryUsage;
      const currentScore = currentMetrics.cpuUsage + currentMetrics.memoryUsage;

      return currentScore < bestScore ? current : best;
    });
  }

  getWorkerCount(): number {
    return this.workers.size;
  }

  getWorkerStatus(): Array<{ 
    id: string; 
    type: string; 
    status: string;
    metrics: {
      cpuUsage: number;
      memoryUsage: number;
      taskCount: number;
      lastActive: string;
    };
  }> {
    return Array.from(this.workers.entries()).map(([id, worker]) => {
      const metrics = this.workerMetrics.get(id);
      return {
        id,
        type: worker.type,
        status: metrics?.status || 'unknown',
        metrics: metrics ? {
          cpuUsage: metrics.cpuUsage,
          memoryUsage: metrics.memoryUsage,
          taskCount: metrics.taskCount,
          lastActive: metrics.lastActive.toISOString()
        } : {
          cpuUsage: 0,
          memoryUsage: 0,
          taskCount: 0,
          lastActive: new Date().toISOString()
        }
      };
    });
  }

  terminateIdleWorkers(): void {
    const now = new Date();
    for (const [workerId, metrics] of this.workerMetrics.entries()) {
      // Terminate workers idle for more than 5 minutes
      if (metrics.status === 'idle' && 
          now.getTime() - metrics.lastActive.getTime() > 5 * 60 * 1000) {
        this.workers.delete(workerId);
        this.workerMetrics.delete(workerId);
        this.logger.addLog({
          source: 'WorkerPool',
          type: 'info',
          message: `Terminated idle worker: ${workerId}`
        });
      }
    }
  }
}

export const workerPool = new WorkerPool();
