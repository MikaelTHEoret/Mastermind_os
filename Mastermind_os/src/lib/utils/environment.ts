export interface EnvironmentInfo {
  isNode: boolean;
  isBrowser: boolean;
  isTest: boolean;
  isProduction: boolean;
  isDevelopment: boolean;
  indexedDBAvailable: boolean;
}

export function getEnvironment(): EnvironmentInfo {
  const isNode = typeof process !== 'undefined' && 
                 typeof process.versions !== 'undefined' && 
                 typeof process.versions.node !== 'undefined';

  const isBrowser = typeof window !== 'undefined' && 
                    typeof window.document !== 'undefined';

  const env = process.env.NODE_ENV || 'development';
  const isTest = env === 'test';
  const isProduction = env === 'production';
  const isDevelopment = !isProduction && !isTest;

  const indexedDBAvailable = isBrowser && 
                            typeof window.indexedDB !== 'undefined';

  return {
    isNode,
    isBrowser,
    isTest,
    isProduction,
    isDevelopment,
    indexedDBAvailable
  };
}
