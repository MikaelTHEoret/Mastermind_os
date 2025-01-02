import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { memoryManager } from '../MemoryManager';
import { createAIProvider } from '../../ai/factory';
import type { Message, AIProvider, AIConfig, CreateAIProviderOptions } from '../../ai/types';

type InitializeType = () => Promise<void>;
type ChatType = (messages: Message[]) => Promise<Message>;
type GenerateEmbeddingType = (text: string) => Promise<number[]>;
type CleanupType = () => Promise<void>;

// Create a mock AIProvider implementation
const mockAIProvider = {
  initialize: jest.fn<InitializeType>().mockResolvedValue(undefined),
  chat: jest.fn<ChatType>().mockResolvedValue({ 
    role: 'assistant', 
    content: 'Mocked response' 
  } as Message),
  generateEmbedding: jest.fn<GenerateEmbeddingType>().mockResolvedValue(new Array(384).fill(0)),
  cleanup: jest.fn<CleanupType>().mockResolvedValue(undefined)
} as const;

// Mock the factory function
jest.mock('../../ai/factory', () => ({
  createAIProvider: jest.fn().mockImplementation(async () => mockAIProvider)
}));

describe('Memory System', () => {
  beforeEach(async () => {
    // Clear any previous state
    jest.clearAllMocks();
    try {
      await memoryManager.initialize();
    } catch (error) {
      console.error('Failed to initialize memory manager:', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      // Clean up after each test
      await memoryManager.close();
    } catch (error) {
      console.error('Failed to cleanup memory manager:', error);
    }
  });

  it('should store and retrieve knowledge', async () => {
    const knowledge = 'Clean code principles include: DRY, SOLID principles, and meaningful naming.';
    const topic = 'programming';
    const metadata = { category: 'best-practices' };

    const storedMemory = await memoryManager.storeKnowledge(knowledge, topic, metadata);
    expect(storedMemory).toBeDefined();
    expect(storedMemory.id).toBeDefined();

    // Verify we can retrieve the stored knowledge
    const retrievedMemories = await memoryManager.searchKnowledge(knowledge, topic, 1);
    expect(retrievedMemories).toHaveLength(1);
    expect(retrievedMemories[0].content).toBe(knowledge);
    expect(retrievedMemories[0].metadata.topic).toBe(topic);
    expect(retrievedMemories[0].metadata.category).toBe(metadata.category);
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

    await memoryManager.createMemoryAssociation(
      memory1.id,
      memory2.id,
      { relationship: 'related-concept' }
    );

    // Verify we can retrieve the associations
    const associations = await memoryManager.getAssociatedMemories(memory1.id);
    expect(associations).toHaveLength(1);
    expect(associations[0].id).toBe(memory2.id);
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
    expect(response.role).toBe('assistant');
    expect(createAIProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'openai',
        model: 'gpt-3.5-turbo'
      }),
      expect.objectContaining({ enableMemory: true })
    );
  });

  it('should handle errors gracefully', async () => {
    // Test invalid knowledge storage
    await expect(
      memoryManager.storeKnowledge('', '', {})
    ).rejects.toThrow();

    // Test invalid association creation
    await expect(
      memoryManager.createMemoryAssociation('invalid-id-1', 'invalid-id-2', {})
    ).rejects.toThrow();

    // Test retrieving non-existent memories
    const nonExistentMemories = await memoryManager.searchKnowledge('non-existent');
    expect(nonExistentMemories).toHaveLength(0);
  });

  it('should retrieve relevant memories', async () => {
    // Store some test memories
    await memoryManager.storeKnowledge(
      'JavaScript is a dynamic programming language.',
      'programming',
      { language: 'javascript' }
    );

    await memoryManager.storeKnowledge(
      'Python is known for its readability.',
      'programming',
      { language: 'python' }
    );

    // Search for relevant memories
    const memories = await memoryManager.retrieveRelevantMemories('Tell me about JavaScript');
    expect(memories.length).toBeGreaterThan(0);
    expect(memories[0].metadata.language).toBe('javascript');
  });

  it('should handle conversation summaries', async () => {
    const conversation = [
      { role: 'user', content: 'How do I write clean code?' },
      { role: 'assistant', content: 'Follow SOLID principles and write meaningful names.' },
      { role: 'user', content: 'Can you explain SOLID?' }
    ] as Message[];

    // Test conversation summarization
    const summary = await memoryManager.summarizeConversation(conversation);
    expect(summary).toBeDefined();
    expect(typeof summary).toBe('string');

    // Store conversation memory
    const storedMemory = await memoryManager.storeConversationMemory(conversation);
    expect(storedMemory).toBeDefined();
    expect(storedMemory.type).toBe('conversation');
    expect(storedMemory.metadata.messageCount).toBe(3);
  });
});
