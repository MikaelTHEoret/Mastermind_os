import React, { memo, useCallback, useMemo } from 'react';
import { Rnd } from 'react-rnd';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { useWindowStore } from '../stores/windowStore';
import type { WindowState } from '../types/window';
import { cn } from '../lib/utils';

interface WindowProps {
  window: WindowState;
  children: React.ReactNode;
}

const Window = memo(function Window({ window, children }: WindowProps) {
  // Use selective store subscription
  const updateWindow = useWindowStore(useCallback(state => state.updateWindow, []));
  const removeWindow = useWindowStore(useCallback(state => state.removeWindow, []));
  const setActiveWindow = useWindowStore(useCallback(state => state.setActiveWindow, []));
  const isActive = useWindowStore(useCallback(state => state.activeWindow === window.id, [window.id]));

  const handleDragStop = useCallback((_: any, d: { x: number; y: number }) => {
    updateWindow(window.id, { position: { x: d.x, y: d.y } });
  }, [window.id, updateWindow]);

  const handleResize = useCallback((_: any, _direction: any, ref: HTMLElement) => {
    const width = parseInt(ref.style.width, 10);
    const height = parseInt(ref.style.height, 10);
    if (!isNaN(width) && !isNaN(height)) {
      updateWindow(window.id, {
        size: { width, height },
      });
    }
  }, [window.id, updateWindow]);

  const handleMinimize = useCallback(() => {
    updateWindow(window.id, { isMinimized: true });
  }, [window.id, updateWindow]);

  const handleMaximize = useCallback(() => {
    updateWindow(window.id, { isMaximized: !window.isMaximized });
  }, [window.id, window.isMaximized, updateWindow]);

  const handleClose = useCallback(() => {
    removeWindow(window.id);
  }, [window.id, removeWindow]);

  const handleActivate = useCallback(() => {
    setActiveWindow(window.id);
  }, [window.id, setActiveWindow]);

  // Memoize default props to prevent unnecessary re-renders
  const defaultProps = useMemo(() => ({
    x: window.position.x,
    y: window.position.y,
    width: window.size.width,
    height: window.size.height,
  }), [window.position.x, window.position.y, window.size.width, window.size.height]);

  if (window.isMinimized) return null;

  return (
    <Rnd
      default={defaultProps}
      minWidth={300}
      minHeight={200}
      bounds="window"
      onDragStop={handleDragStop}
      onResize={handleResize}
      style={{ zIndex: window.zIndex }}
      onMouseDown={handleActivate}
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
              onClick={handleMinimize}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleMaximize}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
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
});

export default Window;
