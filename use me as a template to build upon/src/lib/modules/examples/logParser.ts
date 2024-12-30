import type { Module } from '../types';
import { useLogStore } from '../../../stores/logStore';
import { useConfigStore } from '../../../stores/configStore';
import { createAIProvider } from '../../ai/factory';

interface LogPattern {
  name: string;
  pattern: RegExp;
  fields: string[];
}

interface ParsedLog {
  timestamp: Date;
  level: string;
  source: string;
  message: string;
  metadata: Record<string, any>;
}

class LogParserService {
  private patterns: LogPattern[] = [];
  private aiProvider: any;
  private logger = useLogStore.getState();

  constructor() {
    const config = useConfigStore.getState().config;
    this.aiProvider = createAIProvider(config.ai);
  }

  addPattern(pattern: LogPattern) {
    this.patterns.push(pattern);
  }

  async parseLog(logLine: string): Promise<ParsedLog | null> {
    // Try matching against known patterns first
    for (const pattern of this.patterns) {
      const match = logLine.match(pattern.pattern);
      if (match) {
        return this.structureLog(match, pattern);
      }
    }

    // If no pattern matches, use AI to parse
    try {
      const response = await this.aiProvider.chat([{
        role: 'system',
        content: 'Parse the following log line into a structured format with timestamp, level, source, message, and any additional metadata.',
      }, {
        role: 'user',
        content: logLine,
      }]);

      return JSON.parse(response.content);
    } catch (error) {
      this.logger.addLog({
        source: 'LogParser',
        type: 'error',
        message: `Failed to parse log line: ${error.message}`,
      });
      return null;
    }
  }

  private structureLog(match: RegExpMatchArray, pattern: LogPattern): ParsedLog {
    const result: any = {};
    pattern.fields.forEach((field, index) => {
      result[field] = match[index + 1];
    });

    return {
      timestamp: new Date(result.timestamp || Date.now()),
      level: result.level || 'info',
      source: result.source || 'unknown',
      message: result.message || '',
      metadata: result,
    };
  }

  async analyzeLogs(logs: ParsedLog[], query: string): Promise<any> {
    try {
      const response = await this.aiProvider.chat([{
        role: 'system',
        content: 'Analyze the following logs and answer the query. Provide insights and patterns.',
      }, {
        role: 'user',
        content: JSON.stringify({ logs, query }),
      }]);

      return JSON.parse(response.content);
    } catch (error) {
      this.logger.addLog({
        source: 'LogParser',
        type: 'error',
        message: `Failed to analyze logs: ${error.message}`,
      });
      return null;
    }
  }
}

export const logParserModule: Module = {
  id: 'log-parser',
  name: 'Log Parser',
  version: '1.0.0',
  description: 'Advanced log parsing and analysis with AI capabilities',
  author: 'AI Assistant',
  status: 'inactive',
  type: 'tool',
  capabilities: ['log-parsing', 'pattern-matching', 'ai-analysis'],
  entry: './logParser',
  config: {
    defaultPatterns: [
      {
        name: 'standardLog',
        pattern: /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)\s+\[([^\]]+)\]\s+(\w+)\s+(.+)/,
        fields: ['timestamp', 'source', 'level', 'message'],
      },
    ],
  },
};

export const logParser = new LogParserService();