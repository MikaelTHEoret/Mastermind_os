import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { OllamaProvider } from './providers/ollama';
import { MemoryEnabledProvider } from './MemoryEnabledProvider';
import type { AIConfig, AIProvider, AIProviderType, CreateAIProviderOptions, Message } from './types';
import { AppError } from '../utils/errors';

// Request queue for each provider type
const requestQueues = new Map<AIProviderType, Promise<any>>();

// Queue a request for a specific provider
export async function queueRequest<T>(
  provider: AIProviderType,
  operation: () => Promise<T>
): Promise<T> {
  // Get or create the provider's queue
  const currentQueue = requestQueues.get(provider) || Promise.resolve();
  
  // Create new promise that waits for current queue before executing
  const newQueue = currentQueue.then(async () => {
    try {
      return await operation();
    } catch (error) {
      throw error;
    }
  });

  // Update the queue
  requestQueues.set(provider, newQueue);
  
  // Return the queued operation result
  return newQueue;
}

// Wrap provider methods with queue
function wrapProviderWithQueue(provider: AIProvider, type: AIProviderType): AIProvider {
  return {
    ...provider,
    chat: (messages: Message[]) => 
      queueRequest(type, () => provider.chat(messages)),
    generateEmbedding: provider.generateEmbedding 
      ? (text: string) => queueRequest(type, () => {
          if (provider.generateEmbedding) {
            return provider.generateEmbedding(text);
          }
          throw new AppError('Embedding generation not supported', 'AIProvider');
        })
      : undefined,
    initialize: () => queueRequest(type, () => provider.initialize()),
    cleanup: provider.cleanup
      ? () => queueRequest(type, () => {
          if (provider.cleanup) {
            return provider.cleanup();
          }
          return Promise.resolve();
        })
      : undefined
  };
}

export async function createAIProvider(
  config: AIConfig,
  options: CreateAIProviderOptions = {}
): Promise<AIProvider> {
  try {
    // Validate config
    if (!config.model) {
      throw new AppError('Model name is required', 'AIFactory');
    }
    
    // API key is required for OpenAI and Anthropic, but not for Ollama
    if (config.provider !== 'ollama' && !config.apiKey) {
      throw new AppError('API key is required for this provider', 'AIFactory');
    }

    // Validate fallback config if provided
    if (config.fallbackProvider) {
      if (config.fallbackProvider !== 'ollama' && !config.fallbackApiKey) {
        throw new AppError('Fallback API key is required for non-Ollama providers', 'AIFactory');
      }
      if (!isValidProvider(config.fallbackProvider)) {
        throw new AppError(`Invalid fallback provider: ${config.fallbackProvider}`, 'AIFactory');
      }
      if (!config.fallbackModel) {
        throw new AppError('Fallback model must be specified', 'AIFactory');
      }
    }

    // Create and initialize provider
    let provider: AIProvider;
    switch (config.provider) {
      case 'openai':
        provider = new OpenAIProvider(config);
        break;
      case 'anthropic':
        provider = new AnthropicProvider(config);
        break;
      case 'ollama':
        provider = new OllamaProvider(config);
        break;
      default:
        throw new AppError(
          `Unsupported AI provider: ${config.provider}`,
          'AIFactory'
        );
    }

    // Initialize the provider
    await provider.initialize();

    // Wrap provider with request queue
    const queuedProvider = wrapProviderWithQueue(provider, config.provider);

    // Wrap with memory if enabled
    if (options.enableMemory) {
      const memoryProvider = new MemoryEnabledProvider(queuedProvider);
      await memoryProvider.initialize();
      return memoryProvider;
    }

    return queuedProvider;
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      `Failed to create AI provider: ${error instanceof Error ? error.message : String(error)}`,
      'AIFactory',
      error
    );
  }
}

export function isValidProvider(provider: string): provider is AIProviderType {
  return ['openai', 'anthropic', 'ollama'].includes(provider);
}
