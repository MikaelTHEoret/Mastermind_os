import { create } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';

// Vite env type declarations
interface ImportMetaEnv {
  VITE_OPENAI_API_KEY: string;
  VITE_AI_FALLBACK_PROVIDER: string;
  VITE_AI_FALLBACK_MODEL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface AIConfig {
  provider: 'openai' | 'anthropic' | 'ollama';
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  fallbackProvider?: 'openai' | 'anthropic' | 'ollama';
  fallbackModel?: string;
}

interface SystemConfig {
  environment: 'development' | 'production' | 'testing';
  debug: boolean;
  maxAgents: number;
  maxWorkers: number;
  timezone: string;
}

interface NetworkConfig {
  mode: 'standalone' | 'cluster' | 'distributed';
  discoveryPort: number;
  autoDiscovery: boolean;
  maxConnections: number;
  timeout: number;
}

interface SecurityConfig {
  encryptionEnabled: boolean;
  encryptionAlgorithm: string;
  keyRotationInterval: number;
  maxLoginAttempts: number;
  sessionTimeout: number;
  allowedIPs: string[];
}

interface DatabaseConfig {
  backupEnabled: boolean | undefined;
  backupInterval: number;
  type: 'sqlite' | 'mongodb' | 'postgres';
  url: string;
  maxConnections: number;
  timeout: number;
  ssl: boolean;
}

interface ChromaConfig {
  host: string;
  port: number;
  apiImpl: 'rest' | 'http';
  apiKey?: string;
}

interface EmbeddingConfig {
  provider: 'openai' | 'local';
  model?: string;
  batchSize?: number;
}

interface MemoryConfig {
  summarizationThreshold: number;
  relevanceThreshold: number;
  maxContextMemories: number;
  cleanupAge: number;
  deduplicationThreshold: number;
  backupInterval?: number;
  compressionThreshold?: number;
  version?: string;
  maxMemorySize?: number;
  importanceThresholds?: {
    high: number;
    medium: number;
    low: number;
  };
  chroma?: ChromaConfig;
  embedding?: EmbeddingConfig;
}

interface Config {
  system: SystemConfig;
  network: NetworkConfig;
  security: SecurityConfig;
  database: DatabaseConfig;
  ai: AIConfig;
  memory?: MemoryConfig;
}

interface ConfigStore {
  config: Config;
  updateConfig: (updates: Partial<Config>) => void;
}

// Get environment variables
const getEnvVars = () => {
  if (process.env.NODE_ENV === 'test') {
    return {
      apiKey: 'test-key',
      fallbackProvider: 'ollama',
      fallbackModel: 'llama2'
    };
  }
  
  // In Vite, environment variables are exposed through import.meta.env
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const fallbackProvider = import.meta.env.VITE_AI_FALLBACK_PROVIDER;
  const fallbackModel = import.meta.env.VITE_AI_FALLBACK_MODEL;
  
  if (!apiKey) {
    console.error('OpenAI API key not found in environment variables');
  }
  
  return {
    apiKey: apiKey || '',
    fallbackProvider: fallbackProvider || 'ollama',
    fallbackModel: fallbackModel || 'llama2'
  };
};

const defaultConfig: Config = {
  memory: {
    summarizationThreshold: 10,
    relevanceThreshold: 0.7,
    maxContextMemories: 5,
    cleanupAge: 30 * 24 * 60 * 60 * 1000,
    deduplicationThreshold: 0.95,
    backupInterval: 24 * 60 * 60 * 1000,
    compressionThreshold: 7 * 24 * 60 * 60 * 1000,
    version: '1.0.0',
    maxMemorySize: 50 * 1024 * 1024,
    importanceThresholds: {
      high: 0.8,
      medium: 0.5,
      low: 0.3
    },
    chroma: {
      host: 'localhost',
      port: 8000,
      apiImpl: 'rest'
    },
    embedding: {
      provider: 'openai',
      model: 'text-embedding-ada-002',
      batchSize: 512
    }
  },
  system: {
    environment: 'development',
    debug: true,
    maxAgents: 50,
    maxWorkers: 20,
    timezone: 'UTC',
  },
  network: {
    mode: 'standalone',
    discoveryPort: 8080,
    autoDiscovery: true,
    maxConnections: 100,
    timeout: 30000,
  },
  security: {
    encryptionEnabled: true,
    encryptionAlgorithm: 'AES-256-GCM',
    keyRotationInterval: 86400,
    maxLoginAttempts: 5,
    sessionTimeout: 3600,
    allowedIPs: ['*'],
  },
  database: {
      type: 'sqlite',
      url: 'local://data',
      maxConnections: 10,
      timeout: 5000,
      ssl: false,
      backupEnabled: true,
      backupInterval: 86400 // 24 hours
  },
  ai: {
    provider: 'openai',
    apiKey: getEnvVars().apiKey,
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 4000,
    fallbackProvider: getEnvVars().fallbackProvider as 'openai' | 'anthropic' | 'ollama',
    fallbackModel: getEnvVars().fallbackModel,
  },
};

type SetState = (
  partial: ConfigStore | Partial<ConfigStore> | ((state: ConfigStore) => ConfigStore | Partial<ConfigStore>),
  replace?: boolean | undefined
) => void;

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set: SetState) => ({
      config: defaultConfig,
      updateConfig: (updates: Partial<Config>) =>
        set((state: ConfigStore) => ({
          config: {
            ...state.config,
            ...updates,
          },
        })),
    }),
    {
      name: 'system-config',
    }
  )
);

// Declare env.d.ts augmentation for Vite
declare module 'vite/client' {
  interface ImportMetaEnv {
    readonly VITE_OPENAI_API_KEY: string;
    readonly VITE_AI_FALLBACK_PROVIDER: string;
    readonly VITE_AI_FALLBACK_MODEL: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
