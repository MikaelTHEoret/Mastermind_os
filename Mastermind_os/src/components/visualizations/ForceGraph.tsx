import React from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { NexusCore, NexusAgent } from '../../lib/nexus/types';

interface ForceGraphProps {
  core: NexusCore | null;
  agents: Map<string, NexusAgent>;
  activeTask: string | null;
}

export default function ForceGraph({ core, agents, activeTask }: ForceGraphProps) {
  const graphData = React.useMemo(() => {
    const nodes = [
      // Core node
      {
        id: 'core',
        name: 'Central Nexus',
        type: 'core',
        val: 20,
      },
      // Agent nodes
      ...Array.from(agents.values()).map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        val: 10,
      })),
    ];

    const links = Array.from(agents.values()).map(agent => ({
      source: 'core',
      target: agent.id,
      value: 1,
    }));

    // Add links between cooperating agents
    Array.from(agents.values()).forEach(agent => {
      if (agent.type === 'coordinator') {
        Array.from(agents.values())
          .filter(a => a.type === 'worker')
          .forEach(worker => {
            links.push({
              source: agent.id,
              target: worker.id,
              value: 0.5,
            });
          });
      }
    });

    return { nodes, links };
  }, [agents]);

  return (
    <div className="w-full h-full">
      <ForceGraph2D
        graphData={graphData}
        nodeAutoColorBy="type"
        nodeLabel={node => (node as any).name}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12/globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(
            node.x - bckgDimensions[0] / 2,
            node.y - bckgDimensions[1] / 2,
            ...bckgDimensions
          );

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = node.color;
          ctx.fillText(label, node.x, node.y);
        }}
      />
    </div>
  );
}