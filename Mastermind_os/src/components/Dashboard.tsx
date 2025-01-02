import React from 'react';
import { useNexusStore } from '../stores/nexusStore';
import { useLogStore } from '../stores/logStore';
import SystemMonitor from './SystemMonitor';
import NexusTerminal from './NexusTerminal';

export default function Dashboard() {
  const { core, agents } = useNexusStore();
  const logs = useLogStore((state) => state.logs);

  if (!core) return null;

  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      <div className="flex flex-col gap-6">
        <SystemMonitor core={core} agents={agents} />
      </div>
      <div className="flex flex-col">
        <NexusTerminal logs={logs} core={core} />
      </div>
    </div>
  );
}