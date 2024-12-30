import type { Module } from '../types';

export const codeAnalysisModule: Module = {
  id: 'code-analysis',
  name: 'Code Analysis',
  version: '1.0.0',
  description: 'Analyzes code structure and provides insights',
  author: 'AI Assistant',
  status: 'inactive',
  type: 'tool',
  capabilities: ['static-analysis', 'code-metrics', 'dependency-analysis'],
  entry: './codeAnalysis',
  config: {
    maxFileSize: '1MB',
    excludePatterns: 'node_modules,dist,build',
  },
};