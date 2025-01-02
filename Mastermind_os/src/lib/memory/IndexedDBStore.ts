import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { IMemoryStore, MemoryEntry, MemoryQuery } from './types';
import { useLogStore } from '../../stores/logStore';
import { AppError } from '../utils/errors';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { useConfigStore } from '../../stores/configStore';
import { getEnvironment } from '../utils/environment';

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

// In-memory fallback store
class InMemoryStore {
  private memories: Map<string, MemoryEntry> = new Map();

  async add(entry: MemoryEntry): Promise<void> {
    this.memories.set(entry.id, entry);
  }

  async get(id: string): Promise<MemoryEntry | undefined> {
    return this.memories.get(id);
  }

  async getAll(): Promise<MemoryEntry[]> {
    return Array.from(this.memories.values());
  }

  async put(entry: MemoryEntry): Promise<void> {
    this.memories.set(entry.id, entry);
  }

  async delete(id: string): Promise<void> {
    this.memories.delete(id);
  }

  async clear(): Promise<void> {
    this.memories.clear();
  }
}

export class IndexedDBStore implements IMemoryStore {
  private db: IDBPDatabase<MemoryDB> | null = null;
  private fallbackStore: InMemoryStore;
  private embeddings: OllamaEmbeddings;
  private logger = useLogStore.getState();
  private initialized = false;

  constructor() {
    this.fallbackStore = new InMemoryStore();
    this.embeddings = null as any;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize embeddings first
      const config = useConfigStore.getState().config;
      this.embeddings = config.ai?.ollama?.host && config.ai?.ollama?.model
        ? new OllamaEmbeddings({
            baseUrl: config.ai.ollama.host,
            model: config.ai.ollama.model,
          })
        : {
            embedQuery: async (text: string) => new Array(384).fill(0)
          } as any;

      // Check environment
      const { isNode, indexedDBAvailable } = getEnvironment();
      if (isNode || !indexedDBAvailable) {
        this.initialized = true;
        return; // Use fallback store
      }

      // Try to initialize IndexedDB
      try {
        this.db = await openDB<MemoryDB>('memory-store', 1, {
          upgrade(db) {
            const store = db.createObjectStore('memories', {
              keyPath: 'id',
            });
            store.createIndex('by-type', 'type');
            store.createIndex('by-timestamp', 'timestamp');
          },
        });

        // Quick connection test
        await this.db.transaction('memories', 'readonly').done;
      } catch (error) {
        console.warn('IndexedDB initialization failed, using in-memory fallback:', error);
        this.db = null; // Will use fallback store
      }
    } catch (error) {
      console.warn('Memory store initialization error, using fallback:', error);
      // Don't throw - just use fallback store
    }

    this.initialized = true;
  }

  private async calculateSimilarity(embedding1: number[], embedding2: number[]): Promise<number> {
    const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));
    return dotProduct / (magnitude1 * magnitude2);
  }

  async add(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<MemoryEntry> {
    if (!this.initialized) await this.initialize();

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

      if (this.db) {
        await this.db.add('memories', memoryEntry);
      } else {
        await this.fallbackStore.add(memoryEntry);
      }

      return memoryEntry;
    } catch (error) {
      console.warn('Memory add operation failed:', error);
      throw new AppError('Failed to add memory entry', 'IndexedDBStore', error);
    }
  }

  async search(query: MemoryQuery): Promise<MemoryEntry[]> {
    if (!this.initialized) await this.initialize();

    try {
      const entries = this.db 
        ? await this.db.getAll('memories')
        : await this.fallbackStore.getAll();

      let filteredEntries = entries;

      // Apply filters
      if (query.type) {
        filteredEntries = filteredEntries.filter(entry => entry.type === query.type);
      }

      if (query.metadata) {
        filteredEntries = filteredEntries.filter(entry => 
          Object.entries(query.metadata!).every(([key, value]) => entry.metadata[key] === value)
        );
      }

      if (query.timeRange) {
        const { start, end } = query.timeRange;
        if (typeof start === 'number') {
          filteredEntries = filteredEntries.filter(entry => entry.timestamp >= start);
        }
        if (typeof end === 'number') {
          filteredEntries = filteredEntries.filter(entry => entry.timestamp <= end);
        }
      }

      // Calculate relevance if text query provided
      if (query.text) {
        const queryEmbedding = await this.embeddings.embedQuery(query.text);
        const entriesWithScores = await Promise.all(
          filteredEntries.map(async entry => ({
            entry,
            score: entry.embedding ? await this.calculateSimilarity(queryEmbedding, entry.embedding) : 0,
          }))
        );

        filteredEntries = entriesWithScores
          .filter(({ score }) => !query.minRelevance || score >= query.minRelevance)
          .map(({ entry, score }) => ({
            ...entry,
            relevanceScore: score,
          }))
          .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      }

      return query.limit ? filteredEntries.slice(0, query.limit) : filteredEntries;
    } catch (error) {
      console.warn('Memory search operation failed:', error);
      throw new AppError('Failed to search memories', 'IndexedDBStore', error);
    }
  }

  async update(id: string, entry: Partial<MemoryEntry>): Promise<MemoryEntry> {
    if (!this.initialized) await this.initialize();

    try {
      const existingEntry = this.db
        ? await this.db.get('memories', id)
        : await this.fallbackStore.get(id);

      if (!existingEntry) {
        throw new Error(`Memory entry ${id} not found`);
      }

      const updatedEntry: MemoryEntry = {
        ...existingEntry,
        ...entry,
        id,
        timestamp: entry.timestamp || existingEntry.timestamp,
      };

      if (entry.content) {
        updatedEntry.embedding = await this.embeddings.embedQuery(entry.content);
      }

      if (this.db) {
        await this.db.put('memories', updatedEntry);
      } else {
        await this.fallbackStore.put(updatedEntry);
      }

      return updatedEntry;
    } catch (error) {
      console.warn('Memory update operation failed:', error);
      throw new AppError('Failed to update memory entry', 'IndexedDBStore', error);
    }
  }

  async delete(id: string): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      if (this.db) {
        await this.db.delete('memories', id);
      } else {
        await this.fallbackStore.delete(id);
      }
    } catch (error) {
      console.warn('Memory delete operation failed:', error);
      throw new AppError('Failed to delete memory entry', 'IndexedDBStore', error);
    }
  }

  async clear(): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      if (this.db) {
        await this.db.clear('memories');
      } else {
        await this.fallbackStore.clear();
      }
    } catch (error) {
      console.warn('Memory clear operation failed:', error);
      throw new AppError('Failed to clear memory store', 'IndexedDBStore', error);
    }
  }

  async close(): Promise<void> {
    try {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      this.initialized = false;
    } catch (error) {
      console.warn('Memory store close operation failed:', error);
      throw new AppError('Failed to close memory store', 'IndexedDBStore', error);
    }
  }
}
