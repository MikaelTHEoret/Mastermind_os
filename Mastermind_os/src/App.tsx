import React, { useEffect, useState, Suspense, memo, useCallback } from 'react';
import { checkBrowserCompatibility } from './lib/utils/browserCheck';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useNexusStore } from './stores/nexusStore';
import { useWindowStore } from './stores/windowStore';
import { useLogStore } from './stores/logStore';
import { OllamaProvider } from './lib/ai/providers/ollama';
import type { WindowState } from './types/window';

// Initialize AI provider
const ollamaProvider = new OllamaProvider({
  provider: 'ollama',
  baseUrl: import.meta.env.VITE_OLLAMA_HOST || 'http://localhost:11434',
  model: import.meta.env.VITE_OLLAMA_MODEL || 'llama2'
});

// Import Layout directly to debug module loading issues
import Layout from './components/Layout';
import { ModuleLoader } from './components/ModuleLoader';

// Lazy load other components
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Visualizer = React.lazy(() => import('./components/Visualizer'));
const NetworkMonitor = React.lazy(() => import('./components/NetworkMonitor'));
const Settings = React.lazy(() => import('./components/Settings'));

// Memoized error components
const ErrorBoundary = memo(class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900/50 rounded border border-red-700">
          <h2 className="text-xl font-bold text-red-300 mb-2">Component Error</h2>
          <p className="text-red-300">{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
});

// Memoized warning component
const BrowserWarning = memo(function BrowserWarning({ missingFeatures }: { missingFeatures: string[] }) {
  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-4 z-50">
      <div className="container mx-auto">
        <h2 className="text-lg font-bold mb-2">Browser Compatibility Warning</h2>
        <p>Your browser is missing the following required features:</p>
        <ul className="list-disc list-inside">
          {missingFeatures.map(feature => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <p className="mt-2">
          Please use a modern browser like Chrome, Firefox, Safari, or Edge to ensure all features work correctly.
        </p>
      </div>
    </div>
  );
});

// Loading fallback component
const LoadingFallback = memo(function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
});

// Memoized log display component
const LogDisplay = memo(function LogDisplay({ logs }: { logs: any[] }) {
  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div
          key={log.id}
          className={`p-2 rounded ${
            log.type === 'error'
              ? 'bg-red-900/30 text-red-300'
              : log.type === 'warning'
              ? 'bg-yellow-900/30 text-yellow-300'
              : 'bg-blue-900/30 text-blue-300'
          }`}
        >
          <span className="opacity-75">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
          {' '}
          <span className="font-bold">{log.source}:</span>
          {' '}
          {log.message}
        </div>
      ))}
    </div>
  );
});

// Main App component
function App() {
  const [browserCheck] = useState(() => checkBrowserCompatibility());
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use callbacks for store actions to prevent re-renders
  const initialize = useNexusStore(useCallback(state => state.initialize, []));
  const addWindow = useWindowStore(useCallback(state => state.addWindow, []));
  const recentLogs = useLogStore(useCallback(state => state.logs.slice(0, 5), []));

  // Initialize AI providers (non-blocking)
  useEffect(() => {
    const initAI = async () => {
      try {
        await ollamaProvider.initialize();
      } catch (error) {
        console.warn('Ollama provider unavailable. Application running in limited mode.');
      }
    };
    
    // Don't await initialization - let app render immediately
    initAI();
  }, []);

  // Initialize system only once
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeSystem = async () => {
      try {
        await initialize();
        
        if (!mounted) return;
        
        setIsInitialized(true);

        // Open default windows
        const defaultWindows: Omit<WindowState, 'zIndex'>[] = [
          {
            id: 'johnny',
            title: 'Johnny Go Getter',
            type: 'agent',
            component: 'JohnnyWindow',
            position: { x: 150, y: 150 },
            size: { width: 700, height: 500 },
            isMinimized: false,
            isMaximized: false,
            agentConfig: {
              type: 'commander',
              capabilities: ['task-management', 'system-control']
            }
          },
          {
            id: 'executor',
            title: 'Sir Executor',
            type: 'agent',
            component: 'ExecutorWindow',
            position: { x: 200, y: 200 },
            size: { width: 400, height: 300 },
            isMinimized: true,
            isMaximized: false,
            agentConfig: {
              type: 'executor',
              capabilities: ['script-execution', 'task-execution']
            }
          }
        ];

        // Add windows in next tick to prevent blocking
        timeoutId = setTimeout(() => {
          if (mounted) {
            defaultWindows.forEach(window => addWindow(window));
          }
        }, 0);
      } catch (error) {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : String(error);
        console.error('Failed to initialize Nexus system:', message);
        setError(message);
      }
    };

    initializeSystem();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [initialize, addWindow]);

  if (error || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full">
          <h1 className="text-xl font-bold mb-4">
            {error ? 'System Initialization Error' : 'Initializing System...'}
          </h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-900/50 rounded border border-red-700">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          <LogDisplay logs={recentLogs} />

          {!error && <LoadingFallback />}
        </div>
      </div>
    );
  }

  return (
    <>
      {!browserCheck.isCompatible && (
        <BrowserWarning missingFeatures={browserCheck.missingFeatures} />
      )}
      <ErrorBoundary>
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingFallback />}>
                      <Dashboard />
                    </Suspense>
                  </ErrorBoundary>
                } />
                <Route path="visualizer" element={
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingFallback />}>
                      <Visualizer />
                    </Suspense>
                  </ErrorBoundary>
                } />
                <Route path="network" element={
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingFallback />}>
                      <NetworkMonitor />
                    </Suspense>
                  </ErrorBoundary>
                } />
                <Route path="settings" element={
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingFallback />}>
                      <Settings />
                    </Suspense>
                  </ErrorBoundary>
                } />
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </ErrorBoundary>
    </>
  );
}

export default memo(App);
