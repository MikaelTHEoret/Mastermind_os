import React from 'react';
import { Rnd } from 'react-rnd';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { useWindowStore } from '../stores/windowStore';
import type { WindowState } from '../types/window';
import { cn } from '../lib/utils';

interface WindowProps {
  window: WindowState;
  children: React.ReactNode;
}

export default function Window({ window, children }: WindowProps) {
  const { updateWindow, removeWindow, setActiveWindow, activeWindow } = useWindowStore();
  const isActive = activeWindow === window.id;

  const handleDragStop = (_: any, d: { x: number; y: number }) => {
    updateWindow(window.id, { position: { x: d.x, y: d.y } });
  };

  const handleResize = (_: any, _direction: any, ref: HTMLElement) => {
    updateWindow(window.id, {
      size: {
        width: ref.style.width,
        height: ref.style.height,
      },
    });
  };

  if (window.isMinimized) return null;

  return (
    <Rnd
      default={{
        x: window.position.x,
        y: window.position.y,
        width: window.size.width,
        height: window.size.height,
      }}
      minWidth={300}
      minHeight={200}
      bounds="window"
      onDragStop={handleDragStop}
      onResize={handleResize}
      style={{ zIndex: window.zIndex }}
      onMouseDown={() => setActiveWindow(window.id)}
      disableDragging={window.isMaximized}
      size={window.isMaximized ? { width: '100%', height: '100%' } : undefined}
      position={window.isMaximized ? { x: 0, y: 0 } : undefined}
      className={cn(
        'pointer-events-auto',
        isActive && 'window-glow'
      )}
    >
      <div className={cn(
        'flex flex-col h-full rounded-lg overflow-hidden',
        'bg-gray-900 border',
        isActive ? 'border-purple-500/30' : 'border-gray-800'
      )}>
        <div className={cn(
          'window-header flex items-center justify-between px-4 py-2 cursor-move',
          isActive ? 'bg-gray-800/90' : 'bg-gray-900/90'
        )}>
          <h3 className="text-sm font-medium neon-text">{window.title}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => updateWindow(window.id, { isMinimized: true })}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateWindow(window.id, { isMaximized: !window.isMaximized })}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => removeWindow(window.id)}
              className="p-1 hover:bg-red-900/50 rounded text-gray-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 window-content">
          {children}
        </div>
      </div>
    </Rnd>
  );
}