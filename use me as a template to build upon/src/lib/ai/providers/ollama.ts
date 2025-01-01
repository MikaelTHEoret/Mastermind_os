import { BaseProvider } from './BaseProvider';
import type { AIConfig, Message } from '../types';
import { AppError } from '../../utils/errors';
import { useLogStore } from '../../../stores/logStore';

interface OllamaStatus {
  isAvailable: boolean;
  version?: string;
  models?: string[];
  lastCheck: number;
}

interface OllamaModelInfo {
  name: string;
  size: number;
  digest: string;
  details: Record<string, unknown>;
}

export class OllamaProvider extends BaseProvider {
  private baseUrl: string;
  private model: string;
  private status: OllamaStatus;
  private logger = useLogStore.getState();
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL: number;
  private readonly REQUEST_TIMEOUT: number;

  private static getEnvConfig() {
    return {
      host: import.meta.env.VITE_OLLAMA_HOST || 'http://localhost:11434',
      model: import.meta.env.VITE_OLLAMA_MODEL || 'mistral',
      timeout: parseInt(import.meta.env.VITE_OLLAMA_TIMEOUT || '30000', 10),
      checkInterval: parseInt(import.meta.env.VITE_OLLAMA_CHECK_INTERVAL || '30000', 10)
    };
  }

  constructor(config: AIConfig) {
    super(config);
    const envConfig = OllamaProvider.getEnvConfig();
    
    this.baseUrl = config.baseUrl || envConfig.host;
    this.model = config.model || envConfig.model;
    this.CHECK_INTERVAL = envConfig.checkInterval;
    this.REQUEST_TIMEOUT = envConfig.timeout;
    
    this.status = {
      isAvailable: false,
      lastCheck: 0
    };

    this.logger.addLog({
      source: 'OllamaProvider',
      type: 'info',
      message: 'Initializing Ollama provider',
      metadata: {
        baseUrl: this.baseUrl,
        model: this.model,
        checkInterval: this.CHECK_INTERVAL,
        timeout: this.REQUEST_TIMEOUT
      }
    });
  }

  private async makeRequest<T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Ollama API error: ${errorText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async checkConnection(): Promise<void> {
    try {
      // Check server status
      const versionData = await this.makeRequest<{ version: string }>(
        `${this.baseUrl}/api/version`
      );

      // Get available models
      const modelsData = await this.makeRequest<{ models: OllamaModelInfo[] }>(
        `${this.baseUrl}/api/tags`
      );
      
      const models = modelsData.models?.map(m => m.name) || [];

      this.status = {
        isAvailable: true,
        version: versionData.version,
        models,
        lastCheck: Date.now()
      };

      // Log successful connection
      this.logger.addLog({
        source: 'OllamaProvider',
        type: 'info',
        message: `Connected to Ollama v${versionData.version}`,
        metadata: {
          availableModels: models,
          baseUrl: this.baseUrl
        }
      });

      // Verify model availability
      if (!models.includes(this.model)) {
        this.logger.addLog({
          source: 'OllamaProvider',
          type: 'warning',
          message: `Model ${this.model} not found. Available models: ${models.join(', ')}`
        });
      }
    } catch (error) {
      this.status.isAvailable = false;
      this.status.lastCheck = Date.now();
      throw new AppError('Ollama connection check failed', 'OllamaProvider', error);
    }
  }

  async initialize(): Promise<void> {
    try {
      await this.checkConnection();

      // Start periodic connection checks
      this.connectionCheckInterval = setInterval(async () => {
        try {
          await this.checkConnection();
        } catch (error) {
          this.logger.addLog({
            source: 'OllamaProvider',
            type: 'error',
            message: `Connection check failed: ${error instanceof Error ? error.message : String(error)}`
          });
        }
      }, this.CHECK_INTERVAL);

    } catch (error) {
      throw new AppError('Failed to initialize Ollama provider', 'OllamaProvider', error);
    }
  }

  async chat(messages: Message[]): Promise<Message> {
    // Verify connection status
    if (!this.status.isAvailable || Date.now() - this.status.lastCheck > this.CHECK_INTERVAL) {
      await this.checkConnection();
    }

    try {
      const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      
      const data = await this.makeRequest<{ response: string }>(
        `${this.baseUrl}/api/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.model,
            prompt,
            stream: false,
          }),
        }
      );

      return {
        role: 'assistant',
        content: data.response,
      };
    } catch (error) {
      throw new AppError('Failed to generate chat response', 'OllamaProvider', error);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const data = await this.makeRequest<{ embedding: number[] }>(
        `${this.baseUrl}/api/embeddings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.model,
            prompt: text,
          }),
        }
      );

      return data.embedding;
    } catch (error) {
      throw new AppError('Failed to generate embedding', 'OllamaProvider', error);
    }
  }

  async cleanup(): Promise<void> {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }
}
