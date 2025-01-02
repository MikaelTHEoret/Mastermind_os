import { centralNexus } from '../CentralNexus';
import { memoryManager } from '../../memory/MemoryManager';
import { useLogStore } from '../../../stores/logStore';
import { storageManager } from '../../storage/db';

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

jest.mock('../../storage/db', () => ({
  storageManager: {
    initialize: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock MemoryManager
jest.mock('../../memory/MemoryManager', () => {
  const mockMemoryManager = {
    initialize: jest.fn().mockResolvedValue(undefined),
    storeConversationMemory: jest.fn().mockResolvedValue({ id: 'test-memory-id' }),
    retrieveRelevantMemories: jest.fn().mockResolvedValue([]),
    storeKnowledge: jest.fn().mockResolvedValue({ id: 'test-knowledge-id' }),
    searchKnowledge: jest.fn().mockResolvedValue([])
  };
  return { memoryManager: mockMemoryManager };
});

describe('CentralNexus Integration Tests', () => {
  const mockLogStore = {
    addLog: jest.fn()
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    (useLogStore.getState as jest.Mock).mockReturnValue(mockLogStore);
    await centralNexus.initialize();
  });

  describe('Memory Integration', () => {
    it('should handle memory store initialization failure', async () => {
      // Simulate memory store initialization failure
      (memoryManager.initialize as jest.Mock).mockRejectedValueOnce(new Error('Memory store error'));
      
      // Reset nexus to test initialization
      (centralNexus as any).initialized = false;
      
      await expect(centralNexus.initialize()).rejects.toThrow('Memory store error');
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('Memory store error')
        })
      );
    });

    it('should store command history in memory', async () => {
      const command = 'test command';
      await centralNexus.processCommand(command);
      
      expect(memoryManager.storeConversationMemory).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: command
          })
        ]),
        expect.objectContaining({
          type: 'command',
          timestamp: expect.any(Number)
        })
      );
    });

    it('should retrieve relevant command history', async () => {
      // Setup mock to return relevant memories
      (memoryManager.retrieveRelevantMemories as jest.Mock).mockResolvedValueOnce([
        {
          id: 'memory-1',
          type: 'command',
          content: 'previous similar command',
          timestamp: Date.now() - 1000
        }
      ]);

      const command = 'test command';
      await centralNexus.processCommand(command);

      expect(memoryManager.retrieveRelevantMemories).toHaveBeenCalledWith(
        command,
        expect.any(Number)
      );
    });

    it('should handle memory store errors gracefully', async () => {
      // Simulate memory store error
      (memoryManager.storeConversationMemory as jest.Mock)
        .mockRejectedValueOnce(new Error('Storage error'));

      const command = 'test command';
      const response = await centralNexus.processCommand(command);

      // Command should still be processed despite memory error
      expect(response).not.toContain('Error');
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('Storage error')
        })
      );
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent command processing', async () => {
      const startTime = Date.now();
      
      // Process multiple commands concurrently
      const commands = Array(10).fill(0).map((_, i) => `test command ${i}`);
      await Promise.all(commands.map(cmd => centralNexus.processCommand(cmd)));
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Verify processing time is reasonable (less than 1 second for 10 commands)
      expect(processingTime).toBeLessThan(1000);
      
      // Verify all commands were processed
      expect(mockLogStore.addLog).toHaveBeenCalledTimes(expect.any(Number));
    });

    it('should maintain performance under load', async () => {
      const iterations = 5;
      const commandsPerIteration = 20;
      const processingTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        // Process batch of commands
        const commands = Array(commandsPerIteration)
          .fill(0)
          .map((_, j) => `test command ${i}-${j}`);
        
        await Promise.all(commands.map(cmd => centralNexus.processCommand(cmd)));
        
        const endTime = Date.now();
        processingTimes.push(endTime - startTime);
      }

      // Calculate average processing time per batch
      const avgProcessingTime = 
        processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
      
      // Verify performance remains consistent
      const maxDeviation = Math.max(...processingTimes) - Math.min(...processingTimes);
      expect(maxDeviation).toBeLessThan(avgProcessingTime * 0.5); // Max 50% deviation
    });

    it('should handle memory-intensive operations', async () => {
      // Simulate memory-intensive operation
      const largeDataSet = Array(1000)
        .fill(0)
        .map((_, i) => ({
          id: `data-${i}`,
          content: `Large content string ${i} ${'x'.repeat(1000)}`
        }));

      const startTime = Date.now();
      
      // Process large dataset
      for (const data of largeDataSet) {
        await centralNexus.processCommand(`process ${data.id}`);
      }

      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Verify memory usage remains reasonable
      const resourceMetrics = (centralNexus as any).core.resourceUsage;
      expect(resourceMetrics.memory).toBeLessThan(90); // Memory usage should stay under 90%
      
      // Verify processing time scales linearly
      const timePerOperation = processingTime / largeDataSet.length;
      expect(timePerOperation).toBeLessThan(10); // Less than 10ms per operation
    });
  });

  describe('Error Recovery', () => {
    it('should handle and recover from agent failures', async () => {
      // Simulate agent failure
      const agent = centralNexus.getAgent('johnny-go-getter');
      if (agent) {
        agent.status = 'error';
      }

      // Process command to trigger recovery
      await centralNexus.processCommand('test command');

      // Verify agent was recovered
      const recoveredAgent = centralNexus.getAgent('johnny-go-getter');
      expect(recoveredAgent?.status).toBe('active');
    });

    it('should handle system overload', async () => {
      // Simulate system overload
      const resourceMetrics = (centralNexus as any).core.resourceUsage;
      resourceMetrics.cpu = 95;
      resourceMetrics.memory = 90;

      // Process high-priority command during overload
      const response = await centralNexus.processCommand('important command', 9);

      // Verify high-priority command was processed
      expect(response).not.toContain('Error');

      // Verify system throttling was activated
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          message: expect.stringContaining('Resource throttling activated')
        })
      );
    });

    it('should recover from initialization failures', async () => {
      // Reset initialization state
      (centralNexus as any).initialized = false;
      (centralNexus as any).initializationAttempts = 0;

      // Simulate first initialization failure
      (storageManager.initialize as jest.Mock)
        .mockRejectedValueOnce(new Error('Storage error'));

      // Attempt initialization
      await centralNexus.initialize();

      // Verify retry was successful
      expect(centralNexus.isInitialized()).toBe(true);
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          message: expect.stringContaining('Central Nexus initialized successfully')
        })
      );
    });
  });
});
