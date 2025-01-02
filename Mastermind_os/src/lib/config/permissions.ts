import { z } from 'zod';

export const FilePermissionSchema = z.object({
  read: z.boolean(),
  write: z.boolean(),
  execute: z.boolean(),
  allowedPaths: z.array(z.string()),
  blockedPaths: z.array(z.string()),
  maxFileSize: z.number(),
  allowedExtensions: z.array(z.string()),
});

export const ProcessPermissionSchema = z.object({
  spawn: z.boolean(),
  kill: z.boolean(),
  maxProcesses: z.number(),
  allowedCommands: z.array(z.string()),
  blockedCommands: z.array(z.string()),
  resourceLimits: z.object({
    cpu: z.number(),
    memory: z.number(),
    fileDescriptors: z.number(),
  }),
});

export const NetworkPermissionSchema = z.object({
  outbound: z.boolean(),
  inbound: z.boolean(),
  allowedHosts: z.array(z.string()),
  blockedHosts: z.array(z.string()),
  allowedPorts: z.array(z.number()),
  maxConnections: z.number(),
});

export const AgentPermissionSchema = z.object({
  file: FilePermissionSchema,
  process: ProcessPermissionSchema,
  network: NetworkPermissionSchema,
  clearanceLevel: z.number(),
  capabilities: z.array(z.string()),
});

export type FilePermissions = z.infer<typeof FilePermissionSchema>;
export type ProcessPermissions = z.infer<typeof ProcessPermissionSchema>;
export type NetworkPermissions = z.infer<typeof NetworkPermissionSchema>;
export type AgentPermissions = z.infer<typeof AgentPermissionSchema>;

export const DEFAULT_FILE_PERMISSIONS: FilePermissions = {
  read: false,
  write: false,
  execute: false,
  allowedPaths: [],
  blockedPaths: ['/etc', '/usr', '/var', '/sys', '/proc', '/.git', 'node_modules'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedExtensions: ['.txt', '.json', '.js', '.ts', '.log'],
};

export const DEFAULT_PROCESS_PERMISSIONS: ProcessPermissions = {
  spawn: false,
  kill: false,
  maxProcesses: 5,
  allowedCommands: [],
  blockedCommands: ['rm', 'sudo', 'chmod'],
  resourceLimits: {
    cpu: 50, // 50% CPU limit
    memory: 512 * 1024 * 1024, // 512MB
    fileDescriptors: 100,
  },
};

export const DEFAULT_NETWORK_PERMISSIONS: NetworkPermissions = {
  outbound: false,
  inbound: false,
  allowedHosts: [],
  blockedHosts: [],
  allowedPorts: [80, 443],
  maxConnections: 10,
};

export const DEFAULT_AGENT_PERMISSIONS: AgentPermissions = {
  file: DEFAULT_FILE_PERMISSIONS,
  process: DEFAULT_PROCESS_PERMISSIONS,
  network: DEFAULT_NETWORK_PERMISSIONS,
  clearanceLevel: 0,
  capabilities: [],
};