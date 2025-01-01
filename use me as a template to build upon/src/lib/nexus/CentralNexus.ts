import type { NexusCore, NexusAgent, ResourceMetrics, APIMetrics } from './types';
import { JohnnyGoGetter } from './JohnnyGoGetter';
import { SirExecutor } from './SirExecutor';
import { useLogStore } from '../../stores/logStore';
import { useConfigStore as useProductionConfigStore } from '../../stores/configStore';
import { useConfigStore as useTestConfigStore } from '../../stores/testConfigStore';
import { storageManager } from '../storage/db';
import { memoryManager } from '../memory/MemoryManager';
import { AppError } from '../utils/errors';

const useConfigStore = process.env.NODE_ENV === 'test' 
  ? useTestConfigStore
  : useProductionConfigStore;

class CentralNexusSystem {
  private core: NexusCore;
  private agents: Map<string, NexusAgent>;
  private logger = useLogStore.getState();
  private initialized: boolean = false;
  private initializationAttempts: number = 0;
  private readonly MAX_INIT_ATTEMPTS = 3;
  private taskQueue: Array<{
    id: string;
    command: string;
    priority: number;
    timestamp: number;
    retryCount: number;
  }> = [];
  private readonly MAX_RETRIES = 3;
  private resourceMonitorInterval?: NodeJS.Timeout;
  private agentHealthCheckInterval?: NodeJS.Timeout;
  private shutdownPromise: Promise<void> | null = null;

  constructor() {
    this.setupResourceMonitoring();
    this.setupAgentHealthChecks();
    
    this.core = {
      id: 'central-nexus-001',
      name: 'Central Nexus',
      status: 'standby',
      capabilities: new Set([
        'task-coordination',
        'resource-management',
        'agent-supervision',
        'security-enforcement',
        'data-flux-processing',
        'module-integration',
        'context-awareness'
      ]),
      connectedAgents: new Set(),
      securityLevel: 10,
      resourceUsage: this.initializeResourceMetrics(),
      apiUsage: this.initializeAPIMetrics(),
      processCommand: this.processCommand.bind(this)
    };

    this.agents = new Map();
  }

  private initializeResourceMetrics(): ResourceMetrics {
    return {
      cpu: 0,
      memory: 0,
      storage: 0,
      network: 0,
      taskQueue: {
        total: 0,
        highPriority: 0,
        waiting: 0,
        processing: 0,
        failed: 0,
        avgProcessingTime: 0
      },
      agentCoordination: {
        activeAgents: 0,
        totalTasks: 0,
        taskDistribution: {},
        avgResponseTime: 0,
        failureRate: 0
      }
    };
  }

  private initializeAPIMetrics(): APIMetrics {
    return {
      totalCalls: 0,
      totalTokens: 0,
      costToDate: 0,
      lastCall: new Date().toISOString(),
      quotaRemaining: 1000000
    };
  }

  private setupResourceMonitoring() {
    this.resourceMonitorInterval = setInterval(() => {
      try {
        this.updateResourceMetrics();
      } catch (error) {
        this.logger.addLog({
          source: 'CentralNexus',
          type: 'error',
          message: `Failed to update resource metrics: ${error}`
        });
      }
    }, 5000);
  }

  private setupAgentHealthChecks() {
    this.agentHealthCheckInterval = setInterval(() => {
      this.agents.forEach((agent, id) => {
        this.checkAgentHealth(id);
      });
    }, 10000);
  }

