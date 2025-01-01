import { storageManager } from '../db';
import { useLogStore } from '../../../stores/logStore';
import { AppError } from '../../utils/errors';

// Mock indexedDB
const mockAdd = jest.fn();
const mockGetAll = jest.fn();
const mockClose = jest.fn();
const mockCreateIndex = jest.fn();
const mockCreateObjectStore = jest.fn();

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
};

const mockOpenDB = jest.fn();
jest.mock('idb', () => ({
  openDB: (...args: any[]) => mockOpenDB(...args),
}));

// Mock log store
const mockLogStore = {
  addLog: jest.fn(),
};

jest.mock('../../../stores/logStore', () => ({
  useLogStore: {
    getState: jest.fn(),
  },
}));

describe('StorageManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLogStore.getState as jest.Mock).mockReturnValue(mockLogStore);
    mockOpenDB.mockResolvedValue(mockDB);
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
      mockOpenDB
        .mockRejectedValueOnce(new Error('DB Error'))
        .mockResolvedValueOnce(mockDB);

      await storageManager.initialize();

      expect(mockOpenDB).toHaveBeenCalledTimes(2);
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('Failed to initialize storage (attempt 1)')
        })
      );
    });

    it('should throw after max retries', async () => {
      const error = new Error('DB Error');
      mockOpenDB.mockRejectedValue(error);

      await expect(storageManager.initialize()).rejects.toThrow(AppError);
      expect(mockOpenDB).toHaveBeenCalledTimes(3); // MAX_RETRIES
    });
  });

  describe('Database Operations', () => {
    beforeEach(async () => {
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
        tokens: message.tokens
      }));
      expect(result).toMatchObject(message);
    });

    it('should retrieve chat messages by role', async () => {
      const messages = [{ id: '1', role: 'user' }];
      mockGetAll.mockResolvedValue(messages);

      const result = await storageManager.getChatMessagesByRole('user');
      expect(result).toEqual(messages);
    });
  });

  describe('Cleanup', () => {
    it('should close database connection', async () => {
      await storageManager.initialize();
      await storageManager.close();

      expect(mockClose).toHaveBeenCalled();
      expect(mockLogStore.addLog).toHaveBeenCalledWith({
        source: 'StorageManager',
        type: 'info',
        message: 'Storage system closed successfully'
      });
    });
  });
});
