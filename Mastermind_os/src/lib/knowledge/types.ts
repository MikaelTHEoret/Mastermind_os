import { z } from 'zod';

export const KnowledgeItemSchema = z.object({
  id: z.string(),
  topic: z.string(),
  content: z.any(),
  metadata: z.record(z.string(), z.any()),
  embedding: z.array(z.number()).optional(),
  timestamp: z.number(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  version: z.number().default(1),
});

export const SearchQuerySchema = z.object({
  text: z.string().optional(),
  topic: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  semantic: z.boolean().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type KnowledgeItem = z.infer<typeof KnowledgeItemSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;