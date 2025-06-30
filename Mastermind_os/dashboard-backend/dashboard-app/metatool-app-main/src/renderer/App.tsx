import React, { useEffect, useState } from 'react';
import { Module } from '../types/window';

const App: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [activeModule, setActiveModule] = useState<string | null>(null);

  useEffect(() => {
    // Load modules on mount
    window.osBridge.getModules().then(setModules);
  }, []);

  const handleActivateModule = async (moduleId: string) => {
    await window.osBridge.activateModule(moduleId);
    setActiveModule(moduleId);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>MCP Nexus Controller</h1>
      </header>

      <div className="main-content">
        <nav className="module-sidebar">
          <h2>Available Modules</h2>
          <ul>
            {modules.map(module => (
              <li key={module.id}>
                <button 
                  onClick={() => handleActivateModule(module.id)}
                  className={activeModule === module.id ? 'active' : ''}
                >
                  {module.id}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="module-view">
          {activeModule && (
            <div className="module-details">
              <h2>{activeModule}</h2>
              {/* Module-specific UI will go here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
