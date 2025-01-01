import { centralNexus } from '../CentralNexus';
import { useLogStore } from '../../../stores/logStore';
import { storageManager } from '../../storage/db';
import { JohnnyGoGetter } from '../JohnnyGoGetter';
import { SirExecutor } from '../SirExecutor';

// Mock stores
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

// Mock other dependencies
jest.mock('../../storage/db', () => ({
  storageManager: {
    initialize: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('../JohnnyGoGetter', () => ({
  JohnnyGoGetter: {
    initialize: jest.fn().mockResolvedValue(undefined),
    id: 'johnny-go-getter',
    name: 'Johnny Go Getter',
    status: 'active'
  }
}));

jest.mock('../SirExecutor', () => ({
  SirExecutor: {
    initialize: jest.fn().mockResolvedValue(undefined),
    id: 'sir-executor',
    name: 'Sir Executor',
    status: 'active'
  }
}));

describe('CentralNexus', () => {
  const mockLogStore = {
    addLog: jest.fn()
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock implementations
    (useLogStore.getState as jest.Mock).mockReturnValue(mockLogStore);
    (storageManager.initialize as jest.Mock).mockResolvedValue(undefined);
    (JohnnyGoGetter.initialize as jest.Mock).mockResolvedValue(undefined);
    (SirExecutor.initialize as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Basic Command Processing', () => {
    beforeEach(async () => {
      await centralNexus.initialize();
    });

    it('should process help command', async () => {
      const response = await centralNexus.processCommand('help');
      expect(response).toContain('Available commands:');
      expect(response).toContain('help:');
      expect(response).toContain('status:');
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          message: expect.stringContaining('Help command executed')
        })
      );
    });

    it('should process status command', async () => {
      const response = await centralNexus.processCommand('status');
      expect(response).toContain('System Status:');
      expect(response).toContain('Connected Agents:');
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          message: expect.stringContaining('Status command executed')
        })
      );
    });

    it('should process version command', async () => {
      const response = await centralNexus.processCommand('version');
      expect(response).toBe('Virtual OS v0.1.0');
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          message: expect.stringContaining('Version command executed')
        })
      );
    });

    it('should handle unknown commands', async () => {
      const response = await centralNexus.processCommand('unknown');
      expect(response).toContain('Unknown command:');
      expect(mockLogStore.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          message: expect.stringContaining('Unknown command:')
        })
      );
    });
  });

  describe('System Initialization', () => {
    it('should initialize successfully', async () => {
      await centralNexus.initialize();
      expect(storageManager.initialize).toHaveBeenCalled();
      expect(JohnnyGoGetter.initialize).toHaveBeenCalled();
      expect(SirExecutor.initialize).toHaveBeenCalled();
      expect(centralNexus.isInitialized()).toBe(true);
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Storage error');
      (storageManager.initialize as jest.Mock).mockRejectedValueOnce(error);
      
      await expect(centralNexus.initialize()).rejects.toThrow('Storage error');
      expect(centralNexus.isInitialized()).toBe(false);
    });
  });
});
