import { z } from 'zod';

export const SystemConfigSchema = z.object({
  system: z.object({
    name: z.string(),
    version: z.string(),
    environment: z.enum(['development', 'production', 'testing']),
    debug: z.boolean(),
    maxAgents: z.number(),
    maxWorkers: z.number(),
    timezone: z.string(),
  }),
  security: z.object({
    encryptionEnabled: z.boolean(),
    encryptionAlgorithm: z.string(),
    keyRotationInterval: z.number(),
    maxLoginAttempts: z.number(),
    sessionTimeout: z.number(),
    allowedIPs: z.array(z.string()),
  }),
  database: z.object({
    type: z.enum(['mongodb', 'sqlite', 'postgres']),
    url: z.string(),
    maxConnections: z.number(),
    timeout: z.number(),
    ssl: z.boolean(),
  }),
  monitoring: z.object({
    enabled: z.boolean(),
    interval: z.number(),
    retention: z.object({
      logs: z.number(),
      metrics: z.number(),
      events: z.number(),
    }),
    alerts: z.object({
      enabled: z.boolean(),
      channels: z.array(z.string()),
      thresholds: z.record(z.string(), z.number()),
    }),
  }),
  resources: z.object({
    cpu: z.object({
      maxUsage: z.number(),
      throttleThreshold: z.number(),
    }),
    memory: z.object({
      maxUsage: z.number(),
      swapEnabled: z.boolean(),
    }),
    storage: z.object({
      maxSize: z.number(),
      backupEnabled: z.boolean(),
      backupInterval: z.number(),
    }),
  }),
  api: z.object({
    rateLimit: z.object({
      enabled: z.boolean(),
      maxRequests: z.number(),
      windowMs: z.number(),
    }),
    timeout: z.number(),
    cors: z.object({
      enabled: z.boolean(),
      origins: z.array(z.string()),
    }),
  }),
});

export type SystemConfig = z.infer<typeof SystemConfigSchema>;

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  system: {
    name: 'AI Virtual OS',
    version: '1.0.0',
    environment: 'development',
    debug: true,
    maxAgents: 50,
    maxWorkers: 20,
    timezone: 'UTC',
  },
  security: {
    encryptionEnabled: true,
    encryptionAlgorithm: 'AES-256-GCM',
    keyRotationInterval: 86400, // 24 hours
    maxLoginAttempts: 5,
    sessionTimeout: 3600, // 1 hour
    allowedIPs: ['*'],
  },
  database: {
    type: 'mongodb',
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus',
    maxConnections: 10,
    timeout: 5000,
    ssl: false,
  },
  monitoring: {
    enabled: true,
    interval: 60, // 1 minute
    retention: {
      logs: 604800, // 7 days
      metrics: 2592000, // 30 days
      events: 7776000, // 90 days
    },
    alerts: {
      enabled: true,
      channels: ['console', 'log'],
      thresholds: {
        cpuUsage: 90,
        memoryUsage: 85,
        diskUsage: 90,
        errorRate: 10,
      },
    },
  },
  resources: {
    cpu: {
      maxUsage: 80,
      throttleThreshold: 90,
    },
    memory: {
      maxUsage: 85,
      swapEnabled: true,
    },
    storage: {
      maxSize: 10 * 1024 * 1024 * 1024, // 10GB
      backupEnabled: true,
      backupInterval: 86400, // 24 hours
    },
  },
  api: {
    rateLimit: {
      enabled: true,
      maxRequests: 100,
      windowMs: 60000, // 1 minute
    },
    timeout: 30000, // 30 seconds
    cors: {
      enabled: true,
      origins: ['*'],
    },
  },
};