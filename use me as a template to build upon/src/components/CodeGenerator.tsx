import React from 'react';
import { useNexusStore } from '../stores/nexusStore';
import { Code, Play, Save, Copy } from 'lucide-react';
import { cn } from '../lib/utils';

interface CodeGeneratorProps {
  agentId: string;
  agentName: string;
  specialization: string;
}

export default function CodeGenerator({ agentId, agentName, specialization }: CodeGeneratorProps) {
  const [prompt, setPrompt] = React.useState('');
  const [generatedCode, setGeneratedCode] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const { submitTask } = useNexusStore();

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    try {
      const response = await submitTask(`Generate code: ${prompt}\nSpecialization: ${specialization}`);
      setGeneratedCode(response);
    } catch (error) {
      console.error('Code generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
  };

  const handleSave = () => {
    // Implement file saving logic
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-code.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col p-4 bg-gray-900">
      <div className="flex items-center gap-2 mb-4">
        <Code className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold text-white">Code Generator</h2>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">
            Describe what you want to generate:
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the code you want to generate..."
            className="w-full h-32 p-3 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className={cn(
              "flex items-center justify-center gap-2 p-2 rounded",
              "bg-purple-600 text-white hover:bg-purple-700",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Play className="w-4 h-4" />
            {isGenerating ? 'Generating...' : 'Generate Code'}
          </button>
        </div>

        {generatedCode && (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">Generated Code:</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSave}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </div>
            <pre className="flex-1 p-4 bg-gray-800 rounded border border-gray-700 overflow-auto">
              <code className="text-gray-100">{generatedCode}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}