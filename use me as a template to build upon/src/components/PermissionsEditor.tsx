import React from 'react';
import { Folder, File, Globe, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

interface NetworkPermissions {
  outbound: boolean;
  inbound: boolean;
  allowedHosts: string[];
}

interface Permissions {
  read: boolean;
  write: boolean;
  allowedPaths?: string[];
  blockedPaths?: string[];
  network?: NetworkPermissions;
}

interface PermissionsEditorProps {
  permissions?: Permissions;
  onChange: (permissions: Permissions) => void;
}

const DEFAULT_PERMISSIONS: Permissions = {
  read: false,
  write: false,
  allowedPaths: [],
  blockedPaths: ['/etc', '/usr', '/var', '/sys', '/proc', '/.git', 'node_modules'],
  network: {
    outbound: false,
    inbound: false,
    allowedHosts: ['*.openai.com', '*.anthropic.com'],
  },
};

export default function PermissionsEditor({
  permissions = DEFAULT_PERMISSIONS,
  onChange,
}: PermissionsEditorProps) {
  const [newPath, setNewPath] = React.useState('');
  const [newBlockedPath, setNewBlockedPath] = React.useState('');

  const addAllowedPath = () => {
    if (!newPath) return;
    onChange({
      ...permissions,
      allowedPaths: [...(permissions.allowedPaths || []), newPath],
    });
    setNewPath('');
  };

  const removeAllowedPath = (path: string) => {
    onChange({
      ...permissions,
      allowedPaths: permissions.allowedPaths?.filter((p) => p !== path),
    });
  };

  const addBlockedPath = () => {
    if (!newBlockedPath) return;
    onChange({
      ...permissions,
      blockedPaths: [...(permissions.blockedPaths || []), newBlockedPath],
    });
    setNewBlockedPath('');
  };

  const removeBlockedPath = (path: string) => {
    onChange({
      ...permissions,
      blockedPaths: permissions.blockedPaths?.filter((p) => p !== path),
    });
  };

  return (
    <div className="space-y-6 text-gray-100">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-medium neon-text">File System Permissions</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={permissions.read}
                onChange={(e) =>
                  onChange({ ...permissions, read: e.target.checked })
                }
                className="rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500"
              />
              <span>Allow Reading Files</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={permissions.write}
                onChange={(e) =>
                  onChange({ ...permissions, write: e.target.checked })
                }
                className="rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500"
              />
              <span>Allow Writing Files</span>
            </label>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Allowed Paths</h4>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                placeholder="/path/to/allow"
                className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
              />
              <button
                onClick={addAllowedPath}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {permissions.allowedPaths?.map((path) => (
                <div
                  key={path}
                  className={cn(
                    "flex items-center justify-between p-2 rounded border",
                    "bg-gray-800/50 border-purple-500/30",
                    "hover:border-purple-500/50 transition-colors"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-purple-400" />
                    <span>{path}</span>
                  </div>
                  <button
                    onClick={() => removeAllowedPath(path)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Blocked Paths</h4>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newBlockedPath}
                onChange={(e) => setNewBlockedPath(e.target.value)}
                placeholder="/path/to/block"
                className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
              />
              <button
                onClick={addBlockedPath}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {permissions.blockedPaths?.map((path) => (
                <div
                  key={path}
                  className={cn(
                    "flex items-center justify-between p-2 rounded border",
                    "bg-gray-800/50 border-red-500/30",
                    "hover:border-red-500/50 transition-colors"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-red-400" />
                    <span>{path}</span>
                  </div>
                  <button
                    onClick={() => removeBlockedPath(path)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-medium neon-text-cyan">Network Permissions</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={permissions.network?.outbound}
                onChange={(e) =>
                  onChange({
                    ...permissions,
                    network: {
                      ...permissions.network,
                      outbound: e.target.checked,
                    },
                  })
                }
                className="rounded bg-gray-800 border-gray-700 text-cyan-500 focus:ring-cyan-500"
              />
              <span>Allow Outbound Connections</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={permissions.network?.inbound}
                onChange={(e) =>
                  onChange({
                    ...permissions,
                    network: {
                      ...permissions.network,
                      inbound: e.target.checked,
                    },
                  })
                }
                className="rounded bg-gray-800 border-gray-700 text-cyan-500 focus:ring-cyan-500"
              />
              <span>Allow Inbound Connections</span>
            </label>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Allowed Hosts</h4>
            <div className="flex flex-wrap gap-2">
              {permissions.network?.allowedHosts.map((host) => (
                <div
                  key={host}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded border",
                    "bg-gray-800/50 border-cyan-500/30",
                    "hover:border-cyan-500/50 transition-colors"
                  )}
                >
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>{host}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}