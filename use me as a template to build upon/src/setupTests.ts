import '@testing-library/jest-dom';
import 'openai/shims/node';
import '@anthropic-ai/sdk/shims/node';
import { testConfig } from './lib/utils/env';

// Set test environment
process.env.NODE_ENV = 'test';

// Set up environment variables from testConfig
Object.entries(testConfig).forEach(([key, value]) => {
  process.env[key] = value;
});

// Mock window.__VITE_ENV__
global.window = global.window || {};
(global.window as any).__VITE_ENV__ = testConfig;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock crypto API
Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid',
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      digest: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    },
  },
});

// Mock IndexedDB
const indexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDB,
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset IndexedDB mock
  indexedDB.open.mockReset();
  indexedDB.deleteDatabase.mockReset();
  
  // Reset crypto mock
  (window.crypto.randomUUID as jest.Mock).mockClear();
  (window.crypto.subtle.digest as jest.Mock).mockClear();
  (window.crypto.subtle.encrypt as jest.Mock).mockClear();
  (window.crypto.subtle.decrypt as jest.Mock).mockClear();
});
