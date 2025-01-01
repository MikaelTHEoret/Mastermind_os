import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { IMemoryStore, MemoryEntry, MemoryQuery } from './types';
import { useLogStore } from '../../stores/logStore';
import { AppError } from '../utils/errors';
import { OpenAIEmbeddings } from '@langchain/openai';
import { useConfigStore } from '../../stores/configStore';

interface MemoryDB extends DBSchema {
  memories: {
    key: string;
    value: MemoryEntry;
    indexes: {
      'by-type': string;
      'by-timestamp': number;
    };
  };
}

export class IndexedDBStore implements IMemoryStore {
  private db: IDBPDatabase<MemoryDB> | null = null;
  private embeddings: OpenAIEmbeddings;
  private logger = useLogStore.getState();

  constructor() {
    const config = useConfigStore.getState().config;
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.ai.apiKey,
      modelName: 'text-embedding-3-small',
    });
  }

  async initialize(): Promise<void> {
    try {
      this.logger.addLog({
        source: 'IndexedDBStore',
        type: 'info',
        message: 'Starting IndexedDB initialization...',
      });

      // Check if IndexedDB is available
      if (!window.indexedDB) {
        throw new Error('IndexedDB is not available in this environment');
      }

      // Check if OpenAI API key is configured
      const config = useConfigStore.getState().config;
      if (!config.ai.apiKey) {
        throw new Error('OpenAI API key is not configured');
      }

      this.logger.addLog({
        source: 'IndexedDBStore',
        type: 'info',
        message: 'Opening IndexedDB database...',
      });

      this.db = await openDB<MemoryDB>('memory-store', 1, {
        upgrade(db) {
          const store = db.createObjectStore('memories', {
            keyPath: 'id',
          });
          store.createIndex('by-type', 'type');
          store.createIndex('by-timestamp', 'timestamp');
        },
      });

      // Verify database connection
      const testTx = this.db.transaction('memories', 'readonly');
      await testTx.done;

      this.logger.addLog({
        source: 'IndexedDBStore',
        type: 'info',
        message: 'Memory store initialized successfully',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('IndexedDBStore initialization error:', error);
      this.logger.addLog({
        source: 'IndexedDBStore',
        type: 'error',
        message: `Failed to initialize memory store: ${message}`,
      });
      throw new AppError('Failed to initialize memory store', 'IndexedDBStore', error);
    }
  }

  private async calculateSimilarity(embedding1: number[], embedding2: number[]): Promise<number> {
    // Cosine similarity
    const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));
    return dotProduct / (magnitude1 * magnitude2);
  }

  async add(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<MemoryEntry> {
    if (!this.db) throw new AppError('Memory store not initialized', 'IndexedDBStore');

    try {
      const embedding = await this.embeddings.embedQuery(entry.content);
      const timestamp = Date.now();
      const id = crypto.randomUUID();

      const memoryEntry: MemoryEntry = {
        id,
        timestamp,
        embedding,
        ...entry,
      };

      await this.db.add('memories', memoryEntry);
      return memoryEntry;
    } catch (error: unknown) {
      throw new AppError('Failed to add memory entry', 'IndexedDBStore', error);
    }
  }

  async search(query: MemoryQuery): Promise<MemoryEntry[]> {
    if (!this.db) throw new AppError('Memory store not initialized', 'IndexedDBStore');

    try {
      let entries = await this.db.getAll('memories');

      // Filter by type if specified
      if (query.type) {
        entries = entries.filter(entry => entry.type === query.type);
      }

      // Filter by metadata if specified
      if (query.metadata) {
        entries = entries.filter(entry => {
          return Object.entries(query.metadata!).every(([key, value]) => 
            entry.metadata[key] === value
          );
        });
      }

      // Filter by time range if specified
      if (query.timeRange) {
        const { start, end } = query.timeRange;
        if (typeof start === 'number') {
          entries = entries.filter(entry => entry.timestamp >= start);
        }
        if (typeof end === 'number') {
          entries = entries.filter(entry => entry.timestamp <= end);
        }
      }

      // If text query is provided, calculate relevance scores
      if (query.text) {
        const queryEmbedding = await this.embeddings.embedQuery(query.text);
        const entriesWithScores = await Promise.all(
          entries.map(async entry => ({
            entry,
            score: entry.embedding ? await this.calculateSimilarity(queryEmbedding, entry.embedding) : 0,
          }))
        );

        // Filter by minimum relevance if specified
        if (query.minRelevance) {
          entries = entriesWithScores
            .filter(({ score }) => score >= query.minRelevance!)
            .map(({ entry, score }) => ({
              ...entry,
              relevanceScore: score,
            }));
        } else {
          entries = entriesWithScores
            .map(({ entry, score }) => ({
              ...entry,
              relevanceScore: score,
            }));
        }

        // Sort by relevance score
        entries.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      }

      // Apply limit if specified
      if (query.limit) {
        entries = entries.slice(0, query.limit);
      }

      return entries;
    } catch (error: unknown) {
      throw new AppError('Failed to search memories', 'IndexedDBStore', error);
    }
  }

  async update(id: string, entry: Partial<MemoryEntry>): Promise<MemoryEntry> {
    if (!this.db) throw new AppError('Memory store not initialized', 'IndexedDBStore');

    try {
      const existingEntry = await this.db.get('memories', id);
      if (!existingEntry) {
        throw new Error(`Memory entry ${id} not found`);
      }

      const updatedEntry: MemoryEntry = {
        ...existingEntry,
        ...entry,
        id, // Ensure ID remains unchanged
        timestamp: entry.timestamp || existingEntry.timestamp, // Keep original timestamp unless explicitly updated
      };

      // If content is updated, recalculate embedding
      if (entry.content) {
        updatedEntry.embedding = await this.embeddings.embedQuery(entry.content);
      }

      await this.db.put('memories', updatedEntry);
      return updatedEntry;
    } catch (error: unknown) {
      throw new AppError('Failed to update memory entry', 'IndexedDBStore', error);
    }
  }

  async delete(id: string): Promise<void> {
    if (!this.db) throw new AppError('Memory store not initialized', 'IndexedDBStore');

    try {
      await this.db.delete('memories', id);
    } catch (error: unknown) {
      throw new AppError('Failed to delete memory entry', 'IndexedDBStore', error);
    }
  }

  async clear(): Promise<void> {
    if (!this.db) throw new AppError('Memory store not initialized', 'IndexedDBStore');

    try {
      await this.db.clear('memories');
    } catch (error: unknown) {
      throw new AppError('Failed to clear memory store', 'IndexedDBStore', error);
    }
  }

  async close(): Promise<void> {
    try {
      if (this.db) {
        this.db.close();
        this.db = null;
        this.logger.addLog({
          source: 'IndexedDBStore',
          type: 'info',
          message: 'Memory store closed successfully'
        });
      }
    } catch (error: unknown) {
      throw new AppError('Failed to close memory store', 'IndexedDBStore', error);
    }
  }
}
