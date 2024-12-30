import { useConfigStore } from '../stores/configStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Server, Network, Shield, Database, Bot } from 'lucide-react';

export default function Settings() {
  const { config, updateConfig } = useConfigStore();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-white">System Settings</h2>
      
      <Tabs defaultValue="system" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ai">
            <Bot className="w-4 h-4 mr-2" />
            AI/LLM
          </TabsTrigger>
          <TabsTrigger value="system">
            <Server className="w-4 h-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger value="network">
            <Network className="w-4 h-4 mr-2" />
            Network
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="storage">
            <Database className="w-4 h-4 mr-2" />
            Storage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">AI/LLM Configuration</h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Provider
              </label>
              <select
                value={config.ai.provider}
                onChange={(e) => updateConfig({
                  ai: { ...config.ai, provider: e.target.value as 'openai' | 'anthropic' }
                })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={config.ai.apiKey}
                onChange={(e) => updateConfig({
                  ai: { ...config.ai, apiKey: e.target.value }
                })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="Enter your API key"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Model
              </label>
              <select
                value={config.ai.model}
                onChange={(e) => updateConfig({
                  ai: { ...config.ai, model: e.target.value }
                })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                {config.ai.provider === 'openai' ? (
                  <>
                    <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </>
                ) : (
                  <>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                    <option value="claude-2.1">Claude 2.1</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Temperature
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={config.ai.temperature}
                onChange={(e) => updateConfig({
                  ai: { ...config.ai, temperature: parseFloat(e.target.value) }
                })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Tokens
              </label>
              <input
                type="number"
                value={config.ai.maxTokens}
                onChange={(e) => updateConfig({
                  ai: { ...config.ai, maxTokens: parseInt(e.target.value) }
                })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">System Configuration</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Environment
              </label>
              <select
                value={config.system.environment}
                onChange={(e) => updateConfig({
                  system: { ...config.system, environment: e.target.value as 'development' | 'production' | 'testing' }
                })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="development">Development</option>
                <option value="production">Production</option>
                <option value="testing">Testing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Concurrent Agents
              </label>
              <input
                type="number"
                value={config.system.maxAgents}
                onChange={(e) => updateConfig({
                  system: { ...config.system, maxAgents: parseInt(e.target.value) }
                })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Debug Mode
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.system.debug}
                  onChange={(e) => updateConfig({
                    system: { ...config.system, debug: e.target.checked }
                  })}
                  className="rounded bg-gray-700 border-gray-600 text-blue-500"
                />
                <span className="text-gray-300">Enable debug logging</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Network Configuration</h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Cluster Mode
              </label>
              <select
                value={config.network.mode}
                onChange={(e) => updateConfig({
                  network: { ...config.network, mode: e.target.value as 'standalone' | 'cluster' | 'distributed' }
                })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="standalone">Standalone</option>
                <option value="cluster">Cluster</option>
                <option value="distributed">Distributed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Discovery Port
              </label>
              <input
                type="number"
                value={config.network.discoveryPort}
                onChange={(e) => updateConfig({
                  network: { ...config.network, discoveryPort: parseInt(e.target.value) }
                })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Auto-Discovery
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.network.autoDiscovery}
                  onChange={(e) => updateConfig({
                    network: { ...config.network, autoDiscovery: e.target.checked }
                  })}
                  className="rounded bg-gray-700 border-gray-600 text-blue-500"
                />
                <span className="text-gray-300">Enable automatic node discovery</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Encryption
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.security.encryptionEnabled}
                  onChange={(e) => updateConfig({
                    security: { ...config.security, encryptionEnabled: e.target.checked }
                  })}
                  className="rounded bg-gray-700 border-gray-600 text-blue-500"
                />
                <span className="text-gray-300">Enable end-to-end encryption</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Key Rotation Interval (hours)
              </label>
              <input
                type="number"
                value={config.security.keyRotationInterval / 3600}
                onChange={(e) => updateConfig({
                  security: { ...config.security, keyRotationInterval: parseInt(e.target.value) * 3600 }
                })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Allowed IP Addresses
              </label>
              <textarea
                value={config.security.allowedIPs.join('\n')}
                onChange={(e) => updateConfig({
                  security: { ...config.security, allowedIPs: e.target.value.split('\n').filter(Boolean) }
                })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                rows={3}
                placeholder="One IP per line"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="storage" className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Storage Configuration</h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Database Type
              </label>
              <select
                value={config.database.type}
                onChange={(e) => updateConfig({
                  database: { ...config.database, type: e.target.value as 'sqlite' | 'mongodb' | 'postgres' }
                })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="sqlite">SQLite (Local)</option>
                <option value="mongodb">MongoDB</option>
                <option value="postgres">PostgreSQL</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Backup Enabled
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.database.backupEnabled}
                  onChange={(e) => updateConfig({
                    database: { ...config.database, backupEnabled: e.target.checked }
                  })}
                  className="rounded bg-gray-700 border-gray-600 text-blue-500"
                />
                <span className="text-gray-300">Enable automatic backups</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Backup Interval (hours)
              </label>
              <input
                type="number"
                value={config.database.backupInterval / 3600}
                onChange={(e) => updateConfig({
                  database: { ...config.database, backupInterval: parseInt(e.target.value) * 3600 }
                })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
