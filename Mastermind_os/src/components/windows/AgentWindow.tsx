import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Settings, MessageSquare, Database, FileText, Bot, Shield } from 'lucide-react';
import type { AgentConfig, AgentAppearance, KnowledgeBaseItem } from '../../types/window';
import { useWindowStore } from '../../stores/windowStore';
import Chat from '../Chat';
import FileDropzone from '../FileDropzone';
import KnowledgeBaseEditor from '../KnowledgeBaseEditor';
import InstructionsEditor from '../InstructionsEditor';
import PermissionsEditor from '../PermissionsEditor';

interface AgentWindowProps {
  id: string;
  config?: AgentConfig;
  appearance?: AgentAppearance;
}

const DEFAULT_APPEARANCE: AgentAppearance = {
  theme: {
    primary: '#9333EA',
    secondary: '#10B981',
    accent: '#3B82F6',
  }
};

export function AgentWindow({ id, config, appearance = DEFAULT_APPEARANCE }: AgentWindowProps) {
  const { updateWindow } = useWindowStore();
  const [knowledgeBase, setKnowledgeBase] = React.useState<KnowledgeBaseItem[]>([]);
  const [instructions, setInstructions] = React.useState<string[]>([]);

  const handleAppearanceUpdate = async (updates: Partial<AgentAppearance>) => {
    updateWindow(id, {
      appearance: {
        ...appearance,
        ...updates,
      },
    });
  };

  const handleAvatarDrop = async (files: File[]) => {
    if (files[0]) {
      const avatarUrl = URL.createObjectURL(files[0]);
      handleAppearanceUpdate({ 
        avatar: avatarUrl,
        avatarFile: files[0]
      });
    }
  };

  const handleBackgroundDrop = async (files: File[]) => {
    if (files[0]) {
      const backgroundUrl = URL.createObjectURL(files[0]);
      handleAppearanceUpdate({ 
        background: backgroundUrl,
        backgroundFile: files[0]
      });
    }
  };

  const handleKnowledgeBaseChange = (items: KnowledgeBaseItem[]) => {
    setKnowledgeBase(items);
    updateWindow(id, { knowledgeBase: items });
  };

  const handleInstructionsChange = (newInstructions: string[]) => {
    setInstructions(newInstructions);
    updateWindow(id, { instructions: newInstructions });
  };

  const handleConfigUpdate = (updates: Partial<AgentConfig>) => {
    updateWindow(id, {
      agentConfig: {
        ...config,
        ...updates,
      },
    });
  };

  if (!config) return null;

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="chat" className="flex-1">
        <TabsList>
          <TabsTrigger value="chat">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="knowledge">
            <Database className="w-4 h-4 mr-2" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="instructions">
            <FileText className="w-4 h-4 mr-2" />
            Instructions
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Bot className="w-4 h-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="w-4 h-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1">
          <Chat agentId={id} knowledgeBase={knowledgeBase} instructions={instructions} />
        </TabsContent>

        <TabsContent value="knowledge" className="p-4 bg-gray-800 rounded-lg">
          <KnowledgeBaseEditor
            items={knowledgeBase}
            onChange={handleKnowledgeBaseChange}
          />
        </TabsContent>

        <TabsContent value="instructions" className="p-4 bg-gray-800 rounded-lg">
          <InstructionsEditor
            instructions={instructions}
            onChange={handleInstructionsChange}
          />
        </TabsContent>

        <TabsContent value="appearance" className="p-4 bg-gray-800 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Avatar</label>
              <FileDropzone
                accept={{ 'image/*': [] }}
                maxSize={5 * 1024 * 1024} // 5MB
                onDrop={handleAvatarDrop}
                value={appearance?.avatar || ''}
                preview={appearance?.avatar}
                onClear={() => handleAppearanceUpdate({ avatar: undefined })}
                className="aspect-square"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Background</label>
              <FileDropzone
                accept={{ 'image/*': [] }}
                maxSize={5 * 1024 * 1024} // 5MB
                onDrop={handleBackgroundDrop}
                value={appearance?.background || ''}
                preview={appearance?.background}
                onClear={() => handleAppearanceUpdate({ background: undefined })}
                className="aspect-video"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">Theme Colors</label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Primary</label>
                  <input
                    type="color"
                    value={appearance?.theme?.primary || '#9333EA'}
                    onChange={(e) =>
                      handleAppearanceUpdate({
                        theme: {
                          ...appearance?.theme,
                          primary: e.target.value,
                        },
                      })
                    }
                    className="w-full h-10 rounded cursor-pointer bg-gray-700 border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Secondary</label>
                  <input
                    type="color"
                    value={appearance?.theme?.secondary || '#10B981'}
                    onChange={(e) =>
                      handleAppearanceUpdate({
                        theme: {
                          ...appearance?.theme,
                          secondary: e.target.value,
                        },
                      })
                    }
                    className="w-full h-10 rounded cursor-pointer bg-gray-700 border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Accent</label>
                  <input
                    type="color"
                    value={appearance?.theme?.accent || '#3B82F6'}
                    onChange={(e) =>
                      handleAppearanceUpdate({
                        theme: {
                          ...appearance?.theme,
                          accent: e.target.value,
                        },
                      })
                    }
                    className="w-full h-10 rounded cursor-pointer bg-gray-700 border-gray-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="p-4 bg-gray-800 rounded-lg">
          <PermissionsEditor
            permissions={config.permissions}
            onChange={(permissions) => handleConfigUpdate({ permissions })}
          />
        </TabsContent>

        <TabsContent value="settings" className="p-4 bg-gray-800 rounded-lg">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-300">Agent Type</h3>
              <div className="flex flex-wrap gap-2">
                {config.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="px-2 py-1 text-xs bg-purple-900 text-purple-300 rounded"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            {!config.localOnly && (
              <div>
                <h3 className="text-sm font-medium mb-2 text-gray-300">AI Model</h3>
                <select
                  value={config.aiModel}
                  onChange={(e) =>
                    handleConfigUpdate({
                      aiModel: e.target.value,
                    })
                  }
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-300"
                >
                  <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-300">Monitoring</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.monitoring?.enabled || false}
                    onChange={(e) =>
                      handleConfigUpdate({
                        monitoring: {
                          ...config.monitoring,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="rounded bg-gray-700 border-gray-600 text-purple-500"
                  />
                  <span className="text-gray-300">Enable Performance Monitoring</span>
                </label>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Log Level
                  </label>
                  <select
                    value={config.monitoring?.logLevel || 'info'}
                    onChange={(e) =>
                      handleConfigUpdate({
                        monitoring: {
                          ...config.monitoring,
                          logLevel: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-300"
                  >
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}