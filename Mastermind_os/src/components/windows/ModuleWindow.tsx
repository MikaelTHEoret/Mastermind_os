import React from 'react';
import { useModuleStore } from '../../stores/moduleStore';
import { moduleManager } from '../../lib/modules/moduleManager';
import { Power, Settings, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ModuleWindow() {
  const { modules, activeModules } = useModuleStore();
  const [selectedModule, setSelectedModule] = React.useState<string | null>(null);

  const handleToggleModule = async (moduleId: string) => {
    try {
      if (activeModules.has(moduleId)) {
        await moduleManager.unloadModule(moduleId);
      } else {
        await moduleManager.loadModule(moduleId);
      }
    } catch (error) {
      console.error('Failed to toggle module:', error);
    }
  };

  const getModuleStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Module Manager</h2>
      <div className="flex-1 flex gap-4">
        <div className="w-1/2 bg-gray-50 rounded-lg p-4 overflow-auto">
          <div className="space-y-2">
            {modules.map((module) => (
              <div
                key={module.id}
                onClick={() => setSelectedModule(module.id)}
                className={cn(
                  'p-4 bg-white rounded-lg shadow cursor-pointer transition-colors',
                  selectedModule === module.id ? 'border-2 border-blue-500' : 'border border-gray-200',
                  'hover:border-blue-300'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{module.name}</h3>
                  <div className="flex items-center gap-2">
                    {module.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full',
                      getModuleStatusColor(module.status)
                    )}>
                      {module.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">v{module.version}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleModule(module.id);
                      }}
                      className={cn(
                        'p-1 rounded',
                        activeModules.has(module.id)
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      )}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModule(module.id);
                      }}
                      className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-1/2 bg-gray-50 rounded-lg p-4">
          {selectedModule ? (
            <ModuleDetails
              module={modules.find((m) => m.id === selectedModule)!}
              onClose={() => setSelectedModule(null)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a module to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ModuleDetailsProps {
  module: Module;
  onClose: () => void;
}

function ModuleDetails({ module, onClose }: ModuleDetailsProps) {
  const [config, setConfig] = React.useState(module.config || {});

  const handleSaveConfig = async () => {
    try {
      await moduleManager.updateModuleConfig(module.id, config);
    } catch (error) {
      console.error('Failed to update module config:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{module.name}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Capabilities</h4>
            <div className="flex flex-wrap gap-2">
              {module.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Configuration</h4>
            <div className="space-y-2">
              {Object.entries(config).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm text-gray-600 mb-1">
                    {key}
                  </label>
                  <input
                    type="text"
                    value={value as string}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSaveConfig}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}