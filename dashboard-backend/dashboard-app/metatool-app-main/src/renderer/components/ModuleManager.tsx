import React, { useEffect, useState } from 'react';
import { Module } from '../../main/module-manager';

export function ModuleManager() {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  useEffect(() => {
    window.electron.ipcRenderer.invoke('get-modules').then((modules: Module[]) => {
      setModules(modules);
    });

    const updateHandler = (newModules: Module[]) => {
      setModules(newModules);
    };

    window.electron.ipcRenderer.on('modules-updated', updateHandler);
    return () => {
      window.electron.ipcRenderer.off('modules-updated', updateHandler);
    };
  }, []);

  const handleActivate = async (moduleId: string) => {
    await window.electron.ipcRenderer.invoke('activate-module', moduleId);
  };

  return (
    <div className="module-manager">
      <div className="module-list">
        <h2>Modules</h2>
        <ul>
          {modules.map(module => (
            <li 
              key={module.id}
              className={module.status}
              onClick={() => setSelectedModule(module)}
            >
              {module.name} - {module.status}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleActivate(module.id);
                }}
                disabled={module.status === 'active'}
              >
                {module.status === 'active' ? 'Active' : 'Activate'}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {selectedModule && (
        <div className="module-details">
          <h3>{selectedModule.name}</h3>
          <p>{selectedModule.description}</p>
          <p>Status: {selectedModule.status}</p>
          {selectedModule.server && (
            <div>
              <h4>Server Details</h4>
              <pre>{JSON.stringify(selectedModule.server, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
