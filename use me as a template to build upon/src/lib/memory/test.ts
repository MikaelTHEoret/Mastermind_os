import { resolve } from 'path';
import { config } from 'dotenv';
import { createAIProvider } from '../ai/factory';
import { memoryManager } from './MemoryManager';
import type { Message } from '../ai/types';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });

if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

async function testMemorySystem() {
  console.log('Initializing memory-enabled AI provider...');
  
  const provider = await createAIProvider({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
  }, { enableMemory: true });

  // First conversation about programming
  console.log('\nFirst conversation about programming:');
  const programmingMessages: Message[] = [
    { role: 'user', content: 'What are the key principles of clean code?' }
  ];

  const response1 = await provider.chat(programmingMessages);
  console.log('Assistant:', response1.content);

  // Second conversation about a different topic
  console.log('\nSecond conversation about databases:');
  const databaseMessages: Message[] = [
    { role: 'user', content: 'What are the benefits of using vector databases?' }
  ];

  const response2 = await provider.chat(databaseMessages);
  console.log('Assistant:', response2.content);

  // Third conversation that should trigger memory recall about clean code
  console.log('\nThird conversation (should recall clean code context):');
  const recallMessages: Message[] = [
    { role: 'user', content: 'How can I improve my code organization?' }
  ];

  const response3 = await provider.chat(recallMessages);
  console.log('Assistant:', response3.content);

  // Store some explicit knowledge
  console.log('\nStoring explicit knowledge...');
  await memoryManager.storeKnowledge(
    'Clean code principles include: DRY (Don\'t Repeat Yourself), SOLID principles, and meaningful naming.',
    'programming',
    { category: 'best-practices' }
  );

  // Query related to stored knowledge
  console.log('\nQuerying with context from stored knowledge:');
  const knowledgeMessages: Message[] = [
    { role: 'user', content: 'What principle should I follow to avoid code duplication?' }
  ];

  const response4 = await provider.chat(knowledgeMessages);
  console.log('Assistant:', response4.content);

  // Test memory associations
  console.log('\nCreating and testing memory associations...');
  
  // Store related memories
  const memory1 = await memoryManager.storeKnowledge(
    'Vector databases are optimized for storing and retrieving high-dimensional vectors, making them ideal for semantic search.',
    'databases',
    { type: 'definition' }
  );

  const memory2 = await memoryManager.storeKnowledge(
    'Semantic search uses vector embeddings to find similar content based on meaning rather than exact matches.',
    'search',
    { type: 'concept' }
  );

  // Create association between the memories
  await memoryManager.createMemoryAssociation(
    memory1.id,
    memory2.id,
    { relationship: 'related-concept' }
  );

  // Query that should leverage the association
  console.log('\nQuerying with associated memories:');
  const associationMessages: Message[] = [
    { role: 'user', content: 'How do vector databases enable semantic search capabilities?' }
  ];

  const response5 = await provider.chat(associationMessages);
  console.log('Assistant:', response5.content);

  // Clean up
  await provider.cleanup?.();
}

// Check if file is being run directly
if (require.main === module) {
  // Initialize memory manager first
  memoryManager.initialize()
    .then(() => testMemorySystem())
    .catch(console.error);
}

export { testMemorySystem };
