import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { useLogStore } from '../../stores/logStore';
import { AppError } from '../utils/errors';

interface AIAssistantDB extends DBSchema {
  dataFlux: {
    key: string;
    value: {
      id: string;
      type: string;
      content: any;
      timestamp: number;
      processed: boolean;
    };
    indexes: { 'by-timestamp': number };
  };
  knowledge: {
    key: string;
    value: {
      id: string;
      topic: string;
      content: any;
      timestamp: number;
      metadata: Record<string, any>;
    };
    indexes: { 'by-topic': string };
  };
  chatMessages: {
    key: string;
    value: {
      id: string;
      role: 'user' | 'assistant';
      content: string;
      tokens: number;
      timestamp: number;
      metadata: Record<string, any>;
    };
    indexes: {
      'by-role': string;
      'by-timestamp': number;
      'by-tokens': number;
    };
  };
  chatClassifications: {
    key: string;
    value: {
      id: string;
      topic: string;
      messageIds: string[];
      analysis: any;
      timestamp: number;
    };
    indexes: {
      'by-topic': string;
      'by-timestamp': number;
    };
  };
  metrics: {
    key: string;
    value: {
      id: string;
      type: string;
      value: number;
      timestamp: number;
    };
    indexes: { 'by-type': string };
  };
}

const DB_NAME = 'ai-assistant';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

