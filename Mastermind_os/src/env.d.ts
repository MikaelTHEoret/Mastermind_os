/// <reference types="vite/client" />

import type { ImportGlobFunction } from './types/import-types';

interface ImportMetaEnv {
  readonly VITE_AI_PROVIDER: string;
  readonly VITE_AI_MODEL: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_AI_FALLBACK_PROVIDER: string;
  readonly VITE_AI_FALLBACK_MODEL: string;
  readonly VITE_AI_FALLBACK_API_KEY: string;
  readonly VITE_AI_MAX_TOKENS: number;
  readonly VITE_AI_TEMPERATURE: number;
  readonly VITE_AI_TOP_P: number;
  readonly VITE_OLLAMA_HOST: string;
  readonly VITE_OLLAMA_MODEL: string;
  readonly VITE_OLLAMA_TIMEOUT: string;
  readonly VITE_OLLAMA_CHECK_INTERVAL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  url: string;
  resolve(id: string): string;
  glob: ImportGlobFunction;
  dirname: string;
  filename: string;
}
