import OpenAI from 'openai';
import type { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam, ChatCompletionAssistantMessageParam } from 'openai/resources/chat/completions';
import type { AIConfig, AIProvider, Message } from '../types';
import { AppError } from '../../utils/errors';

export class OpenAIProvider implements AIProvider {
  private config: AIConfig;
  private client: OpenAI | null = null;
  private initialized = false;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
      });
      this.initialized = true;
    } catch (error) {
      throw new AppError(
        `Failed to initialize OpenAI client: ${error instanceof Error ? error.message : String(error)}`,
        'OpenAIProvider',
        error
      );
    }
  }

  private ensureInitialized() {
    if (!this.initialized || !this.client) {
      throw new AppError('OpenAI provider not initialized', 'OpenAIProvider');
    }
  }

  private convertToOpenAIMessages(messages: Message[]): (ChatCompletionSystemMessageParam | ChatCompletionUserMessageParam | ChatCompletionAssistantMessageParam)[] {
    return messages.map(msg => {
      switch (msg.role) {
        case 'system':
          return {
            role: 'system',
            content: msg.content
          };
        case 'user':
          return {
            role: 'user',
            content: msg.content
          };
        case 'assistant':
          return {
            role: 'assistant',
            content: msg.content
          };
        default:
          throw new AppError(
            `Unsupported message role: ${msg.role}`,
            'OpenAIProvider'
          );
      }
    });
  }

  async chat(messages: Message[]): Promise<Message> {
    this.ensureInitialized();
    try {
      const openAIMessages = this.convertToOpenAIMessages(messages);
      const completion = await this.client!.chat.completions.create({
        model: this.config.model,
        messages: openAIMessages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      return {
        role: 'assistant',
        content: completion.choices[0].message.content || '',
      };
    } catch (error: unknown) {
      throw new AppError(
        `OpenAI chat error: ${error instanceof Error ? error.message : String(error)}`,
        'OpenAIProvider',
        error
      );
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    this.ensureInitialized();
    try {
      const response = await this.client!.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error: unknown) {
      throw new AppError(
        `OpenAI embedding error: ${error instanceof Error ? error.message : String(error)}`,
        'OpenAIProvider',
        error
      );
    }
  }
}
