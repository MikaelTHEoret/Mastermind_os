import React from 'react';
import { Outlet } from 'react-router-dom';
import Toolbar from './Toolbar';
import Desktop from './Desktop';

export default function Layout() {
  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <Toolbar />
      <div className="flex-1 relative">
        <div className="absolute inset-0 circuit-bg">
          <Desktop />
        </div>
        <div className="relative z-10 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}