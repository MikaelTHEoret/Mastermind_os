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

class StorageManager {
  private db: IDBPDatabase<AIAssistantDB> | null = null;

  private logger = useLogStore.getState();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      this.db = await openDB<AIAssistantDB>('ai-assistant', 1, {
      upgrade(db) {
        // DataFlux store
        const dataFluxStore = db.createObjectStore('dataFlux', {
          keyPath: 'id',
        });
        dataFluxStore.createIndex('by-timestamp', 'timestamp');

        // Knowledge store
        const knowledgeStore = db.createObjectStore('knowledge', {
          keyPath: 'id',
        });
        knowledgeStore.createIndex('by-topic', 'topic');

        // Chat Messages store
        const chatMessagesStore = db.createObjectStore('chatMessages', {
          keyPath: 'id',
        });
        chatMessagesStore.createIndex('by-role', 'role');
        chatMessagesStore.createIndex('by-timestamp', 'timestamp');
        chatMessagesStore.createIndex('by-tokens', 'tokens');

        // Chat Classifications store
        const chatClassificationsStore = db.createObjectStore('chatClassifications', {
          keyPath: 'id',
        });
        chatClassificationsStore.createIndex('by-topic', 'topic');
        chatClassificationsStore.createIndex('by-timestamp', 'timestamp');

        // Metrics store
        const metricsStore = db.createObjectStore('metrics', {
          keyPath: 'id',
        });
        metricsStore.createIndex('by-type', 'type');
      },
    });

    this.initialized = true;
    this.logger.addLog({
      source: 'StorageManager',
      type: 'info',
      message: 'Storage system initialized successfully'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.addLog({
      source: 'StorageManager',
      type: 'error',
      message: `Failed to initialize storage: ${message}`
    });
    throw new AppError('Failed to initialize storage system', 'StorageManager', error);
  }
}

  private ensureInitialized() {
    if (!this.initialized || !this.db) {
      throw new AppError('Storage system not initialized', 'StorageManager');
    }
  }

  async storeDataFlux(data: any) {
    await this.initialize();
    this.ensureInitialized();
    
    const entry = {
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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

export const storageManager = new StorageManager();
