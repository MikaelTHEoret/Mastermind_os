import { z } from 'zod';

export const MemoryEntrySchema = z.object({
  id: z.string(),
  type: z.enum(['conversation', 'summary', 'knowledge', 'context', 'system']),
  content: z.string(),
  metadata: z.record(z.string(), z.any()),
  embedding: z.array(z.number()).optional(),
  timestamp: z.number(),
  relevanceScore: z.number().optional(),
  associations: z.array(z.string()).optional(), // IDs of related memories
  source: z.string().optional(),
});

export const MemoryQuerySchema = z.object({
  text: z.string().optional(),
  type: z.enum(['conversation', 'summary', 'knowledge', 'context', 'system']).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  timeRange: z.object({
    start: z.number().optional(),
    end: z.number().optional(),
  }).optional(),
  limit: z.number().optional(),
  minRelevance: z.number().optional(),
});

export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;
export type MemoryQuery = z.infer<typeof MemoryQuerySchema>;

export interface IMemoryStore {
  // Lifecycle methods
  initialize(): Promise<void>;
  close(): Promise<void>;

  // Data operations
  add(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<MemoryEntry>;
  search(query: MemoryQuery): Promise<MemoryEntry[]>;
  update(id: string, entry: Partial<MemoryEntry>): Promise<MemoryEntry>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}
