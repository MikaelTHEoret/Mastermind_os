import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Eye,
  Network,
  Settings,
  Bot,
  Terminal,
  ChevronDown,
  Package,
  Cog
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useWindowStore } from '../stores/windowStore';
import { cn } from '../lib/utils';

export default function Toolbar({ children }: React.PropsWithChildren) {
  const { addWindow } = useWindowStore();

  const openJohnnyWindow = () => {
    addWindow({
      id: 'johnny',
      title: 'Johnny Go Getter',
      type: 'johnny',
      component: 'JohnnyWindow',
      position: { x: 150, y: 150 },
      size: { width: 700, height: 500 },
      isMinimized: false,
      isMaximized: false,
    });
  };

  const openExecutorWindow = () => {
    addWindow({
      id: 'executor',
      title: 'Sir Executor',
      type: 'executor',
      component: 'ExecutorWindow',
      position: { x: 200, y: 200 },
      size: { width: 400, height: 300 },
      isMinimized: false,
      isMaximized: false,
    });
  };

  return (
    <div className="toolbar h-16 flex items-center px-4 justify-between relative z-10">
      <div className="flex items-center gap-2">
        <Bot className="w-8 h-8 text-primary" />
        <h1 className="text-xl font-bold neon-text">AI Virtual OS</h1>
      </div>
      {children}
      <div className="flex items-center gap-4">

        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 p-3 rounded transition-colors",
              "hover:bg-muted",
              isActive && "bg-blue-500 text-white"
            )
          }
        >
          <Bot className="w-5 h-5" />
          <span>Central Nexus</span>
        </NavLink>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 p-3 rounded transition-colors hover:bg-muted">
            <Bot className="w-5 h-5" />
            <span>Agents</span>
            <ChevronDown className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={openJohnnyWindow}>
              Johnny Go Getter
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openExecutorWindow}>
              Sir Executor
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NavLink
          to="/visualizer"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 p-3 rounded transition-colors",
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
              "flex items-center gap-2 p-3 rounded transition-colors",
              "hover:bg-muted",
              isActive && "bg-muted text-primary"
            )
          }
        >
          <Network className="w-5 h-5" />
          <span>Network</span>
        </NavLink>
      </div>

      <div className="flex items-center gap-2">
        <NavLink
          to="/modules"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 p-3 rounded transition-colors",
              "hover:bg-muted",
              isActive && "bg-muted text-primary"
            )
          }
        >
          <Package className="w-5 h-5" />
          <Cog className="w-4 h-4" />
        </NavLink>
        
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 p-3 rounded transition-colors",
              "hover:bg-muted",
              isActive && "bg-muted text-primary"
            )
          }
        >
          <Settings className="w-5 h-5" />
        </NavLink>
      </div>
    </div>
  );
}
