import { ChromaClient } from 'chromadb';
import { Collection, IEmbeddingFunction } from './chromaTypes';
import { OpenAIEmbeddings } from '@langchain/openai';
import { IMemoryStore, MemoryEntry, MemoryQuery } from './types';
import { useConfigStore } from '../../stores/configStore';
import { useLogStore } from '../../stores/logStore';
import { AppError } from '../utils/errors';
import { generateLocalEmbedding } from '../ai/mock/localEmbeddings';

export class ChromaStore implements IMemoryStore {
  private client: ChromaClient;
  private collection!: Collection;
  private embeddings?: OpenAIEmbeddings;
  private embeddingFunction: IEmbeddingFunction;
  private logger = useLogStore.getState();
  private initialized = false;

  constructor() {
    const config = useConfigStore.getState().config;
    const memoryConfig = config.memory;
    
    if (!memoryConfig) {
      throw new AppError('Memory configuration is required', 'ChromaStore');
    }
    
    // Initialize ChromaDB client with configuration
    const chromaConfig = memoryConfig.chroma || {
      host: 'localhost',
      port: 8000,
      apiImpl: 'rest'
    };

    this.client = new ChromaClient({
      path: `http://${chromaConfig.host}:${chromaConfig.port}`,
      fetchOptions: chromaConfig.apiKey ? {
        headers: {
          'Authorization': `Bearer ${chromaConfig.apiKey}`
        }
      } : undefined
    });

    // Initialize embedding function based on configuration
    const embeddingConfig = memoryConfig.embedding || {
      provider: 'openai',
      model: 'text-embedding-ada-002',
      batchSize: 512
    };
    
    const useLocalEmbeddings = embeddingConfig.provider === 'local' || !config.ai.apiKey;
    
    if (!useLocalEmbeddings && config.ai.apiKey) {
      try {
        this.embeddings = new OpenAIEmbeddings({
          openAIApiKey: config.ai.apiKey,
          modelName: embeddingConfig.model,
          batchSize: embeddingConfig.batchSize,
          stripNewLines: true,
        });
      } catch (error) {
        this.logger.addLog({
          source: 'ChromaStore',
          type: 'warning',
          message: `Failed to initialize OpenAI embeddings: ${error}. Falling back to local embeddings.`
        });
      }
    }

    // Create embedding function with fallback
    this.embeddingFunction = {
      generate: async (texts: string[]): Promise<number[][]> => {
        try {
          if (this.embeddings) {
            return await Promise.all(texts.map(text => this.embeddings!.embedQuery(text)));
          }
          return await Promise.all(texts.map(generateLocalEmbedding));
        } catch (error) {
          this.logger.addLog({
            source: 'ChromaStore',
            type: 'warning',
            message: `OpenAI embeddings failed, falling back to local: ${error}`
          });
          return await Promise.all(texts.map(generateLocalEmbedding));
        }
      }
    };
  }

  async close(): Promise<void> {
    if (this.initialized) {
      try {
        await this.client.reset();
        this.initialized = false;
        this.logger.addLog({
          source: 'ChromaStore',
          type: 'info',
          message: 'ChromaDB connection closed successfully'
        });
      } catch (error) {
        throw new AppError('Failed to close ChromaDB connection', 'ChromaStore', error);
      }
    }
  }

  async initialize() {
    try {
      const collection = await this.client.createCollection({
        name: "memory_store",
        embeddingFunction: this.embeddingFunction as any,
      });
      this.collection = collection as unknown as Collection;

      this.logger.addLog({
        source: 'ChromaStore',
        type: 'info',
        message: 'ChromaDB memory store initialized successfully'
      });
    } catch (error: unknown) {
      const appError = AppError.fromUnknown(error, 'ChromaStore');
      this.logger.addLog({
        source: 'ChromaStore',
        type: 'error',
        message: `Failed to initialize ChromaDB: ${appError.message}`
      });
      throw appError;
    }
  }

