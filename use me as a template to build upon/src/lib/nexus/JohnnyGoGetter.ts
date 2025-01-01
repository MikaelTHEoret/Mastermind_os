import type { NexusAgent, AgentPersonality, TaskEvaluation } from './types';
import { useConfigStore } from '../../stores/configStore';
import { useLogStore } from '../../stores/logStore';
import { validatePath, createDefaultPermissions } from '../fs/permissions';
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
    }>
  };

  public resourceAllocation = {
    cpuQuota: 25, // 25% CPU allocation
    memoryQuota: 512, // 512MB memory allocation
    priorityLevel: 8, // High priority (1-10 scale)
    currentLoad: 0
  };

  public readonly personality: AgentPersonality;
  protected logger = useLogStore.getState();
  protected config = useConfigStore.getState().config;
  protected securityChecks: Map<string, (params: any) => boolean> = new Map();
  protected executionLocks: Set<string> = new Set();
  protected lastExecutionTime: Map<string, number> = new Map();
  protected rateLimits: Map<string, { count: number; resetTime: number }> = new Map();
  protected readonly MAX_REQUESTS_PER_MINUTE = 60;
  protected readonly RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
  protected readonly RESOURCE_QUOTAS = {
    maxMemoryUsage: 512 * 1024 * 1024, // 512MB
    maxCpuTime: 30000, // 30 seconds
    maxConcurrentTasks: 5
  };
  protected auditLog: Array<{
    timestamp: number;
    action: string;
    details: any;
    outcome: 'success' | 'failure';
    reason?: string;
  }> = [];

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
    // Enhanced file system security checks
    this.securityChecks.set('fileAccess', ({ path, operation }: { path: string; operation: string }) => {
      // Sanitize and normalize path
      const normalizedPath = path.replace(/\\/g, '/').toLowerCase();
      
      // Check for path traversal attempts
      if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
        this.logger.addLog({
          source: 'JohnnyGoGetter',
          type: 'error',
          message: `Path traversal attempt blocked: ${path}`
        });
        return false;
      }

      // Validate against permissions
      const permissions = createDefaultPermissions();
      if (!validatePath(path, permissions)) {
        this.logger.addLog({
          source: 'JohnnyGoGetter',
          type: 'warning',
          message: `Blocked unauthorized file access: ${path}`
        });
        return false;
      }

      // Operation-specific checks
      if (operation === 'write' || operation === 'modify') {
        const fileExtension = path.split('.').pop()?.toLowerCase();
        const dangerousExtensions = ['exe', 'dll', 'sys', 'bat', 'cmd', 'sh'];
        if (dangerousExtensions.includes(fileExtension || '')) {
          this.logger.addLog({
            source: 'JohnnyGoGetter',
            type: 'error',
            message: `Blocked write to dangerous file type: ${fileExtension}`
          });
          return false;
        }
      }

      return true;
    });

    // Enhanced network security checks
    this.securityChecks.set('networkAccess', ({ host, port, protocol }: { host: string; port: number; protocol?: string }) => {
      // Validate host
      const blockedHosts = ['0.0.0.0', '127.0.0.1', 'localhost'];
      if (blockedHosts.includes(host.toLowerCase())) {
        this.logger.addLog({
          source: 'JohnnyGoGetter',
          type: 'warning',
          message: `Blocked access to restricted host: ${host}`
        });
        return false;
      }

      // Port validation with protocol context
      const allowedPorts: Record<string, number[]> = {
        http: [80, 8080, 3000],
        https: [443, 8443],
        ws: [5000],
        wss: [5443]
      };

      const requestedProtocol = protocol || (port === 443 ? 'https' : 'http');
      if (!allowedPorts[requestedProtocol]?.includes(port)) {
        this.logger.addLog({
          source: 'JohnnyGoGetter',
          type: 'warning',
          message: `Blocked unauthorized port access: ${port} for protocol ${requestedProtocol}`
        });
        return false;
      }

      return true;
    });

    // Enhanced system modification checks
    this.securityChecks.set('systemMod', ({ operation, target, context }: { operation: string; target: string; context?: any }) => {
      // Normalize path for consistent checks
      const normalizedTarget = target.replace(/\\/g, '/').toLowerCase();
      
      // Critical system paths
      const criticalPaths = ['/etc', '/usr/bin', '/var/lib', '/system32', '/windows'];
      if (criticalPaths.some(path => normalizedTarget.includes(path.toLowerCase()))) {
        this.logger.addLog({
          source: 'JohnnyGoGetter',
          type: 'error',
          message: `Blocked critical system modification: ${target}`
        });
        return false;
      }

      // Operation-specific security checks
      const dangerousOperations = ['delete', 'modify', 'chmod', 'chown'];
      if (dangerousOperations.includes(operation.toLowerCase())) {
        // Additional context validation for dangerous operations
        if (!context?.authorized || !context?.reason) {
          this.logger.addLog({
            source: 'JohnnyGoGetter',
            type: 'error',
            message: `Dangerous operation ${operation} requires authorization context`
          });
          return false;
        }
      }

      // Resource limit checks
      if (context?.size && context.size > 100 * 1024 * 1024) { // 100MB limit
        this.logger.addLog({
          source: 'JohnnyGoGetter',
          type: 'warning',
          message: `Resource limit exceeded: ${context.size} bytes`
        });
        return false;
      }

      return true;
    });

    // Add input sanitization check
    this.securityChecks.set('inputSanitization', ({ input, type }: { input: string; type: string }) => {
      // Check for common injection patterns
      const injectionPatterns = [
        /\b(exec|eval|setTimeout|setInterval)\s*\(/i,  // JavaScript injection
        /<script\b[^>]*>(.*?)<\/script>/i,            // XSS
        /(\b(union|select|insert|update|delete)\b.*\bfrom\b.*)/i,  // SQL injection
        /\$\{.*\}/,  // Template injection
        /\b(rm|chmod|chown|sudo|mv)\b/i  // Command injection
      ];

      if (injectionPatterns.some(pattern => pattern.test(input))) {
        this.logger.addLog({
          source: 'JohnnyGoGetter',
          type: 'error',
          message: `Potential injection detected in ${type}: ${input}`
        });
        return false;
      }

      // Type-specific validation
      switch (type) {
        case 'filename':
          return /^[a-zA-Z0-9_\-\.]+$/.test(input);
        case 'path':
          return !/[<>:"|?*]/.test(input);
        case 'command':
          return !/[;&|]/.test(input);
        default:
          return true;
      }
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
    const securityFlags = {
      containsSystemCommands: /\b(rm|chmod|chown|sudo|mv|kill|reboot|shutdown)\b/i.test(task),
      containsNetworkOps: /\b(firewall|network|port|dns|socket|http|ftp)\b/i.test(task),
      containsFileOps: /\b(file|directory|folder|path|read|write|delete)\b/i.test(task),
      containsSensitiveOps: /\b(password|secret|key|token|credential)\b/i.test(task),
      containsInjectionPatterns: /[;&|`$]|\b(eval|exec)\b/i.test(task)
    };

    // Perform deep security analysis
    const analysis = {
      secure: true,
      reason: '',
      riskLevel: 0,
      complexity: 0.7,
      technicalDepth: 0.8,
      tokenCount: task.length * 1.5,
      requiredPermissions: [] as string[]
    };

    // Evaluate security flags
    if (securityFlags.containsSystemCommands) {
      analysis.secure = false;
      analysis.reason = 'Contains restricted system commands';
      analysis.riskLevel += 0.4;
    }

    if (securityFlags.containsSensitiveOps) {
      analysis.secure = false;
      analysis.reason += ' Contains sensitive operations';
      analysis.riskLevel += 0.3;
    }

    if (securityFlags.containsInjectionPatterns) {
      analysis.secure = false;
      analysis.reason += ' Contains potential injection patterns';
      analysis.riskLevel += 0.5;
    }

    // Log security analysis
    this.auditLog.push({
      timestamp: Date.now(),
      action: 'security_analysis',
      details: {
        task,
        flags: securityFlags,
        riskLevel: analysis.riskLevel
      },
      outcome: analysis.secure ? 'success' : 'failure',
      reason: analysis.reason
    });

    return analysis;
  }

  async processTask(task: string): Promise<string> {
    try {
      this.status = 'busy';
      this.currentTask = task;

      // Enhanced rate limiting
      const now = Date.now();
      const rateLimit = this.rateLimits.get(task) || { count: 0, resetTime: now + this.RATE_LIMIT_WINDOW };
      
      if (now > rateLimit.resetTime) {
        // Reset rate limit window
        rateLimit.count = 0;
        rateLimit.resetTime = now + this.RATE_LIMIT_WINDOW;
      }

      if (rateLimit.count >= this.MAX_REQUESTS_PER_MINUTE) {
        const waitTime = Math.ceil((rateLimit.resetTime - now) / 1000);
        throw new AppError(`Rate limit exceeded. Please wait ${waitTime} seconds.`, 'JohnnyGoGetter');
      }

      rateLimit.count++;
      this.rateLimits.set(task, rateLimit);

      // Resource quota check
      const activeTasks = this.processingMetrics.taskHistory.filter(t => t.status === 'in-progress').length;
      if (activeTasks >= this.RESOURCE_QUOTAS.maxConcurrentTasks) {
        throw new AppError('Maximum concurrent task limit reached', 'JohnnyGoGetter');
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

      const taskId = crypto.randomUUID();
      const startTime = new Date().toISOString();
      
      // Add task to history
      this.processingMetrics.taskHistory.push({
        id: taskId,
        type: evaluation.recommendedProcessor.type,
        startTime,
        status: 'in-progress'
      });

      const execStartTime = performance.now();
      const result = await this.executeSecureTask(task);
      const execEndTime = performance.now();
      const totalExecutionTime = execEndTime - execStartTime;

      // Check execution time against quota
      if (totalExecutionTime > this.RESOURCE_QUOTAS.maxCpuTime) {
        throw new AppError('Task exceeded maximum execution time', 'JohnnyGoGetter');
      }

      // Log successful execution
      this.auditLog.push({
        timestamp: now,
        action: 'task_execution',
        details: {
          task,
          executionTime: totalExecutionTime,
          resourceUsage: {
            cpuTime: totalExecutionTime,
            memory: process.memoryUsage().heapUsed
          }
        },
        outcome: 'success'
      });
      
      // Update execution timestamp and metrics
      this.lastExecutionTime.set(task, now);
      if (evaluation.recommendedProcessor.type === 'api') {
        this.processingMetrics.apiTasks++;
      } else {
        this.processingMetrics.localTasks++;
      }
      
      // Update metrics
      const totalTasks = this.processingMetrics.apiTasks + this.processingMetrics.localTasks;
      this.processingMetrics.averageCostPerTask = 
        ((this.processingMetrics.averageCostPerTask * (totalTasks - 1)) + 
        evaluation.estimatedCost) / totalTasks;
      
      this.processingMetrics.responseTime = 
        (this.processingMetrics.responseTime * (totalTasks - 1) + totalExecutionTime) / totalTasks;
      
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
        (this.processingMetrics.taskHistory.filter(t => t.status === 'in-progress').length / 5) * 100
      );

      this.status = 'active';
      this.currentTask = undefined;
      return result;
    } catch (error: unknown) {
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
        source: 'JohnnyGoGetter',
        type: 'error',
        message: `Task execution failed: ${message}`
      });
      throw error;
    }
  }

  protected async executeSecureTask(task: string): Promise<string> {
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
