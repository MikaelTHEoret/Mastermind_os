import { AIConfig, AIProvider, Message, RateLimitConfig } from '../types';
import { AppError } from '../../utils/errors';

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequestsPerMinute: 60,
  maxTokensPerMinute: 90000,
  maxRetries: 3,
  retryDelayMs: 1000,
};

export abstract class BaseProvider implements AIProvider {
  protected config: AIConfig;
  private requestTimestamps: number[] = [];
  private tokenCounts: number[] = [];
  private rateLimit: RateLimitConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.rateLimit = config.rateLimit || DEFAULT_RATE_LIMIT;
  }

  protected async enforceRateLimit(estimatedTokens: number = 0): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean up old timestamps and token counts
    this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo);
    this.tokenCounts = this.tokenCounts.filter((_, i) => this.requestTimestamps[i] > oneMinuteAgo);

    // Check rate limits
    if (this.requestTimestamps.length >= this.rateLimit.maxRequestsPerMinute) {
      const waitTime = this.requestTimestamps[0] - oneMinuteAgo;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.enforceRateLimit(estimatedTokens);
    }

    const totalTokens = this.tokenCounts.reduce((sum, count) => sum + count, 0) + estimatedTokens;
    if (totalTokens >= this.rateLimit.maxTokensPerMinute) {
      const waitTime = this.requestTimestamps[0] - oneMinuteAgo;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.enforceRateLimit(estimatedTokens);
    }

    // Record the request
    this.requestTimestamps.push(now);
    this.tokenCounts.push(estimatedTokens);
  }

  protected async withRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= this.rateLimit.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: unknown) {
        lastError = error;
        
        // Don't retry on validation errors or if it's the last attempt
        if (error instanceof AppError && error.message.includes('validation')) {
          throw error;
        }
        
        if (attempt === this.rateLimit.maxRetries) {
          break;
        }

        // Wait before retrying
        await new Promise(resolve => 
          setTimeout(resolve, this.rateLimit.retryDelayMs * attempt)
        );
      }
    }

    throw new AppError(
      `${context} failed after ${this.rateLimit.maxRetries} attempts: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
      this.constructor.name,
      lastError
    );
  }

  protected async withFallback<T>(
    operation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await this.withRetry(operation, context);
    } catch (error) {
      if (!this.config.fallbackProvider) {
        throw error;
      }
      
      // Only check for fallback API key if the fallback provider is not Ollama
      if (this.config.fallbackProvider !== 'ollama' && !this.config.fallbackApiKey) {
        throw error;
      }

      try {
        return await fallbackOperation();
      } catch (fallbackError) {
        throw new AppError(
          `Both primary and fallback ${context} failed. Primary: ${
            error instanceof Error ? error.message : String(error)
          }. Fallback: ${
            fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
          }`,
          this.constructor.name,
          error
        );
      }
    }
  }

  abstract initialize(): Promise<void>;
  abstract chat(messages: Message[]): Promise<Message>;
  abstract generateEmbedding?(text: string): Promise<number[]>;
  abstract cleanup?(): Promise<void>;
}
