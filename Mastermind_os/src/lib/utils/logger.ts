import path from 'path';

let fs: typeof import('fs') | null = null;
try {
  fs = await import('fs');
} catch {
  // fs not available in browser environment
}

const logFilePath = process.env.NODE_ENV === 'test' ? 
  './test-component-logs.txt' : 
  './component-logs.txt';

type LogLevel = 'info' | 'error' | 'log';

const logToFile = (level: LogLevel, message: string) => {
  try {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    if (fs && fs.existsSync && fs.mkdirSync && fs.appendFileSync) {
      // Ensure directory exists
      const dir = path.dirname(logFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Append to file
      fs.appendFileSync(logFilePath, logMessage);
    } else {
      // Fallback to console logging in browser environment
      console[level](logMessage);
    }
  } catch (error) {
    console.error('Logger error:', error);
    throw error;
  }
};

export const logger = {
  log: (message: string) => {
    logToFile('log', message);
    console.log(message);
  },
  info: (message: string) => {
    logToFile('info', message);
    console.info(message);
  },
  error: (message: string) => {
    logToFile('error', message);
    console.error(message);
  },
  clear: () => {
    try {
      if (fs && fs.existsSync(logFilePath)) {
        fs.unlinkSync(logFilePath);
      }
    } catch (error) {
      console.error('Logger clear error:', error);
      throw error;
    }
  }
};
