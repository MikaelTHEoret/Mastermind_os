import { useConfigStore } from '../../stores/configStore';
import { useLogStore } from '../../stores/logStore';
import { AppError } from '../utils/errors';
import { IndexedDBStore } from './IndexedDBStore';
import { MemoryEntry, MemoryQuery } from './types';
import { createAIProvider } from '../ai/factory';

export class MemoryManager {
  private store: IndexedDBStore;
  private logger = useLogStore.getState();
  private aiProvider: any;

  private static instance: MemoryManager;
  private initialized = false;

  private constructor() {
    this.store = new IndexedDBStore();
    const config = useConfigStore.getState().config;
    this.aiProvider = createAIProvider(config.ai, { enableMemory: true });
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      await this.store.initialize();
      this.initialized = true;
      this.logger.addLog({
        source: 'MemoryManager',
        type: 'info',
        message: 'Memory system initialized successfully'
      });
    } catch (error) {
      this.logger.addLog({
        source: 'MemoryManager',
        type: 'error',
        message: `Failed to initialize memory system: ${error}`
      });
      throw new AppError('Failed to initialize memory system', 'MemoryManager', error);
    }
  }

  private ensureInitialized() {
    if (!this.initialized) {
      throw new AppError('Memory system not initialized', 'MemoryManager');
    }
  }

  async summarizeConversation(messages: { role: string; content: string }[]): Promise<string> {
    this.ensureInitialized();
    try {
      const prompt = `Summarize the following conversation concisely, capturing key points and context:
      
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Summary:`;

      const response = await this.aiProvider.chat([{
        role: 'user',
        content: prompt
      }]);

      return response.content;
    } catch (error) {
      throw new AppError('Failed to summarize conversation', 'MemoryManager', error);
    }
  }

  async storeConversationMemory(
    messages: { role: string; content: string }[],
    metadata: Record<string, any> = {}
  ): Promise<MemoryEntry> {
    this.ensureInitialized();
    try {
      const summary = await this.summarizeConversation(messages);

      return await this.store.add({
        type: 'conversation',
        content: summary,
        metadata: {
          ...metadata,
          messageCount: messages.length,
          lastMessage: messages[messages.length - 1].content
        }
      });
    } catch (error) {
      throw new AppError('Failed to store conversation memory', 'MemoryManager', error);
    }
  }

  async retrieveRelevantMemories(
    context: string,
    limit: number = 5
  ): Promise<MemoryEntry[]> {
    this.ensureInitialized();
    try {
      return await this.store.search({
        text: context,
        limit,
        minRelevance: 0.7
      });
    } catch (error) {
      throw new AppError('Failed to retrieve memories', 'MemoryManager', error);
    }
  }

  async generateContextFromMemories(
    memories: MemoryEntry[],
    currentContext: string
  ): Promise<string> {
    this.ensureInitialized();
    try {
      const prompt = `Given these previous conversation summaries and the current context, generate a concise but informative context that would be helpful for understanding and responding to the current situation.

Previous Summaries:
${memories.map(m => `- ${m.content}`).join('\n')}

Current Context:
${currentContext}

Generated Context:`;

      const response = await this.aiProvider.chat([{
        role: 'user',
        content: prompt
      }]);

      return response.content;
    } catch (error) {
      throw new AppError('Failed to generate context', 'MemoryManager', error);
    }
  }

  async storeKnowledge(
    content: string,
    topic: string,
    metadata: Record<string, any> = {}
  ): Promise<MemoryEntry> {
    this.ensureInitialized();
    try {
      return await this.store.add({
        type: 'knowledge',
        content,
        metadata: {
          ...metadata,
          topic
        }
      });
    } catch (error) {
      throw new AppError('Failed to store knowledge', 'MemoryManager', error);
    }
  }

  async searchKnowledge(
    query: string,
    topic?: string,
    limit: number = 10
  ): Promise<MemoryEntry[]> {
    this.ensureInitialized();
    try {
      return await this.store.search({
        text: query,
        type: 'knowledge',
        metadata: topic ? { topic } : undefined,
        limit
      });
    } catch (error) {
      throw new AppError('Failed to search knowledge', 'MemoryManager', error);
    }
  }

  async createMemoryAssociation(
    sourceId: string,
    targetId: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    this.ensureInitialized();
    try {
      const source = await this.store.search({ 
        metadata: { id: sourceId },
        limit: 1 
      });

      if (!source.length) {
        throw new Error(`Source memory ${sourceId} not found`);
      }

      const target = await this.store.search({
        metadata: { id: targetId },
        limit: 1
      });

      if (!target.length) {
        throw new Error(`Target memory ${targetId} not found`);
      }

      // Update source memory with association
      await this.store.update(sourceId, {
        metadata: {
          ...source[0].metadata,
          associations: [...(source[0].associations || []), targetId],
          associationMetadata: {
            ...(source[0].metadata.associationMetadata || {}),
            [targetId]: metadata
          }
        }
      });

      // Update target memory with association
      await this.store.update(targetId, {
        metadata: {
          ...target[0].metadata,
          associations: [...(target[0].associations || []), sourceId],
          associationMetadata: {
            ...(target[0].metadata.associationMetadata || {}),
            [sourceId]: metadata
          }
        }
      });
    } catch (error) {
      throw new AppError('Failed to create memory association', 'MemoryManager', error);
    }
  }

  async getAssociatedMemories(
    memoryId: string,
    limit: number = 10
  ): Promise<MemoryEntry[]> {
    this.ensureInitialized();
    try {
      const memory = await this.store.search({
        metadata: { id: memoryId },
        limit: 1
      });

      if (!memory.length) {
        throw new Error(`Memory ${memoryId} not found`);
      }

      const associations = memory[0].associations || [];
      if (!associations.length) return [];

      return await this.store.search({
        metadata: {
          id: { $in: associations }
        },
        limit
      });
    } catch (error) {
      throw new AppError('Failed to get associated memories', 'MemoryManager', error);
    }
  }
}

export const memoryManager = MemoryManager.getInstance();
