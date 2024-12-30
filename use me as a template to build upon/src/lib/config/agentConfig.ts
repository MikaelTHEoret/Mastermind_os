import { z } from 'zod';
import { AgentPermissionSchema } from './permissions';

export const AgentConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['commander', 'executor', 'worker', 'analyzer']),
  permissions: AgentPermissionSchema,
  aiConfig: z.object({
    provider: z.enum(['local', 'openai', 'anthropic', 'gemini']),
    model: z.string(),
    temperature: z.number().min(0).max(1),
    maxTokens: z.number(),
    contextWindow: z.number(),
    systemPrompt: z.string(),
  }).optional(),
  personality: z.object({
    traits: z.record(z.string(), z.number().min(0).max(1)),
    quirks: z.array(z.string()),
    catchphrases: z.array(z.string()),
    background: z.string(),
  }),
  appearance: z.object({
    avatar: z.string().optional(),
    background: z.string().optional(),
    theme: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
    }).optional(),
  }).optional(),
  monitoring: z.object({
    enabled: z.boolean(),
    metrics: z.array(z.string()),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']),
    alertThresholds: z.record(z.string(), z.number()),
  }),
  storage: z.object({
    persistent: z.boolean(),
    maxSize: z.number(),
    backupEnabled: z.boolean(),
    backupInterval: z.number(),
  }),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

export const DEFAULT_COMMANDER_CONFIG: AgentConfig = {
  id: 'commander-template',
  name: 'Commander',
  type: 'commander',
  permissions: {
    file: {
      read: true,
      write: true,
      execute: true,
      allowedPaths: ['/home/project'],
      blockedPaths: ['/etc', '/usr', '/var', '/sys', '/proc'],
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedExtensions: ['*'],
    },
    process: {
      spawn: true,
      kill: true,
      maxProcesses: 10,
      allowedCommands: ['*'],
      blockedCommands: ['rm -rf /', 'sudo', 'chmod'],
      resourceLimits: {
        cpu: 80,
        memory: 1024 * 1024 * 1024, // 1GB
        fileDescriptors: 1000,
      },
    },
    network: {
      outbound: true,
      inbound: false,
      allowedHosts: ['*'],
      blockedHosts: [],
      allowedPorts: [80, 443, 3000, 5000],
      maxConnections: 100,
    },
    clearanceLevel: 9,
    capabilities: ['task-management', 'resource-allocation', 'agent-coordination'],
  },
  aiConfig: {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 4000,
    contextWindow: 128000,
    systemPrompt: 'You are the Commander, responsible for high-level task management and coordination.',
  },
  personality: {
    traits: {
      authority: 0.9,
      efficiency: 0.8,
      adaptability: 0.7,
      diplomacy: 0.8,
    },
    quirks: [
      'Uses military terminology',
      'Always creates detailed operation plans',
      'Refers to tasks as "missions"',
    ],
    catchphrases: [
      'Mission parameters acknowledged.',
      'Initiating strategic deployment.',
      'Resources allocated, commencing operation.',
    ],
    background: 'Strategic operations coordinator with extensive experience in multi-agent task management.',
  },
  monitoring: {
    enabled: true,
    metrics: ['cpu', 'memory', 'taskQueue', 'agentStatus'],
    logLevel: 'info',
    alertThresholds: {
      cpuUsage: 90,
      memoryUsage: 85,
      queueSize: 100,
    },
  },
  storage: {
    persistent: true,
    maxSize: 1024 * 1024 * 1024, // 1GB
    backupEnabled: true,
    backupInterval: 3600, // 1 hour
  },
};

// Add other default configurations for different agent types...