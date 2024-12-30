import type { NexusCore, NexusAgent, ResourceMetrics, APIMetrics } from './types';
import { JohnnyGoGetter } from './JohnnyGoGetter';
import { SirExecutor } from './SirExecutor';
import { useLogStore } from '../../stores/logStore';
import { useConfigStore } from '../../stores/configStore';
import { storageManager } from '../storage/db';
import { AppError } from '../utils/errors';

class CentralNexusSystem {
  private core: NexusCore;
  private agents: Map<string, NexusAgent>;
  private logger = useLogStore.getState();
  private config = useConfigStore.getState().config;
  private initialized: boolean = false;
  private initializationAttempts: number = 0;
  private readonly MAX_INIT_ATTEMPTS = 3;

  constructor() {
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

      // Initialize Storage System
      try {
        await storageManager.initialize();
        this.logger.addLog({
          source: 'CentralNexus',
          type: 'info',
          message: 'Storage system initialized successfully'
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new AppError(`Storage initialization failed: ${message}`, 'CentralNexus', error);
      }

      // Register Core Agents
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

  private async registerCoreAgents(): Promise<void> {
    // Initialize and register Johnny Go Getter
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

    // Initialize and register Sir Executor
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

  private initializeResourceMetrics(): ResourceMetrics {
    return {
      cpu: 0,
      memory: 0,
      storage: 0,
      network: 0
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

  public getState(): NexusCore {
    return this.core;
  }

  public getAgent(id: string): NexusAgent | undefined {
    return this.agents.get(id);
  }

  public getAgents(): Map<string, NexusAgent> {
    return this.agents;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async processCommand(command: string): Promise<string> {
    try {
      this.logger.addLog({
        source: 'CentralNexus',
        type: 'info',
        message: `Processing command: ${command}`
      });

      // Process command through appropriate agent or directly
      const response = await this.executeCommand(command);

      this.logger.addLog({
        source: 'CentralNexus',
        type: 'info',
        message: `Command response: ${response}`
      });

      return response;
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

  private async executeCommand(command: string): Promise<string> {
    if (!this.initialized) {
      throw new Error('System not initialized. Please wait...');
    }

    const normalizedCommand = command.toLowerCase().trim();
    this.logger.addLog({
      source: 'CentralNexus',
      type: 'info',
      message: `Executing command: ${normalizedCommand}`
    });

    try {
      switch (normalizedCommand) {
        case 'help':
          const helpMessage = `Available commands:
- help: Show this help message
- status: Show system status
- agents: List active agents
- clear: Clear terminal
- version: Show system version`;
          this.logger.addLog({
            source: 'CentralNexus',
            type: 'info',
            message: 'Help command executed'
          });
          return helpMessage;

        case 'status':
          const statusMessage = `System Status: ${this.core.status}
Connected Agents: ${this.core.connectedAgents.size}
API Usage: ${this.core.apiUsage.totalCalls} calls
Resource Usage:
- CPU: ${this.core.resourceUsage.cpu}%
- Memory: ${this.core.resourceUsage.memory}%
- Storage: ${this.core.resourceUsage.storage}%
- Network: ${this.core.resourceUsage.network}%`;
          this.logger.addLog({
            source: 'CentralNexus',
            type: 'info',
            message: 'Status command executed'
          });
          return statusMessage;

        case 'agents':
          const agentList = Array.from(this.agents.values())
            .map(agent => `- ${agent.name} (${agent.status})`)
            .join('\n');
          const agentsMessage = `Active Agents:\n${agentList}`;
          this.logger.addLog({
            source: 'CentralNexus',
            type: 'info',
            message: 'Agents command executed'
          });
          return agentsMessage;

        case 'clear':
          this.logger.addLog({
            source: 'CentralNexus',
            type: 'info',
            message: 'Clear command executed'
          });
          return '[CLEAR]';

        case 'version':
          this.logger.addLog({
            source: 'CentralNexus',
            type: 'info',
            message: 'Version command executed'
          });
          return 'Virtual OS v0.1.0';

        default:
          // Try to process command through Johnny Go Getter
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
          this.logger.addLog({
            source: 'CentralNexus',
            type: 'warning',
            message: `Unknown command: ${command}`
          });
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
