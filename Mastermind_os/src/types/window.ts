export interface WindowState {
  id: string;
  title: string;
  type: 'agent' | 'system' | 'module' | 'console' | 'terminal' | 'settings' | 'johnny' | 'executor';
  component: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  agentConfig?: AgentConfig;
  appearance?: AgentAppearance;
  instructions?: string[];
  knowledgeBase?: KnowledgeBaseItem[];
}

export interface AgentConfig {
  type: 'commander' | 'executor' | 'worker' | 'monitor';
  capabilities: string[];
  aiModel?: string;
  apiKey?: string;
  contextWindow?: number;
  localOnly?: boolean;
  permissions?: {
    read: boolean;
    write: boolean;
    allowedPaths?: string[];
    blockedPaths?: string[];
  };
}

export interface AgentAppearance {
  avatar?: string;
  avatarFile?: File;
  background?: string;
  backgroundFile?: File;
  theme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  customCss?: string;
}

export interface KnowledgeBaseItem {
  id: string;
  type: 'text' | 'pdf' | 'webpage' | 'image';
  title: string;
  content: string;
  url?: string;
  localPath?: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}
