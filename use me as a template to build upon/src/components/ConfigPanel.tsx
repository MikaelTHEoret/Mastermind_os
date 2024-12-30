import React from 'react';
import { Shield, Zap, Bot, Database } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfigPanelProps {
  agentId: string;
  type: string;
  capabilities: string[];
}

export default function ConfigPanel({ agentId, type, capabilities }: ConfigPanelProps) {
  const [config, setConfig] = React.useState({
    aiModel: 'local',
    temperature: 0.7,
    maxTokens: 4000,
    useLocalLLM: true,
    apiThreshold: 0.8,
    permissions: {
      fileSystem: false,
      network: false,
      processExecution: false,
    },
  });

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-medium text-white">Agent Configuration</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              AI Model
            </label>
            <select
              value={config.aiModel}
              onChange={(e) => handleConfigChange('aiModel', e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
            >
              <option value="local">Local LLM</option>
              <option value="gpt-4">GPT-4</option>
              <option value="claude">Claude</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Temperature
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature}
              onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-400">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <input
                type="checkbox"
                checked={config.useLocalLLM}
                onChange={(e) => handleConfigChange('useLocalLLM', e.target.checked)}
                className="rounded bg-gray-800 border-gray-700 text-purple-500"
              />
              Prioritize Local LLM
            </label>
            <p className="mt-1 text-sm text-gray-400">
              Use local processing when possible to minimize API costs
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Usage Threshold
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.apiThreshold}
              onChange={(e) => handleConfigChange('apiThreshold', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-400">
              <span>Local First</span>
              <span>API First</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-medium text-white">Permissions</h3>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 p-2 bg-gray-800 rounded">
            <input
              type="checkbox"
              checked={config.permissions.fileSystem}
              onChange={(e) => handleConfigChange('permissions', {
                ...config.permissions,
                fileSystem: e.target.checked,
              })}
              className="rounded bg-gray-700 border-gray-600 text-cyan-500"
            />
            <span className="text-gray-300">File System Access</span>
          </label>

          <label className="flex items-center gap-2 p-2 bg-gray-800 rounded">
            <input
              type="checkbox"
              checked={config.permissions.network}
              onChange={(e) => handleConfigChange('permissions', {
                ...config.permissions,
                network: e.target.checked,
              })}
              className="rounded bg-gray-700 border-gray-600 text-cyan-500"
            />
            <span className="text-gray-300">Network Access</span>
          </label>

          <label className="flex items-center gap-2 p-2 bg-gray-800 rounded">
            <input
              type="checkbox"
              checked={config.permissions.processExecution}
              onChange={(e) => handleConfigChange('permissions', {
                ...config.permissions,
                processExecution: e.target.checked,
              })}
              className="rounded bg-gray-700 border-gray-600 text-cyan-500"
            />
            <span className="text-gray-300">Process Execution</span>
          </label>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-medium text-white">Capabilities</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {capabilities.map((cap) => (
            <span
              key={cap}
              className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-sm"
            >
              {cap}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}