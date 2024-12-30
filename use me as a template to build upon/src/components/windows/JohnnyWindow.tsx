import React from 'react';
import Chat from '../Chat';
import { useNexusStore } from '../../stores/nexusStore';

interface JohnnyWindowProps {
  id: string;
}

export function JohnnyWindow({ id }: JohnnyWindowProps) {
  const { core } = useNexusStore();

  return (
    <div className="h-full flex flex-col">
      <Chat 
        agentId={id} 
        core={core}
        agentName="Johnny Go Getter"
        defaultMessage="Hey there! I'm Johnny Go Getter, your task coordinator. I'll help manage resources and delegate tasks appropriately. What would you like me to do?"
      />
    </div>
  );
}