import React from 'react';
import { networkManager } from '../lib/network/networkManager';
import { networkDiscovery } from '../lib/network/discovery';
import { Activity, Server, Wifi, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { Node, NetworkStats } from '../lib/network/types';

export default function NetworkMonitor() {
  const [stats, setStats] = React.useState<NetworkStats>();
  const [nodes, setNodes] = React.useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = React.useState<Node>();

  React.useEffect(() => {
    const updateStats = () => {
      setStats(networkManager.getNetworkStats());
      setNodes(networkDiscovery.getDiscoveredNodes());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Network Monitor</h2>

      <Tabs defaultValue="overview" className="flex-1">
        <TabsList>
          <TabsTrigger value="overview">
            <Activity className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="nodes">
            <Server className="w-4 h-4 mr-2" />
            Nodes
          </TabsTrigger>
          <TabsTrigger value="connections">
            <Wifi className="w-4 h-4 mr-2" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Zap className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Connected Nodes</h3>
              <p className="text-2xl font-semibold">{stats.connectedNodes}</p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Active Connections</h3>
              <p className="text-2xl font-semibold">{stats.activeConnections}</p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Network Reliability</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  stats.reliability > 0.9 ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <p className="text-lg font-semibold">
                  {(stats.reliability * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Average Latency</h3>
              <p className="text-2xl font-semibold">
                {stats.avgLatency.toFixed(2)}ms
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="nodes" className="flex-1">
          <div className="flex gap-4 h-full">
            <div className="w-1/2 space-y-2 overflow-auto">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-4 bg-white rounded-lg shadow cursor-pointer transition-colors ${
                    selectedNode?.id === node.id ? 'border-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{node.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      node.status === 'online'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {node.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Type: {node.type}</p>
                  <p className="text-sm text-gray-600">
                    Address: {node.address}:{node.port}
                  </p>
                </div>
              ))}
            </div>

            <div className="w-1/2 bg-white rounded-lg p-4">
              {selectedNode ? (
                <div>
                  <h3 className="text-lg font-medium mb-4">{selectedNode.name}</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Capabilities</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedNode.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Resources</h4>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>CPU Usage</span>
                            <span>{selectedNode.resources.cpu.usage}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded">
                            <div
                              className="h-full bg-blue-500 rounded"
                              style={{
                                width: `${selectedNode.resources.cpu.usage}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm">
                            <span>Memory Usage</span>
                            <span>
                              {(selectedNode.resources.memory.used / 1024 / 1024 / 1024).toFixed(1)}GB
                              /
                              {(selectedNode.resources.memory.total / 1024 / 1024 / 1024).toFixed(1)}GB
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded">
                            <div
                              className="h-full bg-green-500 rounded"
                              style={{
                                width: `${(selectedNode.resources.memory.used / selectedNode.resources.memory.total) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Network</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-500">Bandwidth</p>
                          <p className="font-medium">
                            {(selectedNode.network.bandwidth / 1024 / 1024).toFixed(1)} MB/s
                          </p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-500">Latency</p>
                          <p className="font-medium">
                            {selectedNode.network.latency.toFixed(1)}ms
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Select a node to view details
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="connections" className="flex-1">
          {/* Connection visualization would go here */}
        </TabsContent>

        <TabsContent value="performance" className="flex-1">
          {/* Performance metrics would go here */}
        </TabsContent>
      </Tabs>
    </div>
  );
}