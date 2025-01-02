import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface InstructionsEditorProps {
  instructions: string[];
  onChange: (instructions: string[]) => void;
}

interface SortableInstructionProps {
  id: string;
  instruction: string;
  onDelete: () => void;
  onChange: (value: string) => void;
}

function SortableInstruction({ id, instruction, onDelete, onChange }: SortableInstructionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-white rounded-lg border group"
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <input
        type="text"
        value={instruction}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 p-2 bg-transparent focus:outline-none"
      />
      <button
        onClick={onDelete}
        className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function InstructionsEditor({
  instructions,
  onChange,
}: InstructionsEditorProps) {
  const [newInstruction, setNewInstruction] = React.useState('');

  const addInstruction = () => {
    if (!newInstruction.trim()) return;
    onChange([...instructions, newInstruction.trim()]);
    setNewInstruction('');
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    onChange(newInstructions);
  };

  const removeInstruction = (index: number) => {
    onChange(instructions.filter((_, i) => i !== index));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = instructions.findIndex((_, i) => `instruction-${i}` === active.id);
      const newIndex = instructions.findIndex((_, i) => `instruction-${i}` === over.id);
      const newInstructions = [...instructions];
      const [removed] = newInstructions.splice(oldIndex, 1);
      newInstructions.splice(newIndex, 0, removed);
      onChange(newInstructions);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newInstruction}
          onChange={(e) => setNewInstruction(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addInstruction()}
          placeholder="Add new instruction..."
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={addInstruction}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={instructions.map((_, i) => `instruction-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {instructions.map((instruction, index) => (
              <SortableInstruction
                key={`instruction-${index}`}
                id={`instruction-${index}`}
                instruction={instruction}
                onDelete={() => removeInstruction(index)}
                onChange={(value) => updateInstruction(index, value)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}