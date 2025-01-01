import { AIProvider, Message, MessageRole } from './types';
import { memoryManager } from '../memory/MemoryManager';
import { useLogStore } from '../../stores/logStore';
import { AppError } from '../utils/errors';

export class MemoryEnabledProvider implements AIProvider {
  private baseProvider: AIProvider;
  private conversationMemory: Message[] = [];
  private logger = useLogStore.getState();

  constructor(provider: AIProvider) {
    this.baseProvider = provider;
  }

  async initialize(): Promise<void> {
    await memoryManager.initialize();
    if (this.baseProvider.initialize) {
      await this.baseProvider.initialize();
    }
  }

  private validateMessage(message: Message): void {
    if (!['system', 'user', 'assistant'].includes(message.role)) {
      throw new AppError(
        `Invalid message role: ${message.role}`,
        'MemoryEnabledProvider'
      );
    }
    if (typeof message.content !== 'string') {
      throw new AppError(
        'Message content must be a string',
        'MemoryEnabledProvider'
      );
    }
  }

  private validateMessages(messages: Message[]): void {
    messages.forEach(this.validateMessage);
  }

  private async getRelevantContext(messages: Message[]): Promise<string> {
    try {
      // Get the last few messages for immediate context
      const recentContext = messages.slice(-3)
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      // Retrieve relevant memories
      const memories = await memoryManager.retrieveRelevantMemories(recentContext);
      
      if (!memories.length) return '';

      // Generate context from memories
      return await memoryManager.generateContextFromMemories(memories, recentContext);
    } catch (error: unknown) {
      const appError = AppError.fromUnknown(error, 'MemoryEnabledProvider');
      this.logger.addLog({
        source: 'MemoryEnabledProvider',
        type: 'error',
        message: `Failed to get relevant context: ${appError.message}`
      });
      return '';
    }
  }

  async chat(messages: Message[]): Promise<Message> {
    try {
      // Validate incoming messages
      this.validateMessages(messages);

      // Add messages to conversation memory
      this.conversationMemory.push(...messages);

      // Get relevant context from memory
      const context = await this.getRelevantContext(this.conversationMemory);

      // If we have relevant context, add it to the messages
      const contextMessage: Message = {
        role: 'system' as MessageRole,
        content: `Previous context:\n${context}\n\nUse this context to inform your responses when relevant.`,
        timestamp: Date.now()
      };

      const messagesWithContext = context
        ? [contextMessage, ...messages]
        : messages;

      // Get response from base provider
      const response = await this.baseProvider.chat(messagesWithContext);

      // Validate response
      this.validateMessage(response);

      // Store the conversation in memory periodically
      if (this.conversationMemory.length >= 10) {
        await this.storeConversationMemory();
      }

      return response;
    } catch (error: unknown) {
      const appError = AppError.fromUnknown(error, 'MemoryEnabledProvider');
      this.logger.addLog({
        source: 'MemoryEnabledProvider',
        type: 'error',
        message: `Chat failed: ${appError.message}`
      });
      throw appError;
    }
  }

  private async storeConversationMemory(): Promise<void> {
    try {
      // Validate before storing
      this.validateMessages(this.conversationMemory);
      
      await memoryManager.storeConversationMemory(this.conversationMemory);
      // Clear conversation memory after storing
      this.conversationMemory = [];
    } catch (error: unknown) {
      const appError = AppError.fromUnknown(error, 'MemoryEnabledProvider');
      this.logger.addLog({
        source: 'MemoryEnabledProvider',
        type: 'error',
        message: `Failed to store conversation memory: ${appError.message}`
      });
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.baseProvider.generateEmbedding) {
      throw new AppError('Base provider does not support embeddings', 'MemoryEnabledProvider');
    }
    return this.baseProvider.generateEmbedding(text);
  }

  // Clean up when provider is no longer needed
  async cleanup(): Promise<void> {
    // Store any remaining conversation memory
    if (this.conversationMemory.length > 0) {
      await this.storeConversationMemory();
    }

    if (this.baseProvider.cleanup) {
      await this.baseProvider.cleanup();
    }
  }
}
