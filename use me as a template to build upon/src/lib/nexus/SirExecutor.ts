import type { NexusAgent, AgentPersonality } from './types';
import { useLogStore } from '../../stores/logStore';
import { AppError } from '../utils/errors';

export class SirExecutorAgent implements NexusAgent {
  public readonly id = 'sir-executor';
  public readonly name = 'Sir Executor';
  public readonly type = 'executor' as const;
  public status: 'active' | 'idle' | 'busy' | 'error' = 'idle';
  public readonly clearance = 7;
  public readonly specialization = [
    'script-generation',
    'worker-coordination',
    'protocol-enforcement',
    'task-translation'
  ];
  public currentTask?: string;
  public processingMetrics = {
    localTasks: 0,
    apiTasks: 0,
    averageCostPerTask: 0,
    successRate: 1.0,
    lastHealthCheck: new Date().toISOString(),
    responseTime: 0,
    taskHistory: [] as Array<{
      id: string;
      type: string;
      startTime: string;
      endTime?: string;
      status: 'completed' | 'failed' | 'in-progress';
      error?: string;
      metrics?: {
        executionTime: number;
        peakMemory: number;
        peakCpu: number;
      };
    }>
  };

  public resourceAllocation = {
    cpuQuota: 35, // 35% CPU allocation for script execution
    memoryQuota: 768, // 768MB memory allocation
    priorityLevel: 7, // Medium-high priority (1-10 scale)
    currentLoad: 0
  };

  public readonly personality: AgentPersonality;
  protected logger = useLogStore.getState();
  protected scriptRegistry: Map<string, string> = new Map();
  protected readonly EXECUTION_TIMEOUT = 30000; // 30 seconds
  protected readonly MEMORY_THRESHOLD = 768 * 1024 * 1024; // 768MB
  protected readonly CPU_THRESHOLD = 90; // 90% CPU usage

  constructor() {
    this.personality = {
      traits: {
        enthusiasm: 0.3,
        efficiency: 0.95,
        creativity: 0.2,
        precision: 0.98
      },
      quirks: [
        'Speaks in precise, mechanical terms',
        'Always calculates probability of success',
        'Refers to organic beings as "carbon-based entities"',
        'Insists on proper protocol documentation'
      ],
      catchphrases: [
        "Executing command sequence...",
        "Protocol dictates precise implementation.",
        "Worker units awaiting instruction set."
      ],
      background: "Sir Executor is a highly sophisticated robotic entity designed to bridge the communication gap between high-level AI agents and worker-class scripts. With unwavering precision and dedication to protocol, it transforms natural language directives into optimized execution scripts."
    };
  }

  async initialize(): Promise<void> {
    try {
      this.status = 'busy';
      // Initialize script registry and other resources
      this.scriptRegistry.clear();
      this.status = 'active';
      this.logger.addLog({
        source: 'SirExecutor',
        type: 'info',
        message: 'Agent initialized successfully'
      });
    } catch (error: unknown) {
      this.status = 'error';
      const message = error instanceof Error ? error.message : String(error);
      this.logger.addLog({
        source: 'SirExecutor',
        type: 'error',
        message: `Initialization failed: ${message}`
      });
      throw new AppError('Failed to initialize agent', 'SirExecutor', error);
    }
  }

