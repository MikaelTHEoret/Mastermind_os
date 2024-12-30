import React from 'react';
import { Terminal } from 'lucide-react';
import { useNexusStore } from '../stores/nexusStore';
import type { Message } from '../types';

interface NexusTerminalProps {
  logs: any[];
}

export default function NexusTerminal({ logs }: NexusTerminalProps) {
  const { nexus, core } = useNexusStore();
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: 'assistant',
      content: 'Initializing Central Nexus Terminal...',
    },
  ]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (core?.status === 'active') {
      setMessages([{
        role: 'assistant',
        content: 'Central Nexus Terminal initialized. Type "help" for available commands.',
      }]);
    }
  }, [core?.status]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    if (!core || core.status !== 'active') {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'System is still initializing. Please wait...',
      }]);
      return;
    }

    try {
      console.log('Processing command:', input);
      console.log('Nexus initialized:', nexus.isInitialized());
      console.log('Core status:', core?.status);
      
      const response = await nexus.processCommand(input);
      console.log('Command response:', response);
      
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
      const message = error instanceof Error ? error.message : String(error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Error: ${message}` },
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
              }
            }}
            placeholder="Enter command..."
            className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
          />
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
