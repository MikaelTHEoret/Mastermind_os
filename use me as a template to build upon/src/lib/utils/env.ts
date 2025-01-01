import { testConfig, type EnvVar } from './testConfig';

/**
 * Get environment variable value
 */
export const getEnvVar = (key: EnvVar, defaultValue: string = ''): string => {
  // Test environment
  if (process.env.NODE_ENV === 'test') {
    return testConfig[key];
  }

  // Development/production environment
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || defaultValue;
  }

  // Fallback to test config
  return testConfig[key] || defaultValue;
};

// Export test config for use in tests
export { testConfig };