class StorageManager {
  private static instance: StorageManager;
  private db: IDBPDatabase<AIAssistantDB> | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private currentVersion = 1;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private getLogger() {
    return useLogStore.getState();
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private async initializeWithRetry(attempt = 1): Promise<void> {
    try {
      // Check environment
      const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
      if (isNode) {
        this.getLogger().addLog({
          source: 'StorageManager',
          type: 'info',
          message: 'Node environment detected, using in-memory fallback'
        });
        // Set initialized without creating IndexedDB
        this.initialized = true;
        return;
      }

      // Check if IndexedDB is available
      if (typeof window === 'undefined' || !window.indexedDB) {
        this.getLogger().addLog({
          source: 'StorageManager',
          type: 'warning',
          message: 'IndexedDB not available, using in-memory fallback'
        });
        // Set initialized without creating IndexedDB
        this.initialized = true;
        return;
      }

      this.db = await openDB<AIAssistantDB>(DB_NAME, this.currentVersion, {
        upgrade(db) {
          // DataFlux store
          if (!db.objectStoreNames.contains('dataFlux')) {
            const dataFluxStore = db.createObjectStore('dataFlux', {
              keyPath: 'id',
            });
            dataFluxStore.createIndex('by-timestamp', 'timestamp');
          }

          // Knowledge store
          if (!db.objectStoreNames.contains('knowledge')) {
            const knowledgeStore = db.createObjectStore('knowledge', {
              keyPath: 'id',
            });
            knowledgeStore.createIndex('by-topic', 'topic');
          }

          // Chat Messages store
          if (!db.objectStoreNames.contains('chatMessages')) {
            const chatMessagesStore = db.createObjectStore('chatMessages', {
              keyPath: 'id',
            });
            chatMessagesStore.createIndex('by-role', 'role');
            chatMessagesStore.createIndex('by-timestamp', 'timestamp');
            chatMessagesStore.createIndex('by-tokens', 'tokens');
          }

          // Chat Classifications store
          if (!db.objectStoreNames.contains('chatClassifications')) {
            const chatClassificationsStore = db.createObjectStore('chatClassifications', {
              keyPath: 'id',
            });
            chatClassificationsStore.createIndex('by-topic', 'topic');
            chatClassificationsStore.createIndex('by-timestamp', 'timestamp');
          }

          // Metrics store
          if (!db.objectStoreNames.contains('metrics')) {
            const metricsStore = db.createObjectStore('metrics', {
              keyPath: 'id',
            });
            metricsStore.createIndex('by-type', 'type');
          }
        },
      });

      this.initialized = true;
      this.getLogger().addLog({
        source: 'StorageManager',
        type: 'info',
        message: 'Storage system initialized successfully'
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.getLogger().addLog({
        source: 'StorageManager',
        type: 'error',
        message: `Failed to initialize storage (attempt ${attempt}): ${message}`
      });

      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return this.initializeWithRetry(attempt + 1);
      }

      throw new AppError(
        `Failed to initialize storage system after ${MAX_RETRIES} attempts`,
        'StorageManager',
        error
      );
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Ensure only one initialization process runs at a time
    if (!this.initPromise) {
      this.initPromise = this.initializeWithRetry().finally(() => {
        this.initPromise = null;
      });
    }

    return this.initPromise;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.initialized = false;
      this.getLogger().addLog({
        source: 'StorageManager',
        type: 'info',
        message: 'Storage system closed successfully'
      });
    }
  }

  private ensureInitialized() {
    if (!this.initialized) {
      throw new AppError('Storage system not initialized', 'StorageManager');
    }
    // Only check db if we're in a browser environment
    if (typeof window !== 'undefined' && window.indexedDB && !this.db) {
      throw new AppError('Storage system not properly initialized', 'StorageManager');
    }
  }

  async storeDataFlux(data: any) {
    await this.initialize();
    this.ensureInitialized();
    
    const entry = {
      id: this.generateId(),
      type: data.type,
      content: data,
      timestamp: Date.now(),
      processed: false,
    };

    await this.db!.add('dataFlux', entry);
    return entry;
  }

  async storeChatMessage(message: {
    role: 'user' | 'assistant';
    content: string;
    tokens: number;
    metadata?: Record<string, any>;
  }) {
    await this.initialize();
    this.ensureInitialized();
    
    const entry = {
      id: this.generateId(),
      ...message,
      timestamp: Date.now(),
      metadata: message.metadata || {},
    };

    await this.db!.add('chatMessages', entry);
    return entry;
  }

  async getChatMessagesByRole(role: 'user' | 'assistant') {
    await this.initialize();
    this.ensureInitialized();
    
    const index = this.db!.transaction('chatMessages').store.index('by-role');
    return await index.getAll(role);
  }

  async storeChatClassification(topic: string, messageIds: string[], analysis: any) {
    await this.initialize();
    this.ensureInitialized();
    
    const entry = {
      id: this.generateId(),
      topic,
      messageIds,
      analysis,
      timestamp: Date.now(),
    };

    await this.db!.add('chatClassifications', entry);
    return entry;
  }

  async getChatClassificationsByTopic(topic: string) {
    await this.initialize();
    this.ensureInitialized();
    
    const index = this.db!.transaction('chatClassifications').store.index('by-topic');
    return await index.getAll(topic);
  }

  async storeKnowledge(topic: string, content: any, metadata: Record<string, any> = {}) {
    await this.initialize();
    this.ensureInitialized();
    
    const entry = {
      id: this.generateId(),
      topic,
      content,
      timestamp: Date.now(),
      metadata,
    };

    await this.db!.add('knowledge', entry);
    return entry;
  }

  async storeMetric(type: string, value: number) {
    await this.initialize();
    this.ensureInitialized();
    
    const entry = {
      id: this.generateId(),
      type,
      value,
      timestamp: Date.now(),
    };

    await this.db!.add('metrics', entry);
    return entry;
  }

  async queryKnowledge(topic: string) {
    await this.initialize();
    this.ensureInitialized();
    
    const index = this.db!.transaction('knowledge').store.index('by-topic');
    return await index.getAll(topic);
  }

  async getRecentDataFlux(limit: number = 100) {
    await this.initialize();
    this.ensureInitialized();
    
    const index = this.db!.transaction('dataFlux').store.index('by-timestamp');
    return await index.getAll(null, limit);
  }

  async getMetricsByType(type: string, since: number) {
    await this.initialize();
    this.ensureInitialized();
    
    const index = this.db!.transaction('metrics').store.index('by-type');
    const metrics = await index.getAll(type);
    return metrics.filter(m => m.timestamp >= since);
  }
}

// Export the singleton instance
export const storageManager = StorageManager.getInstance();
