import React from 'react';
import type { Position } from '../types';
import { Code, Settings, Globe, Terminal, FileText, Search, ArrowDown, ArrowUp, Zap, Bot } from 'lucide-react';

interface NodePaletteProps {
  onAddNode: (type: string, position: Position) => void;
}

const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode }) => {
  const toolbarIcons = [
    { type: 'bash', name: 'Bash', icon: Terminal },
    { type: 'regex', name: 'Regex', icon: Search },
    { type: 'curl', name: 'HTTP', icon: Globe },
    { type: 'scp', name: 'SCP', icon: FileText },
    { type: 'input', name: 'Input', icon: ArrowDown },
    { type: 'output', name: 'Output', icon: ArrowUp }
  ];

  const blockCards = [
    { type: 'variable', name: 'Variable', className: 'variable' },
    { type: 'print', name: 'Print', className: 'print' },
    { type: 'assignment', name: 'Assignment', className: 'assignment' },
    { type: 'if-then', name: 'If/Then', className: 'if-then' },
    { type: 'foreach', name: 'ForEach', className: 'foreach' },
    { type: 'while', name: 'While', className: 'while' },
    { type: 'function', name: 'Function', className: 'function' },
    { type: 'execute', name: 'Execute', className: 'execute' }
  ];

  const handleClick = (nodeType: string) => {
    onAddNode(nodeType, { x: 400, y: 300 });
  };

  const handleBlockDragStart = (e: React.DragEvent, blockType: string) => {
    e.dataTransfer.setData('blockType', blockType);
  };

  return (
    <div className="left-panel">
      {/* Top 25% - Toolbar Icons */}
      <div className="left-toolbar">
        {toolbarIcons.map((toolType, index) => {
          const IconComponent = toolType.icon;
          return (
            <button
              key={toolType.type}
              onClick={() => handleClick(toolType.type)}
              className={`toolbar-button ${index === 0 ? 'active' : ''}`}
              title={toolType.name}
            >
              <IconComponent size={20} />
            </button>
          );
        })}
      </div>

      {/* Bottom 75% - Block Library */}
      <div className="block-library-section">
        <div className="library-header">Coding Blocks</div>
        <div className="block-cards-container">
          {blockCards.map((block) => (
            <div
              key={block.type}
              className={`block-card ${block.className}`}
              onClick={() => handleClick(block.type)}
              draggable
              onDragStart={(e) => handleBlockDragStart(e, block.type)}
              title={`Drag to add ${block.name} block`}
            >
              {block.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NodePalette;