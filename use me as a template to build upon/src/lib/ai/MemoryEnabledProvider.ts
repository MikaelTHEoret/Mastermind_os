import { AIProvider, Message, MessageRole, CompletionMetrics } from './types';
import { memoryManager } from '../memory/MemoryManager';
import { useLogStore } from '../../stores/logStore';
import { AppError } from '../utils/errors';

interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}

interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryBefore: MemoryMetrics;
  memoryAfter: MemoryMetrics;
  memoryDelta: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  };
}

export class MemoryEnabledProvider implements AIProvider {
  private baseProvider: AIProvider;
  private conversationMemory: Message[] = [];
  private logger = useLogStore.getState();
  private DEBUG = process.env.NODE_ENV === 'development';
  private metrics: PerformanceMetrics[] = [];

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

  private getMemoryMetrics(): MemoryMetrics {
    try {
      const memory = process.memoryUsage();
      return {
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external,
        arrayBuffers: memory.arrayBuffers || 0
      };
    } catch {
      // Return default values if process.memoryUsage is not available
      return {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        arrayBuffers: 0
      };
    }
  }

  private calculateMemoryDelta(before: MemoryMetrics, after: MemoryMetrics) {
    return {
      heapUsed: after.heapUsed - before.heapUsed,
      heapTotal: after.heapTotal - before.heapTotal,
      external: after.external - before.external,
      arrayBuffers: after.arrayBuffers - before.arrayBuffers
    };
  }

  private logMetrics(metrics: PerformanceMetrics) {
    if (!this.DEBUG) return;

    const mb = 1024 * 1024;
    this.logger.addLog({
      source: 'MemoryEnabledProvider',
      type: 'info',
      message: `Performance Metrics - Duration: ${metrics.duration}ms, Memory: ${(metrics.memoryAfter.heapUsed / mb).toFixed(2)}MB used`,
      metadata: {
        duration: metrics.duration,
        memoryUsed: Math.round(metrics.memoryAfter.heapUsed / mb),
        memoryDelta: Math.round(metrics.memoryDelta.heapUsed / mb)
      }
    });

    // Alert if memory usage is high
    const memoryThreshold = 500; // MB
    if (metrics.memoryAfter.heapUsed / mb > memoryThreshold) {
      this.logger.addLog({
        source: 'MemoryEnabledProvider',
        type: 'warning',
        message: 'High memory usage detected'
      });
    }

    // Store metrics for trend analysis
    this.metrics.push(metrics);
    if (this.metrics.length > 100) {
      this.metrics.shift(); // Keep last 100 metrics
    }

    // Analyze trends
    this.analyzePerformanceTrends();
  }

  private analyzePerformanceTrends() {
    if (this.metrics.length < 5) return;

    const recentMetrics = this.metrics.slice(-5);
    const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
    const avgMemoryDelta = recentMetrics.reduce((sum, m) => sum + m.memoryDelta.heapUsed, 0) / recentMetrics.length;

    if (avgDuration > 5000) { // 5 seconds
      this.logger.addLog({
        source: 'MemoryEnabledProvider',
        type: 'warning',
        message: 'Performance degradation detected: High average response time'
      });
    }

    const memoryLeakThreshold = 50; // MB
    if (avgMemoryDelta / (1024 * 1024) > memoryLeakThreshold) {
      this.logger.addLog({
        source: 'MemoryEnabledProvider',
        type: 'warning',
        message: 'Memory leak suspected: High average memory growth'
      });
    }
  }

  async chat(messages: Message[]): Promise<Message> {
    const startTime = performance.now();
    const memoryBefore = this.getMemoryMetrics();

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

      const endTime = performance.now();
      const memoryAfter = this.getMemoryMetrics();

      const metrics: PerformanceMetrics = {
        startTime,
        endTime,
        duration: endTime - startTime,
        memoryBefore,
        memoryAfter,
        memoryDelta: this.calculateMemoryDelta(memoryBefore, memoryAfter)
      };

      this.logMetrics(metrics);

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
