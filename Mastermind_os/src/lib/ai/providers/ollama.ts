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
  private isCheckingConnection = false;
  private readonly CHECK_INTERVAL: number;
  private readonly REQUEST_TIMEOUT: number;
  private lastConnectionCheck = 0;

  private static getEnvConfig() {
    return {
      host: import.meta.env.VITE_OLLAMA_HOST || 'http://localhost:11434',
      model: import.meta.env.VITE_OLLAMA_MODEL || 'llama2',
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
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AppError('Request timed out', 'OllamaProvider', error);
      }
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new AppError('Network connection failed', 'OllamaProvider', error);
      }
      throw new AppError('Request failed', 'OllamaProvider', error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async checkConnection(): Promise<void> {
    // Debounce check if another one is in progress
    if (this.isCheckingConnection) return;
    
    // Rate limit checks to prevent rapid consecutive calls
    const now = Date.now();
    if (now - this.lastConnectionCheck < 5000) return;
    
    this.isCheckingConnection = true;
    this.lastConnectionCheck = now;
    
    try {
      // Check server status with version validation
      const versionData = await this.makeRequest<{ version: string }>(
        `${this.baseUrl}/api/version`
      );
      
      if (!versionData?.version) {
        throw new AppError('Invalid version response from Ollama', 'OllamaProvider');
      }

      // Get available models with validation
      const modelsData = await this.makeRequest<{ models: OllamaModelInfo[] }>(
        `${this.baseUrl}/api/tags`
      );
      
      if (!modelsData?.models) {
        throw new AppError('Invalid models response from Ollama', 'OllamaProvider');
      }
      
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
    } finally {
      this.isCheckingConnection = false;
    }
  }

  async initialize(): Promise<void> {
    try {
      await this.checkConnection();

      // Clear any existing interval before starting a new one
      if (this.connectionCheckInterval) {
        clearInterval(this.connectionCheckInterval);
      }
      
      // Start periodic connection checks with debouncing
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
      }, Math.max(this.CHECK_INTERVAL, 10000)); // Ensure minimum 10 second interval

    } catch (error) {
      throw new AppError('Failed to initialize Ollama provider', 'OllamaProvider', error);
    }
  }

  private retryCount = 0;
  private readonly MAX_RETRIES = 3;

  async chat(messages: Message[]): Promise<Message> {
    // If service is unavailable, return fallback immediately
    if (!this.status.isAvailable) {
      return {
        role: 'assistant',
        content: 'Ollama service is currently unavailable. Application is running in limited mode.'
      };
    }

    // Rate limit requests to prevent excessive calls
    const now = Date.now();
    if (now - this.lastConnectionCheck < 1000) {
      return {
        role: 'assistant',
        content: 'Processing previous request...'
      };
    }

    try {
      // Verify connection status
      if (now - this.status.lastCheck > this.CHECK_INTERVAL) {
        await this.checkConnection();
      }

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

      // Reset retry count on successful request
      this.retryCount = 0;
      this.lastConnectionCheck = now;
      
      return {
        role: 'assistant',
        content: data.response,
      };
    } catch (error) {
      this.retryCount++;
      
      if (this.retryCount >= this.MAX_RETRIES) {
        // Mark service as unavailable after max retries
        this.status.isAvailable = false;
        this.logger.addLog({
          source: 'OllamaProvider',
          type: 'warning',
          message: `Ollama service unavailable after ${this.MAX_RETRIES} attempts. Entering limited mode.`,
          metadata: { error: error instanceof Error ? error.message : String(error) }
        });
      }

      return {
        role: 'assistant',
        content: 'Ollama service is currently unavailable. Application is running in limited mode.'
      };
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
