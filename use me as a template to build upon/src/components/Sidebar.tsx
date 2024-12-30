import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  Eye,
  MessageSquare,
  Settings,
  Plus,
  Bot,
} from 'lucide-react';
import { useWindowStore } from '../stores/windowStore';
import { cn } from '../lib/utils';

export default function Sidebar() {
  const { addWindow } = useWindowStore();

  const createNewAgent = () => {
    addWindow({
      id: `agent-${Date.now()}`,
      title: 'New Agent',
      type: 'agent',
      component: 'AgentWindow',
      position: { x: 100, y: 100 },
      size: { width: 600, height: 400 },
      isMinimized: false,
      isMaximized: false,
    });
  };

  return (
    <div className="w-64 bg-card text-card-foreground p-4 flex flex-col h-full border-r border-border">
      <div className="flex items-center gap-2 mb-8">
        <Bot className="w-8 h-8 text-primary" />
        <h1 className="text-xl font-bold neon-text">AI Virtual OS</h1>
      </div>

      <button
        onClick={createNewAgent}
        className={cn(
          "flex items-center gap-2 w-full p-3 rounded-lg",
          "bg-primary/20 text-primary hover:bg-primary/30",
          "transition-colors duration-200 mb-6 neon-text"
        )}
      >
        <Plus className="w-5 h-5" />
        <span>New Agent</span>
      </button>

      <nav className="space-y-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 p-3 rounded-lg transition-colors",
              "hover:bg-muted",
              isActive && "bg-muted text-primary"
            )
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/visualizer"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 p-3 rounded-lg transition-colors",
              "hover:bg-muted",
              isActive && "bg-muted text-primary"
            )
          }
        >
          <Eye className="w-5 h-5" />
          <span>Visualizer</span>
        </NavLink>

        <NavLink
          to="/network"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 p-3 rounded-lg transition-colors",
              "hover:bg-muted",
              isActive && "bg-muted text-primary"
            )
          }
        >
          <Network className="w-5 h-5" />
          <span>Network</span>
        </NavLink>

        <NavLink
          to="/chat"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 p-3 rounded-lg transition-colors",
              "hover:bg-muted",
              isActive && "bg-muted text-primary"
            )
          }
        >
          <MessageSquare className="w-5 h-5" />
          <span>Chat</span>
        </NavLink>
      </nav>

      <div className="mt-auto">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 p-3 rounded-lg transition-colors",
              "hover:bg-muted",
              isActive && "bg-muted text-primary"
            )
          }
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </NavLink>
      </div>
    </div>
  );
}