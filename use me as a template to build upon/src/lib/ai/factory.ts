import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { MemoryEnabledProvider } from './MemoryEnabledProvider';
import type { AIConfig, AIProvider, AIProviderType } from './types';
import { AppError } from '../utils/errors';

interface CreateAIProviderOptions {
  enableMemory?: boolean;
}

export function createAIProvider(
  config: AIConfig,
  options: CreateAIProviderOptions = {}
): AIProvider {
  try {
    let provider: AIProvider;

    switch (config.provider) {
      case 'openai':
        provider = new OpenAIProvider(config);
        break;
      case 'anthropic':
        provider = new AnthropicProvider(config);
        break;
      default:
        throw new AppError(
          `Unsupported AI provider: ${config.provider}`,
          'AIFactory'
        );
    }

    if (options.enableMemory) {
      return new MemoryEnabledProvider(provider);
    }

    return provider;
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      `Failed to create AI provider: ${error instanceof Error ? error.message : String(error)}`,
      'AIFactory'
    );
  }
}

export function isValidProvider(provider: string): provider is AIProviderType {
  return ['openai', 'anthropic'].includes(provider);
}
