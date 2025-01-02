/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  setupFiles: [
    'dotenv/config',
    '<rootDir>/src/setupTests.ts',
    '<rootDir>/src/lib/nexus/__tests__/setup.ts'
  ],
  setupFilesAfterEnv: [],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
    env: {
      NODE_ENV: 'test',
      DOTENV_CONFIG_PATH: '.env.test'
    }
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.test.json',
        useESM: true,
        diagnostics: {
          ignoreCodes: [1343]
        }
      }
    ],
    '^.+\\.js$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }]
        ],
        plugins: [
          ['babel-plugin-transform-vite-meta-env', {
            envPrefix: 'VITE_'
          }]
        ]
      }
    ]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^crypto$': '<rootDir>/src/lib/__mocks__/crypto.ts'
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!(@anthropic-ai/sdk|openai)/)'
  ],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  }
};
