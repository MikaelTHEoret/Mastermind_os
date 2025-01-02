export interface NexusCore {
  id: string;
  name: string;
  status: 'active' | 'standby' | 'error';
  capabilities: Set<string>;
  connectedAgents: Set<string>;
  securityLevel: number;
  resourceUsage: ResourceMetrics;
  apiUsage: APIMetrics;
  processCommand: (command: string) => Promise<string>;
}

export interface ResourceMetrics {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  taskQueue: {
    total: number;
    highPriority: number;
    waiting: number;
    processing: number;
    failed: number;
    avgProcessingTime: number;
  };
  agentCoordination: {
    activeAgents: number;
    totalTasks: number;
    taskDistribution: Record<string, number>; // agent type -> task count
    avgResponseTime: number;
    failureRate: number;
  };
}

export interface APIMetrics {
  totalCalls: number;
  totalTokens: number;
  costToDate: number;
  lastCall: string;
  quotaRemaining: number;
}

export interface NexusAgent {
  id: string;
  name: string;
  type: 'commander' | 'executor' | 'worker' | 'analyzer' | 'coordinator';
  personality: AgentPersonality;
  status: 'active' | 'idle' | 'busy' | 'error';
  clearance: number;
  specialization: string[];
  currentTask?: string;
  processingMetrics: {
    localTasks: number;
    apiTasks: number;
    averageCostPerTask: number;
    successRate: number;
    lastHealthCheck: string;
    responseTime: number;
    taskHistory: Array<{
      id: string;
      type: string;
      startTime: string;
      endTime?: string;
      status: 'completed' | 'failed' | 'in-progress';
      error?: string;
    }>;
  };
  resourceAllocation: {
    cpuQuota: number;
    memoryQuota: number;
    priorityLevel: number;
    currentLoad: number;
  };
}

export interface AgentPersonality {
  traits: {
    enthusiasm: number;
    efficiency: number;
    creativity: number;
    precision: number;
  };
  quirks: string[];
  catchphrases: string[];
  background: string;
}

export interface TaskEvaluation {
  complexity: number;
  technicalDepth: number;
  estimatedTokens: number;
  recommendedProcessor: {
    type: 'local' | 'api';
    model: string;
    reason: string;
  };
  estimatedCost: number;
}
