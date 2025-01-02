import { useLogStore } from '../../stores/logStore';
import { validatePath } from '../fs/permissions';
import { networkManager } from '../network/networkManager';

interface SystemOperation {
  type: 'file' | 'network' | 'process';
  action: string;
  params: Record<string, any>;
}

class SystemAccessManager {
  private logger = useLogStore.getState();
  private operationHistory: Map<string, number> = new Map();
  private readonly RATE_LIMIT = 1000; // 1 second between operations

  async executeOperation(operation: SystemOperation): Promise<boolean> {
    try {
      // Rate limiting check
      const lastExecution = this.operationHistory.get(operation.type) || 0;
      const now = Date.now();
      
      if (now - lastExecution < this.RATE_LIMIT) {
        throw new Error('Operation rate limit exceeded');
      }

      // Validate operation
      await this.validateOperation(operation);

      // Execute operation
      const result = await this.performOperation(operation);

      // Update operation history
      this.operationHistory.set(operation.type, now);

      // Log success
      this.logger.addLog({
        source: 'SystemAccess',
        type: 'info',
        message: `Operation completed: ${operation.type}/${operation.action}`
      });

      return result;
    } catch (error) {
      this.logger.addLog({
        source: 'SystemAccess',
        type: 'error',
        message: `Operation failed: ${error.message}`
      });
      throw error;
    }
  }

  private async validateOperation(operation: SystemOperation): Promise<void> {
    switch (operation.type) {
      case 'file':
        if (!validatePath(operation.params.path, {
          read: true,
          write: operation.action === 'write',
          allowedPaths: ['/home/project'],
          blockedPaths: ['/etc', '/usr', '/var']
        })) {
          throw new Error('Invalid file path');
        }
        break;

      case 'network':
        const allowedPorts = [80, 443, 3000, 5000, 8080];
        if (!allowedPorts.includes(operation.params.port)) {
          throw new Error('Invalid port');
        }
        break;

      case 'process':
        const allowedCommands = ['node', 'npm', 'git'];
        if (!allowedCommands.includes(operation.params.command)) {
          throw new Error('Invalid command');
        }
        break;

      default:
        throw new Error('Invalid operation type');
    }
  }

  private async performOperation(operation: SystemOperation): Promise<boolean> {
    switch (operation.type) {
      case 'file':
        // Implement file operations
        return true;

      case 'network':
        // Implement network operations
        return networkManager.executeOperation(operation);

      case 'process':
        // Implement process operations
        return true;

      default:
        return false;
    }
  }
}

export const systemAccess = new SystemAccessManager();