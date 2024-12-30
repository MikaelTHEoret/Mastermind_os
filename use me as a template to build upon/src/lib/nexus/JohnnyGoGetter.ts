import type { NexusAgent, AgentPersonality, TaskEvaluation } from './types';
import { useConfigStore } from '../../stores/configStore';
import { useLogStore } from '../../stores/logStore';
import { validatePath, createDefaultPermissions } from '../fs/permissions';
import { networkManager } from '../network/networkManager';
import { SirExecutor } from './SirExecutor';
import { AppError } from '../utils/errors';

export class JohnnyGoGetterAgent implements NexusAgent {
  public readonly id = 'johnny-go-getter';
  public readonly name = 'Johnny Go Getter';
  public readonly type = 'coordinator' as const;
  public status: 'active' | 'idle' | 'busy' | 'error' = 'idle';
  public readonly clearance = 8;
  public readonly specialization = [
    'task-management',
    'system-access',
    'security-enforcement',
    'resource-optimization',
    'api-coordination'
  ];
  public currentTask?: string;
  public processingMetrics = {
    localTasks: 0,
    apiTasks: 0,
    averageCostPerTask: 0
  };

  public readonly personality: AgentPersonality;
  protected logger = useLogStore.getState();
  protected config = useConfigStore.getState().config;
  protected securityChecks: Map<string, (params: any) => boolean> = new Map();
  protected executionLocks: Set<string> = new Set();
  protected lastExecutionTime: Map<string, number> = new Map();

  constructor() {
    this.personality = {
      traits: {
        enthusiasm: 0.7,
        efficiency: 0.9,
        creativity: 0.6,
        precision: 0.95
      },
      quirks: [
        'Always double-checks security parameters',
        'Maintains detailed operation logs',
        'Prefers incremental changes over large modifications',
        'Requests confirmation for critical operations'
      ],
      catchphrases: [
        "I'll handle that securely for you.",
        "Let me verify those permissions first.",
        "I'll coordinate with Sir Executor for the implementation."
      ],
      background: "Security-focused task coordinator with system-wide access capabilities."
    };

    this.initializeSecurityChecks();
  }

  protected initializeSecurityChecks() {
    // File system security checks
    this.securityChecks.set('fileAccess', ({ path, operation }: { path: string; operation: string }) => {
      if (!validatePath(path, createDefaultPermissions())) {
        this.logger.addLog({
          source: 'JohnnyGoGetter',
          type: 'warning',
          message: `Blocked unauthorized file access: ${path}`
        });
        return false;
      }
      return true;
    });

    // Network security checks
    this.securityChecks.set('networkAccess', ({ host, port }: { host: string; port: number }) => {
      const allowedPorts = [80, 443, 3000, 5000, 8080];
      if (!allowedPorts.includes(port)) {
        this.logger.addLog({
          source: 'JohnnyGoGetter',
          type: 'warning',
          message: `Blocked unauthorized port access: ${port}`
        });
        return false;
      }
      return true;
    });

    // System modification checks
    this.securityChecks.set('systemMod', ({ operation, target }: { operation: string; target: string }) => {
      const criticalPaths = ['/etc', '/usr/bin', '/var/lib'];
      if (criticalPaths.some(path => target.startsWith(path))) {
        this.logger.addLog({
          source: 'JohnnyGoGetter',
          type: 'error',
          message: `Blocked critical system modification: ${target}`
        });
        return false;
      }
      return true;
    });
  }

  async initialize(): Promise<void> {
    try {
      this.status = 'busy';
      await this.initializeSecurityChecks();
      await SirExecutor.initialize();
      this.status = 'active';
      this.logger.addLog({
        source: 'JohnnyGoGetter',
        type: 'info',
        message: 'Agent initialized successfully'
      });
    } catch (error: unknown) {
      this.status = 'error';
      const message = error instanceof Error ? error.message : String(error);
      this.logger.addLog({
        source: 'JohnnyGoGetter',
        type: 'error',
        message: `Initialization failed: ${message}`
      });
      throw new AppError('Failed to initialize agent', 'JohnnyGoGetter', error);
    }
  }

  async evaluateTask(task: string): Promise<TaskEvaluation> {
    // Analyze task requirements and security implications
    const analysis = await this.analyzeTaskSecurity(task);
    
    if (!analysis.secure) {
      throw new AppError(`Security validation failed: ${analysis.reason}`, 'JohnnyGoGetter');
    }

    return {
      complexity: analysis.complexity,
      technicalDepth: analysis.technicalDepth,
      estimatedTokens: analysis.tokenCount,
      recommendedProcessor: this.determineProcessor(analysis),
      estimatedCost: this.calculateCost(analysis)
    };
  }

