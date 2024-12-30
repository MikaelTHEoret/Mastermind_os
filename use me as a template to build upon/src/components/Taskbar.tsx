import React from 'react';
import { useWindowStore } from '../stores/windowStore';
import { Maximize2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Taskbar() {
  const { windows, activeWindow, setActiveWindow, updateWindow } = useWindowStore();

  const handleWindowClick = (id: string) => {
    const window = windows.find(w => w.id === id);
    if (window?.isMinimized) {
      updateWindow(id, { isMinimized: false });
    }
    setActiveWindow(id);
  };

  return (
    <div className="h-12 bg-gray-800 border-t border-gray-700 flex items-center px-4 gap-2">
      {windows.map((window) => (
        <button
          key={window.id}
          onClick={() => handleWindowClick(window.id)}
          className={cn(
            'h-8 px-3 flex items-center gap-2 rounded-md transition-colors',
            activeWindow === window.id
              ? 'bg-gray-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          )}
        >
          {window.isMinimized && <Maximize2 className="w-4 h-4" />}
          <span className="text-sm truncate max-w-[150px]">{window.title}</span>
        </button>
      ))}
    </div>
  );
}