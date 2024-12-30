import React from 'react';
import { useWindowStore } from '../stores/windowStore';
import Window from './Window';
import { AgentWindow } from './windows/AgentWindow';
import { JohnnyWindow } from './windows/JohnnyWindow';
import { ExecutorWindow } from './windows/ExecutorWindow';
import type { WindowState } from '../types/window';

export default function Desktop() {
  const { windows } = useWindowStore();

  const renderWindowContent = (window: WindowState) => {
    if (window.type === 'agent') {
      // Use specific window components based on the window ID
      switch (window.id) {
        case 'johnny':
          return <JohnnyWindow id={window.id} />;
        case 'executor':
          return <ExecutorWindow id={window.id} />;
        default:
          return <AgentWindow id={window.id} config={window.agentConfig} appearance={window.appearance} />;
      }
    }
    return null;
  };

  return (
    <div className="absolute inset-0 circuit-bg">
      <div className="relative w-full h-full">
        {windows.map((window) => (
          <Window key={window.id} window={window}>
            {renderWindowContent(window)}
          </Window>
        ))}
      </div>
    </div>
  );
}
