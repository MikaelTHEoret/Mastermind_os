import { z } from 'zod';

export const NodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['master', 'worker', 'relay']),
  status: z.enum(['online', 'offline', 'busy', 'maintenance']),
  address: z.string(),
  port: z.number(),
  capabilities: z.array(z.string()),
  resources: z.object({
    cpu: z.object({
      cores: z.number(),
      usage: z.number(),
      available: z.number(),
    }),
    memory: z.object({
      total: z.number(),
      used: z.number(),
      available: z.number(),
    }),
    gpu: z.object({
      available: z.boolean(),
      model: z.string().optional(),
      memory: z.number().optional(),
    }).optional(),
  }),
  network: z.object({
    bandwidth: z.number(),
    latency: z.number(),
    reliability: z.number(),
  }),
  security: z.object({
    encryption: z.boolean(),
    certificate: z.string().optional(),
    allowedIPs: z.array(z.string()),
  }),
});

export const ClusterSchema = z.object({
  id: z.string(),
  name: z.string(),
  nodes: z.array(NodeSchema),
  masterNode: z.string(),
  status: z.enum(['active', 'degraded', 'offline']),
  created: z.date(),
  lastSync: z.date(),
});

export type Node = z.infer<typeof NodeSchema>;
export type Cluster = z.infer<typeof ClusterSchema>;

export interface NetworkMessage {
  type: 'task' | 'result' | 'status' | 'control';
  source: string;
  target: string;
  payload: any;
  timestamp: number;
  priority: number;
  id: string;
}

export interface NetworkStats {
  connectedNodes: number;
  activeConnections: number;
  bytesTransferred: number;
  messageQueue: number;
  avgLatency: number;
  reliability: number;
}