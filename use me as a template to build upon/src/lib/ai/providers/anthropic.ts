import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { AIConfig, AIProvider, Message } from '../types';
import { AppError } from '../../utils/errors';

export class AnthropicProvider implements AIProvider {
  private config: AIConfig;
  private client: Anthropic;

  constructor(config: AIConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

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

      return {
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      };
    });
  }

  async chat(messages: Message[]): Promise<Message> {
    try {
      const anthropicMessages = this.convertToAnthropicMessages(messages);
      const completion = await this.client.messages.create({
        model: this.config.model,
        messages: anthropicMessages,
        max_tokens: this.config.maxTokens || 1000,
        temperature: this.config.temperature || 0.7,
        system: "You are a helpful AI assistant in the Mastermind operating system."
      });

      return {
        role: 'assistant',
        content: completion.content.reduce((text, block) => {
          if ('text' in block) {
            return text + block.text;
          }
          return text;
        }, ''),
      };
    } catch (error: unknown) {
      throw new AppError(
        `Anthropic chat error: ${error instanceof Error ? error.message : String(error)}`,
        'AnthropicProvider',
        error
      );
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Use OpenAI embeddings since Anthropic doesn't provide embeddings yet
      const openai = new OpenAI({
        apiKey: this.config.apiKey,
      });

      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error: unknown) {
      throw new AppError(
        `Embedding error: ${error instanceof Error ? error.message : String(error)}`,
        'AnthropicProvider',
        error
      );
    }
  }
}
