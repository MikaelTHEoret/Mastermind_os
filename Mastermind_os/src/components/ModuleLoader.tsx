import { useState } from 'react';
import { moduleManager } from '../lib/modules/moduleManager';
import { Button } from './ui/Button';

export const ModuleLoader = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadModule = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electron.openFileDialog({
        properties: ['openFile'],
        filters: [{ name: 'JavaScript Modules', extensions: ['js', 'mjs'] }]
      });

      if (result.canceled) {
        return;
      }

      const modulePath = result.filePaths[0];
      await moduleManager.loadModule(modulePath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load module');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="module-loader">
      <Button 
        onClick={handleLoadModule}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Load Module'}
      </Button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};
