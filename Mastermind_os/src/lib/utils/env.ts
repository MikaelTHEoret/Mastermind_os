export function getEnvVar(key: string, defaultValue?: string): string {
  // Check Vite environment variables first
  if (typeof import.meta !== 'undefined' && import.meta.env[key] !== undefined) {
    return import.meta.env[key];
  }

  // Check Node.js environment variables
  if (typeof process !== 'undefined' && process.env[key] !== undefined) {
    return process.env[key];
  }

  // Check window environment variables
  if (typeof window !== 'undefined' && (window as any).__env?.[key] !== undefined) {
    return (window as any).__env[key];
  }

  // Return default value if provided
  if (defaultValue !== undefined) {
    return defaultValue;
  }

  throw new Error(`Environment variable ${key} is not defined`);
}

export const isProduction = getEnvVar('NODE_ENV', 'development') === 'production';
export const isTest = getEnvVar('NODE_ENV', 'development') === 'test';
export const isDevelopment = !isProduction && !isTest;
