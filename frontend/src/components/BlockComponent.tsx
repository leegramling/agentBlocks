import React, { useState, useRef } from 'react';
import type { Block, Position } from '../types';

interface BlockComponentProps {
  block: Block;
  selected: boolean;
  onSelect: (block: Block) => void;
  onDrag: (blockId: string, position: Position) => void;
}

const BlockComponent: React.FC<BlockComponentProps> = ({
  block,
  selected,
  onSelect,
  onDrag
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const blockRef = useRef<HTMLDivElement>(null);

  const getBlockIcon = (type: string): string => {
    const icons: Record<string, string> = {
      'variable_set': '📝',
      'variable_get': '📋',
      'text_input': '💬',
      'text_join': '🔗',
      'text_split': '✂️',
      'regex_match': '🔍',
      'regex_replace': '🔄',
      'curl_get': '🌐',
      'curl_post': '📤',
      'file_read': '📖',
      'file_write': '💾',
      'bash_command': '💻',
      'if_condition': '❓',
      'loop_for': '🔄',
      'loop_while': '🔁',
      'math_add': '➕',
      'math_subtract': '➖',
      'array_create': '📚',
      'array_get': '📖'
    };
    return icons[type] || '📦';
  };

  const getBlockColor = (type: string): string => {
    const colors: Record<string, string> = {
      'variable_set': 'bg-orange-600',
      'variable_get': 'bg-orange-500',
      'text_input': 'bg-green-600',
      'text_join': 'bg-green-500',
      'text_split': 'bg-green-400',
      'regex_match': 'bg-purple-600',
      'regex_replace': 'bg-purple-500',
      'curl_get': 'bg-blue-600',
      'curl_post': 'bg-blue-500',
      'file_read': 'bg-yellow-600',
      'file_write': 'bg-yellow-500',
      'bash_command': 'bg-gray-600',
      'if_condition': 'bg-red-600',
      'loop_for': 'bg-red-500',
      'loop_while': 'bg-red-400',
      'math_add': 'bg-indigo-600',
      'math_subtract': 'bg-indigo-500',
      'array_create': 'bg-pink-600',
      'array_get': 'bg-pink-500'
    };
    return colors[type] || 'bg-gray-600';
  };

  const getBlockName = (type: string): string => {
    const names: Record<string, string> = {
      'variable_set': 'Set Variable',
      'variable_get': 'Get Variable',
      'text_input': 'Text',
      'text_join': 'Join Text',
      'text_split': 'Split Text',
      'regex_match': 'Regex Match',
      'regex_replace': 'Regex Replace',
      'curl_get': 'HTTP GET',
      'curl_post': 'HTTP POST',
      'file_read': 'Read File',
      'file_write': 'Write File',
      'bash_command': 'Bash Command',
      'if_condition': 'If/Else',
      'loop_for': 'For Loop',
      'loop_while': 'While Loop',
      'math_add': 'Add',
      'math_subtract': 'Subtract',
      'array_create': 'Create Array',
      'array_get': 'Get Item'
    };
    return names[type] || type;
  };

  const renderBlockInputs = () => {
    switch (block.type) {
      case 'variable_set':
        return (
          <div className="flex items-center space-x-2 text-xs">
            <span>set</span>
            <input 
              type="text" 
              value={block.properties.variableName || 'myVar'}
              className="bg-white bg-opacity-20 rounded px-1 py-0.5 text-white text-xs w-16"
              readOnly
            />
            <span>to</span>
            <input 
              type="text" 
              value={block.properties.value || ''}
              className="bg-white bg-opacity-20 rounded px-1 py-0.5 text-white text-xs w-20"
              readOnly
            />
          </div>
        );
      case 'text_input':
        return (
          <div className="flex items-center space-x-1 text-xs">
            <input 
              type="text" 
              value={block.properties.text || 'Hello World'}
              className="bg-white bg-opacity-20 rounded px-1 py-0.5 text-white text-xs flex-1"
              readOnly
            />
          </div>
        );
      case 'bash_command':
        return (
          <div className="flex items-center space-x-1 text-xs">
            <span>run</span>
            <input 
              type="text" 
              value={block.properties.command || 'echo "Hello"'}
              className="bg-white bg-opacity-20 rounded px-1 py-0.5 text-white text-xs flex-1"
              readOnly
            />
          </div>
        );
      case 'curl_get':
        return (
          <div className="flex items-center space-x-1 text-xs">
            <span>GET</span>
            <input 
              type="text" 
              value={block.properties.url || 'https://api.example.com'}
              className="bg-white bg-opacity-20 rounded px-1 py-0.5 text-white text-xs flex-1"
              readOnly
            />
          </div>
        );
      default:
        return <span className="text-xs">{getBlockName(block.type)}</span>;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    onSelect(block);
    
    const rect = blockRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      };
      onDrag(block.id, newPosition);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={blockRef}
      className={`absolute select-none cursor-move rounded-lg shadow-lg border-2 ${
        selected ? 'border-white ring-2 ring-blue-400' : 'border-gray-600'
      } ${getBlockColor(block.type)} text-white min-w-32`}
      style={{
        left: block.position.x,
        top: block.position.y
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Connection Points */}
      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-700 rounded-full border-2 border-gray-300 cursor-pointer hover:bg-gray-600" />
      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-700 rounded-full border-2 border-gray-300 cursor-pointer hover:bg-gray-600" />

      {/* Block Content */}
      <div className="p-2">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm">{getBlockIcon(block.type)}</span>
          <span className="text-xs font-medium">{getBlockName(block.type)}</span>
        </div>
        <div className="text-white">
          {renderBlockInputs()}
        </div>
      </div>
    </div>
  );
};

export default BlockComponent;