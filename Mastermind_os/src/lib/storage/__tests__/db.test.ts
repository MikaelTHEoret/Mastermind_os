import { storageManager } from '../db';

// Mock indexedDB
const mockAdd = jest.fn().mockImplementation(() => Promise.resolve());
const mockGetAll = jest.fn().mockImplementation(() => Promise.resolve([]));
const mockClose = jest.fn().mockImplementation(() => Promise.resolve());
const mockCreateObjectStore = jest.fn().mockReturnValue({
  createIndex: jest.fn(),
});

const mockDB = {
  close: mockClose,
  add: mockAdd,
  transaction: jest.fn(() => ({
    store: {
      index: jest.fn(() => ({
        getAll: mockGetAll
      }))
    }
  })),
  createObjectStore: mockCreateObjectStore,
  objectStoreNames: {
    contains: jest.fn().mockReturnValue(false),
  },
};

const mockOpenDB = jest.fn();
jest.mock('idb', () => ({
  openDB: (...args: any[]) => mockOpenDB(...args),
}));

// Mock log store with proper initialization
const mockLogStore = {
  addLog: jest.fn(),
};

jest.mock('../../../stores/logStore', () => ({
  useLogStore: {
    getState: () => mockLogStore,
  },
}));

describe('StorageManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenDB.mockResolvedValue(mockDB);
    
    // Reset the instance state
    (storageManager as any).initialized = false;
    (storageManager as any).db = null;
    (storageManager as any).initPromise = null;
  });

  afterEach(async () => {
    try {
      await storageManager.close();
    } catch (error) {
      // Ignore close errors in cleanup
    }
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when getInstance is called multiple times', () => {
      const instance1 = storageManager;
      const instance2 = storageManager;
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully on first attempt', async () => {
      await storageManager.initialize();
      expect(mockOpenDB).toHaveBeenCalledTimes(1);
      expect(mockLogStore.addLog).toHaveBeenCalledWith({
        source: 'StorageManager',
        type: 'info',
        message: 'Storage system initialized successfully'
      });
    });

    it('should retry initialization on failure', async () => {
      // First call fails, second succeeds
      mockOpenDB
        .mockRejectedValueOnce(new Error('DB Error'))
        .mockResolvedValueOnce(mockDB);

      await storageManager.initialize();

      expect(mockOpenDB).toHaveBeenCalledTimes(2);
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'StorageManager',
          type: 'error',
          message: expect.stringContaining('Failed to initialize storage (attempt 1)')
        })
      );
    });

    it('should throw after max retries', async () => {
      // All calls fail
      mockOpenDB.mockRejectedValue(new Error('DB Error'));

      await expect(storageManager.initialize()).rejects.toThrow(
        'Failed to initialize storage system after 3 attempts'
      );
      expect(mockOpenDB).toHaveBeenCalledTimes(3);
    });
  });

  describe('Database Operations', () => {
    beforeEach(async () => {
      mockOpenDB.mockResolvedValue(mockDB);
      await storageManager.initialize();
    });

    it('should store chat message', async () => {
      const message = {
        role: 'user' as const,
        content: 'test message',
        tokens: 10
      };

      const result = await storageManager.storeChatMessage(message);
      expect(mockAdd).toHaveBeenCalledWith('chatMessages', expect.objectContaining({
        role: message.role,
        content: message.content,
        tokens: message.tokens,
        id: expect.any(String),
        timestamp: expect.any(Number),
        metadata: expect.any(Object)
      }));
      expect(result).toMatchObject({
        ...message,
        id: expect.any(String),
        timestamp: expect.any(Number),
        metadata: expect.any(Object)
      });
    });

    it('should retrieve chat messages by role', async () => {
      const messages = [
        { id: 'test-uuid', role: 'user', content: 'test', tokens: 5 }
      ];
      mockGetAll.mockResolvedValueOnce(messages);

      const result = await storageManager.getChatMessagesByRole('user');
      expect(result).toEqual(messages);
    });
  });

  describe('Cleanup', () => {
    beforeEach(async () => {
      mockOpenDB.mockResolvedValue(mockDB);
      await storageManager.initialize();
    });

    it('should close database connection', async () => {
      await storageManager.close();

      expect(mockClose).toHaveBeenCalled();
      expect(mockLogStore.addLog).toHaveBeenCalledWith({
        source: 'StorageManager',
        type: 'info',
        message: 'Storage system closed successfully'
      });
    });

    it('should handle close when not initialized', async () => {
      (storageManager as any).initialized = false;
      await storageManager.close();
      expect(mockClose).not.toHaveBeenCalled();
    });
  });
});
