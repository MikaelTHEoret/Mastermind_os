import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { Terminal, Filter, X } from 'lucide-react';
import { useLogStore } from '../stores/logStore';
import { cn } from '../lib/utils';

interface LogEntry {
  id: string;
  timestamp: number;
  source: string;
  type: 'info' | 'warning' | 'error';
  message: string;
}

export default function Console() {
  const { logs, filters, toggleFilter, clearFilters } = useLogStore();
  const [command, setCommand] = React.useState('');
  const [activeFilters, setActiveFilters] = React.useState<Set<string>>(new Set());

  const filteredLogs = React.useMemo(() => {
    if (activeFilters.size === 0) return logs;
    return logs.filter(log => activeFilters.has(log.source));
  }, [logs, activeFilters]);

  const handleCommand = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      console.log('Execute command:', command);
      setCommand('');
    }
  };

  const renderLogRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const log = filteredLogs[index];
    return (
      <div style={style} className={cn(
        'px-4 py-2 border-b border-gray-700 hover:bg-gray-800',
        index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-850'
      )}>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">
            {new Date(log.timestamp).toLocaleTimeString()}
          </span>
          <span className={cn(
            'text-xs px-2 rounded',
            log.type === 'error' ? 'bg-red-900 text-red-300' :
            log.type === 'warning' ? 'bg-yellow-900 text-yellow-300' :
            'bg-blue-900 text-blue-300'
          )}>
            {log.source}
          </span>
        </div>
        <div className="text-sm text-gray-300">{log.message}</div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="flex items-center gap-2 p-2 border-b border-gray-700">
        <Terminal className="w-4 h-4" />
        <span className="text-sm font-medium">Console</span>
        <div className="flex-1" />
        <button
          onClick={() => setActiveFilters(new Set())}
          className="p-1 hover:bg-gray-700 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <List
          height={300}
          width="100%"
          itemCount={filteredLogs.length}
          itemSize={64}
        >
          {renderLogRow}
        </List>
      </div>

      <div className="p-2 border-t border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4" />
          <div className="flex gap-1">
            {Array.from(new Set(logs.map(log => log.source))).map(source => (
              <button
                key={source}
                onClick={() => {
                  const newFilters = new Set(activeFilters);
                  if (newFilters.has(source)) {
                    newFilters.delete(source);
                  } else {
                    newFilters.add(source);
                  }
                  setActiveFilters(newFilters);
                }}
                className={cn(
                  'px-2 py-1 text-xs rounded',
                  activeFilters.has(source)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                )}
              >
                {source}
              </button>
            ))}
          </div>
        </div>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleCommand}
          placeholder="Enter command..."
          className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}