 import type { NexusAgent } from './types';
import { useLogStore } from '../../stores/logStore';
import { validatePath } from '../fs/permissions';

export interface ProcessMetrics {
  cpu: number;
  memory: number;
}

export class WorkerAgent {
  public readonly id: string;
  public readonly type: string;
  private logger = useLogStore.getState();
  private startTime: number;
  private lastMetricsUpdate: number;
  private currentMetrics: ProcessMetrics;

  constructor(id: string, type: string) {
    this.id = id;
    this.type = type;
    this.startTime = Date.now();
    this.lastMetricsUpdate = this.startTime;
    this.currentMetrics = { cpu: 0, memory: 0 };
  }

  getProcessMetrics(): ProcessMetrics {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastMetricsUpdate;
    
    // Only update metrics every second to reduce overhead
    if (timeSinceLastUpdate >= 1000) {
      this.updateMetrics();
      this.lastMetricsUpdate = now;
    }

    return this.currentMetrics;
  }

  private updateMetrics(): void {
    // Calculate metrics based on actual resource usage
    const uptime = Date.now() - this.startTime;
    const processInfo = process.memoryUsage();
    
    // Calculate CPU usage (simplified for demo)
    const cpuUsage = Math.min(
      (Math.sin(uptime / 10000) + 1) * 30, // Simulate varying CPU load
      100
    );

    // Calculate memory usage
    const memoryUsage = Math.min(
      (processInfo.heapUsed / processInfo.heapTotal) * 100,
      100
    );

    this.currentMetrics = {
      cpu: cpuUsage,
      memory: memoryUsage
    };
  }

  async executeScript(script: string, context: any = {}): Promise<any> {
    try {
      this.logger.addLog({
        source: `Worker-${this.id}`,
        type: 'info',
        message: `Executing script of type: ${this.type}`
      });

      // Validate permissions before execution
      if (!this.validatePermissions(context)) {
        throw new Error('Insufficient permissions for requested operation');
      }

      // Execute in isolated context
      const result = await this.runInSandbox(script, context);
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.addLog({
        source: `Worker-${this.id}`,
        type: 'error',
        message: `Script execution failed: ${message}`
      });
      throw error;
    }
  }

  private validatePermissions(context: any): boolean {
    if (context.fileAccess) {
      const { path, operation } = context.fileAccess;
      
      // Check file system permissions
      const fsConfig = context.fileSystem || {
        read: true,
        write: false,
        allowedPaths: [],
        blockedPaths: []
      };
      
      if (operation === 'read' && !fsConfig.read) return false;
      if (operation === 'write' && !fsConfig.write) return false;
      
      // Validate path against allowed/blocked paths
      return validatePath(path, fsConfig);
    }
    
    return true;
  }

  private async runInSandbox(script: string, context: any): Promise<any> {
    const startTime = process.hrtime();

    // Create isolated environment
    const sandbox = {
      console: {
        log: (msg: string) => this.log('info', msg),
        error: (msg: string) => this.log('error', msg),
      },
      fs: this.createRestrictedFS(),
      context,
    };

    try {
      // Execute script in sandbox
      const fn = new Function('sandbox', `
        with (sandbox) {
          ${script}
        }
      `);

      const result = fn(sandbox);

      // Update metrics after execution
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const executionTime = seconds * 1000 + nanoseconds / 1e6; // Convert to ms
      
      // Update CPU metrics based on execution time
      this.currentMetrics.cpu = Math.min(
        (executionTime / context.timeout || 1000) * 100,
        100
      );

      return result;
    } catch (error) {
      // Update error metrics
      this.currentMetrics.cpu = 100; // Indicate high load on error
      throw error;
    }
  }

  private createRestrictedFS() {
    return {
      readFile: async (path: string) => {
        if (!this.validatePermissions({ fileAccess: { path, operation: 'read' }})) {
          throw new Error('Access denied');
        }
        // Implement safe file reading
      },
      writeFile: async (path: string) => {
        if (!this.validatePermissions({ fileAccess: { path, operation: 'write' }})) {
          throw new Error('Access denied');
        }
        // Implement safe file writing
      }
    };
  }

  private log(type: 'info' | 'error', message: string) {
    this.logger.addLog({
      source: `Worker-${this.id}`,
      type,
      message
    });
  }
}

// Worker Types
export const FileWorker: NexusAgent = {
  id: 'file-worker',
  name: 'File System Worker',
  type: 'worker',
  status: 'active',
  clearance: 3,
  specialization: ['file-operations', 'data-transfer', 'path-validation'],
  personality: {
    traits: {
      enthusiasm: 0.1,
      efficiency: 0.9,
      creativity: 0.1,
      precision: 0.95
    },
    quirks: [
      'Reports file sizes in exact bytes',
      'Always double-checks paths',
      'Maintains detailed operation logs'
    ],
    catchphrases: [
      "Path validated. Operation proceeding.",
      "File integrity verified.",
      "Access permissions confirmed."
    ],
    background: "A specialized worker unit dedicated to safe and efficient file system operations."
  },
  processingMetrics: {
    localTasks: 0,
    apiTasks: 0,
    averageCostPerTask: 0,
    successRate: 1.0,
    lastHealthCheck: new Date().toISOString(),
    responseTime: 0,
    taskHistory: []
  },
  resourceAllocation: {
    cpuQuota: 25,
    memoryQuota: 256,
    priorityLevel: 3,
    currentLoad: 0
  }
};

export const ScriptWorker: NexusAgent = {
  id: 'script-worker',
  name: 'Script Execution Worker',
  type: 'worker',
  status: 'active',
  clearance: 2,
  specialization: ['script-execution', 'sandbox-management', 'runtime-isolation'],
  personality: {
    traits: {
      enthusiasm: 0.2,
      efficiency: 0.85,
      creativity: 0.15,
      precision: 0.9
    },
    quirks: [
      'Counts executed operations',
      'Reports execution time in nanoseconds',
      'Maintains execution history'
    ],
    catchphrases: [
      "Sandbox initialized. Script loaded.",
      "Runtime isolation confirmed.",
      "Execution sequence complete."
    ],
    background: "A dedicated worker unit specialized in safe script execution within isolated environments."
  },
  processingMetrics: {
    localTasks: 0,
    apiTasks: 0,
    averageCostPerTask: 0,
    successRate: 1.0,
    lastHealthCheck: new Date().toISOString(),
    responseTime: 0,
    taskHistory: []
  },
  resourceAllocation: {
    cpuQuota: 35,
    memoryQuota: 512,
    priorityLevel: 2,
    currentLoad: 0
  }
};
