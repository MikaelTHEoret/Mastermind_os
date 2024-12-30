import React from 'react';
import { Plus, Trash2, FileText, Image, Globe, File } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import type { KnowledgeBaseItem } from '../types/window';
import { cn } from '../lib/utils';

interface KnowledgeBaseEditorProps {
  items: KnowledgeBaseItem[];
  onChange: (items: KnowledgeBaseItem[]) => void;
}

export default function KnowledgeBaseEditor({
  items,
  onChange,
}: KnowledgeBaseEditorProps) {
  const [newItemType, setNewItemType] = React.useState<KnowledgeBaseItem['type']>('text');
  const [newItemTitle, setNewItemTitle] = React.useState('');
  const [newItemContent, setNewItemContent] = React.useState('');
  const [newItemUrl, setNewItemUrl] = React.useState('');

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: async (files) => {
      const newItems: KnowledgeBaseItem[] = [];
      
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = () => {
            newItems.push({
              id: crypto.randomUUID(),
              type: 'image',
              title: file.name,
              content: reader.result as string,
              localPath: URL.createObjectURL(file),
              metadata: {
                size: file.size,
                type: file.type,
              },
            });
          };
          reader.readAsDataURL(file);
        } else {
          const text = await file.text();
          newItems.push({
            id: crypto.randomUUID(),
            type: 'text',
            title: file.name,
            content: text,
            localPath: URL.createObjectURL(file),
            metadata: {
              size: file.size,
              type: file.type,
            },
          });
        }
      }

      onChange([...items, ...newItems]);
    },
  });

  const addNewItem = () => {
    if (!newItemTitle) return;

    const newItem: KnowledgeBaseItem = {
      id: crypto.randomUUID(),
      type: newItemType,
      title: newItemTitle,
      content: newItemContent,
      url: newItemUrl,
    };

    onChange([...items, newItem]);
    setNewItemTitle('');
    setNewItemContent('');
    setNewItemUrl('');
  };

  const removeItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const getItemIcon = (type: KnowledgeBaseItem['type']) => {
    switch (type) {
      case 'text':
        return FileText;
      case 'image':
        return Image;
      case 'webpage':
        return Globe;
      default:
        return File;
    }
  };

  return (
    <div className="space-y-4">
      <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-500">
        <input {...getInputProps()} />
        <p className="text-sm text-gray-600">
          Drag & drop files here, or click to select files
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <select
          value={newItemType}
          onChange={(e) => setNewItemType(e.target.value as KnowledgeBaseItem['type'])}
          className="p-2 border rounded"
        >
          <option value="text">Text</option>
          <option value="webpage">Webpage</option>
        </select>
        <input
          type="text"
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          placeholder="Title"
          className="flex-1 p-2 border rounded"
        />
        {newItemType === 'webpage' ? (
          <input
            type="url"
            value={newItemUrl}
            onChange={(e) => setNewItemUrl(e.target.value)}
            placeholder="URL"
            className="flex-1 p-2 border rounded"
          />
        ) : (
          <textarea
            value={newItemContent}
            onChange={(e) => setNewItemContent(e.target.value)}
            placeholder="Content"
            className="flex-1 p-2 border rounded"
            rows={1}
          />
        )}
        <button
          onClick={addNewItem}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const ItemIcon = getItemIcon(item.type);
          return (
            <div
              key={item.id}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
            >
              <ItemIcon className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <h4 className="font-medium">{item.title}</h4>
                <p className="text-sm text-gray-500">
                  {item.type === 'webpage' ? item.url : `${item.content.slice(0, 50)}...`}
                </p>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}