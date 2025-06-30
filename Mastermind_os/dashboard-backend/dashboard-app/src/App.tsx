import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Database, Server, BarChart3, Home, Settings, RefreshCw } from 'lucide-react';
import DatabaseDashboard from './components/database/DatabaseDashboard';
import api from './lib/api';

// Navigation component
const Navigation: React.FC = () => {
  const location = useLocation();
  
  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center pt-8 z-20">
      <div className="mb-8">
        <Link 
          to="/"
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
            location.pathname === '/' 
              ? 'bg-gradient-to-br from-pink-600/30 to-cyan-600/30 text-white shadow-neon-pink' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Home size={20} />
        </Link>
      </div>
      
      <div className="flex flex-col space-y-4">
        <Link 
          to="/database"
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
            location.pathname === '/database' 
              ? 'bg-gradient-to-br from-pink-600/30 to-cyan-600/30 text-white shadow-neon-pink' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Database size={20} />
        </Link>
        
        <Link 
          to="/servers"
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
            location.pathname === '/servers' 
              ? 'bg-gradient-to-br from-pink-600/30 to-cyan-600/30 text-white shadow-neon-pink' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Server size={20} />
        </Link>
        
        <Link 
          to="/analytics"
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
            location.pathname === '/analytics' 
              ? 'bg-gradient-to-br from-pink-600/30 to-cyan-600/30 text-white shadow-neon-pink' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <BarChart3 size={20} />
        </Link>
      </div>
      
      <div className="mt-auto mb-8">
        <Link 
          to="/settings"
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
            location.pathname === '/settings' 
              ? 'bg-gradient-to-br from-pink-600/30 to-cyan-600/30 text-white shadow-neon-pink' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Settings size={20} />
        </Link>
      </div>
    </div>
  );
};

// Home page
const HomePage: React.FC = () => {
  const [initializing, setInitializing] = useState(false);
  const [status, setStatus] = useState<any>(null);
  
  const handleInitialize = async () => {
    setInitializing(true);
    try {
      const result = await api.system.initialize();
      setStatus(result);
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setInitializing(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="relative z-10 w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-cyan-400 bg-clip-text text-transparent">
            Mastermind Dashboard
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            A unified interface for Neon PostgreSQL databases, featuring vector search and synthwave aesthetics.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link 
            to="/database" 
            className="block bg-gray-800/50 p-6 rounded-lg border border-gray-700/50 hover:border-pink-500/30 transition-colors group"
          >
            <div className="flex items-center space-x-3 mb-3">
              <Database className="text-pink-400 group-hover:text-pink-300 transition-colors" size={24} />
              <h2 className="text-xl font-semibold text-white">Database Dashboard</h2>
            </div>
            <p className="text-gray-400">
              Monitor database connections, browse tables, and analyze database structure with stylish visualizations.
            </p>
          </Link>
          
          <Link 
            to="/servers" 
            className="block bg-gray-800/50 p-6 rounded-lg border border-gray-700/50 hover:border-cyan-500/30 transition-colors group"
          >
            <div className="flex items-center space-x-3 mb-3">
              <Server className="text-cyan-400 group-hover:text-cyan-300 transition-colors" size={24} />
              <h2 className="text-xl font-semibold text-white">Server Management</h2>
            </div>
            <p className="text-gray-400">
              View server status, manage connections, and monitor performance metrics.
            </p>
          </Link>
        </div>
        
        <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700/50">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Settings className="text-pink-400 mr-2" size={20} />
            System Initialization
          </h2>
          
          <p className="text-gray-400 mb-4">
            Initialize the system to set up database schemas, connection tables, and vector stores.
          </p>
          
          <button
            onClick={handleInitialize}
            disabled={initializing}
            className="bg-gradient-to-r from-pink-600 to-cyan-600 text-white px-4 py-2 rounded-md hover:from-pink-500 hover:to-cyan-500 transition-colors flex items-center"
          >
            {initializing ? (
              <>
                <RefreshCw className="animate-spin mr-2" size={18} />
                Initializing...
              </>
            ) : (
              <>Initialize System</>
            )}
          </button>
          
          {status && (
            <div className="mt-4 p-4 bg-gray-800/50 rounded-md text-sm">
              <pre className="text-gray-300 overflow-auto max-h-48">
                {JSON.stringify(status, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Placeholder for other pages
const ComingSoon: React.FC<{ title: string }> = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-cyan-400 bg-clip-text text-transparent">
        {title}
      </h1>
      <p className="text-gray-400">Coming soon...</p>
    </div>
  </div>
);

// Main App
const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Grid background */}
        <div 
          className="fixed inset-0 z-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(to right, #2d3748 1px, transparent 1px), 
                             linear-gradient(to bottom, #2d3748 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Glow overlay */}
        <div className="fixed bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-pink-500/20 to-transparent z-0" />
        
        <Navigation />
        
        <div className="ml-16">  {/* Add margin to account for fixed sidebar */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/database" element={<DatabaseDashboard />} />
            <Route path="/servers" element={<ComingSoon title="Server Management" />} />
            <Route path="/analytics" element={<ComingSoon title="Analytics Dashboard" />} />
            <Route path="/settings" element={<ComingSoon title="Settings" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
