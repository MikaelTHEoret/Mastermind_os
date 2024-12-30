import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Visualizer from './components/Visualizer';
import NetworkMonitor from './components/NetworkMonitor';
import Settings from './components/Settings';
import { useNexusStore } from './stores/nexusStore';
import { useWindowStore } from './stores/windowStore';

function App() {
  const { initialize } = useNexusStore();
  const { addWindow } = useWindowStore();

  const [isInitialized, setIsInitialized] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const initializeSystem = async () => {
      try {
        await initialize();
        setIsInitialized(true);

        // Open Johnny window by default
        addWindow({
          id: 'johnny',
          title: 'Johnny Go Getter',
          type: 'agent',
          component: 'JohnnyWindow',
          position: { x: 150, y: 150 },
          size: { width: 700, height: 500 },
          isMinimized: false,
          isMaximized: false,
        });

        // Open Sir Executor in minimized state
        addWindow({
          id: 'executor',
          title: 'Sir Executor',
          type: 'agent',
          component: 'ExecutorWindow',
          position: { x: 200, y: 200 },
          size: { width: 400, height: 300 },
          isMinimized: true,
          isMaximized: false,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Failed to initialize Nexus system:', message);
        setError(message);
      }
    };

    initializeSystem();
  }, [initialize, addWindow]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="p-6 bg-red-900/50 rounded-lg border border-red-700">
          <h1 className="text-xl font-bold mb-4">System Initialization Error</h1>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
          <h1 className="text-xl font-bold mb-4">Initializing System...</h1>
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="visualizer" element={<Visualizer />} />
          <Route path="network" element={<NetworkMonitor />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
