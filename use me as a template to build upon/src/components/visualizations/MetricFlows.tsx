import React from 'react';
import { Stage, Layer, Circle, Line, Text, Group } from 'react-konva';
import type { NexusCore, NexusAgent } from '../../lib/nexus/types';

interface MetricFlowsProps {
  core: NexusCore | null;
  agents: Map<string, NexusAgent>;
  activeTask: string | null;
}

interface MetricNode {
  id: string;
  x: number;
  y: number;
  type: string;
  name: string;
  value: number;
  maxValue: number;
  color: string;
}

interface Flow {
  from: string;
  to: string;
  value: number;
  type: string;
}

export default function MetricFlows({ core, agents, activeTask }: MetricFlowsProps) {
  const [nodes, setNodes] = React.useState<MetricNode[]>([]);
  const [flows, setFlows] = React.useState<Flow[]>([]);
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

    // Create metric nodes
    const nodeList: MetricNode[] = [];
    const flowList: Flow[] = [];

    // Center node (Core)
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    nodeList.push({
      id: 'core',
      x: centerX,
      y: centerY,
      type: 'core',
      name: 'Central Nexus',
      value: 100,
      maxValue: 100,
      color: '#2196F3',
    });

    // Resource nodes
    const resourceMetrics = [
      { id: 'cpu', name: 'CPU', value: core.resourceUsage.cpu, color: '#F44336' },
      { id: 'memory', name: 'Memory', value: core.resourceUsage.memory, color: '#4CAF50' },
      { id: 'network', name: 'Network', value: core.resourceUsage.network, color: '#FF9800' },
      { id: 'storage', name: 'Storage', value: core.resourceUsage.storage, color: '#9C27B0' },
    ];

    const radius = Math.min(dimensions.width, dimensions.height) * 0.3;
    resourceMetrics.forEach((metric, index) => {
      const angle = (index / resourceMetrics.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      nodeList.push({
        id: metric.id,
        x,
        y,
        type: 'resource',
        name: metric.name,
        value: metric.value,
        maxValue: 100,
        color: metric.color,
      });

      // Add flow from core to resource
      flowList.push({
        from: 'core',
        to: metric.id,
        value: metric.value,
        type: 'resource',
      });
    });

    setNodes(nodeList);
    setFlows(flowList);
  }, [core, dimensions]);

  const drawFlowParticles = (ctx: CanvasRenderingContext2D, flow: Flow) => {
    const fromNode = nodes.find(n => n.id === flow.from);
    const toNode = nodes.find(n => n.id === flow.to);
    if (!fromNode || !toNode) return;

    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Calculate particle positions based on time
    const now = Date.now();
    const speed = 0.001; // Adjust for desired particle speed
    const particleCount = Math.ceil(flow.value / 10);

    for (let i = 0; i < particleCount; i++) {
      const offset = (now * speed + i * (1 / particleCount)) % 1;
      const x = fromNode.x + dx * offset;
      const y = fromNode.y + dy * offset;

      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = toNode.color;
      ctx.fill();
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-900">
      <Stage width={dimensions.width} height={dimensions.height}>
        <Layer>
          {/* Draw flows */}
          {flows.map((flow, i) => {
            const fromNode = nodes.find(n => n.id === flow.from);
            const toNode = nodes.find(n => n.id === flow.to);
            if (!fromNode || !toNode) return null;

            return (
              <Group key={`flow-${i}`}>
                <Line
                  points={[fromNode.x, fromNode.y, toNode.x, toNode.y]}
                  stroke={toNode.color}
                  strokeWidth={Math.max(1, flow.value / 20)}
                  opacity={0.3}
                  lineCap="round"
                  shadowBlur={5}
                  shadowColor={toNode.color}
                />
              </Group>
            );
          })}

          {/* Draw nodes */}
          {nodes.map(node => (
            <Group key={node.id}>
              {/* Background circle */}
              <Circle
                x={node.x}
                y={node.y}
                radius={node.type === 'core' ? 40 : 30}
                fill="#1E293B"
                stroke={node.color}
                strokeWidth={2}
                shadowBlur={10}
                shadowColor={node.color}
              />

              {/* Progress circle */}
              <Arc
                x={node.x}
                y={node.y}
                angle={(node.value / node.maxValue) * 360}
                innerRadius={node.type === 'core' ? 35 : 25}
                outerRadius={node.type === 'core' ? 40 : 30}
                fill={node.color}
                rotation={-90}
              />

              <Text
                x={node.x - 40}
                y={node.y - 8}
                width={80}
                text={node.name}
                align="center"
                fontSize={12}
                fill="#E2E8F0"
              />

              <Text
                x={node.x - 40}
                y={node.y + 8}
                width={80}
                text={`${Math.round(node.value)}%`}
                align="center"
                fontSize={10}
                fill="#94A3B8"
              />
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  );
}