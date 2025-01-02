// Mock environment variables
process.env = {
  ...process.env,
  VITE_OPENAI_API_KEY: 'test-key',
  OPENAI_API_KEY: 'test-key',
  NODE_ENV: 'test'
};
