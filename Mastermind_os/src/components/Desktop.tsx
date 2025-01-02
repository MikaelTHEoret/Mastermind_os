import React, { memo, useCallback, useMemo } from 'react';
import { useWindowStore } from '../stores/windowStore';
import Window from './Window';
import { AgentWindow } from './windows/AgentWindow';
import { JohnnyWindow } from './windows/JohnnyWindow';
import { ExecutorWindow } from './windows/ExecutorWindow';
import type { WindowState } from '../types/window';

// Memoized window content components
const MemoizedJohnnyWindow = memo(JohnnyWindow);
const MemoizedExecutorWindow = memo(ExecutorWindow);
const MemoizedAgentWindow = memo(AgentWindow);

const Desktop = memo(function Desktop() {
  // Use selector to only get necessary window data
  const windows = useWindowStore(useCallback((state) => 
    state.windows.map(({ id, type, title, component, position, size, zIndex, isMinimized, isMaximized, agentConfig, appearance }) => ({
      id, type, title, component, position, size, zIndex, isMinimized, isMaximized, agentConfig, appearance
    })), []));

  const renderWindowContent = useCallback((window: WindowState) => {
    if (window.type === 'agent') {
      switch (window.id) {
        case 'johnny':
          return <MemoizedJohnnyWindow id={window.id} />;
        case 'executor':
          return <MemoizedExecutorWindow id={window.id} />;
        default:
          return <MemoizedAgentWindow id={window.id} config={window.agentConfig} appearance={window.appearance} />;
      }
    }
    return null;
  }, []);

  const memoizedWindows = useMemo(() => 
    windows.map((window) => (
      <Window key={window.id} window={window}>
        {renderWindowContent(window)}
      </Window>
    )), [windows, renderWindowContent]);

  return (
    <div className="absolute inset-0 circuit-bg">
      <div className="relative w-full h-full">
        {memoizedWindows}
      </div>
    </div>
  );
});

export default Desktop;
