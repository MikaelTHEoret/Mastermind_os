import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIConfig } from '../types';

export class GeminiProvider {
  private client: GoogleGenerativeAI;
  private model: any;

  constructor(config: AIConfig) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = this.client.getGenerativeModel({ 
      model: config.model || 'gemini-pro'
    });
  }

  async chat(messages: Array<{ role: string; content: string }>) {
    try {
      const chat = this.model.startChat({
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.7,
        },
        history: messages.slice(0, -1).map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
      });

      const result = await chat.sendMessage(messages[messages.length - 1].content);
      const response = await result.response;
      
      return {
        role: 'assistant',
        content: response.text(),
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embeddingModel = this.client.getGenerativeModel({ model: 'embedding-001' });
      const result = await embeddingModel.embedContent(text);
      return result.embedding;
    } catch (error) {
      console.error('Gemini Embedding Error:', error);
      throw error;
    }
  }
}