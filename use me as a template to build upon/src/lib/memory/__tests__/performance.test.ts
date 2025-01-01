import { memoryManager } from '../MemoryManager';
import { useLogStore } from '../../../stores/logStore';
import { useConfigStore } from '../../../stores/testConfigStore';

// Mock dependencies
jest.mock('../../../stores/logStore');
jest.mock('../../../stores/testConfigStore', () => ({
  useConfigStore: {
    getState: jest.fn().mockReturnValue({
      config: {
        system: { environment: 'testing' },
        ai: { apiKey: 'test-key' }
      }
    })
  }
}));

describe('Memory System Performance Tests', () => {
  const mockLogStore = {
    addLog: jest.fn()
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (useLogStore.getState as jest.Mock).mockReturnValue(mockLogStore);
    await memoryManager.initialize();
  });

  describe('Memory Operation Latency', () => {
    it('should maintain acceptable latency for single operations', async () => {
      const operations = [
        {
          name: 'store conversation',
          fn: () => memoryManager.storeConversationMemory([
            { role: 'user', content: 'test message' }
          ], { type: 'test' })
        },
        {
          name: 'retrieve memories',
          fn: () => memoryManager.retrieveRelevantMemories('test query')
        },
        {
          name: 'store knowledge',
          fn: () => memoryManager.storeKnowledge('test knowledge', 'test-topic')
        },
        {
          name: 'search knowledge',
          fn: () => memoryManager.searchKnowledge('test query')
        }
      ];

      for (const op of operations) {
        const startTime = Date.now();
        await op.fn();
        const endTime = Date.now();
        const latency = endTime - startTime;

        // Each operation should complete within 100ms
        expect(latency).toBeLessThan(100);
      }
    });
  });

  describe('Memory Operation Throughput', () => {
    it('should handle high-volume operations efficiently', async () => {
      const operationCount = 1000;
      const batchSize = 50;
      const maxBatchTime = 1000; // 1 second

      // Create test data
      const operations = Array(operationCount).fill(0).map((_, i) => ({
        messages: [{ role: 'user', content: `test message ${i}` }],
        metadata: { type: 'test', index: i }
      }));

      // Process in batches
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        const startTime = Date.now();

        await Promise.all(batch.map(op => 
          memoryManager.storeConversationMemory(op.messages, op.metadata)
        ));

        const endTime = Date.now();
        const batchTime = endTime - startTime;

        // Each batch should complete within maxBatchTime
        expect(batchTime).toBeLessThan(maxBatchTime);
      }
    });
  });

  describe('Large Dataset Handling', () => {
    it('should handle large memory entries efficiently', async () => {
      // Create a large memory entry (100KB)
      const largeContent = 'x'.repeat(100 * 1024);
      const startTime = Date.now();

      await memoryManager.storeKnowledge(largeContent, 'large-entry');
      const stored = await memoryManager.searchKnowledge('x', 'large-entry');

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Operations on large data should complete within 1 second
      expect(processingTime).toBeLessThan(1000);
      expect(stored.length).toBeGreaterThan(0);
    });

    it('should efficiently search through large datasets', async () => {
      // Store 1000 entries
      const entries = Array(1000).fill(0).map((_, i) => ({
        content: `test content ${i} ${Math.random().toString(36)}`,
        topic: `topic-${i % 10}`
      }));

      await Promise.all(entries.map(entry =>
        memoryManager.storeKnowledge(entry.content, entry.topic)
      ));

      const startTime = Date.now();
      const results = await memoryManager.searchKnowledge('test');
      const searchTime = Date.now() - startTime;

      // Search should complete within 500ms
      expect(searchTime).toBeLessThan(500);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent read/write operations', async () => {
      const operationCount = 100;
      const operations = Array(operationCount).fill(0).map((_, i) => {
        if (i % 2 === 0) {
          // Write operation
          return memoryManager.storeConversationMemory([
            { role: 'user', content: `message ${i}` }
          ], { type: 'test' });
        } else {
          // Read operation
          return memoryManager.retrieveRelevantMemories(`query ${i}`);
        }
      });

      const startTime = Date.now();
      await Promise.all(operations);
      const totalTime = Date.now() - startTime;

      // All concurrent operations should complete within 2 seconds
      expect(totalTime).toBeLessThan(2000);
    });

    it('should maintain data consistency under concurrent operations', async () => {
      const writeCount = 50;
      const writes = Array(writeCount).fill(0).map((_, i) => ({
        messages: [{ role: 'user', content: `concurrent message ${i}` }],
        metadata: { type: 'test', id: `msg-${i}` }
      }));

      // Perform concurrent writes
      await Promise.all(writes.map(w => 
        memoryManager.storeConversationMemory(w.messages, w.metadata)
      ));

      // Verify all writes
      const verificationPromises = writes.map(async w => {
        const memories = await memoryManager.retrieveRelevantMemories(w.messages[0].content);
        return memories.some(m => m.content.includes(w.messages[0].content));
      });

      const verificationResults = await Promise.all(verificationPromises);
      expect(verificationResults.every(r => r)).toBe(true);
    });
  });

  describe('Memory System Stress Test', () => {
    it('should maintain performance under sustained load', async () => {
      const duration = 5000; // 5 seconds
      const startTime = Date.now();
      let operationCount = 0;
      const results: number[] = [];

      while (Date.now() - startTime < duration) {
        const opStartTime = Date.now();
        
        await Promise.all([
          memoryManager.storeConversationMemory([
            { role: 'user', content: `stress test message ${operationCount}` }
          ], { type: 'stress-test' }),
          memoryManager.retrieveRelevantMemories('stress test'),
          memoryManager.searchKnowledge('test')
        ]);

        const opEndTime = Date.now();
        results.push(opEndTime - opStartTime);
        operationCount++;
      }

      // Calculate performance metrics
      const avgLatency = results.reduce((a, b) => a + b, 0) / results.length;
      const maxLatency = Math.max(...results);
      const p95Latency = results.sort((a, b) => a - b)[Math.floor(results.length * 0.95)];

      // Performance assertions
      expect(avgLatency).toBeLessThan(100); // Average latency under 100ms
      expect(maxLatency).toBeLessThan(200); // Max latency under 200ms
      expect(p95Latency).toBeLessThan(150); // 95th percentile under 150ms
      expect(operationCount).toBeGreaterThan(100); // Should complete many operations
    });
  });
});
