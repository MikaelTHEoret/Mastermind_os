import React from 'react';
import { Stage, Layer, Circle, Line, Text, Group } from 'react-konva';
import type { NexusCore, NexusAgent } from '../../lib/nexus/types';

interface TreeViewProps {
  core: NexusCore | null;
  agents: Map<string, NexusAgent>;
  activeTask: string | null;
}

interface TreeNode {
  id: string;
  x: number;
  y: number;
  level: number;
  type: string;
  name: string;
  status: string;
  children: TreeNode[];
}

export default function TreeView({ core, agents, activeTask }: TreeViewProps) {
  const [root, setRoot] = React.useState<TreeNode | null>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    }
  }, []);

  React.useEffect(() => {
    if (!core) return;

    // Build tree structure
    const buildTree = () => {
      const agentArray = Array.from(agents.values());
      const commanders = agentArray.filter(a => a.type === 'commander');
      const executors = agentArray.filter(a => a.type === 'executor');
      const workers = agentArray.filter(a => a.type === 'worker');

      const tree: TreeNode = {
        id: 'core',
        x: dimensions.width / 2,
        y: 50,
        level: 0,
        type: 'core',
        name: 'Central Nexus',
        status: core.status,
        children: commanders.map((commander, i) => ({
          id: commander.id,
          x: 0,
          y: 0,
          level: 1,
          type: commander.type,
          name: commander.name,
          status: commander.status,
          children: executors.map((executor, j) => ({
            id: executor.id,
            x: 0,
            y: 0,
            level: 2,
            type: executor.type,
            name: executor.name,
            status: executor.status,
            children: workers.map((worker, k) => ({
              id: worker.id,
              x: 0,
              y: 0,
              level: 3,
              type: worker.type,
              name: worker.name,
              status: worker.status,
              children: [],
            })),
          })),
        })),
      };

      // Calculate positions
      const levelHeight = dimensions.height / 4;
      const positionNode = (node: TreeNode, left: number, right: number, level: number) => {
        node.y = level * levelHeight + 50;
        
        if (node.children.length === 0) {
          node.x = (left + right) / 2;
          return;
        }

        const width = right - left;
        const step = width / node.children.length;
        
        node.children.forEach((child, i) => {
          positionNode(child, left + i * step, left + (i + 1) * step, level + 1);
        });
        
        node.x = (node.children[0].x + node.children[node.children.length - 1].x) / 2;
      };

      positionNode(tree, 0, dimensions.width, 0);
      return tree;
    };

    setRoot(buildTree());
  }, [core, agents, dimensions]);

  const renderNode = (node: TreeNode) => {
    const getNodeColor = () => {
      switch (node.type) {
        case 'core': return '#2196F3';
        case 'commander': return '#4CAF50';
        case 'executor': return '#FF9800';
        case 'worker': return '#9C27B0';
        default: return '#1E293B';
      }
    };

    return (
      <React.Fragment key={node.id}>
        {node.children.map(child => (
          <React.Fragment key={`${node.id}-${child.id}`}>
            <Line
              points={[node.x, node.y, child.x, child.y]}
              stroke="#1E293B"
              strokeWidth={2}
              opacity={0.5}
            />
            {renderNode(child)}
          </React.Fragment>
        ))}
        <Group x={node.x} y={node.y}>
          <Circle
            radius={25}
            fill={getNodeColor()}
            stroke="#0F172A"
            strokeWidth={2}
            shadowBlur={node.status === 'active' ? 10 : 0}
            shadowColor={getNodeColor()}
          />
          <Text
            x={-40}
            y={-8}
            width={80}
            text={node.name}
            align="center"
            fontSize={10}
            fill="#E2E8F0"
          />
          <Text
            x={-40}
            y={8}
            width={80}
            text={node.type}
            align="center"
            fontSize={8}
            fill="#94A3B8"
          />
        </Group>
      </React.Fragment>
    );
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-900">
      <Stage width={dimensions.width} height={dimensions.height}>
        <Layer>
          {root && renderNode(root)}
        </Layer>
      </Stage>
    </div>
  );
}