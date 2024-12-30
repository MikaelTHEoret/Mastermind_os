import React from 'react';
import { SendHorizontal, Bot, User, Loader2 } from 'lucide-react';
import type { Message } from '../types';
import type { NexusCore } from '../lib/nexus/types';
import { useNexusStore } from '../stores/nexusStore';
import { cn } from '../lib/utils';

interface ChatProps {
  agentId: string;
  core?: NexusCore;
  agentName: string;
  defaultMessage?: string;
}

export default function Chat({ agentId, core, agentName, defaultMessage }: ChatProps) {
  const [input, setInput] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: 'assistant',
      content: defaultMessage || "Hello! How can I help you today?",
    },
  ]);

  const { submitTask, evaluateTask } = useNexusStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Evaluate task complexity and route appropriately
      const evaluation = await evaluateTask(input);
      
      // Submit task to Nexus system
      const response = await submitTask(input);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response || "I understand your request and I'll process that right away.",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I apologize, but I encountered an error processing your request.",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] p-4 rounded-lg',
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-100'
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isProcessing}
            className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isProcessing}
            className="p-3 bg-purple-600 text-white rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <SendHorizontal className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}