import React, { useState, useRef } from 'react';
import type { WorkflowPanel, WorkflowNode, Position, Connection } from '../types';
import NodeComponent from './NodeComponent';

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
  onNodeReorder: (panelId: string, nodeId: string, newIndex: number) => void;
  selectedNode: WorkflowNode | null;
  onNodeSelect: (node: WorkflowNode) => void;
  onStartConnection: (nodeId: string, outputId: string) => void;
  onCompleteConnection: (nodeId: string, inputId: string) => void;
  connecting: { nodeId: string; outputId: string } | null;
  connections: Connection[];
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
  onNodeDrag,
  onNodeReorder,
  selectedNode,
  onNodeSelect,
  onStartConnection,
  onCompleteConnection,
  connecting,
  connections
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number>(-1);
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
    const horizontalPadding = 32; // 16px on each side
    const verticalPadding = 32; // 16px on top and bottom
    const nodeHeight = 44;
    const nodeSpacing = 8;
    
    const headerHeight = 40;
    const contentHeight = (panelNodes.length * nodeHeight) + ((panelNodes.length - 1) * nodeSpacing) + verticalPadding;

    return {
      width: nodeWidth + horizontalPadding,
      height: headerHeight + contentHeight
    };
  };

  const minSize = calculateMinSize();
  const actualSize = {
    width: Math.max(panel.size.width, minSize.width),
    height: Math.max(panel.size.height, minSize.height)
  };

  // Auto-resize panel when content changes
  React.useEffect(() => {
    if (actualSize.height > panel.size.height || actualSize.width > panel.size.width) {
      onResize(panel.id, actualSize);
    }
  }, [actualSize.height, actualSize.width, panel.size.height, panel.size.width, panel.id, onResize]);

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

  // Keyboard navigation for nodes within panel
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!panel.isExpanded || panelNodes.length === 0) return;
    
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      
      const sortedNodes = panelNodes.sort((a, b) => (a.position.y || 0) - (b.position.y || 0));
      let newIndex = selectedNodeIndex;
      
      if (e.key === 'ArrowUp') {
        newIndex = selectedNodeIndex <= 0 ? sortedNodes.length - 1 : selectedNodeIndex - 1;
      } else if (e.key === 'ArrowDown') {
        newIndex = selectedNodeIndex >= sortedNodes.length - 1 ? 0 : selectedNodeIndex + 1;
      }
      
      setSelectedNodeIndex(newIndex);
      
      // Select the node in the parent component
      if (sortedNodes[newIndex]) {
        onNodeSelect(sortedNodes[newIndex]);
      }
    }
  };

  // Focus management for keyboard navigation
  React.useEffect(() => {
    if (selected && panelRef.current) {
      panelRef.current.focus();
    }
  }, [selected]);

  // Update selectedNodeIndex when selectedNode changes
  React.useEffect(() => {
    if (selectedNode && selectedNode.panelId === panel.id) {
      const sortedNodes = panelNodes.sort((a, b) => (a.position.y || 0) - (b.position.y || 0));
      const index = sortedNodes.findIndex(node => node.id === selectedNode.id);
      setSelectedNodeIndex(index);
    } else if (selectedNode?.panelId !== panel.id) {
      setSelectedNodeIndex(-1);
    }
  }, [selectedNode, panelNodes, panel.id]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const blockType = e.dataTransfer.getData('blockType');
    const nodeId = e.dataTransfer.getData('nodeId');
    
    if (!panel.isExpanded) {
      return; // Can't drop on collapsed panels
    }
    
    if (blockType) {
      // Handle new node from palette
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
    } else if (nodeId) {
      // Handle moving existing node between panels
      const rect = panelRef.current?.getBoundingClientRect();
      if (rect) {
        const relativeY = e.clientY - rect.top - 40; // Subtract header height
        const nodeHeight = 44;
        const nodeSpacing = 8;
        const targetIndex = Math.max(0, Math.floor(relativeY / (nodeHeight + nodeSpacing)));
        
        // Move the node to this panel at the specified index
        onNodeReorder(panel.id, nodeId, targetIndex);
      }
    }
  };
  
  const handleNodeDragStart = (e: React.DragEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggedNodeId(nodeId);
    e.dataTransfer.setData('nodeId', nodeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleNodeDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedNodeId) {
      setDragOverIndex(targetIndex);
    }
  };

  const handleNodeDragEnd = () => {
    setDraggedNodeId(null);
    setDragOverIndex(null);
  };

  const handleNodeDropOnNode = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const nodeId = e.dataTransfer.getData('nodeId');
    if (nodeId && nodeId !== panelNodes[targetIndex]?.id) {
      onNodeReorder(panel.id, nodeId, targetIndex);
    }
    
    setDraggedNodeId(null);
    setDragOverIndex(null);
  };

  return (
    <div
      ref={panelRef}
      className={`workflow-panel ${panel.type} ${selected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'absolute',
        left: panel.position.x,
        top: panel.position.y,
        width: actualSize.width,
        height: actualSize.height,
        borderColor: panel.color || (panel.type === 'main' ? '#3b82f6' : '#8b5cf6'),
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1000 : 'auto'
      }}
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
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
          {selected && panelNodes.length > 0 && (
            <span className="panel-hint" style={{ fontSize: '11px', opacity: 0.7, marginLeft: '8px' }}>
              ↑↓ Navigate
            </span>
          )}
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
          {/* Render node placeholders for drag and drop ordering */}
          {panelNodes
            .sort((a, b) => (a.position.y || 0) - (b.position.y || 0))
            .map((node, index) => (
              <div key={node.id}>
                {/* Drop zone above node */}
                {draggedNodeId && draggedNodeId !== node.id && (
                  <div
                    className={`node-drop-zone ${dragOverIndex === index ? 'drag-over' : ''}`}
                    onDragOver={(e) => handleNodeDragOver(e, index)}
                    onDrop={(e) => handleNodeDropOnNode(e, index)}
                    style={{ height: '4px', margin: '2px 0' }}
                  />
                )}
                
                {/* Node container */}
                <div
                  className={`panel-node ${draggedNodeId === node.id ? 'dragging' : ''} ${index === selectedNodeIndex ? 'keyboard-focused' : ''}`}
                  style={{
                    position: 'relative',
                    marginBottom: index < panelNodes.length - 1 ? '8px' : '0',
                    paddingLeft: (node.indentLevel || 0) * 24,
                    opacity: draggedNodeId === node.id ? 0.5 : 1,
                    outline: index === selectedNodeIndex && selected ? '2px solid #3b82f6' : 'none',
                    borderRadius: index === selectedNodeIndex && selected ? '4px' : '0'
                  }}
                  draggable
                  onDragStart={(e) => handleNodeDragStart(e, node.id)}
                  onDragEnd={handleNodeDragEnd}
                >
                  {/* Drag handle */}
                  <div className="node-drag-handle" title="Drag to reorder">
                    ⋮⋮
                  </div>
                  
                  {/* Actual node component */}
                  <NodeComponent
                    node={{
                      ...node,
                      position: { x: 0, y: 0 } // Position relative to panel
                    }}
                    selected={selectedNode?.id === node.id}
                    onSelect={onNodeSelect}
                    onDrag={onNodeDrag}
                    onStartConnection={onStartConnection}
                    onCompleteConnection={onCompleteConnection}
                    connecting={connecting}
                    connections={connections}
                    onReorderNode={(draggedNodeId, targetNodeId, insertBefore) => {
                      // Handle reordering within panel
                      const draggedIndex = panelNodes.findIndex(n => n.id === draggedNodeId);
                      const targetIndex = panelNodes.findIndex(n => n.id === targetNodeId);
                      if (draggedIndex !== -1 && targetIndex !== -1) {
                        const newIndex = insertBefore ? targetIndex : targetIndex + 1;
                        onNodeReorder(panel.id, draggedNodeId, newIndex);
                      }
                    }}
                  />
                </div>
                
                {/* Drop zone at the end */}
                {index === panelNodes.length - 1 && draggedNodeId && draggedNodeId !== node.id && (
                  <div
                    className={`node-drop-zone ${dragOverIndex === index + 1 ? 'drag-over' : ''}`}
                    onDragOver={(e) => handleNodeDragOver(e, index + 1)}
                    onDrop={(e) => handleNodeDropOnNode(e, index + 1)}
                    style={{ height: '4px', margin: '2px 0' }}
                  />
                )}
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