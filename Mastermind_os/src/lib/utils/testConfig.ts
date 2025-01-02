/**
 * Test environment configuration
 */
export const testConfig = {
  VITE_OPENAI_API_KEY: 'test-key',
  VITE_ANTHROPIC_API_KEY: 'test-key',
  VITE_GEMINI_API_KEY: 'test-key',
  VITE_AI_PROVIDER: 'ollama',
  VITE_AI_MODEL: 'llama2',
  VITE_AI_FALLBACK_PROVIDER: 'ollama',
  VITE_AI_FALLBACK_MODEL: 'llama2'
} as const;

export type EnvVar = keyof typeof testConfig;
