import type { Module } from '../types';
import { storageManager } from '../../storage/db';
import { useLogStore } from '../../../stores/logStore';
import { useConfigStore } from '../../../stores/configStore';
import { createAIProvider } from '../../ai/factory';

interface ChatMessage {
  id: string;
  timestamp: Date;
  role: 'user' | 'assistant';
  content: string;
  tokens: number;
  metadata: Record<string, any>;
}

interface ProcessingStats {
  totalMessages: number;
  totalTokens: number;
  processedBytes: number;
}

class ChatLogProcessor {
  private aiProvider: any;
  private logger = useLogStore.getState();
  private chunkSize = 1024 * 1024; // 1MB chunks
  private stats: ProcessingStats = {
    totalMessages: 0,
    totalTokens: 0,
    processedBytes: 0
  };

  constructor() {
    const config = useConfigStore.getState().config;
    this.aiProvider = createAIProvider(config.ai);
  }

  async processFile(file: File): Promise<ProcessingStats> {
    this.resetStats();
    
    try {
      const reader = new FileReader();
      let offset = 0;
      
      while (offset < file.size) {
        const chunk = file.slice(offset, offset + this.chunkSize);
        const text = await this.readChunk(chunk);
        await this.processChunk(text);
        offset += this.chunkSize;
        this.stats.processedBytes = offset;
      }

      return this.stats;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.addLog({
        source: 'ChatLogProcessor',
        type: 'error',
        message: `Failed to process file: ${errorMessage}`,
      });
      throw new Error(`Failed to process file: ${errorMessage}`);
    }
  }

  private readChunk(chunk: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(chunk);
    });
  }

  private async processChunk(text: string) {
    const lines = text.split('\n');
    let currentMessage: Partial<ChatMessage> = {};
    
    for (const line of lines) {
      if (this.isMessageStart(line)) {
        if (currentMessage.content) {
          await this.saveMessage(currentMessage as ChatMessage);
        }
        currentMessage = this.parseMessageStart(line);
      } else if (line.trim() && currentMessage.content !== undefined) {
        currentMessage.content += '\n' + line;
      }
    }

    // Save last message if exists
    if (currentMessage.content) {
      await this.saveMessage(currentMessage as ChatMessage);
    }
  }

  private isMessageStart(line: string): boolean {
    // Match patterns like "Human: " or "Assistant: " at start of line
    return /^(Human|Assistant):\s/.test(line);
  }

  private parseMessageStart(line: string): Partial<ChatMessage> {
    const role = line.startsWith('Human:') ? 'user' : 'assistant';
    const content = line.substring(line.indexOf(':') + 1).trim();
    
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      role,
      content,
      tokens: this.estimateTokens(content),
      metadata: {}
    };
  }

  private async saveMessage(message: ChatMessage) {
    try {
      await storageManager.storeChatMessage({
        role: message.role,
        content: message.content,
        tokens: message.tokens,
        metadata: {
          ...message.metadata,
          timestamp: message.timestamp
        }
      });
      
      this.stats.totalMessages++;
      this.stats.totalTokens += message.tokens;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.addLog({
        source: 'ChatLogProcessor',
        type: 'error',
        message: `Failed to save message: ${errorMessage}`,
      });
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 chars per token
    return Math.ceil(text.length / 4);
  }

  private resetStats() {
    this.stats = {
      totalMessages: 0,
      totalTokens: 0,
      processedBytes: 0
    };
  }

  async classifyMessages(topic: string): Promise<any> {
    try {
      // Get all messages and sort by timestamp
      const userMessages = await storageManager.getChatMessagesByRole('user');
      const assistantMessages = await storageManager.getChatMessagesByRole('assistant');
      const messages = [...userMessages, ...assistantMessages].sort((a, b) => a.timestamp - b.timestamp);
      
      const batchSize = 10; // Process messages in batches to manage tokens
      
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        const response = await this.aiProvider.chat([{
          role: 'system',
          content: `Classify the following chat messages related to ${topic}. Identify key themes, sentiment, and technical complexity.`,
        }, {
          role: 'user',
          content: JSON.stringify(batch.map(m => m.content)),
        }]);

        // Store classification results using dedicated method
        await storageManager.storeChatClassification(
          topic,
          batch.map(m => m.id),
          JSON.parse(response.content)
        );
      }

      return await storageManager.getChatClassificationsByTopic(topic);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.addLog({
        source: 'ChatLogProcessor',
        type: 'error',
        message: `Failed to classify messages: ${errorMessage}`,
      });
    }
  }
}

export const chatLogProcessorModule: Module = {
  id: 'chat-log-processor',
  name: 'Chat Log Processor',
  version: '1.0.0',
  description: 'Process and analyze large chat log files with efficient chunking and classification',
  author: 'AI Assistant',
  status: 'active',
  type: 'tool',
  capabilities: ['chat-processing', 'token-management', 'classification'],
  entry: './chatLogProcessor',
  config: {
    chunkSize: 1024 * 1024, // 1MB default chunk size
    maxTokensPerRequest: 4000, // Safe limit for API requests
  },
};

export const chatLogProcessor = new ChatLogProcessor();