  async add(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<MemoryEntry> {
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    
    try {
      const embedding = this.embeddings 
        ? await this.embeddings.embedQuery(entry.content)
        : await generateLocalEmbedding(entry.content);
      
      await (this.collection as any).add({
        ids: [id],
        embeddings: [embedding],
        metadatas: [{
          type: entry.type,
          ...entry.metadata,
          timestamp,
          associations: entry.associations || [],
          source: entry.source
        }],
        documents: [entry.content]
      });

      return {
        id,
        timestamp,
        embedding,
        ...entry
      };
    } catch (error: unknown) {
      const appError = AppError.fromUnknown(error, 'ChromaStore');
      this.logger.addLog({
        source: 'ChromaStore',
        type: 'error',
        message: `Failed to add memory entry: ${appError.message}`
      });
      throw appError;
    }
  }

  async search(query: MemoryQuery): Promise<MemoryEntry[]> {
    try {
      let whereClause: Record<string, any> = {};
      
      if (query.type) {
        whereClause.type = query.type;
      }
      
      if (query.timeRange) {
        if (query.timeRange.start) {
          whereClause.timestamp = { $gte: query.timeRange.start };
        }
        if (query.timeRange.end) {
          whereClause.timestamp = { 
            ...whereClause.timestamp,
            $lte: query.timeRange.end 
          };
        }
      }

      if (query.metadata) {
        whereClause = { ...whereClause, ...query.metadata };
      }

      const results = await (this.collection as any).query({
        queryTexts: query.text ? [query.text] : undefined,
        nResults: query.limit || 10,
        whereDocument: whereClause
      });

      return results.ids[0].map((id: string, index: number) => ({
        id,
        type: results.metadatas[0][index].type,
        content: results.documents[0][index],
        metadata: results.metadatas[0][index],
        embedding: results.embeddings?.[0][index],
        timestamp: results.metadatas[0][index].timestamp,
        relevanceScore: results.distances?.[0][index],
        associations: results.metadatas[0][index].associations,
        source: results.metadatas[0][index].source
      })).filter((entry: MemoryEntry) => 
        !query.minRelevance || 
        (entry.relevanceScore && entry.relevanceScore >= query.minRelevance)
      );
    } catch (error: unknown) {
      const appError = AppError.fromUnknown(error, 'ChromaStore');
      this.logger.addLog({
        source: 'ChromaStore',
        type: 'error',
        message: `Search failed: ${appError.message}`
      });
      return [];
    }
  }

  async update(id: string, entry: Partial<MemoryEntry>): Promise<MemoryEntry> {
    try {
      const existing = await (this.collection as any).get({
        ids: [id]
      });

      if (!existing.ids.length) {
        throw new Error(`Memory entry ${id} not found`);
      }

      const updatedContent = entry.content || existing.documents[0];
      const updatedMetadata = {
        ...existing.metadatas[0],
        ...entry.metadata
      };

      let updatedEmbedding = existing.embeddings?.[0];
      if (entry.content) {
        updatedEmbedding = this.embeddings 
          ? await this.embeddings.embedQuery(entry.content)
          : await generateLocalEmbedding(entry.content);
      }

      await (this.collection as any).update({
        ids: [id],
        embeddings: updatedEmbedding ? [updatedEmbedding] : undefined,
        metadatas: [updatedMetadata],
        documents: [updatedContent]
      });

      return {
        id,
        type: updatedMetadata.type,
        content: updatedContent,
        metadata: updatedMetadata,
        embedding: updatedEmbedding,
        timestamp: updatedMetadata.timestamp,
        associations: updatedMetadata.associations,
        source: updatedMetadata.source
      };
    } catch (error: unknown) {
      const appError = AppError.fromUnknown(error, 'ChromaStore');
      this.logger.addLog({
        source: 'ChromaStore',
        type: 'error',
        message: `Update failed: ${appError.message}`
      });
      throw appError;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await (this.collection as any).delete({
        ids: [id]
      });
    } catch (error: unknown) {
      const appError = AppError.fromUnknown(error, 'ChromaStore');
      this.logger.addLog({
        source: 'ChromaStore',
        type: 'error',
        message: `Delete failed: ${appError.message}`
      });
      throw appError;
    }
  }

  async clear(): Promise<void> {
    try {
      await (this.collection as any).delete();
      await this.initialize();
    } catch (error: unknown) {
      const appError = AppError.fromUnknown(error, 'ChromaStore');
      this.logger.addLog({
        source: 'ChromaStore',
        type: 'error',
        message: `Clear failed: ${appError.message}`
      });
      throw appError;
    }
  }
}
