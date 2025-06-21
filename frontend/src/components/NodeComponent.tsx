import React, { useState, useRef } from 'react';
import type { WorkflowNode, Position } from '../types';

interface NodeComponentProps {
  node: WorkflowNode;
  selected: boolean;
  onSelect: (node: WorkflowNode) => void;
  onDrag: (nodeId: string, position: Position) => void;
  onStartConnection: (nodeId: string, outputId: string) => void;
  onCompleteConnection: (nodeId: string, inputId: string) => void;
  connecting: { nodeId: string; outputId: string } | null;
}

const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  selected,
  onSelect,
  onDrag,
  onStartConnection,
  onCompleteConnection,
  connecting
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const getNodeIcon = (type: string) => {
    const icons: Record<string, string> = {
      bash: '💻',
      regex: '🔍',
      curl: '🌐',
      scp: '📁',
      input: '⬇️',
      output: '⬆️',
      conditional: '❓',
      loop: '🔄',
      transform: '⚙️',
      agent: '🤖'
    };
    return icons[type] || '📦';
  };

  const getNodeColor = (type: string) => {
    const colors: Record<string, string> = {
      bash: 'bg-blue-600',
      regex: 'bg-purple-600',
      curl: 'bg-green-600',
      scp: 'bg-orange-600',
      input: 'bg-gray-600',
      output: 'bg-gray-600',
      conditional: 'bg-yellow-600',
      loop: 'bg-red-600',
      transform: 'bg-indigo-600',
      agent: 'bg-pink-600'
    };
    return colors[type] || 'bg-gray-600';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.detail === 2) {
      // Double click - open block editor
      window.open(`/block-editor/${node.id}`, '_blank');
      return;
    }

    setIsDragging(true);
    onSelect(node);
    
    const rect = nodeRef.current?.getBoundingClientRect();
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
      onDrag(node.id, newPosition);
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

  const handleOutputClick = (outputId: string) => {
    onStartConnection(node.id, outputId);
  };

  const handleInputClick = (inputId: string) => {
    if (connecting && connecting.nodeId !== node.id) {
      onCompleteConnection(node.id, inputId);
    }
  };

  return (
    <div
      ref={nodeRef}
      className={`absolute select-none cursor-move ${
        selected ? 'ring-2 ring-blue-400' : ''
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
        minWidth: '200px'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className={`rounded-lg shadow-lg border-2 ${
        selected ? 'border-blue-400' : 'border-gray-600'
      } bg-gray-800`}>
        {/* Node Header */}
        <div className={`${getNodeColor(node.type)} rounded-t-lg p-3 flex items-center space-x-2`}>
          <span className="text-lg">{getNodeIcon(node.type)}</span>
          <div className="flex-1">
            <div className="font-medium text-white text-sm">
              {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
            </div>
            <div className="text-xs text-white opacity-75">
              {node.id}
            </div>
          </div>
        </div>

        {/* Node Body */}
        <div className="p-3">
          {/* Inputs */}
          {node.inputs.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-gray-400 mb-1">Inputs</div>
              {node.inputs.map(input => (
                <div
                  key={input.id}
                  onClick={() => handleInputClick(input.id)}
                  className="flex items-center space-x-2 text-xs text-gray-300 mb-1 cursor-pointer hover:text-white"
                >
                  <div className={`w-2 h-2 rounded-full border-2 ${
                    connecting ? 'border-green-400' : 'border-gray-500'
                  }`} />
                  <span>{input.name}</span>
                  {input.required && <span className="text-red-400">*</span>}
                </div>
              ))}
            </div>
          )}

          {/* Outputs */}
          {node.outputs.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-1">Outputs</div>
              {node.outputs.map(output => (
                <div
                  key={output.id}
                  onClick={() => handleOutputClick(output.id)}
                  className="flex items-center justify-end space-x-2 text-xs text-gray-300 mb-1 cursor-pointer hover:text-white"
                >
                  <span>{output.name}</span>
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Double-click hint */}
        <div className="px-3 pb-2">
          <div className="text-xs text-gray-500 text-center">
            Double-click to edit blocks
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeComponent;