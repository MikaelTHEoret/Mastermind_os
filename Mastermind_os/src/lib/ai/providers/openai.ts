import OpenAI from 'openai';
import type { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam, ChatCompletionAssistantMessageParam } from 'openai/resources/chat/completions';
import type { Message, MessageRole } from '../types';
import { AppError } from '../../utils/errors';
import { BaseProvider } from './BaseProvider';

export class OpenAIProvider extends BaseProvider {
  private client: OpenAI | null = null;
  private initialized = false;

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

  private async createFallbackClient(): Promise<OpenAI | null> {
    if (!this.config.fallbackProvider) {
      throw new AppError('Fallback provider not configured', 'OpenAIProvider');
    }

    // If fallback is Ollama, we don't create an OpenAI client
    if (this.config.fallbackProvider === 'ollama') {
      return null;
    }

    // For non-Ollama providers, we need an API key
    if (!this.config.fallbackApiKey) {
      throw new AppError('Fallback API key missing for non-Ollama provider', 'OpenAIProvider');
    }

    return new OpenAI({
      apiKey: this.config.fallbackApiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Skip initialization completely if not the primary provider
    if (this.config.provider !== 'openai') {
      this.initialized = true;
      this.client = null;
      return;
    }
    
    try {
      this.client = await this.withRetry(
        async () => {
          const client = new OpenAI({
            apiKey: this.config.apiKey,
            dangerouslyAllowBrowser: true,
            baseURL: 'https://api.openai.com/v1',
            defaultHeaders: {
              'Authorization': `Bearer ${this.config.apiKey}`
            }
          });
          
          // Test the client with a minimal embedding request instead of models.list
          // since embeddings are what we actually need for the memory system
          await client.embeddings.create({
            model: 'text-embedding-3-small',
            input: 'test'
          });
          
          return client;
        },
        'initialization'
      );
      this.initialized = true;
    } catch (error) {
      console.error('OpenAI initialization error:', error);
      throw new AppError(
        `Failed to initialize OpenAI client: ${error instanceof Error ? error.message : String(error)}`,
        'OpenAIProvider',
        error
      );
    }
  }

  private ensureInitialized() {
    // Throw error if attempting to use OpenAI when it's not the primary provider
    if (this.config.provider !== 'openai') {
      throw new AppError(
        'OpenAI provider is not the primary provider. Current provider: ' + this.config.provider,
        'OpenAIProvider'
      );
    }
    
    if (!this.initialized || !this.client) {
      throw new AppError('OpenAI provider not initialized', 'OpenAIProvider');
    }
  }

  async chat(messages: Message[]): Promise<Message> {
    this.ensureInitialized();

    // Estimate tokens for rate limiting (rough estimate)
    const estimatedTokens = messages.reduce((sum, msg) => sum + msg.content.length / 4, 0);
    await this.enforceRateLimit(estimatedTokens);

    const primaryOperation = async () => {
      const openAIMessages = this.convertToOpenAIMessages(messages);
      const completion = await this.client!.chat.completions.create({
        model: this.config.model,
        messages: openAIMessages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      return {
        role: 'assistant' as MessageRole,
        content: completion.choices[0].message.content || '',
        timestamp: Date.now()
      };
    };

    const fallbackOperation = async () => {
      if (this.config.fallbackProvider === 'ollama') {
        // For Ollama, make a direct API call
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.config.fallbackModel || 'llama2',
            prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
            stream: false,
          }),
        });

        if (!response.ok) {
          throw new AppError(`Ollama API error: ${response.statusText}`, 'OpenAIProvider');
        }

        const data = await response.json();
        return {
          role: 'assistant' as MessageRole,
          content: data.response,
          timestamp: Date.now()
        };
      } else {
        // For other providers, use OpenAI client
        const fallbackClient = await this.createFallbackClient();
        if (!fallbackClient) {
          throw new AppError('Failed to create fallback client', 'OpenAIProvider');
        }
        const openAIMessages = this.convertToOpenAIMessages(messages);
        const completion = await fallbackClient.chat.completions.create({
          model: this.config.fallbackModel || this.config.model,
          messages: openAIMessages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        });

        return {
          role: 'assistant' as MessageRole,
          content: completion.choices[0].message.content || '',
          timestamp: Date.now()
        };
      }
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
      const response = await this.client!.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    };

    const fallbackOperation = async () => {
      if (this.config.fallbackProvider === 'ollama') {
        // For Ollama, make a direct API call
        const response = await fetch('http://localhost:11434/api/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.config.fallbackModel || 'llama2',
            prompt: text,
          }),
        });

        if (!response.ok) {
          throw new AppError(`Ollama API error: ${response.statusText}`, 'OpenAIProvider');
        }

        const data = await response.json();
        return data.embedding;
      } else {
        // For other providers, use OpenAI client
        const fallbackClient = await this.createFallbackClient();
        if (!fallbackClient) {
          throw new AppError('Failed to create fallback client', 'OpenAIProvider');
        }
        const response = await fallbackClient.embeddings.create({
          model: 'text-embedding-3-small',
          input: text,
        });
        return response.data[0].embedding;
      }
    };

    return this.withFallback(
      primaryOperation,
      fallbackOperation,
      'embedding generation'
    );
  }

  async cleanup(): Promise<void> {
    // Only cleanup if we were the primary provider
    if (this.config.provider === 'openai') {
      this.initialized = false;
      this.client = null;
    }
  }
}
