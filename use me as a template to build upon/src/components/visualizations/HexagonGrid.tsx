import React from 'react';
import { Stage, Layer, RegularPolygon, Text, Group } from 'react-konva';
import type { NexusCore, NexusAgent } from '../../lib/nexus/types';

interface HexagonGridProps {
  core: NexusCore | null;
  agents: Map<string, NexusAgent>;
  activeTask: string | null;
}

interface HexCell {
  id: string;
  x: number;
  y: number;
  size: number;
  type: string;
  status: string;
  data: any;
}

export default function HexagonGrid({ core, agents, activeTask }: HexagonGridProps) {
  const [cells, setCells] = React.useState<HexCell[]>([]);
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

    const hexSize = 50;
    const hexWidth = hexSize * 2;
    const hexHeight = Math.sqrt(3) * hexSize;
    const cols = Math.floor(dimensions.width / (hexWidth * 0.75));
    const rows = Math.floor(dimensions.height / hexHeight);

    const cellList: HexCell[] = [];
    let agentIndex = 0;
    const agentArray = Array.from(agents.values());

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * hexWidth * 0.75 + hexSize + (row % 2) * (hexWidth * 0.375);
        const y = row * hexHeight + hexSize;

        // Center cell is the core
        const isCenter = row === Math.floor(rows/2) && col === Math.floor(cols/2);
        const agent = agentArray[agentIndex];

        cellList.push({
          id: isCenter ? 'core' : agent?.id || `cell-${row}-${col}`,
          x,
          y,
          size: hexSize,
          type: isCenter ? 'core' : agent ? agent.type : 'empty',
          status: isCenter ? core.status : agent?.status || 'inactive',
          data: isCenter ? core : agent || null,
        });

        if (agent && !isCenter) agentIndex++;
      }
    }

    setCells(cellList);
  }, [core, agents, dimensions]);

  const getCellColor = (cell: HexCell) => {
    if (cell.type === 'core') return '#2196F3';
    if (cell.type === 'commander') return '#4CAF50';
    if (cell.type === 'executor') return '#FF9800';
    if (cell.type === 'worker') return '#9C27B0';
    return '#1E293B';
  };

  const getStatusColor = (status: string) => {
    if (status === 'active') return '#4CAF50';
    if (status === 'busy') return '#FF9800';
    if (status === 'error') return '#F44336';
    return '#9E9E9E';
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-900">
      <Stage width={dimensions.width} height={dimensions.height}>
        <Layer>
          {cells.map((cell) => (
            <Group key={cell.id}>
              <RegularPolygon
                x={cell.x}
                y={cell.y}
                sides={6}
                radius={cell.size}
                fill={getCellColor(cell)}
                stroke="#0F172A"
                strokeWidth={2}
                shadowBlur={cell.status === 'active' ? 10 : 0}
                shadowColor={getCellColor(cell)}
                rotation={30}
              />
              {cell.type !== 'empty' && (
                <>
                  <RegularPolygon
                    x={cell.x}
                    y={cell.y}
                    sides={6}
                    radius={cell.size * 0.3}
                    fill={getStatusColor(cell.status)}
                    rotation={30}
                  />
                  <Text
                    x={cell.x - cell.size * 0.8}
                    y={cell.y + cell.size * 0.6}
                    width={cell.size * 1.6}
                    text={cell.data?.name || cell.type}
                    align="center"
                    fontSize={10}
                    fill="#E2E8F0"
                  />
                </>
              )}
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  );
}