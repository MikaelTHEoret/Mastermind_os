import React from 'react';
import { useNexusStore } from '../../stores/nexusStore';
import { useLogStore } from '../../stores/logStore';
import { Activity, Cpu, Database, Network } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export function SystemWindow() {
  const { core, agents, activeTask } = useNexusStore();
  const logs = useLogStore((state) => state.logs);

  if (!core) return null;

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">System Monitor</h2>
      
      <Tabs defaultValue="overview" className="flex-1">
        <TabsList>
          <TabsTrigger value="overview">
            <Activity className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="agents">
            <Cpu className="w-4 h-4 mr-2" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="resources">
            <Database className="w-4 h-4 mr-2" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="network">
            <Network className="w-4 h-4 mr-2" />
            Network
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">System Status</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  core.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <p className="text-lg font-semibold capitalize">{core.status}</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Active Agents</h3>
              <p className="text-2xl font-semibold">{agents.size}</p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Current Task</h3>
              <p className="text-sm">
                {activeTask || 'No active task'}
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">API Usage</h3>
              <p className="text-2xl font-semibold">
                {core.apiUsage.totalCalls.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {core.apiUsage.quotaRemaining.toLocaleString()} remaining
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="flex-1">
          <div className="space-y-4">
            {Array.from(agents.values()).map((agent) => (
              <div key={agent.id} className="p-4 bg-white rounded-lg shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{agent.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {agent.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Type: {agent.type}</p>
                <div className="flex flex-wrap gap-2">
                  {agent.specialization.map((spec) => (
                    <span key={spec} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">CPU Usage</h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                      {core.resourceUsage.cpu}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                  <div
                    style={{ width: `${core.resourceUsage.cpu}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Memory Usage</h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                      {core.resourceUsage.memory}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                  <div
                    style={{ width: `${core.resourceUsage.memory}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="network" className="flex-1">
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Network Activity</h3>
              <p className="text-2xl font-semibold">
                {(core.resourceUsage.network / 1024 / 1024).toFixed(2)} MB/s
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Recent Connections</h3>
              <div className="space-y-2">
                {Array.from(core.connectedAgents).map((agentId) => (
                  <div key={agentId} className="flex items-center justify-between">
                    <span className="text-sm">{agentId}</span>
                    <span className="text-xs text-green-500">Connected</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}