import { useConfigStore } from '../../stores/configStore';
import { useLogStore } from '../../stores/logStore';
import { AppError } from '../utils/errors';
import { IndexedDBStore } from './IndexedDBStore';
import { MemoryEntry } from './types';
import { createAIProvider } from '../ai/factory';

export class MemoryManager {
  private store: IndexedDBStore;
  private logger = useLogStore.getState();
  private aiProvider: any;
  private healthCheckInterval?: NodeJS.Timeout;
  private maintenanceInterval?: NodeJS.Timeout;
  private backupInterval?: NodeJS.Timeout;

  private static instance: MemoryManager;
  private initialized = false;
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute
  private readonly MAINTENANCE_INTERVAL = 3600000; // 1 hour
  private readonly MAX_MEMORY_USAGE = 0.9; // 90% threshold
  
  private config = {
    summarizationThreshold: 10, // Messages before summarization
    relevanceThreshold: 0.7,    // Minimum similarity score
    maxContextMemories: 5,      // Max memories for context
    cleanupAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    deduplicationThreshold: 0.95, // Similarity threshold for duplicate detection
    backupInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    compressionThreshold: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    version: '1.0.0', // Schema version for migrations
    maxMemorySize: 50 * 1024 * 1024, // 50MB max size
    importanceThresholds: {
      high: 0.8,    // High importance threshold
      medium: 0.5,  // Medium importance threshold
      low: 0.3     // Low importance threshold
    }
  };

  private constructor() {
    this.store = new IndexedDBStore();
    const appConfig = useConfigStore.getState().config;
    
    // Override default memory config with app config if provided
    if (appConfig.memory) {
      this.config = {
        ...this.config,
        ...appConfig.memory
      };
    }
  }

