export type AIProviderType = 'openai' | 'anthropic';

export interface Message {
  role: string;
  content: string;
}

export interface AIProvider {
  initialize?(): Promise<void>;
  chat(messages: Message[]): Promise<Message>;
  generateEmbedding?(text: string): Promise<number[]>;
  cleanup?(): Promise<void>;
}

export interface AIConfig {
  provider: AIProviderType;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface FilePermissions {
  read: boolean;
  write: boolean;
  allowedPaths: string[];
  blockedPaths: string[];
}

export interface AppConfig {
  ai: AIConfig;
  fileSystem: FilePermissions;
}
