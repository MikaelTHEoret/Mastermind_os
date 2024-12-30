import React from 'react';
import { Terminal } from 'lucide-react';
import { useNexusStore } from '../../stores/nexusStore';

interface ExecutorWindowProps {
  id: string;
}

export function ExecutorWindow({ id }: ExecutorWindowProps) {
  const { core } = useNexusStore();
  const [logs, setLogs] = React.useState<string[]>([]);

  return (
    <div className="h-full flex flex-col bg-gray-900 p-2 text-xs">
      <div className="flex items-center gap-2 mb-2">
        <Terminal className="w-4 h-4 text-cyan-400" />
        <span className="text-gray-300">Debug Console</span>
      </div>
      <div className="flex-1 overflow-auto font-mono">
        {logs.map((log, i) => (
          <div key={i} className="text-gray-400">{log}</div>
        ))}
      </div>
    </div>
  );
}