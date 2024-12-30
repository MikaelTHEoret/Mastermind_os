import { useLogStore } from '../../stores/logStore';
import { useConfigStore } from '../../stores/configStore';
import { storageManager } from '../storage/db';
import { createAIProvider } from '../ai/factory';
import type { KnowledgeItem, SearchQuery } from './types';
import { KnowledgeItemSchema, SearchQuerySchema } from './types';

class KnowledgeManagerService {
  private logger = useLogStore.getState();
  private aiProvider: any;
  private initialized: boolean = false;
  private cache: Map<string, KnowledgeItem[]> = new Map();

  async initialize() {
    if (this.initialized) return;

    try {
      const config = useConfigStore.getState().config;
      this.aiProvider = createAIProvider(config.ai);
      
      await storageManager.initialize();
      this.initialized = true;

      this.logger.addLog({
        source: 'KnowledgeManager',
        type: 'info',
        message: 'Knowledge management system initialized successfully'
      });
    } catch (error) {
      this.logger.addLog({
        source: 'KnowledgeManager',
        type: 'error',
        message: `Initialization failed: ${error.message}`
      });
      throw error;
    }
  }

  async storeKnowledge(topic: string, content: any, metadata: Record<string, any> = {}) {
    try {
      if (!this.initialized) await this.initialize();

      const embedding = await this.generateEmbedding(
        typeof content === 'string' ? content : JSON.stringify(content)
      );
      
      const item = KnowledgeItemSchema.parse({
        id: crypto.randomUUID(),
        topic,
        content,
        metadata,
        embedding,
        timestamp: Date.now(),
        version: 1,
      });

      await storageManager.storeKnowledge(topic, item);
      this.invalidateCache(topic);

      this.logger.addLog({
        source: 'KnowledgeManager',
        type: 'info',
        message: `Stored knowledge item for topic: ${topic}`
      });

      return item;
    } catch (error) {
      this.logger.addLog({
        source: 'KnowledgeManager',
        type: 'error',
        message: `Failed to store knowledge: ${error.message}`
      });
      throw error;
    }
  }

  async searchKnowledge(query: SearchQuery): Promise<KnowledgeItem[]> {
    try {
      if (!this.initialized) await this.initialize();

      const validatedQuery = SearchQuerySchema.parse(query);
      const cacheKey = this.getCacheKey(validatedQuery);
      
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }

      let results = await storageManager.queryKnowledge(validatedQuery.topic || '');

      if (validatedQuery.semantic && validatedQuery.text) {
        const queryEmbedding = await this.generateEmbedding(validatedQuery.text);
        results = this.semanticSearch(results, queryEmbedding);
      }

      if (validatedQuery.metadata) {
        results = this.filterByMetadata(results, validatedQuery.metadata);
      }

      if (validatedQuery.sortBy) {
        results = this.sortResults(results, validatedQuery.sortBy, validatedQuery.sortOrder);
      }

      if (validatedQuery.limit) {
        const offset = validatedQuery.offset || 0;
        results = results.slice(offset, offset + validatedQuery.limit);
      }

      this.cache.set(cacheKey, results);
      return results;
    } catch (error) {
      this.logger.addLog({
        source: 'KnowledgeManager',
        type: 'error',
        message: `Search failed: ${error.message}`
      });
      return [];
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      return await this.aiProvider.generateEmbedding(text);
    } catch (error) {
      this.logger.addLog({
        source: 'KnowledgeManager',
        type: 'error',
        message: `Failed to generate embedding: ${error.message}`
      });
      return [];
    }
  }

  private semanticSearch(items: KnowledgeItem[], queryEmbedding: number[]): KnowledgeItem[] {
    return items
      .map(item => ({
        item,
        similarity: this.cosineSimilarity(item.embedding || [], queryEmbedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .map(({ item }) => item);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private filterByMetadata(items: KnowledgeItem[], metadata: Record<string, any>): KnowledgeItem[] {
    return items.filter(item =>
      Object.entries(metadata).every(([key, value]) =>
        item.metadata[key] === value
      )
    );
  }

  private sortResults(
    items: KnowledgeItem[],
    sortBy: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): KnowledgeItem[] {
    return [...items].sort((a, b) => {
      const aValue = this.getNestedValue(a, sortBy);
      const bValue = this.getNestedValue(b, sortBy);
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }

  private getCacheKey(query: SearchQuery): string {
    return JSON.stringify(query);
  }

  private invalidateCache(topic?: string) {
    if (topic) {
      for (const [key, value] of this.cache.entries()) {
        if (value.some(item => item.topic === topic)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  async analyzeKnowledge(topic: string): Promise<any> {
    try {
      if (!this.initialized) await this.initialize();

      const items = await this.searchKnowledge({ topic });
      
      const response = await this.aiProvider.chat([{
        role: 'system',
        content: 'Analyze the following knowledge items and provide insights.',
      }, {
        role: 'user',
        content: JSON.stringify(items),
      }]);

      return JSON.parse(response.content);
    } catch (error) {
      this.logger.addLog({
        source: 'KnowledgeManager',
        type: 'error',
        message: `Analysis failed: ${error.message}`
      });
      return null;
    }
  }
}

export const knowledgeManager = new KnowledgeManagerService();