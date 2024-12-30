import React from 'react';
import { Stage, Layer, Circle, Line, Text, Group } from 'react-konva';
import type { NexusCore, NexusAgent } from '../../lib/nexus/types';

interface NeuralNetworkProps {
  core: NexusCore | null;
  agents: Map<string, NexusAgent>;
  activeTask: string | null;
}

interface Neuron {
  id: string;
  x: number;
  y: number;
  type: string;
  layer: number;
  index: number;
  name: string;
  active: boolean;
}

interface Synapse {
  from: string;
  to: string;
  weight: number;
  active: boolean;
}

export default function NeuralNetwork({ core, agents, activeTask }: NeuralNetworkProps) {
  const [neurons, setNeurons] = React.useState<Neuron[]>([]);
  const [synapses, setSynapses] = React.useState<Synapse[]>([]);
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
    // Create neural network layout
    const neuronList: Neuron[] = [];
    const synapseList: Synapse[] = [];

    // Define layers
    const layers = [
      { type: 'input', count: 3 },
      { type: 'hidden', count: 5 },
      { type: 'core', count: 1 },
      { type: 'hidden', count: 5 },
      { type: 'output', count: 3 },
    ];

    const layerSpacing = dimensions.width / (layers.length + 1);
    const maxNeurons = Math.max(...layers.map(l => l.count));
    const neuronSpacing = dimensions.height / (maxNeurons + 1);

    // Create neurons for each layer
    layers.forEach((layer, layerIndex) => {
      const startY = (dimensions.height - (layer.count * neuronSpacing)) / 2;

      for (let i = 0; i < layer.count; i++) {
        const id = `${layer.type}-${layerIndex}-${i}`;
        neuronList.push({
          id,
          x: layerSpacing * (layerIndex + 1),
          y: startY + (i * neuronSpacing),
          type: layer.type,
          layer: layerIndex,
          index: i,
          name: layer.type === 'core' ? 'Central Nexus' : `${layer.type}-${i}`,
          active: layer.type === 'core' || Math.random() > 0.5,
        });
      }
    });

    // Create synapses between layers
    for (let l = 0; l < layers.length - 1; l++) {
      const currentLayer = neuronList.filter(n => n.layer === l);
      const nextLayer = neuronList.filter(n => n.layer === l + 1);

      currentLayer.forEach(from => {
        nextLayer.forEach(to => {
          synapseList.push({
            from: from.id,
            to: to.id,
            weight: Math.random(),
            active: from.active && to.active,
          });
        });
      });
    }

    setNeurons(neuronList);
    setSynapses(synapseList);
  }, [dimensions, agents]);

  const pulseAnimation = React.useCallback((node: any) => {
    const amplitude = 1.2;
    const period = 1;
    
    node.to({
      scaleX: amplitude,
      scaleY: amplitude,
      duration: period / 2,
      easing: (t: number) => (1 - Math.cos(Math.PI * t)) / 2,
      onFinish: () => {
        node.to({
          scaleX: 1,
          scaleY: 1,
          duration: period / 2,
          easing: (t: number) => (1 - Math.cos(Math.PI * t)) / 2,
        });
      },
    });
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-900">
      <Stage width={dimensions.width} height={dimensions.height}>
        <Layer>
          {/* Draw synapses */}
          {synapses.map((synapse, i) => {
            const from = neurons.find(n => n.id === synapse.from);
            const to = neurons.find(n => n.id === synapse.to);
            if (!from || !to) return null;

            return (
              <React.Fragment key={`synapse-${i}`}>
                <Line
                  points={[from.x, from.y, to.x, to.y]}
                  stroke={synapse.active ? '#4CAF50' : '#1E293B'}
                  strokeWidth={synapse.weight * 2}
                  opacity={0.6}
                  shadowBlur={synapse.active ? 10 : 0}
                  shadowColor="#4CAF50"
                />
                {synapse.active && (
                  <Circle
                    x={from.x + (to.x - from.x) * 0.5}
                    y={from.y + (to.y - from.y) * 0.5}
                    radius={2}
                    fill="#4CAF50"
                    shadowBlur={5}
                    shadowColor="#4CAF50"
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Draw neurons */}
          {neurons.map(neuron => (
            <Group key={neuron.id}>
              <Circle
                x={neuron.x}
                y={neuron.y}
                radius={neuron.type === 'core' ? 25 : 15}
                fill={neuron.active ? '#4CAF50' : '#1E293B'}
                stroke="#0F172A"
                strokeWidth={2}
                shadowBlur={neuron.active ? 15 : 5}
                shadowColor={neuron.active ? '#4CAF50' : '#1E293B'}
                onMouseEnter={e => pulseAnimation(e.target)}
              />
              <Text
                x={neuron.x - 40}
                y={neuron.y + 20}
                width={80}
                text={neuron.name}
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