  private updateResourceMetrics() {
    const metrics = this.core.resourceUsage;
    
    metrics.taskQueue.total = this.taskQueue.length;
    metrics.taskQueue.highPriority = this.taskQueue.filter(t => t.priority > 7).length;
    metrics.taskQueue.waiting = this.taskQueue.filter(t => t.retryCount === 0).length;
    metrics.taskQueue.processing = this.taskQueue.filter(t => t.retryCount > 0).length;
    metrics.taskQueue.failed = this.taskQueue.filter(t => t.retryCount >= this.MAX_RETRIES).length;

    let totalResponseTime = 0;
    let totalTasks = 0;
    let failedTasks = 0;

    metrics.agentCoordination.activeAgents = Array.from(this.agents.values())
      .filter(agent => agent.status === 'active').length;

    const taskDistribution: Record<string, number> = {};
    
    this.agents.forEach(agent => {
      const agentType = agent.type;
      taskDistribution[agentType] = (taskDistribution[agentType] || 0) + 
        (agent.processingMetrics?.taskHistory?.filter(t => t.status === 'in-progress').length || 0);
      
      if (agent.processingMetrics) {
        totalResponseTime += agent.processingMetrics.responseTime * 
          agent.processingMetrics.taskHistory.length;
        totalTasks += agent.processingMetrics.taskHistory.length;
        failedTasks += agent.processingMetrics.taskHistory
          .filter(t => t.status === 'failed').length;
      }
    });

    metrics.agentCoordination.taskDistribution = taskDistribution;
    metrics.agentCoordination.totalTasks = totalTasks;
    metrics.agentCoordination.avgResponseTime = totalTasks > 0 ? 
      totalResponseTime / totalTasks : 0;
    metrics.agentCoordination.failureRate = totalTasks > 0 ? 
      failedTasks / totalTasks : 0;

    metrics.cpu = Math.floor(Math.random() * 100);
    metrics.memory = Math.floor(Math.random() * 100);
    metrics.storage = Math.floor(Math.random() * 100);
    metrics.network = Math.floor(Math.random() * 100);

    if (metrics.cpu > 80 || metrics.memory > 80) {
      this.throttleResources();
    }

    if (metrics.agentCoordination.failureRate > 0.2) {
      this.logger.addLog({
        source: 'CentralNexus',
        type: 'warning',
        message: `High failure rate detected: ${Math.round(metrics.agentCoordination.failureRate * 100)}%`
      });
    }
  }

  private throttleResources() {
    this.taskQueue = this.taskQueue.filter(task => task.priority > 7);
    
    this.agents.forEach(agent => {
      if (agent.status === 'busy' && agent.clearance < 8) {
        agent.status = 'idle';
      }
    });

    this.logger.addLog({
      source: 'CentralNexus',
      type: 'warning',
      message: 'Resource throttling activated'
    });
  }

