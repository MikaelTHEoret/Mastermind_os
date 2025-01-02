import React from 'react';
import { Stage, Layer, Circle, Line, Text } from 'react-konva';
import type { NexusCore, NexusAgent } from '../../lib/nexus/types';

interface CircuitBoardProps {
  core: NexusCore | null;
  agents: Map<string, NexusAgent>;
  activeTask: string | null;
}

interface Node {
  id: string;
  x: number;
  y: number;
  type: string;
  name: string;
}

interface Connection {
  from: string;
  to: string;
  active: boolean;
}

export default function CircuitBoard({ core, agents, activeTask }: CircuitBoardProps) {
  const [nodes, setNodes] = React.useState<Node[]>([]);
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [dimensions, setDimensions] = React.useState({ width: 800, height: 600 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        if (offsetWidth > 0 && offsetHeight > 0) {
          setDimensions({
            width: offsetWidth,
            height: offsetHeight,
          });
          setIsReady(true);
        }
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  React.useEffect(() => {
    if (!core || !isReady) return;

    const nodeList: Node[] = [];
    const connectionList: Connection[] = [];

    // Position core at the center
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    nodeList.push({
      id: 'core',
      x: centerX,
      y: centerY,
      type: 'core',
      name: 'Central Nexus',
    });

    // Position agents in a circular pattern
    const radius = Math.min(dimensions.width, dimensions.height) * 0.3;
    const agentArray = Array.from(agents.values());
    
    agentArray.forEach((agent, index) => {
      const angle = (index / agentArray.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      nodeList.push({
        id: agent.id,
        x,
        y,
        type: agent.type,
        name: agent.name,
      });

      connectionList.push({
        from: 'core',
        to: agent.id,
        active: agent.status === 'active',
      });
    });

    setNodes(nodeList);
    setConnections(connectionList);
  }, [core, agents, dimensions, isReady]);

  if (!isReady) {
    return <div ref={containerRef} className="w-full h-full" />;
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      <Stage width={dimensions.width} height={dimensions.height}>
        <Layer>
          {connections.map((conn, i) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            return (
              <React.Fragment key={`conn-${i}`}>
                <Line
                  points={[fromNode.x, fromNode.y, toNode.x, toNode.y]}
                  stroke={conn.active ? '#4CAF50' : '#9E9E9E'}
                  strokeWidth={2}
                  dash={conn.active ? undefined : [5, 5]}
                />
                {conn.active && (
                  <Circle
                    x={fromNode.x + (toNode.x - fromNode.x) * 0.5}
                    y={fromNode.y + (toNode.y - fromNode.y) * 0.5}
                    radius={4}
                    fill="#4CAF50"
                    shadowBlur={10}
                    shadowColor="#4CAF50"
                  />
                )}
              </React.Fragment>
            );
          })}

          {nodes.map(node => (
            <React.Fragment key={node.id}>
              <Circle
                x={node.x}
                y={node.y}
                radius={node.type === 'core' ? 30 : 20}
                fill={node.type === 'core' ? '#2196F3' : '#607D8B'}
                stroke="#fff"
                strokeWidth={2}
                shadowBlur={15}
                shadowColor={node.type === 'core' ? '#2196F3' : '#607D8B'}
              />
              <Text
                x={node.x - 50}
                y={node.y + 30}
                width={100}
                text={node.name}
                align="center"
                fontSize={12}
                fill="#fff"
              />
            </React.Fragment>
          ))}
        </Layer>
      </Stage>
    </div>
  );
}