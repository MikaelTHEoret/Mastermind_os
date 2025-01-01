import { memoryManager } from '../MemoryManager';
import { createAIProvider } from '../../ai/factory';
import type { Message } from '../../ai/types';

// Mock the AI provider
jest.mock('../../ai/factory', () => ({
  createAIProvider: jest.fn().mockImplementation(() => ({
    chat: jest.fn().mockResolvedValue({ content: 'Mocked response' }),
    cleanup: jest.fn().mockResolvedValue(undefined)
  }))
}));

describe('Memory System', () => {
  beforeEach(async () => {
    await memoryManager.initialize();
  });

  afterEach(async () => {
    // Clean up after each test
    jest.clearAllMocks();
  });

  it('should store and retrieve knowledge', async () => {
    const knowledge = 'Clean code principles include: DRY, SOLID principles, and meaningful naming.';
    const category = 'programming';
    const metadata = { category: 'best-practices' };

    const storedMemory = await memoryManager.storeKnowledge(knowledge, category, metadata);
    expect(storedMemory).toBeDefined();
    expect(storedMemory.id).toBeDefined();
  });

  it('should create memory associations', async () => {
    const memory1 = await memoryManager.storeKnowledge(
      'Vector databases are optimized for storing and retrieving high-dimensional vectors.',
      'databases',
      { type: 'definition' }
    );

    const memory2 = await memoryManager.storeKnowledge(
      'Semantic search uses vector embeddings to find similar content.',
      'search',
      { type: 'concept' }
    );

    const association = await memoryManager.createMemoryAssociation(
      memory1.id,
      memory2.id,
      { relationship: 'related-concept' }
    );

    expect(association).toBeDefined();
  });

  it('should integrate with AI provider', async () => {
    const provider = await createAIProvider({
      provider: 'openai',
      apiKey: 'test-key',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
    }, { enableMemory: true });

    const messages: Message[] = [
      { role: 'user', content: 'What are the key principles of clean code?' }
    ];

    const response = await provider.chat(messages);
    expect(response.content).toBe('Mocked response');
  });
});
