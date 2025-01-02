import React, { memo, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Toolbar from './Toolbar';
import Desktop from './Desktop';
import { ModuleLoader } from './ModuleLoader';
import { logger } from '../lib/utils/logger';

const Layout = memo(function Layout() {
  useEffect(() => {
    try {
      logger.log('Layout component mounted');
    } catch (error) {
      console.error('Failed to log mount:', error);
    }
    return () => {
      try {
        logger.log('Layout component unmounted');
      } catch (error) {
        console.error('Failed to log unmount:', error);
      }
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <Toolbar>
        <ModuleLoader />
      </Toolbar>
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
});

Layout.displayName = 'Layout';

export default Layout;