  protected async analyzeTaskSecurity(task: string) {
    // Implement security analysis
    const securityFlags = {
      containsSystemCommands: /\b(rm|chmod|chown|sudo|mv)\b/i.test(task),
      containsNetworkOps: /\b(firewall|network|port|dns)\b/i.test(task),
      containsFileOps: /\b(file|directory|folder|path)\b/i.test(task)
    };

    return {
      secure: !securityFlags.containsSystemCommands,
      reason: securityFlags.containsSystemCommands ? 'Contains restricted system commands' : '',
      complexity: 0.7,
      technicalDepth: 0.8,
      tokenCount: task.length * 1.5
    };
  }

  async processTask(task: string): Promise<string> {
    try {
      this.status = 'busy';
      this.currentTask = task;

      // Rate limiting
      const now = Date.now();
      const lastExec = this.lastExecutionTime.get(task) || 0;
      if (now - lastExec < 1000) { // 1 second cooldown
        throw new AppError('Please wait before retrying this operation', 'JohnnyGoGetter');
      }

      // Security validation
      const evaluation = await this.evaluateTask(task);
      if (evaluation.complexity > 0.8) {
        this.logger.addLog({
          source: 'JohnnyGoGetter',
          type: 'warning',
          message: 'High complexity task detected, applying additional security checks'
        });
      }

      // Execute task with security wrapper
      const result = await this.executeSecureTask(task, evaluation);
      
      // Update execution timestamp and metrics
      this.lastExecutionTime.set(task, now);
      if (evaluation.recommendedProcessor.type === 'api') {
        this.processingMetrics.apiTasks++;
      } else {
        this.processingMetrics.localTasks++;
      }
      this.processingMetrics.averageCostPerTask = 
        ((this.processingMetrics.averageCostPerTask * (this.processingMetrics.apiTasks + this.processingMetrics.localTasks - 1)) + 
        evaluation.estimatedCost) / (this.processingMetrics.apiTasks + this.processingMetrics.localTasks);

      this.status = 'active';
      this.currentTask = undefined;
      return result;
    } catch (error: unknown) {
      this.status = 'error';
      const message = error instanceof Error ? error.message : String(error);
      this.logger.addLog({
        source: 'JohnnyGoGetter',
        type: 'error',
        message: `Task execution failed: ${message}`
      });
      throw error;
    }
  }

  protected async executeSecureTask(task: string, evaluation: TaskEvaluation): Promise<string> {
    const taskId = crypto.randomUUID();
    
    if (this.executionLocks.has(taskId)) {
      throw new AppError('Task is already being executed', 'JohnnyGoGetter');
    }

    this.executionLocks.add(taskId);

    try {
      // Coordinate with Sir Executor for implementation
      const script = await SirExecutor.translateTask(task);
      
      // Apply security checks
      for (const [checkName, checkFn] of this.securityChecks) {
        if (!checkFn({ task, script })) {
          throw new AppError(`Security check failed: ${checkName}`, 'JohnnyGoGetter');
        }
      }

      // Execute the validated script
      const result = await SirExecutor.executeScript(script);
      
      this.logger.addLog({
        source: 'JohnnyGoGetter',
        type: 'info',
        message: `Task completed successfully: ${taskId}`
      });

      return result;
    } finally {
      this.executionLocks.delete(taskId);
    }
  }

  protected determineProcessor(analysis: any): { type: 'local' | 'api'; model: string; reason: string } {
    const useLocal = analysis.complexity < 0.7 && analysis.tokenCount < 1000;
    return {
      type: useLocal ? 'local' : 'api',
      model: useLocal ? 'local-llm' : 'gpt-4-turbo-preview',
      reason: useLocal ? 'Task suitable for local processing' : 'Complex task requires API capabilities'
    };
  }

  protected calculateCost(analysis: any): number {
    const processor = this.determineProcessor(analysis);
    if (processor.type === 'local') return 0;

    const tokenCosts = {
      'gpt-4-turbo-preview': 0.00001,
      'gpt-4': 0.00003,
      'gpt-3.5-turbo': 0.000001
    };

    return analysis.tokenCount * tokenCosts[processor.model as keyof typeof tokenCosts];
  }
}

export const JohnnyGoGetter = new JohnnyGoGetterAgent();