  private async checkAgentHealth(agentId: string) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    try {
      const isResponsive = await this.pingAgent(agent);
      
      if (!isResponsive) {
        agent.status = 'error';
        this.logger.addLog({
          source: 'CentralNexus',
          type: 'error',
          message: `Agent ${agent.name} is unresponsive`
        });
        
        await this.recoverAgent(agent);
      }

      if (agent.processingMetrics) {
        agent.processingMetrics.lastHealthCheck = new Date().toISOString();
      }
    } catch (error) {
      this.logger.addLog({
        source: 'CentralNexus',
        type: 'error',
        message: `Health check failed for agent ${agent.name}: ${error}`
      });
    }
  }

  private async pingAgent(agent: NexusAgent): Promise<boolean> {
    if (agent.processingMetrics) {
      const lastHealthCheck = new Date(agent.processingMetrics.lastHealthCheck);
      const timeSinceLastCheck = Date.now() - lastHealthCheck.getTime();
      
      if (timeSinceLastCheck > 60000) {
        return false;
      }

      if (agent.processingMetrics.successRate < 0.5) {
        return false;
      }
    }

    return agent.status !== 'error';
  }

  private async recoverAgent(failedAgent: NexusAgent) {
    try {
      await this.registerCoreAgents();
      
      this.logger.addLog({
        source: 'CentralNexus',
        type: 'info',
        message: `Successfully recovered agent ${failedAgent.name}`
      });
    } catch (error) {
      this.logger.addLog({
        source: 'CentralNexus',
        type: 'error',
        message: `Failed to recover agent ${failedAgent.name}: ${error}`
      });
    }
  }

  private async registerCoreAgents(): Promise<void> {
    try {
      await JohnnyGoGetter.initialize();
      this.registerAgent(JohnnyGoGetter);
      this.logger.addLog({
        source: 'CentralNexus',
        type: 'info',
        message: 'Johnny Go Getter initialized and registered successfully'
      });
    } catch (error) {
      throw new Error(`Failed to initialize and register Johnny Go Getter: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      await SirExecutor.initialize();
      this.registerAgent(SirExecutor);
      this.logger.addLog({
        source: 'CentralNexus',
        type: 'info',
        message: 'Sir Executor initialized and registered successfully'
      });
    } catch (error) {
      throw new Error(`Failed to initialize and register Sir Executor: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private registerAgent(agent: NexusAgent): void {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent with ID ${agent.id} is already registered`);
    }

    if (agent.status !== 'active') {
      throw new Error(`Cannot register agent ${agent.id} - not in active state`);
    }

    this.agents.set(agent.id, agent);
    this.core.connectedAgents.add(agent.id);
    
    this.logger.addLog({
      source: 'CentralNexus',
      type: 'info',
      message: `Agent ${agent.name} registered and connected`
    });
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.addLog({
        source: 'CentralNexus',
        type: 'info',
        message: 'System already initialized.'
      });
      return;
    }

    if (this.initializationAttempts >= this.MAX_INIT_ATTEMPTS) {
      throw new Error('Maximum initialization attempts exceeded');
    }

    this.initializationAttempts++;

    try {
      this.logger.addLog({
        source: 'CentralNexus',
        type: 'info',
        message: `Starting system initialization (Attempt ${this.initializationAttempts}/${this.MAX_INIT_ATTEMPTS})`
      });

      try {
        await Promise.all([
          storageManager.initialize(),
          memoryManager.initialize()
        ]);
        this.logger.addLog({
          source: 'CentralNexus',
          type: 'info',
          message: 'Storage and memory systems initialized successfully'
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new AppError(`System initialization failed: ${message}`, 'CentralNexus', error);
      }

      try {
        await this.registerCoreAgents();
        this.logger.addLog({
          source: 'CentralNexus',
          type: 'info',
          message: 'Core agents registered successfully'
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new AppError(`Agent registration failed: ${message}`, 'CentralNexus', error);
      }

      this.core.status = 'active';
      this.initialized = true;
      this.initializationAttempts = 0;

      this.logger.addLog({
        source: 'CentralNexus',
        type: 'info',
        message: 'Central Nexus initialized successfully'
      });
    } catch (error: unknown) {
      this.core.status = 'error';
      const message = error instanceof Error ? error.message : String(error);
      this.logger.addLog({
        source: 'CentralNexus',
        type: 'error',
        message: `Initialization failed: ${message}`
      });

      if (this.initializationAttempts < this.MAX_INIT_ATTEMPTS) {
        this.logger.addLog({
          source: 'CentralNexus',
          type: 'info',
          message: `Retrying initialization in 5 seconds...`
        });
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.initialize();
      }

      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    if (!this.initialized) return;

    // Ensure only one shutdown process runs at a time
    if (!this.shutdownPromise) {
      this.shutdownPromise = this.performShutdown().finally(() => {
        this.shutdownPromise = null;
      });
    }

    return this.shutdownPromise;
  }

  private async performShutdown(): Promise<void> {
    this.logger.addLog({
      source: 'CentralNexus',
      type: 'info',
      message: 'Starting system shutdown'
    });

    // Clear intervals
    if (this.resourceMonitorInterval) {
      clearInterval(this.resourceMonitorInterval);
    }
    if (this.agentHealthCheckInterval) {
      clearInterval(this.agentHealthCheckInterval);
    }

    try {
      // Clean up storage and memory systems
      await Promise.all([
        storageManager.close(),
        memoryManager.close()
      ]);

      this.logger.addLog({
        source: 'CentralNexus',
        type: 'info',
        message: 'Storage and memory systems closed successfully'
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.addLog({
        source: 'CentralNexus',
        type: 'error',
        message: `Error during shutdown: ${message}`
      });
      throw new AppError('Failed to shutdown system cleanly', 'CentralNexus', error);
    }

    this.initialized = false;
    this.core.status = 'standby';
    this.taskQueue = [];

    this.logger.addLog({
      source: 'CentralNexus',
      type: 'info',
      message: 'System shutdown complete'
    });
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getState(): NexusCore {
    return this.core;
  }

  public getAgent(id: string): NexusAgent | undefined {
    return this.agents.get(id);
  }

  public getAgents(): Map<string, NexusAgent> {
    return this.agents;
  }

  public async processCommand(command: string, priority: number = 5): Promise<string> {
    try {
      const taskId = Math.random().toString(36).substring(7);
      
      this.logger.addLog({
        source: 'CentralNexus',
        type: 'info',
        message: `Queueing command: ${command} with priority ${priority}`
      });

      this.taskQueue.push({
        id: taskId,
        command,
        priority,
        timestamp: Date.now(),
        retryCount: 0
      });

      this.taskQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp - b.timestamp;
      });

      return await this.processNextTask();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.addLog({
        source: 'CentralNexus',
        type: 'error',
        message: `Command error: ${message}`
      });
      return `Error processing command: ${message}`;
    }
  }

  private async processNextTask(): Promise<string> {
    if (this.taskQueue.length === 0) {
      return 'No tasks in queue';
    }

    const task = this.taskQueue[0];
    
    try {
      const response = await this.executeCommand(task.command);
      
      try {
        await memoryManager.storeConversationMemory([
          { role: 'user', content: task.command },
          { role: 'assistant', content: response }
        ], {
          type: 'command_response',
          timestamp: Date.now(),
          taskId: task.id,
          priority: task.priority
        });
      } catch (error) {
        this.logger.addLog({
          source: 'CentralNexus',
          type: 'error',
          message: `Failed to store command response: ${error instanceof Error ? error.message : String(error)}`
        });
      }

      this.taskQueue.shift();
      return response;
    } catch (error) {
      if (task.retryCount < this.MAX_RETRIES) {
        task.retryCount++;
        task.timestamp = Date.now();
        this.logger.addLog({
          source: 'CentralNexus',
          type: 'warning',
          message: `Retrying task ${task.id} (attempt ${task.retryCount})`
        });
        return this.processNextTask();
      }
      
      this.taskQueue.shift();
      throw error;
    }
  }

  private async executeCommand(command: string): Promise<string> {
    if (!this.initialized) {
      throw new Error('System not initialized. Please wait...');
    }

    const normalizedCommand = command.toLowerCase().trim();

    try {
      await memoryManager.storeConversationMemory([
        { role: 'user', content: command }
      ], {
        type: 'command',
        timestamp: Date.now()
      });

      const relevantHistory = await memoryManager.retrieveRelevantMemories(command);
      if (relevantHistory.length > 0) {
        this.logger.addLog({
          source: 'CentralNexus',
          type: 'info',
          message: `Found ${relevantHistory.length} relevant historical commands`
        });
      }
    } catch (error) {
      this.logger.addLog({
        source: 'CentralNexus',
        type: 'error',
        message: `Memory operation failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }

    this.logger.addLog({
      source: 'CentralNexus',
      type: 'info',
      message: `Executing command: ${normalizedCommand}`
    });

    try {
      switch (normalizedCommand) {
        case 'help':
          return `Available commands:
- help: Show this help message
- status: Show system status
- agents: List active agents
- clear: Clear terminal
- version: Show system version`;

        case 'status':
          return `System Status: ${this.core.status}
Connected Agents: ${this.core.connectedAgents.size}
API Usage: ${this.core.apiUsage.totalCalls} calls
Resource Usage:
- CPU: ${this.core.resourceUsage.cpu}%
- Memory: ${this.core.resourceUsage.memory}%
- Storage: ${this.core.resourceUsage.storage}%
- Network: ${this.core.resourceUsage.network}%
Task Queue:
- Total Tasks: ${this.core.resourceUsage.taskQueue.total}
- High Priority: ${this.core.resourceUsage.taskQueue.highPriority}
- Waiting: ${this.core.resourceUsage.taskQueue.waiting}
- Processing: ${this.core.resourceUsage.taskQueue.processing}
- Failed: ${this.core.resourceUsage.taskQueue.failed}
Agent Coordination:
- Active Agents: ${this.core.resourceUsage.agentCoordination.activeAgents}
- Total Tasks: ${this.core.resourceUsage.agentCoordination.totalTasks}
- Failure Rate: ${Math.round(this.core.resourceUsage.agentCoordination.failureRate * 100)}%`;

        case 'agents':
          const agentList = Array.from(this.agents.values())
            .map(agent => `- ${agent.name} (${agent.status})
  Tasks: ${agent.processingMetrics?.taskHistory.length || 0}
  Success Rate: ${Math.round((agent.processingMetrics?.successRate || 0) * 100)}%
  Load: ${agent.resourceAllocation?.currentLoad || 0}%`)
            .join('\n');
          return `Active Agents:\n${agentList}`;

        case 'clear':
          return '[CLEAR]';

        case 'version':
          return 'Virtual OS v0.1.0';

        default:
          const johnny = this.agents.get('johnny-go-getter') as any;
          if (johnny && johnny.processTask) {
            try {
              this.logger.addLog({
                source: 'CentralNexus',
                type: 'info',
                message: 'Delegating command to Johnny Go Getter'
              });
              return await johnny.processTask(command);
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : String(error);
              this.logger.addLog({
                source: 'CentralNexus',
                type: 'error',
                message: `Johnny Go Getter error: ${message}`
              });
              throw new Error(`Error processing command: ${message}`);
            }
          }
          return `Unknown command: ${command}. Type 'help' for available commands.`;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.addLog({
        source: 'CentralNexus',
        type: 'error',
        message: `Command execution error: ${message}`
      });
      throw error;
    }
  }
}

export const centralNexus = new CentralNexusSystem();
