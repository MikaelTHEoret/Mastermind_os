import { memoryManager } from '../MemoryManager';
import { IndexedDBStore } from '../IndexedDBStore';
import { useLogStore } from '../../../stores/logStore';
import { AppError } from '../../utils/errors';

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

// Mock IndexedDBStore
jest.mock('../IndexedDBStore');

describe('Memory System Error Recovery Tests', () => {
  const mockLogStore = {
    addLog: jest.fn()
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (useLogStore.getState as jest.Mock).mockReturnValue(mockLogStore);
    await memoryManager.initialize();
  });

  afterEach(async () => {
    await memoryManager.close();
  });

  describe('Lifecycle Management', () => {
    it('should properly initialize and close resources', async () => {
      const mockStore = {
        initialize: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
        add: jest.fn(),
        search: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        clear: jest.fn()
      };

      (IndexedDBStore as jest.Mock).mockImplementation(() => mockStore);

      // Test initialization
      await memoryManager.initialize();
      expect(mockStore.initialize).toHaveBeenCalled();
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          message: expect.stringContaining('initialized successfully')
        })
      );

      // Test cleanup
      await memoryManager.close();
      expect(mockStore.close).toHaveBeenCalled();
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          message: expect.stringContaining('closed successfully')
        })
      );
    });

    it('should handle initialization failures gracefully', async () => {
      const mockStore = {
        initialize: jest.fn().mockRejectedValue(new Error('Init failed')),
        close: jest.fn().mockResolvedValue(undefined),
        add: jest.fn(),
        search: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        clear: jest.fn()
      };

      (IndexedDBStore as jest.Mock).mockImplementation(() => mockStore);
      (memoryManager as any).initialized = false;

      await expect(memoryManager.initialize()).rejects.toThrow('Init failed');
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('Failed to initialize')
        })
      );
    });

    it('should handle cleanup failures gracefully', async () => {
      const mockStore = {
        initialize: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockRejectedValue(new Error('Cleanup failed')),
        add: jest.fn(),
        search: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        clear: jest.fn()
      };

      (IndexedDBStore as jest.Mock).mockImplementation(() => mockStore);

      await expect(memoryManager.close()).rejects.toThrow('Cleanup failed');
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('Failed to close')
        })
      );
    });

    it('should clear intervals on cleanup', async () => {
      const mockStore = {
        initialize: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
        add: jest.fn(),
        search: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        clear: jest.fn()
      };

      (IndexedDBStore as jest.Mock).mockImplementation(() => mockStore);
      
      // Initialize to set up intervals
      await memoryManager.initialize();
      
      // Verify intervals are set
      expect((memoryManager as any).healthCheckInterval).toBeDefined();
      expect((memoryManager as any).maintenanceInterval).toBeDefined();
      expect((memoryManager as any).backupInterval).toBeDefined();

      // Close and verify intervals are cleared
      await memoryManager.close();
      expect((memoryManager as any).healthCheckInterval).toBeUndefined();
      expect((memoryManager as any).maintenanceInterval).toBeUndefined();
      expect((memoryManager as any).backupInterval).toBeUndefined();
    });
  });

  describe('Storage Corruption Recovery', () => {
    it('should recover from corrupted memory entries', async () => {
      // Mock a corrupted entry in the store
      const corruptedEntry = {
        id: 'corrupted-1',
        type: 'conversation',
        content: 'test content',
        timestamp: Date.now(),
        embedding: [NaN, null, undefined] // Corrupted embedding
      };

      // Setup mock implementation
      (IndexedDBStore as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined),
        add: jest.fn().mockResolvedValue({ id: 'test-id' }),
        search: jest.fn().mockImplementation(async (query) => {
          if (query.metadata?.id === 'corrupted-1') {
            return [corruptedEntry];
          }
          return [];
        }),
        update: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined)
      }));

      // Attempt to retrieve the corrupted entry
      const result = await memoryManager.retrieveRelevantMemories('test content');

      // Verify recovery process
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          message: expect.stringContaining('Corrupted entries detected')
        })
      );
      expect(result).toHaveLength(0); // Corrupted entry should be excluded
    });

    it('should handle and recover from storage initialization failures', async () => {
      // Reset memory manager
      (memoryManager as any).initialized = false;

      // Mock storage initialization failure
      (IndexedDBStore as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn()
          .mockRejectedValueOnce(new Error('Storage initialization failed'))
          .mockResolvedValueOnce(undefined),
        add: jest.fn().mockResolvedValue({ id: 'test-id' })
      }));

      // Attempt initialization
      await memoryManager.initialize();

      // Verify recovery attempt
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('Storage initialization failed')
        })
      );
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          message: expect.stringContaining('Retrying initialization')
        })
      );
    });
  });

  describe('Network Failure Handling', () => {
    it('should handle AI provider failures gracefully', async () => {
      // Mock AI provider failure
      const mockError = new Error('AI service unavailable');
      (memoryManager as any).aiProvider.getEmbedding = jest
        .fn()
        .mockRejectedValue(mockError);

      // Attempt to store memory
      await memoryManager.storeConversationMemory([
        { role: 'user', content: 'test message' }
      ], { type: 'test' });

      // Verify error handling
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('AI service unavailable')
        })
      );
    });

    it('should implement retry mechanism for failed operations', async () => {
      // Mock intermittent failures
      let attempts = 0;
      (IndexedDBStore as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined),
        add: jest.fn().mockImplementation(async () => {
          attempts++;
          if (attempts === 1) {
            throw new Error('Temporary failure');
          }
          return { id: 'test-id' };
        })
      }));

      // Attempt operation
      const result = await memoryManager.storeConversationMemory([
        { role: 'user', content: 'test message' }
      ], { type: 'test' });

      // Verify retry mechanism
      expect(attempts).toBe(2);
      expect(result).toBeDefined();
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          message: expect.stringContaining('Retrying operation')
        })
      );
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data integrity during concurrent operations', async () => {
      const writeOperations = Array(10).fill(0).map((_, i) => ({
        messages: [{ role: 'user', content: `message ${i}` }],
        metadata: { id: `msg-${i}` }
      }));

      // Simulate some operations failing
      (IndexedDBStore as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined),
        add: jest.fn().mockImplementation(async (data) => {
          if (Math.random() < 0.3) { // 30% failure rate
            throw new Error('Random failure');
          }
          return { id: data.metadata.id };
        }),
        search: jest.fn().mockResolvedValue([])
      }));

      // Attempt concurrent writes
      const results = await Promise.allSettled(
        writeOperations.map(op => 
          memoryManager.storeConversationMemory(op.messages, op.metadata)
        )
      );

      // Verify results
      const successfulWrites = results.filter(r => r.status === 'fulfilled');
      const failedWrites = results.filter(r => r.status === 'rejected');

      expect(successfulWrites.length + failedWrites.length).toBe(writeOperations.length);
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('Failed to store memory')
        })
      );
    });

    it('should detect and handle data inconsistencies', async () => {
      // Mock inconsistent data state
      const inconsistentData = [
        { id: 'test-1', content: 'valid content', embedding: [0.1, 0.2] },
        { id: 'test-2', content: '', embedding: null }, // Invalid
        { id: 'test-3', content: 'valid content', embedding: undefined }, // Invalid
        { id: 'test-4', content: 'valid content', embedding: [0.3, 0.4] }
      ];

      (IndexedDBStore as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined),
        search: jest.fn().mockResolvedValue(inconsistentData),
        delete: jest.fn().mockResolvedValue(undefined),
        add: jest.fn().mockResolvedValue({ id: 'test-id' })
      }));

      // Trigger data verification
      await (memoryManager as any).verifyDataIntegrity();

      // Verify cleanup actions
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          message: expect.stringContaining('Invalid entries detected')
        })
      );
    });
  });

  describe('System Recovery', () => {
    it('should recover from catastrophic failures', async () => {
      // Simulate catastrophic failure
      (IndexedDBStore as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn()
          .mockRejectedValueOnce(new Error('Catastrophic failure'))
          .mockResolvedValueOnce(undefined),
        clear: jest.fn().mockResolvedValue(undefined),
        add: jest.fn().mockResolvedValue({ id: 'test-id' })
      }));

      // Reset memory manager
      (memoryManager as any).initialized = false;

      // Attempt initialization
      await expect(memoryManager.initialize()).resolves.not.toThrow();

      // Verify recovery process
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          message: expect.stringContaining('Recovery complete')
        })
      );
    });

    it('should handle partial system failures', async () => {
      // Mock partial system failure
      const error = new AppError('Partial system failure', 'MemoryManager');
      (IndexedDBStore as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined),
        add: jest.fn().mockRejectedValue(error)
      }));

      // Attempt operation during partial failure
      await expect(memoryManager.storeConversationMemory([
        { role: 'user', content: 'test message' }
      ], { type: 'test' })).rejects.toThrow('Partial system failure');

      // Verify error handling and recovery attempt
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('Partial system failure')
        })
      );
    });
  });
});
