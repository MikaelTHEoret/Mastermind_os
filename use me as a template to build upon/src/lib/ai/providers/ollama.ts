import { BaseProvider } from './BaseProvider';
import type { AIConfig, Message } from '../types';
import { AppError } from '../../utils/errors';

export class OllamaProvider extends BaseProvider {
  private baseUrl: string;
  private model: string;

  constructor(config: AIConfig) {
    super(config);
    this.baseUrl = 'http://localhost:11434';
    this.model = config.model || 'llama2';
  }

  async initialize(): Promise<void> {
    try {
      // Check if Ollama is running
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error('Failed to connect to Ollama server');
      }
    } catch (error) {
      throw new AppError('Failed to initialize Ollama provider', 'OllamaProvider', error);
    }
  }

  async chat(messages: Message[]): Promise<Message> {
    try {
      const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        role: 'assistant',
        content: data.response,
      };
    } catch (error) {
      throw new AppError('Failed to generate chat response', 'OllamaProvider', error);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      throw new AppError('Failed to generate embedding', 'OllamaProvider', error);
    }
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for Ollama
  }
}
