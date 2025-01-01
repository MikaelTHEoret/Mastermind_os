export type AIProviderType = 'openai' | 'anthropic' | 'ollama';

export type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
  role: MessageRole;
  content: string;
  timestamp?: number;
}

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxTokensPerMinute: number;
  maxRetries: number;
  retryDelayMs: number;
}

export interface AIProvider {
  initialize(): Promise<void>;
  chat(messages: Message[]): Promise<Message>;
  generateEmbedding?(text: string): Promise<number[]>;
  cleanup?(): Promise<void>;
}

export interface AIConfig {
  provider: AIProviderType;
  apiKey?: string;  // Optional since Ollama doesn't need it
  model: string;
  temperature?: number;
  maxTokens?: number;
  fallbackProvider?: AIProviderType;
  fallbackApiKey?: string;  // Optional since Ollama doesn't need it
  fallbackModel?: string;
  rateLimit?: RateLimitConfig;
  baseUrl?: string;  // Optional base URL for API endpoints
}

export interface FilePermissions {
  read: boolean;
  write: boolean;
  allowedPaths: string[];
  blockedPaths: string[];
}

export interface MemoryConfig {
  summarizationThreshold: number;
  relevanceThreshold: number;
  maxContextMemories: number;
  cleanupAge: number;
  deduplicationThreshold: number;
}

export interface CreateAIProviderOptions {
  enableMemory?: boolean;
  memoryConfig?: MemoryConfig;
}

export interface PerformanceMetrics {
  duration: number;
  tokensProcessed?: number;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
}

export interface CompletionMetrics {
  startTime: number;
  endTime: number;
  performance: PerformanceMetrics;
}

export interface LogMessage {
  source: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

export interface AppConfig {
  ai: AIConfig;
  fileSystem: FilePermissions;
  memory?: MemoryConfig;
}
