import type { Module } from '../types';
import { useConfigStore } from '../../../stores/configStore';
import { createAIProvider } from '../../ai/factory';
import { useLogStore } from '../../../stores/logStore';

interface Document {
  id: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

interface SortingCriteria {
  field: string;
  direction: 'asc' | 'desc';
  semantic?: boolean;
}

interface SearchQuery {
  text: string;
  filters?: Record<string, any>;
  semantic?: boolean;
}

class DocumentSorterService {
  private documents: Map<string, Document> = new Map();
  private aiProvider: any;
  private logger = useLogStore.getState();

  constructor() {
    const config = useConfigStore.getState().config;
    this.aiProvider = createAIProvider(config.ai);
  }

  async addDocument(doc: Document): Promise<void> {
    try {
      if (doc.content) {
        // Generate embedding for semantic search
        doc.embedding = await this.generateEmbedding(doc.content);
      }
      this.documents.set(doc.id, doc);
    } catch (error) {
      this.logger.addLog({
        source: 'DocumentSorter',
        type: 'error',
        message: `Failed to add document: ${error.message}`,
      });
      throw error;
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.aiProvider.chat([{
        role: 'system',
        content: 'Generate an embedding vector for the following text.',
      }, {
        role: 'user',
        content: text,
      }]);

      return JSON.parse(response.content);
    } catch (error) {
      this.logger.addLog({
        source: 'DocumentSorter',
        type: 'error',
        message: `Failed to generate embedding: ${error.message}`,
      });
      return [];
    }
  }

  async searchDocuments(query: SearchQuery): Promise<Document[]> {
    try {
      let results = Array.from(this.documents.values());

      if (query.semantic && query.text) {
        const queryEmbedding = await this.generateEmbedding(query.text);
        results = this.semanticSearch(results, queryEmbedding);
      } else if (query.text) {
        results = this.textSearch(results, query.text);
      }

      if (query.filters) {
        results = this.applyFilters(results, query.filters);
      }

      return results;
    } catch (error) {
      this.logger.addLog({
        source: 'DocumentSorter',
        type: 'error',
        message: `Search failed: ${error.message}`,
      });
      return [];
    }
  }

  private semanticSearch(docs: Document[], queryEmbedding: number[]): Document[] {
    return docs
      .map(doc => ({
        doc,
        similarity: this.cosineSimilarity(doc.embedding || [], queryEmbedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .map(({ doc }) => doc);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private textSearch(docs: Document[], query: string): Document[] {
    const normalizedQuery = query.toLowerCase();
    return docs.filter(doc =>
      doc.content.toLowerCase().includes(normalizedQuery) ||
      doc.title.toLowerCase().includes(normalizedQuery)
    );
  }

  private applyFilters(docs: Document[], filters: Record<string, any>): Document[] {
    return docs.filter(doc =>
      Object.entries(filters).every(([key, value]) =>
        doc.metadata[key] === value
      )
    );
  }

  async sortDocuments(docs: Document[], criteria: SortingCriteria[]): Promise<Document[]> {
    return docs.sort((a, b) => {
      for (const criterion of criteria) {
        const comparison = this.compareDocuments(a, b, criterion);
        if (comparison !== 0) return comparison;
      }
      return 0;
    });
  }

  private compareDocuments(a: Document, b: Document, criterion: SortingCriteria): number {
    const getValue = (doc: Document) =>
      criterion.field.split('.').reduce((obj, key) => obj?.[key], doc);

    const aValue = getValue(a);
    const bValue = getValue(b);

    const multiplier = criterion.direction === 'asc' ? 1 : -1;
    return aValue < bValue ? -1 * multiplier : aValue > bValue ? 1 * multiplier : 0;
  }
}

export const documentSorterModule: Module = {
  id: 'document-sorter',
  name: 'Document Sorter',
  version: '1.0.0',
  description: 'AI-powered document organization and semantic search',
  author: 'AI Assistant',
  status: 'inactive',
  type: 'tool',
  capabilities: ['semantic-search', 'document-sorting', 'metadata-extraction'],
  entry: './documentSorter',
  config: {
    maxDocumentSize: '10MB',
    embeddingModel: 'text-embedding-3-small',
    semanticSearchEnabled: true,
  },
};

export const documentSorter = new DocumentSorterService();