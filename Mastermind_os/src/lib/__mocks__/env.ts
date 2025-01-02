// Mock environment variables for testing
export const env = {
  VITE_OPENAI_API_KEY: 'test-key',
  VITE_ANTHROPIC_API_KEY: 'test-key',
  VITE_GEMINI_API_KEY: 'test-key',
  VITE_OLLAMA_HOST: 'http://localhost:11434',
  VITE_OLLAMA_MODEL: 'mistral',
  VITE_OLLAMA_TIMEOUT: '30000',
  VITE_OLLAMA_CHECK_INTERVAL: '30000',
  MODE: 'test',
  DEV: false,
  PROD: false,
  SSR: false
};

// @ts-ignore
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.env = env;
}

export default env;
