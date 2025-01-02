// ChromaDB client configuration types
export interface ChromaClientParams {
  path?: string;
  fetchOptions?: RequestInit;
}

export interface IEmbeddingFunction {
  generate(texts: string[]): Promise<number[][]>;
}

export interface CollectionMetadata {
  name?: string;
  description?: string;
  [key: string]: any;
}

export interface Collection {
  name: string;
  id: string;
  metadata?: CollectionMetadata;
  add(params: {
    ids: string[];
    embeddings: number[][];
    metadatas?: Record<string, any>[];
    documents?: string[];
  }): Promise<void>;
  query(params: {
    queryTexts?: string[];
    queryEmbeddings?: number[][];
    nResults?: number;
    where?: Record<string, any>;
    whereDocument?: Record<string, any>;
  }): Promise<{
    ids: string[][];
    distances: number[][];
    metadatas: Record<string, any>[][];
    embeddings: number[][][];
    documents: string[][];
  }>;
  get(params: {
    ids?: string[];
    where?: Record<string, any>;
    limit?: number;
    offset?: number;
  }): Promise<{
    ids: string[];
    embeddings: number[][];
    metadatas: Record<string, any>[];
    documents: string[];
  }>;
  update(params: {
    ids: string[];
    embeddings?: number[][];
    metadatas?: Record<string, any>[];
    documents?: string[];
  }): Promise<void>;
  delete(params?: { ids?: string[]; where?: Record<string, any> }): Promise<void>;
}
