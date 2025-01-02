import React from 'react';
import { Terminal } from 'lucide-react';
import { useNexusStore } from '../stores/nexusStore';
import type { Message } from '../types';

interface CommandHistoryEntry {
  command: string;
  timestamp: number;
}

export default function NexusTerminal() {
  const { nexus, core, activeTask } = useNexusStore();
  const [input, setInput] = React.useState('');
  const [commandHistory, setCommandHistory] = React.useState<CommandHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: 'assistant',
      content: 'Initializing Central Nexus Terminal...',
    },
  ]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Command history navigation
  const navigateHistory = (direction: 'up' | 'down') => {
    if (commandHistory.length === 0) return;
    
    let newIndex = direction === 'up' ? historyIndex + 1 : historyIndex - 1;
    newIndex = Math.min(Math.max(-1, newIndex), commandHistory.length - 1);
    
    setHistoryIndex(newIndex);
    if (newIndex >= 0) {
      setInput(commandHistory[commandHistory.length - 1 - newIndex].command);
    } else {
      setInput('');
    }
  };

  React.useEffect(() => {
    if (core?.status === 'active') {
      setMessages([{
        role: 'assistant',
        content: 'Central Nexus Terminal initialized. Type "help" for available commands.',
      }]);
    }
  }, [core?.status]);

  // Update processing status based on activeTask
  React.useEffect(() => {
    setIsProcessing(!!activeTask);
  }, [activeTask]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addToHistory = (command: string) => {
    setCommandHistory(prev => [...prev, { command, timestamp: Date.now() }]);
    setHistoryIndex(-1);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    addToHistory(trimmedInput);
    const userMessage = { role: 'user' as const, content: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    if (!core || core.status !== 'active') {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'System is still initializing. Please wait...',
      }]);
      return;
    }

    try {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⏳ Processing command...',
      }]);

      const response = await nexus.processCommand(trimmedInput);
      
      if (response === '[CLEAR]') {
        setMessages([{
          role: 'assistant',
          content: 'Terminal cleared. How may I assist you?',
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.split('\n').join('\n') // Preserve line breaks
        }]);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `❌ Error: ${errorMessage}` },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-800">
      <div className="flex items-center gap-2 p-4 border-b border-gray-800">
        <Terminal className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold text-white">Central Nexus Terminal</h2>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4 max-h-[500px]">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                navigateHistory('up');
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                navigateHistory('down');
              }
            }}
            placeholder="Enter command..."
            className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
          />
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isProcessing}
            className={`px-4 py-2 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              isProcessing 
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing
              </span>
            ) : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
