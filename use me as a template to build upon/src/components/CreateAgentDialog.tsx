import React from 'react';
import { useWindowStore } from '../stores/windowStore';
import { Bot, Terminal, Monitor } from 'lucide-react';
import type { AgentConfig } from '../types/window';

const AGENT_TYPES = [
  {
    type: 'commander',
    title: 'Commander',
    icon: Bot,
    description: 'Interprets commands and coordinates tasks',
    capabilities: ['command-interpretation', 'task-coordination'],
    localOnly: false,
  },
  {
    type: 'executor',
    title: 'Executor',
    icon: Terminal,
    description: 'Links between commander and workers',
    capabilities: ['task-execution', 'resource-management'],
    localOnly: true,
  },
  {
    type: 'monitor',
    title: 'System Monitor',
    icon: Monitor,
    description: 'Monitors system resources and operations',
    capabilities: ['system-monitoring', 'log-management'],
    localOnly: true,
  },
];

export default function CreateAgentDialog() {
  const { addWindow } = useWindowStore();

  const createAgent = (agentType: AgentConfig['type']) => {
    const agent = AGENT_TYPES.find((a) => a.type === agentType);
    if (!agent) return;

    const config: AgentConfig = {
      type: agent.type,
      capabilities: agent.capabilities,
      localOnly: agent.localOnly,
      aiModel: agent.localOnly ? undefined : 'gpt-4-turbo-preview',
    };

    addWindow({
      id: `${agent.type}-${Date.now()}`,
      title: `${agent.title} Agent`,
      type: 'agent',
      component: 'AgentWindow',
      position: { x: 50, y: 50 },
      size: { width: 400, height: 500 },
      isMinimized: false,
      isMaximized: false,
      agentConfig: config,
    });
  };

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {AGENT_TYPES.map((agent) => (
        <button
          key={agent.type}
          onClick={() => createAgent(agent.type)}
          className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-2">
            <agent.icon className="w-6 h-6 text-blue-600" />
            <h3 className="font-medium">{agent.title}</h3>
          </div>
          <p className="text-sm text-gray-600">{agent.description}</p>
        </button>
      ))}
    </div>
  );
}