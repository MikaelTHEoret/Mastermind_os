import { ChromaClient } from 'chromadb';
import { Collection, IEmbeddingFunction } from './chromaTypes';
import { OpenAIEmbeddings } from '@langchain/openai';
import { IMemoryStore, MemoryEntry, MemoryQuery } from './types';
import { useConfigStore } from '../../stores/configStore';
import { useLogStore } from '../../stores/logStore';
import { AppError, getErrorMessage } from '../utils/errors';

export class ChromaStore implements IMemoryStore {
  private client: ChromaClient;
  private collection!: Collection; // Will be initialized in initialize()
  private embeddings: OpenAIEmbeddings;
  private embeddingFunction: IEmbeddingFunction;
  private logger = useLogStore.getState();

  constructor() {
    this.client = new ChromaClient();
    const config = useConfigStore.getState().config;
    if (!config.ai.apiKey) {
      throw new AppError('API key is required for memory embeddings', 'ChromaStore');
    }
    
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.ai.apiKey,
      modelName: 'text-embedding-ada-002',
      batchSize: 512,
      stripNewLines: true,
    });

    this.embeddingFunction = {
      generate: async (texts: string[]): Promise<number[][]> => {
        return await Promise.all(
          texts.map(text => this.embeddings.embedQuery(text))
        );
      }
    };
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
      const embedding = await this.embeddings.embedQuery(entry.content);
      
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
        updatedEmbedding = await this.embeddings.embedQuery(entry.content);
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
