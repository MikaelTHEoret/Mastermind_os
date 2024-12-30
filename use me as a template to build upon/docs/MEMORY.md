# Memory System

The memory system provides long-term memory capabilities to AI assistants using vector storage and semantic search. It enables:

- Conversation summarization and retrieval
- Semantic search across past interactions
- Knowledge storage and retrieval
- Memory associations and context generation

## Components

### ChromaStore

Vector database implementation using ChromaDB for storing and retrieving memories with semantic search capabilities.

```typescript
interface MemoryEntry {
  id: string;
  type: 'conversation' | 'summary' | 'knowledge' | 'context';
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
  timestamp: number;
  relevanceScore?: number;
  associations?: string[];
  source?: string;
}
```

### MemoryManager

High-level service for managing memories, including:

- Conversation summarization
- Context retrieval and generation
- Knowledge storage and search
- Memory associations

```typescript
// Store conversation memory
const memory = await memoryManager.storeConversationMemory(messages);

// Retrieve relevant memories
const memories = await memoryManager.retrieveRelevantMemories(context);

// Generate context from memories
const context = await memoryManager.generateContextFromMemories(memories, currentContext);
```

### MemoryEnabledProvider

AI provider wrapper that automatically:

1. Retrieves relevant memories for the current conversation
2. Generates context from past memories
3. Periodically stores conversation summaries
4. Maintains memory associations

```typescript
// Create a memory-enabled provider
const provider = createAIProvider(config, { enableMemory: true });

// Chat with memory context
const response = await provider.chat(messages);
```

## Usage

1. Enable memory for an AI provider:

```typescript
import { createAIProvider } from './lib/ai/factory';

const provider = createAIProvider(config, { 
  enableMemory: true 
});
```

2. Store knowledge:

```typescript
import { memoryManager } from './lib/memory/MemoryManager';

await memoryManager.storeKnowledge(
  content,
  topic,
  metadata
);
```

3. Search memories:

```typescript
const memories = await memoryManager.searchKnowledge(
  query,
  topic,
  limit
);
```

4. Create memory associations:

```typescript
await memoryManager.createMemoryAssociation(
  sourceId,
  targetId,
  metadata
);
```

## Implementation Details

### Vector Storage

Uses ChromaDB for:
- Storing embeddings generated via OpenAI's text-embedding-ada model
- Semantic similarity search
- Metadata filtering
- Memory associations

### Memory Types

1. **Conversation**: Complete chat interactions
2. **Summary**: AI-generated summaries of conversations
3. **Knowledge**: Stored information and facts
4. **Context**: Generated contextual information

### Context Generation

1. Retrieves relevant memories based on current conversation
2. Generates a concise context summary
3. Injects context into AI provider's system messages

### Memory Associations

- Bidirectional links between related memories
- Metadata for describing relationships
- Graph-like traversal of related concepts

## Configuration

Memory settings can be configured through the AI provider config:

```typescript
{
  memoryConfig: {
    summarizationThreshold: 10, // Messages before summarization
    relevanceThreshold: 0.7,    // Minimum similarity score
    maxContextMemories: 5       // Max memories for context
  }
}