  private async initializeAIProvider() {
    const appConfig = useConfigStore.getState().config;
    try {
      this.aiProvider = await createAIProvider(appConfig.ai, { 
        enableMemory: true,
        memoryConfig: this.config
      });
    } catch (error) {
      // Log the error but continue initialization
      this.logger.addLog({
        source: 'MemoryManager',
        type: 'warning',
        message: `Failed to initialize AI provider: ${error}. System will continue with limited functionality.`
      });
      
      // Create a mock AI provider that returns empty responses
      this.aiProvider = {
        chat: async () => ({ role: 'assistant', content: 'AI provider not available' }),
        generateEmbedding: async () => new Array(384).fill(0),
        initialize: async () => {},
        cleanup: async () => {}
      };
    }
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      await this.store.initialize();
      await this.initializeAIProvider();
      this.initialized = true;
      
      // Check and perform migrations if needed
      await this.checkSchemaVersion();
      
      // Setup periodic operations
      this.setupHealthChecks();
      this.setupMaintenance();
      this.setupBackups();
      
      this.logger.addLog({
        source: 'MemoryManager',
        type: 'info',
        message: 'Memory system initialized successfully'
      });
    } catch (error) {
      this.logger.addLog({
        source: 'MemoryManager',
        type: 'error',
        message: `Failed to initialize memory system: ${error}`
      });
      throw new AppError('Failed to initialize memory system', 'MemoryManager', error);
    }
  }

  private setupHealthChecks() {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.verifyStoreHealth();
      } catch (error) {
        this.logger.addLog({
          source: 'MemoryManager',
          type: 'error',
          message: `Health check failed: ${error}`
        });
      }
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private setupMaintenance() {
    this.maintenanceInterval = setInterval(async () => {
      try {
        await this.performMaintenance();
      } catch (error) {
        this.logger.addLog({
          source: 'MemoryManager',
          type: 'error',
          message: `Maintenance failed: ${error}`
        });
      }
    }, this.MAINTENANCE_INTERVAL);
  }

  private setupBackups() {
    this.backupInterval = setInterval(async () => {
      try {
        await this.createBackup('scheduled');
      } catch (error) {
        this.logger.addLog({
          source: 'MemoryManager',
          type: 'error',
          message: `Backup failed: ${error}`
        });
      }
    }, this.config.backupInterval);
  }

  private async verifyStoreHealth(): Promise<void> {
    this.ensureInitialized();

    try {
      // Check store connectivity
      const testEntry = await this.store.add({
        type: 'system',
        content: 'health_check',
        metadata: { timestamp: Date.now() }
      });

      await this.store.search({
        metadata: { id: testEntry.id },
        limit: 1
      });

      // Verify data integrity
      const corruptedEntries = await this.verifyDataIntegrity();
      if (corruptedEntries.length > 0) {
        this.logger.addLog({
          source: 'MemoryManager',
          type: 'warning',
          message: `Found ${corruptedEntries.length} corrupted entries`
        });
        await this.recoverCorruptedData(corruptedEntries);
      }

      // Check memory usage
      const memoryUsage = await this.getMemoryUsage();
      if (memoryUsage > this.MAX_MEMORY_USAGE) {
        this.logger.addLog({
          source: 'MemoryManager',
          type: 'warning',
          message: `High memory usage detected: ${Math.round(memoryUsage * 100)}%`
        });
        await this.optimizeStorage();
      }

      this.logger.addLog({
        source: 'MemoryManager',
        type: 'info',
        message: 'Store health check passed'
      });
    } catch (error) {
      throw new AppError('Store health check failed', 'MemoryManager', error);
    }
  }

  private async verifyDataIntegrity(): Promise<MemoryEntry[]> {
    const allEntries = await this.store.search({});
    const corruptedEntries: MemoryEntry[] = [];

    for (const entry of allEntries) {
      try {
        // Verify required fields
        if (!entry.id || !entry.type || !entry.content || !entry.timestamp) {
          corruptedEntries.push(entry);
          continue;
        }

        // Verify embedding integrity if exists
        if (entry.embedding && (!Array.isArray(entry.embedding) || 
            entry.embedding.some(val => typeof val !== 'number'))) {
          corruptedEntries.push(entry);
          continue;
        }

        // Verify associations integrity if exists
        if (entry.associations) {
          const invalidAssociations = await Promise.all(
            entry.associations.map(async id => {
              const exists = (await this.store.search({ 
                metadata: { id },
                limit: 1 
              })).length > 0;
              return !exists;
            })
          );
          if (invalidAssociations.some(invalid => invalid)) {
            corruptedEntries.push(entry);
          }
        }
      } catch {
        corruptedEntries.push(entry);
      }
    }

    return corruptedEntries;
  }

  private async recoverCorruptedData(corruptedEntries: MemoryEntry[]): Promise<void> {
    for (const entry of corruptedEntries) {
      try {
        // Try to recover from backup first
        const recovered = await this.recoverFromBackup(entry.id);
        if (recovered) continue;

        // If no backup, try to repair the entry
        const repairedEntry = await this.repairEntry(entry);
        if (repairedEntry) {
          await this.store.update(entry.id, repairedEntry);
        } else {
          // If repair fails, archive the corrupted entry
          await this.archiveCorruptedEntry(entry);
        }
      } catch (error) {
        this.logger.addLog({
          source: 'MemoryManager',
          type: 'error',
          message: `Failed to recover entry ${entry.id}: ${error}`
        });
      }
    }
  }

  private async repairEntry(entry: MemoryEntry): Promise<Partial<MemoryEntry> | null> {
    const repaired: Partial<MemoryEntry> = {};

    // Repair embedding if corrupted
    if (entry.embedding && (!Array.isArray(entry.embedding) || 
        entry.embedding.some(val => typeof val !== 'number'))) {
      try {
        repaired.embedding = await this.aiProvider.getEmbedding(entry.content);
      } catch {
        delete repaired.embedding;
      }
    }

    // Repair associations if corrupted
    if (entry.associations) {
      const validAssociations = await Promise.all(
        entry.associations.map(async id => {
          const exists = (await this.store.search({ 
            metadata: { id },
            limit: 1 
          })).length > 0;
          return exists ? id : null;
        })
      );
      repaired.associations = validAssociations.filter((id): id is string => id !== null);
    }

    // Return null if no repairs were possible
    return Object.keys(repaired).length > 0 ? repaired : null;
  }

  private async archiveCorruptedEntry(entry: MemoryEntry): Promise<void> {
    await this.store.add({
      type: 'system',
      content: JSON.stringify(entry),
      metadata: {
        type: 'corrupted_archive',
        originalId: entry.id,
        timestamp: Date.now()
      }
    });
    await this.store.delete(entry.id);
  }

  private async checkSchemaVersion(): Promise<void> {
    const versionEntry = await this.store.search({
      type: 'system',
      metadata: { type: 'schema_version' },
      limit: 1
    });

    const currentVersion = versionEntry[0]?.content || '0.0.0';
    if (currentVersion !== this.config.version) {
      await this.performMigration(currentVersion, this.config.version);
    }
  }

  private async performMigration(fromVersion: string, toVersion: string): Promise<void> {
    // Create backup before migration
    await this.createBackup('pre-migration');

    try {
      // Perform version-specific migrations
      if (fromVersion === '0.0.0') {
        await this.migrateFromInitial();
      }
      // Add more version-specific migrations as needed

      // Update schema version
      await this.store.add({
        type: 'system',
        content: toVersion,
        metadata: {
          type: 'schema_version',
          timestamp: Date.now()
        }
      });

      this.logger.addLog({
        source: 'MemoryManager',
        type: 'info',
        message: `Migration completed from ${fromVersion} to ${toVersion}`
      });
    } catch (error) {
      // Attempt to restore from backup
      await this.restoreFromBackup('pre-migration');
      throw new AppError('Migration failed', 'MemoryManager', error);
    }
  }

  private async migrateFromInitial(): Promise<void> {
    const allEntries = await this.store.search({});
    for (const entry of allEntries) {
      // Add new required fields
      await this.store.update(entry.id, {
        metadata: {
          ...entry.metadata,
          version: '1.0.0',
          migrated: true
        }
      });
    }
  }

  private async createBackup(type: string): Promise<void> {
    const allEntries = await this.store.search({});
    const backup = {
      timestamp: Date.now(),
      version: this.config.version,
      type,
      entries: allEntries
    };

    await this.store.add({
      type: 'system',
      content: JSON.stringify(backup),
      metadata: {
        type: 'backup',
        backupType: type,
        timestamp: backup.timestamp
      }
    });
  }

  private async recoverFromBackup(entryId: string): Promise<boolean> {
    // Find the latest backup
    const backups = await this.store.search({
      type: 'system',
      metadata: { type: 'backup' },
      limit: 1
    });

    if (backups.length === 0) return false;

    try {
      const backup = JSON.parse(backups[0].content);
      const entry = backup.entries.find((e: MemoryEntry) => e.id === entryId);
      
      if (entry) {
        await this.store.update(entryId, entry);
        return true;
      }
    } catch {
      return false;
    }

    return false;
  }

  private async restoreFromBackup(backupType: string): Promise<void> {
    const backup = await this.store.search({
      type: 'system',
      metadata: { 
        type: 'backup',
        backupType 
      },
      limit: 1
    });

    if (backup.length === 0) {
      throw new Error(`No backup found of type: ${backupType}`);
    }

    try {
      const { entries } = JSON.parse(backup[0].content);
      await this.store.clear();
      
      for (const entry of entries) {
        await this.store.add(entry);
      }
    } catch (error) {
      throw new AppError('Failed to restore from backup', 'MemoryManager', error);
    }
  }

  private async performMaintenance(): Promise<void> {
    this.ensureInitialized();

    try {
      // Clean up old system entries
      const oldSystemEntries = await this.store.search({
        type: 'system',
        metadata: {
          timestamp: { $lt: Date.now() - this.config.cleanupAge }
        }
      });

      for (const entry of oldSystemEntries) {
        await this.store.delete(entry.id);
      }

      // Optimize storage
      await this.optimizeStorage();

      this.logger.addLog({
        source: 'MemoryManager',
        type: 'info',
        message: 'Maintenance completed successfully'
      });
    } catch (error) {
      throw new AppError('Maintenance failed', 'MemoryManager', error);
    }
  }

  private async optimizeStorage(): Promise<void> {
    try {
      // Create backup before optimization
      await this.createBackup('pre-optimization');

      const allMemories = await this.store.search({});
      const now = Date.now();

      // Calculate importance scores
      const memoriesWithImportance = await Promise.all(
        allMemories.map(async memory => {
          const importance = await this.calculateImportance(memory);
          return { memory, importance };
        })
      );

      // Process memories based on importance and age
      for (const { memory, importance } of memoriesWithImportance) {
        const age = now - memory.timestamp;

        if (age > this.config.compressionThreshold) {
          if (importance < this.config.importanceThresholds.low) {
            // Delete low importance old memories
            await this.store.delete(memory.id);
          } else if (importance < this.config.importanceThresholds.medium) {
            // Compress medium importance old memories
            await this.compressMemory(memory);
          }
          // High importance memories are kept intact
        }
      }

      // Find and merge duplicates
      const duplicates = new Map<string, MemoryEntry[]>();
      for (const memory of allMemories) {
        const similarMemories = await this.store.search({
          text: memory.content,
          minRelevance: this.config.deduplicationThreshold,
          limit: 5
        });

        if (similarMemories.length > 1) {
          duplicates.set(memory.id, similarMemories);
        }
      }

      // Merge duplicates considering importance
      for (const [, similar] of duplicates) {
        if (similar.length > 1) {
          const sorted = await Promise.all(
            similar.map(async mem => ({
              memory: mem,
              importance: await this.calculateImportance(mem)
            }))
          );

          sorted.sort((a, b) => b.importance - a.importance);

          // Keep the most important version
          const [...remove] = sorted.slice(1);
          for (const { memory } of remove) {
            await this.store.delete(memory.id);
          }
        }
      }

      this.logger.addLog({
        source: 'MemoryManager',
        type: 'info',
        message: 'Storage optimization completed'
      });
    } catch (error) {
      throw new AppError('Storage optimization failed', 'MemoryManager', error);
    }
  }

  private async calculateImportance(memory: MemoryEntry): Promise<number> {
    let score = 0;

    // Factor 1: Usage frequency (from metadata)
    const accessCount = memory.metadata.accessCount || 0;
    score += Math.min(accessCount / 100, 0.3); // Max 0.3 from usage

    // Factor 2: Relevance to recent queries
    const recentQueries = await this.store.search({
      type: 'system',
      metadata: { 
        type: 'query',
        timestamp: { $gt: Date.now() - 7 * 24 * 60 * 60 * 1000 }
      }
    });
    
    let relevanceScore = 0;
    for (const query of recentQueries) {
      const similarity = await this.aiProvider.calculateSimilarity(
        memory.content,
        query.content
      );
      relevanceScore = Math.max(relevanceScore, similarity);
    }
    score += relevanceScore * 0.4; // Max 0.4 from relevance

    // Factor 3: Association count
    const associationCount = memory.associations?.length || 0;
    score += Math.min(associationCount / 10, 0.3); // Max 0.3 from associations

    return score;
  }

  private async compressMemory(memory: MemoryEntry): Promise<void> {
    try {
      // Generate a compressed version of the content
      const prompt = `Compress the following information while preserving key details:
      ${memory.content}`;

      const response = await this.aiProvider.chat([{
        role: 'user',
        content: prompt
      }]);

      // Update the memory with compressed content
      await this.store.update(memory.id, {
        content: response.content,
        metadata: {
          ...memory.metadata,
          compressed: true,
          originalLength: memory.content.length
        }
      });
    } catch (error) {
      throw new AppError('Failed to compress memory', 'MemoryManager', error);
    }
  }

  private async getMemoryUsage(): Promise<number> {
    // In a real implementation, this would check actual IndexedDB usage
    // For now, we'll simulate memory usage
    const allEntries = await this.store.search({ limit: 1000 });
    return allEntries.length / 1000; // Simulate usage ratio
  }

  async close(): Promise<void> {
    if (!this.initialized) return;

    try {
      // Clear intervals
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }
      if (this.maintenanceInterval) {
        clearInterval(this.maintenanceInterval);
      }
      if (this.backupInterval) {
        clearInterval(this.backupInterval);
      }

      // Close AI provider if it has a close method
      if (this.aiProvider && typeof this.aiProvider.close === 'function') {
        await this.aiProvider.close();
      }

      // Close store
      await this.store.close();

      // Reset state
      this.initialized = false;
      this.healthCheckInterval = undefined;
      this.maintenanceInterval = undefined;
      this.backupInterval = undefined;

      this.logger.addLog({
        source: 'MemoryManager',
        type: 'info',
        message: 'Memory system closed successfully'
      });
    } catch (error) {
      throw new AppError('Failed to close memory system', 'MemoryManager', error);
    }
  }

  private ensureInitialized() {
    if (!this.initialized) {
      throw new AppError('Memory system not initialized', 'MemoryManager');
    }
  }

  // Existing public methods remain unchanged
  async summarizeConversation(messages: { role: string; content: string }[]): Promise<string> {
    this.ensureInitialized();
    try {
      const prompt = `Summarize the following conversation concisely, capturing key points and context:
      
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Summary:`;

      const response = await this.aiProvider.chat([{
        role: 'user',
        content: prompt
      }]);

      return response.content;
    } catch (error) {
      throw new AppError('Failed to summarize conversation', 'MemoryManager', error);
    }
  }

  async storeConversationMemory(
    messages: { role: string; content: string }[],
    metadata: Record<string, any> = {}
  ): Promise<MemoryEntry> {
    this.ensureInitialized();
    try {
      const summary = await this.summarizeConversation(messages);

      return await this.store.add({
        type: 'conversation',
        content: summary,
        metadata: {
          ...metadata,
          messageCount: messages.length,
          lastMessage: messages[messages.length - 1].content
        }
      });
    } catch (error) {
      throw new AppError('Failed to store conversation memory', 'MemoryManager', error);
    }
  }

  async retrieveRelevantMemories(
    context: string,
    limit: number = this.config.maxContextMemories
  ): Promise<MemoryEntry[]> {
    this.ensureInitialized();
    try {
      return await this.store.search({
        text: context,
        limit,
        minRelevance: this.config.relevanceThreshold
      });
    } catch (error) {
      throw new AppError('Failed to retrieve memories', 'MemoryManager', error);
    }
  }

  async generateContextFromMemories(
    memories: MemoryEntry[],
    currentContext: string
  ): Promise<string> {
    this.ensureInitialized();
    try {
      const prompt = `Given these previous conversation summaries and the current context, generate a concise but informative context that would be helpful for understanding and responding to the current situation.

Previous Summaries:
${memories.map(m => `- ${m.content}`).join('\n')}

Current Context:
${currentContext}

Generated Context:`;

      const response = await this.aiProvider.chat([{
        role: 'user',
        content: prompt
      }]);

      return response.content;
    } catch (error) {
      throw new AppError('Failed to generate context', 'MemoryManager', error);
    }
  }

  async storeKnowledge(
    content: string,
    topic: string,
    metadata: Record<string, any> = {}
  ): Promise<MemoryEntry> {
    this.ensureInitialized();
    try {
      return await this.store.add({
        type: 'knowledge',
        content,
        metadata: {
          ...metadata,
          topic
        }
      });
    } catch (error) {
      throw new AppError('Failed to store knowledge', 'MemoryManager', error);
    }
  }

  async searchKnowledge(
    searchQuery: string,
    topic?: string,
    limit: number = 10
  ): Promise<MemoryEntry[]> {
    this.ensureInitialized();
    try {
      return await this.store.search({
        text: searchQuery,
        type: 'knowledge',
        metadata: topic ? { topic } : undefined,
        limit
      });
    } catch (error) {
      throw new AppError('Failed to search knowledge', 'MemoryManager', error);
    }
  }

  async createMemoryAssociation(
    sourceId: string,
    targetId: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    this.ensureInitialized();
    try {
      const source = await this.store.search({ 
        metadata: { id: sourceId },
        limit: 1 
      });

      if (!source.length) {
        throw new Error(`Source memory ${sourceId} not found`);
      }

      const target = await this.store.search({
        metadata: { id: targetId },
        limit: 1
      });

      if (!target.length) {
        throw new Error(`Target memory ${targetId} not found`);
      }

      // Update source memory with association
      await this.store.update(sourceId, {
        metadata: {
          ...source[0].metadata,
          associations: [...(source[0].associations || []), targetId],
          associationMetadata: {
            ...(source[0].metadata.associationMetadata || {}),
            [targetId]: metadata
          }
        }
      });

      // Update target memory with association
      await this.store.update(targetId, {
        metadata: {
          ...target[0].metadata,
          associations: [...(target[0].associations || []), sourceId],
          associationMetadata: {
            ...(target[0].metadata.associationMetadata || {}),
            [sourceId]: metadata
          }
        }
      });
    } catch (error) {
      throw new AppError('Failed to create memory association', 'MemoryManager', error);
    }
  }

  async getAssociatedMemories(
    memoryId: string,
    limit: number = 10
  ): Promise<MemoryEntry[]> {
    this.ensureInitialized();
    try {
      const memory = await this.store.search({
        metadata: { id: memoryId },
        limit: 1
      });

      if (!memory.length) {
        throw new Error(`Memory ${memoryId} not found`);
      }

      const associations = memory[0].associations || [];
      if (!associations.length) return [];

      return await this.store.search({
        metadata: {
          id: { $in: associations }
        },
        limit
      });
    } catch (error) {
      throw new AppError('Failed to get associated memories', 'MemoryManager', error);
    }
  }
}

export const memoryManager = MemoryManager.getInstance();
