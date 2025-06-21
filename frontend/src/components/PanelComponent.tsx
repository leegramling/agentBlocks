import React, { useState, useRef } from 'react';
import type { WorkflowPanel, WorkflowNode, Position } from '../types';

interface PanelComponentProps {
  panel: WorkflowPanel;
  nodes: WorkflowNode[];
  selected: boolean;
  onSelect: (panel: WorkflowPanel) => void;
  onDrag: (panelId: string, position: Position) => void;
  onResize: (panelId: string, size: { width: number; height: number }) => void;
  onNodeDrop: (panelId: string, position: Position, blockType: string, insertAfterNodeId?: string) => void;
  onToggleExpanded: (panelId: string) => void;
  onNodeDrag: (nodeId: string, position: Position) => void;
}

const PanelComponent: React.FC<PanelComponentProps> = ({
  panel,
  nodes,
  selected,
  onSelect,
  onDrag,
  onResize,
  onNodeDrop,
  onToggleExpanded,
  onNodeDrag
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Calculate panel nodes and their bounds
  const panelNodes = nodes.filter(node => node.panelId === panel.id);
  
  // Calculate minimum panel size based on nodes
  const calculateMinSize = () => {
    if (panelNodes.length === 0) {
      return { width: 280, height: panel.isExpanded ? 120 : 40 };
    }

    if (!panel.isExpanded) {
      return { width: 280, height: 40 }; // Collapsed height
    }

    // Panel should be exactly node width + padding
    const nodeWidth = 220;
    const padding = 32; // 16px on each side
    const nodeHeight = 44;
    const nodeSpacing = 8;
    
    const headerHeight = 40;
    const contentHeight = (panelNodes.length * nodeHeight) + ((panelNodes.length - 1) * nodeSpacing) + padding;

    return {
      width: nodeWidth + padding,
      height: headerHeight + contentHeight
    };
  };

  const minSize = calculateMinSize();
  const actualSize = {
    width: Math.max(panel.size.width, minSize.width),
    height: Math.max(panel.size.height, minSize.height)
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('panel-header')) {
      setIsDragging(true);
      onSelect(panel);
      
      const rect = panelRef.current?.getBoundingClientRect();
      if (rect) {
        const canvasElement = document.querySelector('.canvas-content');
        const canvasRect = canvasElement?.getBoundingClientRect();
        if (canvasRect) {
          setDragOffset({
            x: e.clientX - canvasRect.left - panel.position.x,
            y: e.clientY - canvasRect.top - panel.position.y
          });
        }
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const canvasElement = document.querySelector('.canvas-content');
      if (canvasElement) {
        const canvasRect = canvasElement.getBoundingClientRect();
        const newPosition = {
          x: e.clientX - canvasRect.left - dragOffset.x,
          y: e.clientY - canvasRect.top - dragOffset.y
        };
        onDrag(panel.id, newPosition);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const blockType = e.dataTransfer.getData('blockType');
    if (blockType && panel.isExpanded) {
      const rect = panelRef.current?.getBoundingClientRect();
      if (rect) {
        const relativeY = e.clientY - rect.top - 40; // Subtract header height
        const nodeHeight = 44;
        const nodeSpacing = 8;
        
        // Find insertion point based on Y position
        let insertAfterNodeId: string | undefined;
        if (panelNodes.length > 0) {
          const nodeIndex = Math.floor(relativeY / (nodeHeight + nodeSpacing));
          if (nodeIndex > 0 && nodeIndex <= panelNodes.length) {
            const sortedNodes = panelNodes.sort((a, b) => (a.position.y || 0) - (b.position.y || 0));
            insertAfterNodeId = sortedNodes[nodeIndex - 1]?.id;
          }
        }
        
        // Position relative to panel content area
        const relativePosition = {
          x: 16, // Left padding
          y: 16 + (panelNodes.length * (nodeHeight + nodeSpacing)) // Stack below existing nodes
        };
        
        onNodeDrop(panel.id, relativePosition, blockType, insertAfterNodeId);
      }
    }
  };
  
  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Handle node dragging within panel
  };

  return (
    <div
      ref={panelRef}
      className={`workflow-panel ${panel.type} ${selected ? 'selected' : ''}`}
      style={{
        position: 'absolute',
        left: panel.position.x,
        top: panel.position.y,
        width: actualSize.width,
        height: actualSize.height,
        borderColor: panel.color || (panel.type === 'main' ? '#3b82f6' : '#8b5cf6')
      }}
      onMouseDown={handleMouseDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="panel-header">
        <div className="panel-title">
          <button 
            className="panel-expand-button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpanded(panel.id);
            }}
            title={panel.isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {panel.isExpanded ? '▼' : '▶'}
          </button>
          <span className="panel-icon">
            {panel.type === 'main' ? '🏠' : '📦'}
          </span>
          <span className="panel-name">{panel.name}</span>
          <span className="panel-node-count">({panelNodes.length})</span>
        </div>
        
        {panel.type === 'module' && (
          <div className="panel-controls">
            <button 
              className="panel-control-button"
              title="Configure module"
            >
              ⚙️
            </button>
          </div>
        )}
      </div>

      {panel.isExpanded && (
        <div className="panel-content">
          {/* Render nodes with relative positioning */}
          {panelNodes
            .sort((a, b) => (a.position.y || 0) - (b.position.y || 0))
            .map((node, index) => (
              <div
                key={node.id}
                className="panel-node"
                style={{
                  position: 'relative',
                  marginBottom: index < panelNodes.length - 1 ? '8px' : '0',
                  left: (node.indentLevel || 0) * 24
                }}
                onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
              >
                {/* Node will be rendered by parent WorkflowEditor */}
              </div>
            ))}
          
          {panelNodes.length === 0 && (
            <div className="panel-drop-zone">
              <div className="panel-drop-hint">
                Drop nodes here to add them to this {panel.type}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resize handle */}
      <div 
        className="panel-resize-handle"
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsResizing(true);
        }}
      />
    </div>
  );
};

export default PanelComponent;