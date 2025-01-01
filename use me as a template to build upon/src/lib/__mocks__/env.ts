// Mock Vite's import.meta.env
export const env = {
  VITE_OPENAI_API_KEY: 'test-key',
  VITE_ANTHROPIC_API_KEY: 'test-key',
  VITE_GEMINI_API_KEY: 'test-key',
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
