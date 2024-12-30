import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AIConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
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

interface Config {
  system: SystemConfig;
  network: NetworkConfig;
  security: SecurityConfig;
  database: DatabaseConfig;
  ai: AIConfig;
}

interface ConfigStore {
  config: Config;
  updateConfig: (updates: Partial<Config>) => void;
}

// Get API key from environment
const getApiKey = () => {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (openaiKey) return openaiKey;
  return '';
};

const defaultConfig: Config = {
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
    apiKey: getApiKey(),
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 4000,
  },
};

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      config: defaultConfig,
      updateConfig: (updates) =>
        set((state) => ({
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
