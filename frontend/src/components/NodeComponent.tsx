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
      // Original node types
      bash: '💻',
      regex: '🔍',
      curl: '🌐',
      scp: '📁',
      input: '⬇️',
      output: '⬆️',
      conditional: '❓',
      loop: '🔄',
      transform: '⚙️',
      agent: '🤖',
      // New coding block types
      variable: '📦',
      assignment: '➡️',
      'if-then': '🔀',
      foreach: '🔁',
      while: '⭕',
      function: '🔧',
      execute: '▶️',
      print: '🖨️'
    };
    return icons[type] || '📦';
  };

  const getNodeColor = (type: string) => {
    const colors: Record<string, string> = {
      // Original node types
      bash: '#3b82f6',
      regex: '#8b5cf6',
      curl: '#10b981',
      scp: '#f97316',
      input: '#6b7280',
      output: '#6b7280',
      conditional: '#eab308',
      loop: '#ef4444',
      transform: '#6366f1',
      agent: '#ec4899',
      // New coding block types (matching left panel colors)
      variable: '#f97316',
      assignment: '#eab308',
      'if-then': '#22c55e',
      foreach: '#8b5cf6',
      while: '#ec4899',
      function: '#3b82f6',
      execute: '#ef4444',
      print: '#10b981'
    };
    return colors[type] || '#6b7280';
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

  const getNodeProperties = () => {
    switch (node.type) {
      case 'variable':
        return (
          <div style={{fontSize: '12px', color: '#d1d5db', marginTop: '4px'}}>
            <strong>Value:</strong> {node.properties.value || 'hello world'}
          </div>
        );
      case 'print':
        return (
          <div style={{fontSize: '12px', color: '#d1d5db', marginTop: '4px'}}>
            <strong>Message:</strong> {node.properties.message || 'Hello, World!'}
          </div>
        );
      default:
        return null;
    }
  };

  const hasInput = () => {
    // Nodes that can receive input from previous nodes
    return ['print', 'assignment', 'if-then', 'foreach', 'while', 'execute'].includes(node.type);
  };

  const hasOutput = () => {
    // Nodes that can send output to next nodes
    return ['variable', 'assignment', 'if-then', 'foreach', 'while', 'function'].includes(node.type);
  };

  return (
    <div
      ref={nodeRef}
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        minWidth: '180px',
        userSelect: 'none',
        cursor: 'move',
        outline: selected ? '2px solid #60a5fa' : 'none',
        borderRadius: '8px'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Connection Bar */}
      <div 
        style={{
          position: 'absolute',
          left: '-8px',
          top: '0',
          bottom: '0',
          width: '4px',
          backgroundColor: '#374151',
          borderRadius: '2px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 0'
        }}
      >
        {/* Input Dot (Blue) */}
        {hasInput() && (
          <div 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              border: '1px solid #1e40af',
              marginTop: '4px'
            }}
          />
        )}
        
        {/* Output Dot (Green) */}
        {hasOutput() && (
          <div 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              border: '1px solid #047857',
              marginBottom: '4px'
            }}
          />
        )}
      </div>
      <div 
        style={{
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          border: `2px solid ${selected ? '#60a5fa' : '#4b5563'}`,
          backgroundColor: '#1f2937',
          overflow: 'hidden'
        }}
      >
        {/* Node Header */}
        <div 
          style={{
            backgroundColor: getNodeColor(node.type),
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span style={{fontSize: '18px'}}>{getNodeIcon(node.type)}</span>
          <div style={{flex: 1}}>
            <div style={{
              fontWeight: '600',
              color: '#ffffff',
              fontSize: '14px'
            }}>
              {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              ID: {node.id.split('_')[1]}
            </div>
          </div>
        </div>

        {/* Node Body */}
        <div style={{padding: '12px'}}>
          {getNodeProperties()}
          
          {/* Simplified display - no complex inputs/outputs for coding blocks */}
          <div style={{
            marginTop: '8px',
            fontSize: '11px',
            color: '#9ca3af',
            textAlign: 'center'
          }}>
            Double-click to edit • Click to select
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeComponent;