import React from 'react';
import { useNexusStore } from '../stores/nexusStore';
import ForceGraph from './visualizations/ForceGraph';
import CircuitBoard from './visualizations/CircuitBoard';
import NeuralNetwork from './visualizations/NeuralNetwork';
import MetricFlows from './visualizations/MetricFlows';
import HexagonGrid from './visualizations/HexagonGrid';
import TreeView from './visualizations/TreeView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Network, 
  Cpu, 
  Brain, 
  Activity,
  Grid,
  GitBranch,
} from 'lucide-react';

const VIEW_MODES = [
  {
    id: 'force',
    name: 'Network Topology',
    icon: Network,
    description: 'Network topology and agent relationships',
    component: ForceGraph,
  },
  {
    id: 'circuit',
    name: 'Circuit View',
    icon: Cpu,
    description: 'Data flow and process pathways',
    component: CircuitBoard,
  },
  {
    id: 'neural',
    name: 'Neural View',
    icon: Brain,
    description: 'AI model interactions and knowledge flow',
    component: NeuralNetwork,
  },
  {
    id: 'metrics',
    name: 'Metric Flows',
    icon: Activity,
    description: 'Real-time performance and resource utilization',
    component: MetricFlows,
  },
  {
    id: 'hexgrid',
    name: 'Hex Grid',
    icon: Grid,
    description: 'Cellular organization of system components',
    component: HexagonGrid,
  },
  {
    id: 'tree',
    name: 'Hierarchy',
    icon: GitBranch,
    description: 'Command hierarchy and agent relationships',
    component: TreeView,
  },
];

export default function Visualizer() {
  const { core, agents, activeTask } = useNexusStore();
  const [selectedMode, setSelectedMode] = React.useState(VIEW_MODES[0].id);

  const ActiveComponent = VIEW_MODES.find(mode => mode.id === selectedMode)?.component;

  if (!ActiveComponent) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">System Visualization</h2>
      </div>

      <Tabs value={selectedMode} onValueChange={setSelectedMode} className="flex-1">
        <TabsList>
          {VIEW_MODES.map(mode => (
            <TabsTrigger key={mode.id} value={mode.id}>
              <mode.icon className="w-4 h-4 mr-2" />
              {mode.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {VIEW_MODES.map(mode => (
          <TabsContent key={mode.id} value={mode.id} className="flex-1">
            <div className="p-2 mb-4 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-300">{mode.description}</p>
            </div>
            <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden">
              <ActiveComponent
                core={core}
                agents={agents}
                activeTask={activeTask}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}