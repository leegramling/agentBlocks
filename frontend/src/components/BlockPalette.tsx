import React, { useState } from 'react';
import type { Position } from '../types';

interface BlockPaletteProps {
  onAddBlock: (type: string, position: Position) => void;
}

const BlockPalette: React.FC<BlockPaletteProps> = ({ onAddBlock }) => {
  const [activeCategory, setActiveCategory] = useState('Variables');

  const blockCategories = {
    'Variables': [
      { type: 'variable_set', name: 'Set Variable', icon: '📝', color: 'bg-orange-600' },
      { type: 'variable_get', name: 'Get Variable', icon: '📋', color: 'bg-orange-500' }
    ],
    'Text': [
      { type: 'text_input', name: 'Text', icon: '💬', color: 'bg-green-600' },
      { type: 'text_join', name: 'Join Text', icon: '🔗', color: 'bg-green-500' },
      { type: 'text_split', name: 'Split Text', icon: '✂️', color: 'bg-green-400' },
      { type: 'regex_match', name: 'Regex Match', icon: '🔍', color: 'bg-purple-600' },
      { type: 'regex_replace', name: 'Regex Replace', icon: '🔄', color: 'bg-purple-500' }
    ],
    'Network': [
      { type: 'curl_get', name: 'HTTP GET', icon: '🌐', color: 'bg-blue-600' },
      { type: 'curl_post', name: 'HTTP POST', icon: '📤', color: 'bg-blue-500' },
      { type: 'curl_put', name: 'HTTP PUT', icon: '📝', color: 'bg-blue-400' }
    ],
    'Files': [
      { type: 'file_read', name: 'Read File', icon: '📖', color: 'bg-yellow-600' },
      { type: 'file_write', name: 'Write File', icon: '💾', color: 'bg-yellow-500' },
      { type: 'file_copy', name: 'Copy File', icon: '📋', color: 'bg-yellow-400' }
    ],
    'System': [
      { type: 'bash_command', name: 'Bash Command', icon: '💻', color: 'bg-gray-600' },
      { type: 'env_get', name: 'Get Environment', icon: '🌍', color: 'bg-gray-500' },
      { type: 'sleep', name: 'Sleep', icon: '😴', color: 'bg-gray-400' }
    ],
    'Logic': [
      { type: 'if_condition', name: 'If/Else', icon: '❓', color: 'bg-red-600' },
      { type: 'loop_for', name: 'For Loop', icon: '🔄', color: 'bg-red-500' },
      { type: 'loop_while', name: 'While Loop', icon: '🔁', color: 'bg-red-400' }
    ],
    'Math': [
      { type: 'math_add', name: 'Add', icon: '➕', color: 'bg-indigo-600' },
      { type: 'math_subtract', name: 'Subtract', icon: '➖', color: 'bg-indigo-500' },
      { type: 'math_multiply', name: 'Multiply', icon: '✖️', color: 'bg-indigo-400' },
      { type: 'math_divide', name: 'Divide', icon: '➗', color: 'bg-indigo-300' }
    ],
    'Arrays': [
      { type: 'array_create', name: 'Create Array', icon: '📚', color: 'bg-pink-600' },
      { type: 'array_get', name: 'Get Item', icon: '📖', color: 'bg-pink-500' },
      { type: 'array_append', name: 'Add Item', icon: '➕', color: 'bg-pink-400' },
      { type: 'array_length', name: 'Array Length', icon: '📏', color: 'bg-pink-300' }
    ]
  };

  const handleDragStart = (e: React.DragEvent, blockType: string) => {
    e.dataTransfer.setData('blockType', blockType);
  };

  const handleClick = (blockType: string) => {
    onAddBlock(blockType, { x: 400, y: 300 });
  };

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Categories */}
      <div className="border-b border-gray-700">
        <div className="p-2">
          <h3 className="text-sm font-semibold text-white mb-2">Block Categories</h3>
          <div className="grid grid-cols-2 gap-1">
            {Object.keys(blockCategories).map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`text-xs p-2 rounded transition-colors ${
                  activeCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Blocks */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <h4 className="text-xs font-medium text-gray-400 mb-2">{activeCategory}</h4>
          <div className="space-y-1">
            {blockCategories[activeCategory as keyof typeof blockCategories]?.map(block => (
              <div
                key={block.type}
                draggable
                onDragStart={(e) => handleDragStart(e, block.type)}
                onClick={() => handleClick(block.type)}
                className={`${block.color} rounded-lg p-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg border border-gray-600 hover:border-gray-400`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{block.icon}</span>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-white">
                      {block.name}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="p-3 border-t border-gray-700 bg-gray-900">
        <div className="text-xs text-gray-400 space-y-1">
          <div className="font-medium">💡 Usage:</div>
          <div>• Drag blocks to canvas</div>
          <div>• Click to add at center</div>
          <div>• Connect blocks to build logic</div>
        </div>
      </div>
    </div>
  );
};

export default BlockPalette;