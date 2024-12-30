import React from 'react';
import { Activity, Cpu, Database, Network, Bot } from 'lucide-react';
import type { NexusCore } from '../lib/nexus/types';
import { cn } from '../lib/utils';

interface SystemMonitorProps {
  core: NexusCore;
  agents: Map<string, any>;
}

export default function SystemMonitor({ core, agents }: SystemMonitorProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-medium text-gray-300">System Status</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              core.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
            )} />
            <p className="text-2xl font-bold text-white capitalize">{core.status}</p>
          </div>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-medium text-gray-300">Active Agents</h2>
          </div>
          <p className="text-2xl font-bold text-white">{agents.size}</p>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-green-400" />
            <h2 className="text-sm font-medium text-gray-300">API Usage</h2>
          </div>
          <p className="text-2xl font-bold text-white">
            {core.apiUsage.totalCalls.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400">
            {core.apiUsage.quotaRemaining.toLocaleString()} remaining
          </p>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-medium text-gray-300">Network Load</h2>
          </div>
          <p className="text-2xl font-bold text-white">
            {core.resourceUsage.network}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-red-400" />
            <h2 className="text-sm font-medium text-gray-300">Resource Usage</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">CPU</span>
                <span className="text-sm text-gray-400">{core.resourceUsage.cpu}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded">
                <div 
                  className="h-full bg-red-500 rounded transition-all duration-300"
                  style={{ width: `${core.resourceUsage.cpu}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Memory</span>
                <span className="text-sm text-gray-400">{core.resourceUsage.memory}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded">
                <div 
                  className="h-full bg-green-500 rounded transition-all duration-300"
                  style={{ width: `${core.resourceUsage.memory}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Storage</span>
                <span className="text-sm text-gray-400">{core.resourceUsage.storage}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded">
                <div 
                  className="h-full bg-purple-500 rounded transition-all duration-300"
                  style={{ width: `${core.resourceUsage.storage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-yellow-400" />
            <h2 className="text-sm font-medium text-gray-300">System Activity</h2>
          </div>
          
          <div className="space-y-2">
            {Array.from(core.connectedAgents).map((agentId) => {
              const agent = agents.get(agentId);
              if (!agent) return null;

              return (
                <div 
                  key={agentId}
                  className="flex items-center justify-between p-2 bg-gray-700 rounded"
                >
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{agent.name}</span>
                  </div>
                  <span className={cn(
                    'px-2 py-1 text-xs rounded-full',
                    agent.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                  )}>
                    {agent.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}