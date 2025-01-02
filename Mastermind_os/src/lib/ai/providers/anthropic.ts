import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { Message, MessageRole } from '../types';
import { AppError } from '../../utils/errors';
import { BaseProvider } from './BaseProvider';

export class AnthropicProvider extends BaseProvider {
  private client: Anthropic | null = null;
  private initialized = false;

  private convertToAnthropicMessages(messages: Message[]): { role: 'user' | 'assistant'; content: string }[] {
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const conversationMessages = messages.filter(msg => msg.role !== 'system');

    // Combine system messages into a single prefix if present
    const systemPrefix = systemMessages.length 
      ? `System context:\n${systemMessages.map(msg => msg.content).join('\n')}\n\n`
      : '';

    return conversationMessages.map((msg, index) => {
      // Add system prefix to first user message
      if (index === 0 && msg.role === 'user' && systemPrefix) {
        return {
          role: 'user',
          content: systemPrefix + msg.content
        };
      }

      if (msg.role !== 'user' && msg.role !== 'assistant') {
        throw new AppError(
          `Unsupported message role for Anthropic: ${msg.role}`,
          'AnthropicProvider'
        );
      }

      return {
        role: msg.role,
        content: msg.content
      };
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      this.client = await this.withRetry(
        async () => {
          const client = new Anthropic({
            apiKey: this.config.apiKey,
          });
          // Test the client with a minimal request
          await client.messages.create({
            model: this.config.model,
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1
          });
          return client;
        },
        'initialization'
      );
      this.initialized = true;
    } catch (error) {
      throw new AppError(
        `Failed to initialize Anthropic client: ${error instanceof Error ? error.message : String(error)}`,
        'AnthropicProvider',
        error
      );
    }
  }

  private ensureInitialized() {
    if (!this.initialized || !this.client) {
      throw new AppError('Anthropic provider not initialized', 'AnthropicProvider');
    }
  }

  async chat(messages: Message[]): Promise<Message> {
    this.ensureInitialized();

    // Estimate tokens for rate limiting (rough estimate)
    const estimatedTokens = messages.reduce((sum, msg) => sum + msg.content.length / 4, 0);
    await this.enforceRateLimit(estimatedTokens);

    const primaryOperation = async () => {
      const anthropicMessages = this.convertToAnthropicMessages(messages);
      const completion = await this.client!.messages.create({
        model: this.config.model,
        messages: anthropicMessages,
        max_tokens: this.config.maxTokens || 1000,
        temperature: this.config.temperature || 0.7,
        system: "You are a helpful AI assistant in the Mastermind operating system."
      });

      return {
        role: 'assistant' as MessageRole,
        content: completion.content.reduce((text, block) => {
          if ('text' in block) {
            return text + block.text;
          }
          return text;
        }, ''),
        timestamp: Date.now()
      };
    };

    const fallbackOperation = async () => {
      // Create OpenAI client for fallback
      const openai = new OpenAI({
        apiKey: this.config.fallbackApiKey
      });

      const completion = await openai.chat.completions.create({
        model: this.config.fallbackModel || 'gpt-3.5-turbo',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      return {
        role: 'assistant' as MessageRole,
        content: completion.choices[0].message.content || '',
        timestamp: Date.now()
      };
    };

    return this.withFallback(
      primaryOperation,
      fallbackOperation,
      'chat completion'
    );
  }

  async generateEmbedding(text: string): Promise<number[]> {
    this.ensureInitialized();

    // Estimate tokens for rate limiting
    const estimatedTokens = text.length / 4;
    await this.enforceRateLimit(estimatedTokens);

    const primaryOperation = async () => {
      // Use OpenAI embeddings since Anthropic doesn't provide embeddings yet
      const openai = new OpenAI({
        apiKey: this.config.apiKey,
      });

      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    };

    const fallbackOperation = async () => {
      const openai = new OpenAI({
        apiKey: this.config.fallbackApiKey,
      });

      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    };

    return this.withFallback(
      primaryOperation,
      fallbackOperation,
      'embedding generation'
    );
  }

  async cleanup(): Promise<void> {
    this.initialized = false;
    this.client = null;
  }
}