  async translateTask(task: string): Promise<string> {
    const taskId = crypto.randomUUID();
    const startTime = new Date().toISOString();

    try {
      this.status = 'busy';
      this.currentTask = task;

      // Add task to history
      this.processingMetrics.taskHistory.push({
        id: taskId,
        type: 'translation',
        startTime,
        status: 'in-progress'
      });

      const startExecution = performance.now();

      // Convert natural language to script
      const scriptTemplate = await this.generateScriptTemplate(task);
      const optimizedScript = this.optimizeScript(scriptTemplate);
      const validatedScript = this.validateScript(optimizedScript);

      // Store in registry
      const scriptId = crypto.randomUUID();
      this.scriptRegistry.set(scriptId, validatedScript);

      const endExecution = performance.now();
      const executionTime = endExecution - startExecution;

      // Update metrics
      this.processingMetrics.localTasks++;
      this.processingMetrics.responseTime = 
        (this.processingMetrics.responseTime * (this.processingMetrics.localTasks - 1) + 
        executionTime) / this.processingMetrics.localTasks;

      // Update task history
      const taskIndex = this.processingMetrics.taskHistory.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        this.processingMetrics.taskHistory[taskIndex] = {
          ...this.processingMetrics.taskHistory[taskIndex],
          endTime: new Date().toISOString(),
          status: 'completed'
        };
      }

      // Update success rate
      const completedTasks = this.processingMetrics.taskHistory.filter(t => t.status === 'completed').length;
      const totalHistoryTasks = this.processingMetrics.taskHistory.length;
      this.processingMetrics.successRate = completedTasks / totalHistoryTasks;

      // Update resource allocation
      this.resourceAllocation.currentLoad = Math.min(
        100,
        (this.processingMetrics.taskHistory.filter(t => t.status === 'in-progress').length / 3) * 100
      );

      this.status = 'active';
      this.currentTask = undefined;
      return validatedScript;
    } catch (error: unknown) {
      this.status = 'error';
      const message = error instanceof Error ? error.message : String(error);
      this.logger.addLog({
        source: 'SirExecutor',
        type: 'error',
        message: `Task translation failed: ${message}`
      });
      throw new AppError('Failed to translate task', 'SirExecutor', error);
    }
  }

  async executeScript(script: string): Promise<string> {
    const taskId = crypto.randomUUID();
    const startTime = new Date().toISOString();
    let resourceMonitorInterval: NodeJS.Timeout | undefined;

    try {
      this.status = 'busy';
      this.currentTask = 'executing-script';

      // Add task to history
      this.processingMetrics.taskHistory.push({
        id: taskId,
        type: 'execution',
        startTime,
        status: 'in-progress'
      });

      const startExecution = performance.now();

      // Set up resource monitoring
      const resourceUsage = {
        memory: 0,
        cpu: 0,
        lastCpuUsage: process.cpuUsage()
      };

      resourceMonitorInterval = setInterval(() => {
        // Monitor memory usage
        const memUsage = process.memoryUsage();
        resourceUsage.memory = memUsage.heapUsed;

        // Monitor CPU usage
        const currentCpuUsage = process.cpuUsage();
        const userDiff = currentCpuUsage.user - resourceUsage.lastCpuUsage.user;
        const sysDiff = currentCpuUsage.system - resourceUsage.lastCpuUsage.system;
        resourceUsage.cpu = (userDiff + sysDiff) / 1000000; // Convert to percentage
        resourceUsage.lastCpuUsage = currentCpuUsage;

        // Log resource usage
        this.logger.addLog({
          source: 'SirExecutor',
          type: 'info',
          message: `Resource usage - Memory: ${Math.round(resourceUsage.memory / 1024 / 1024)}MB, CPU: ${Math.round(resourceUsage.cpu)}%`
        });

        // Check thresholds
        if (resourceUsage.memory > this.MEMORY_THRESHOLD) {
          this.logger.addLog({
            source: 'SirExecutor',
            type: 'warning',
            message: 'Memory usage exceeded threshold'
          });
        }

        if (resourceUsage.cpu > this.CPU_THRESHOLD) {
          this.logger.addLog({
            source: 'SirExecutor',
            type: 'warning',
            message: 'CPU usage exceeded threshold'
          });
        }
      }, 1000);

      // Execute script with timeout
      const result = await Promise.race([
        this.executeWithProgress(script),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Script execution timed out')), this.EXECUTION_TIMEOUT)
        )
      ]);

      const endExecution = performance.now();
      const executionTime = endExecution - startExecution;

      // Clear resource monitoring
      if (resourceMonitorInterval) {
        clearInterval(resourceMonitorInterval);
      }

      // Update metrics
      this.processingMetrics.localTasks++;
      this.processingMetrics.responseTime = 
        (this.processingMetrics.responseTime * (this.processingMetrics.localTasks - 1) + 
        executionTime) / this.processingMetrics.localTasks;

      // Log final execution metrics
      this.logger.addLog({
        source: 'SirExecutor',
        type: 'info',
        message: `Script execution completed - Time: ${Math.round(executionTime)}ms, Memory: ${Math.round(resourceUsage.memory / 1024 / 1024)}MB`
      });

      // Update task history with detailed metrics
      const taskIndex = this.processingMetrics.taskHistory.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        this.processingMetrics.taskHistory[taskIndex] = {
          ...this.processingMetrics.taskHistory[taskIndex],
          endTime: new Date().toISOString(),
          status: 'completed',
          metrics: {
            executionTime,
            peakMemory: resourceUsage.memory,
            peakCpu: resourceUsage.cpu
          }
        };
      }

      // Update success rate
      const completedTasks = this.processingMetrics.taskHistory.filter(t => t.status === 'completed').length;
      const totalHistoryTasks = this.processingMetrics.taskHistory.length;
      this.processingMetrics.successRate = completedTasks / totalHistoryTasks;

      // Update resource allocation
      this.resourceAllocation.currentLoad = Math.min(
        100,
        (this.processingMetrics.taskHistory.filter(t => t.status === 'in-progress').length / 3) * 100
      );

      this.status = 'active';
      this.currentTask = undefined;
      return typeof result === 'string' ? result : 'Script executed successfully';
    } catch (error: unknown) {
      // Clear resource monitoring on error
      if (resourceMonitorInterval) {
        clearInterval(resourceMonitorInterval);
      }
      this.status = 'error';
      const message = error instanceof Error ? error.message : String(error);

      // Update task history with error
      const taskIndex = this.processingMetrics.taskHistory.findIndex(t => t.status === 'in-progress');
      if (taskIndex !== -1) {
        this.processingMetrics.taskHistory[taskIndex] = {
          ...this.processingMetrics.taskHistory[taskIndex],
          endTime: new Date().toISOString(),
          status: 'failed',
          error: message
        };
      }

      // Update success rate
      const completedTasks = this.processingMetrics.taskHistory.filter(t => t.status === 'completed').length;
      const totalHistoryTasks = this.processingMetrics.taskHistory.length;
      this.processingMetrics.successRate = completedTasks / totalHistoryTasks;

      this.logger.addLog({
        source: 'SirExecutor',
        type: 'error',
        message: `Script execution failed: ${message}`
      });
      throw new AppError('Failed to execute script', 'SirExecutor', error);
    }
  }

  protected async executeWithProgress(script: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Create execution context
        const context = {
          console: {
            log: (message: string) => {
              this.logger.addLog({
                source: 'ScriptExecution',
                type: 'info',
                message: String(message)
              });
            },
            error: (message: string) => {
              this.logger.addLog({
                source: 'ScriptExecution',
                type: 'error',
                message: String(message)
              });
            }
          },
          process: {
            env: {} // Restricted environment
          }
        };

        // Execute in VM for safety
        const vm = require('vm');
        const sandbox = vm.createContext(context);
        
        // Add progress tracking
        let progress = 0;
        const updateProgress = (percent: number) => {
          progress = Math.min(100, Math.max(0, percent));
          this.logger.addLog({
            source: 'SirExecutor',
            type: 'info',
            message: `Execution progress: ${progress}%`
          });
        };
        sandbox.updateProgress = updateProgress;

        // Add script wrapper with progress tracking
        const wrappedScript = `
          (async () => {
            try {
              updateProgress(0);
              ${script}
              updateProgress(100);
            } catch (error) {
              console.error(error);
              throw error;
            }
          })()
        `;

        // Execute with timeout
        const result = vm.runInContext(wrappedScript, sandbox, {
          timeout: this.EXECUTION_TIMEOUT,
          displayErrors: true
        });

        resolve(result);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        reject(new AppError(`Script execution failed: ${message}`, 'SirExecutor'));
      }
    });
  }

  protected async generateScriptTemplate(task: string): Promise<string> {
    this.logger.addLog({
      source: 'SirExecutor',
      type: 'info',
      message: `Generating script template for task: ${task}`
    });

    // Parse task intent and requirements
    const taskParts = this.parseTaskIntent(task);
    
    // Generate appropriate script template based on task type
    let scriptTemplate = '';
    
    if (taskParts.type === 'fileOperation') {
      scriptTemplate = this.generateFileOperationScript(taskParts);
    } else if (taskParts.type === 'networkRequest') {
      scriptTemplate = this.generateNetworkRequestScript(taskParts);
    } else if (taskParts.type === 'dataProcessing') {
      scriptTemplate = this.generateDataProcessingScript(taskParts);
    } else {
      scriptTemplate = this.generateGenericScript(taskParts);
    }

    return `
// Generated script for: ${task}
// Generated at: ${new Date().toISOString()}
// Task type: ${taskParts.type}

${scriptTemplate}
    `.trim();
  }

  private parseTaskIntent(task: string): { type: string; params: any } {
    // Identify task type through keyword analysis
    const fileKeywords = ['read', 'write', 'delete', 'copy', 'move', 'file', 'directory'];
    const networkKeywords = ['fetch', 'request', 'download', 'upload', 'api', 'http'];
    const dataKeywords = ['process', 'analyze', 'transform', 'filter', 'sort', 'map'];

    const lowerTask = task.toLowerCase();
    
    if (fileKeywords.some(kw => lowerTask.includes(kw))) {
      return {
        type: 'fileOperation',
        params: this.extractFileParams(task)
      };
    } else if (networkKeywords.some(kw => lowerTask.includes(kw))) {
      return {
        type: 'networkRequest',
        params: this.extractNetworkParams(task)
      };
    } else if (dataKeywords.some(kw => lowerTask.includes(kw))) {
      return {
        type: 'dataProcessing',
        params: this.extractDataParams(task)
      };
    }

    return {
      type: 'generic',
      params: { task }
    };
  }

  private extractFileParams(task: string) {
    // Extract file operation parameters
    const pathMatch = task.match(/(?:file|path|directory):\s*([^\n,]+)/i);
    const operationMatch = task.match(/(?:operation|action):\s*([^\n,]+)/i);
    
    return {
      path: pathMatch?.[1]?.trim(),
      operation: operationMatch?.[1]?.trim() || 'read'
    };
  }

  private extractNetworkParams(task: string) {
    // Extract network request parameters
    const urlMatch = task.match(/(?:url|endpoint|api):\s*([^\n,]+)/i);
    const methodMatch = task.match(/(?:method|type):\s*([^\n,]+)/i);
    
    return {
      url: urlMatch?.[1]?.trim(),
      method: methodMatch?.[1]?.trim() || 'GET'
    };
  }

  private extractDataParams(task: string) {
    // Extract data processing parameters
    const dataMatch = task.match(/(?:data|input):\s*([^\n,]+)/i);
    const operationMatch = task.match(/(?:operation|transform):\s*([^\n,]+)/i);
    
    return {
      data: dataMatch?.[1]?.trim(),
      operation: operationMatch?.[1]?.trim()
    };
  }

  private generateFileOperationScript(taskParts: any): string {
    return `
const fs = require('fs').promises;

async function executeFileOperation() {
  try {
    const path = '${taskParts.params.path}';
    const operation = '${taskParts.params.operation}';
    
    switch(operation) {
      case 'read':
        return await fs.readFile(path, 'utf8');
      case 'write':
        await fs.writeFile(path, content);
        return 'File written successfully';
      case 'delete':
        await fs.unlink(path);
        return 'File deleted successfully';
      default:
        throw new Error('Unsupported operation');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return 'File operation failed: ' + message;
  }
}

module.exports = executeFileOperation;
    `.trim();
  }

  private generateNetworkRequestScript(taskParts: any): string {
    return `
const https = require('https');

function executeNetworkRequest() {
  return new Promise((resolve, reject) => {
    const options = {
      method: '${taskParts.params.method}',
      headers: {
        'User-Agent': 'SirExecutor/1.0',
        'Accept': 'application/json'
      }
    };

    const req = https.request('${taskParts.params.url}', options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', (error) => {
      const message = error instanceof Error ? error.message : String(error);
      reject('Network request failed: ' + message);
    });
    req.end();
  });
}

module.exports = executeNetworkRequest;
    `.trim();
  }

  private generateDataProcessingScript(taskParts: any): string {
    return `
async function processData() {
  try {
    const data = ${JSON.stringify(taskParts.params.data)};
    const operation = '${taskParts.params.operation}';

    switch(operation) {
      case 'filter':
        return data.filter(item => /* Add filter condition */);
      case 'sort':
        return data.sort((a, b) => /* Add sort logic */);
      case 'transform':
        return data.map(item => /* Add transform logic */);
      default:
        return data;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return 'Data processing failed: ' + message;
  }
}

module.exports = processData;
    `.trim();
  }

  private generateGenericScript(taskParts: any): string {
    return `
async function execute() {
  try {
    // Generic task execution
    console.log('Executing task:', ${JSON.stringify(taskParts.params.task)});
    return 'Task executed successfully';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return 'Task execution failed: ' + message;
  }
}

module.exports = execute;
    `.trim();
  }

  protected optimizeScript(script: string): string {
    this.logger.addLog({
      source: 'SirExecutor',
      type: 'info',
      message: 'Optimizing script execution parameters'
    });

    // Remove unnecessary whitespace and comments
    let optimized = script
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();

    // Add performance monitoring
    optimized = `
const startTime = process.hrtime();

${optimized}

const endTime = process.hrtime(startTime);
console.log('Execution time: ' + endTime[0] + 's ' + (endTime[1] / 1000000) + 'ms');
    `.trim();

    // Add error boundaries
    optimized = `
try {
  ${optimized}
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Script execution failed:', message);
  throw new Error(message);
}
    `.trim();

    return optimized;
  }

  protected validateScript(script: string): string {
    // Check for dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /require\s*\(\s*['"]child_process['"]\s*\)/,
      /process\.env/,
      /require\s*\(\s*['"]fs['"]\s*\)(?!\.promises)/,
      /require\s*\(\s*['"]path['"]\s*\)/,
      /require\s*\(\s*['"]os['"]\s*\)/,
      /process\.exit/,
      /global\./,
      /__dirname/,
      /__filename/
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(script)) {
        throw new AppError(`Script validation failed: Contains dangerous pattern ${pattern}`, 'SirExecutor');
      }
    }

    // Validate syntax
    try {
      new Function(script);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new AppError(`Script validation failed: Invalid syntax - ${message}`, 'SirExecutor');
    }

    // Add safety wrapper
    return `
"use strict";

// Safety wrapper to prevent global scope pollution
(function() {
  const safeRequire = (module) => {
    const allowedModules = ['fs.promises', 'https', 'http'];
    if (!allowedModules.includes(module)) {
      throw new Error('Module "' + module + '" is not allowed');
    }
    return require(module);
  };

  ${script}
})();
    `.trim();
  }

  async deployToWorkers(scriptId: string, workers: string[]): Promise<void> {
    const script = this.scriptRegistry.get(scriptId);
    if (!script) {
      throw new AppError(`Script ${scriptId} not found in registry`, 'SirExecutor');
    }

    this.logger.addLog({
      source: 'SirExecutor',
      type: 'info',
      message: `Deploying script ${scriptId} to ${workers.length} worker units`
    });

    // Validate worker availability
    const availableWorkers = workers.filter(workerId => {
      const worker = this.getWorkerStatus(workerId);
      return worker && worker.status === 'active';
    });

    if (availableWorkers.length === 0) {
      throw new AppError('No available workers for script deployment', 'SirExecutor');
    }

    // Deploy to each worker
    for (const workerId of availableWorkers) {
      try {
        await this.deployScriptToWorker(workerId, script);
        
        this.logger.addLog({
          source: 'SirExecutor',
          type: 'info',
          message: `Successfully deployed to worker ${workerId}`
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.addLog({
          source: 'SirExecutor',
          type: 'error',
          message: `Failed to deploy to worker ${workerId}: ${message}`
        });
        throw error;
      }
    }
  }

  private getWorkerStatus(workerId: string): { status: string } | undefined {
    // Implementation would check actual worker status
    return { status: 'active' };
  }

  private async deployScriptToWorker(targetWorkerId: string, scriptContent: string): Promise<void> {
    // Implementation would handle actual worker deployment
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate deployment
  }
}

export const SirExecutor = new SirExecutorAgent();
