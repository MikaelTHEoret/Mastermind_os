import { WorkerAgent, FileWorker, ScriptWorker, ProcessMetrics } from './Worker';
import type { NexusAgent } from './types';
import { useLogStore } from '../../stores/logStore';

interface WorkerMetrics {
  cpuUsage: number;
  memoryUsage: number;
  taskCount: number;
  lastActive: Date;
  status: 'idle' | 'busy' | 'error';
}

export class WorkerPool {
  private workers: Map<string, WorkerAgent> = new Map();
  private logger = useLogStore.getState();
  private maxWorkers: number = 4; // Reduced from 10
  private workerMetrics: Map<string, WorkerMetrics> = new Map();
  private metricsInterval: number | null = null;
  private initialized = false;

  constructor() {
    // Defer initialization until needed
  }

  private async initialize() {
    if (this.initialized) return;
    
    // Initialize with just one worker of each type
    await this.createWorker(FileWorker);
    await this.createWorker(ScriptWorker);
    
    this.startMetricsMonitoring();
    this.initialized = true;
  }

  private startMetricsMonitoring() {
    if (this.metricsInterval) return;

    // Reduced frequency and added dynamic interval
    let interval = 10000; // Start with 10 seconds
    
    const updateMetrics = () => {
      const metrics = this.updateWorkerMetrics();
      const highLoad = metrics.some(m => m.cpuUsage > 70 || m.memoryUsage > 70);
      
      // Adjust monitoring frequency based on load
      if (highLoad && interval > 5000) {
        if (this.metricsInterval) {
          window.clearInterval(this.metricsInterval);
        }
        interval = 5000;
        this.metricsInterval = window.setInterval(updateMetrics, interval);
      } else if (!highLoad && interval < 10000) {
        if (this.metricsInterval) {
          window.clearInterval(this.metricsInterval);
        }
        interval = 10000;
        this.metricsInterval = window.setInterval(updateMetrics, interval);
      }
    };

    this.metricsInterval = window.setInterval(updateMetrics, interval);
  }

  private updateWorkerMetrics(): Array<{ cpuUsage: number; memoryUsage: number }> {
    const metrics: Array<{ cpuUsage: number; memoryUsage: number }> = [];
    let totalCPU = 0;
    let totalMemory = 0;

    for (const [workerId, worker] of this.workers.entries()) {
      const currentMetrics = this.workerMetrics.get(workerId) || {
        cpuUsage: 0,
        memoryUsage: 0,
        taskCount: 0,
        lastActive: new Date(),
        status: 'idle' as const
      };

      // Get actual metrics from worker process
      const processMetrics = worker.getProcessMetrics();
      currentMetrics.cpuUsage = processMetrics.cpu;
      currentMetrics.memoryUsage = processMetrics.memory;
      
      metrics.push({
        cpuUsage: currentMetrics.cpuUsage,
        memoryUsage: currentMetrics.memoryUsage
      });

      totalCPU += currentMetrics.cpuUsage;
      totalMemory += currentMetrics.memoryUsage;
      
      this.workerMetrics.set(workerId, currentMetrics);

      // Only log if consistently high usage (avoid sporadic warnings)
      if (currentMetrics.cpuUsage > 80 || currentMetrics.memoryUsage > 80) {
        const timestamp = new Date().toLocaleTimeString();
        console.warn(`[${timestamp}] High resource usage in worker ${workerId}`);
      }
    }

    // Log pool-wide metrics less frequently
    if (this.workers.size > 0 && (totalCPU / this.workers.size > 70 || totalMemory / this.workers.size > 70)) {
      this.logger.addLog({
        source: 'WorkerPool',
        type: 'warning',
        message: 'High overall resource usage in worker pool'
      });
    }

    return metrics;
  }

  async createWorker(template: NexusAgent): Promise<WorkerAgent> {
    if (this.workers.size >= this.maxWorkers) {
      // Instead of throwing, try to reuse least busy worker
      const leastBusyWorker = this.findOptimalWorker(template.type);
      if (leastBusyWorker) return leastBusyWorker;
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

    return worker;
  }

  async executeTask(type: string, script: string, context: any = {}): Promise<any> {
    if (!this.initialized) await this.initialize();

    // Find or create optimal worker
    let worker = this.findOptimalWorker(type);
    if (!worker && this.workers.size < this.maxWorkers) {
      worker = await this.createWorker({ type } as NexusAgent);
    }
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
      // Execute with resource limits
      const result = await worker.executeScript(script, {
        ...context,
        maxCPU: 70,  // Reduced from 80
        maxMemory: 256,  // Reduced from 512
        timeout: 20000,  // Reduced from 30000
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
      throw error;
    }
  }

  private findOptimalWorker(type: string): WorkerAgent | undefined {
    const availableWorkers = Array.from(this.workers.values())
      .filter(worker => worker.type === type)
      .filter(worker => {
        const metrics = this.workerMetrics.get(worker.id);
        return metrics && metrics.status === 'idle' && 
               metrics.cpuUsage < 70 && metrics.memoryUsage < 70;
      });

    if (availableWorkers.length === 0) {
      return undefined;
    }

    // Return worker with lowest combined resource usage
    return availableWorkers.reduce((best, current) => {
      const bestMetrics = this.workerMetrics.get(best.id);
      const currentMetrics = this.workerMetrics.get(current.id);

      if (!bestMetrics || !currentMetrics) return best;

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
      // Terminate workers idle for more than 2 minutes (reduced from 5)
      if (metrics.status === 'idle' && 
          now.getTime() - metrics.lastActive.getTime() > 2 * 60 * 1000) {
        this.workers.delete(workerId);
        this.workerMetrics.delete(workerId);
      }
    }
  }

  shutdown(): void {
    if (this.metricsInterval) {
      window.clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    
    this.workers.clear();
    this.workerMetrics.clear();
    this.initialized = false;
  }
}

export const workerPool = new WorkerPool();
