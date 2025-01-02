declare module 'test-env' {
  export interface ImportMetaEnv {
    BASE_URL: string;
    MODE: string;
    DEV: boolean;
    PROD: boolean;
    SSR: boolean;
    VITE_API_BASE_URL: string;
    VITE_APP_NAME: string;
    VITE_APP_VERSION: string;
    VITE_APP_BUILD_TIME: string;
    VITE_APP_COMMIT_HASH: string;
    VITE_APP_BRANCH: string;
    VITE_APP_ENVIRONMENT: string;
    VITE_AI_PROVIDER: string;
    VITE_AI_MODEL: string;
    VITE_OPENAI_API_KEY: string;
    VITE_AI_FALLBACK_PROVIDER: string;
    VITE_AI_FALLBACK_MODEL: string;
    VITE_AI_FALLBACK_API_KEY: string;
    VITE_AI_MAX_TOKENS: number;
    VITE_AI_TEMPERATURE: number;
    VITE_AI_TOP_P: number;
    VITE_OLLAMA_HOST: string;
    VITE_OLLAMA_MODEL: string;
    VITE_OLLAMA_TIMEOUT: string;
    VITE_OLLAMA_CHECK_INTERVAL: string;
    [key: string]: string | number | boolean | undefined;
  }
}
