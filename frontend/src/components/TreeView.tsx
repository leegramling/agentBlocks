import React from 'react';
import type { WorkflowNode, WorkflowPanel } from '../types';

interface TreeViewProps {
  nodes: WorkflowNode[];
  panels: WorkflowPanel[];
  selectedNodeId?: string;
  onNodeSelect: (node: WorkflowNode) => void;
  onPanelSelect: (panel: WorkflowPanel) => void;
}

const TreeView: React.FC<TreeViewProps> = ({ 
  nodes, 
  panels, 
  selectedNodeId, 
  onNodeSelect,
  onPanelSelect 
}) => {
  const getNodeIcon = (type: string) => {
    const icons: Record<string, string> = {
      variable: '📦',
      print: '🖨️',
      'if-then': '🔀',
      foreach: '🔁',
      while: '⭕',
      function: '🔧',
      find_files: '📁',
      read_file: '📖',
      write_file: '📝',
      copy_file: '📋',
      text_transform: '🔤',
      regex_match: '🔍',
      http_request: '🌐',
      download_file: '⬇️',
      webhook: '🔗',
      ai_text_gen: '🤖',
      ai_code_gen: '💻',
      ai_analysis: '🧠',
      python_code: '🐍',
      shell_command: '💻',
      execute: '▶️',
      hybrid_template: '📄'
    };
    return icons[type] || '📦';
  };

  const getNodesByPanel = (panelId: string) => {
    return nodes
      .filter(node => node.panelId === panelId)
      .sort((a, b) => a.position.y - b.position.y);
  };

  const getParentNodes = (panelNodes: WorkflowNode[]) => {
    return panelNodes.filter(node => !node.parentId);
  };

  const getChildNodes = (parentId: string, panelNodes: WorkflowNode[]) => {
    return panelNodes
      .filter(node => node.parentId === parentId)
      .sort((a, b) => a.position.y - b.position.y);
  };

  const isParentType = (nodeType: string) => {
    return ['function', 'foreach', 'while', 'if-then'].includes(nodeType);
  };

  const renderNode = (node: WorkflowNode, depth: number = 0) => {
    const isSelected = selectedNodeId === node.id;
    const isParent = isParentType(node.type);
    const childNodes = getChildNodes(node.id, nodes.filter(n => n.panelId === node.panelId));
    
    return (
      <div key={node.id} className="tree-node-container">
        <div 
          className={`tree-node ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onNodeSelect(node)}
        >
          <span className="tree-node-icon">{getNodeIcon(node.type)}</span>
          <span className="tree-node-text">
            {node.type.charAt(0).toUpperCase() + node.type.slice(1).replace('_', ' ')}
          </span>
          {isParent && childNodes.length > 0 && (
            <span className="tree-node-count">({childNodes.length})</span>
          )}
        </div>
        
        {/* Render child nodes */}
        {isParent && childNodes.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  const renderPanel = (panel: WorkflowPanel) => {
    const panelNodes = getNodesByPanel(panel.id);
    const rootNodes = getParentNodes(panelNodes);
    
    return (
      <div key={panel.id} className="tree-panel">
        <div 
          className="tree-panel-header"
          onClick={() => onPanelSelect(panel)}
        >
          <span className="tree-panel-icon">
            {panel.type === 'main' ? '🏠' : '📦'}
          </span>
          <span className="tree-panel-name">{panel.name}</span>
          <span className="tree-panel-count">({panelNodes.length})</span>
        </div>
        
        <div className="tree-panel-nodes">
          {rootNodes.map(node => renderNode(node, 0))}
        </div>
      </div>
    );
  };

  // Ensure main panel is first
  const sortedPanels = [...panels].sort((a, b) => {
    if (a.type === 'main') return -1;
    if (b.type === 'main') return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="tree-view">
      <div className="tree-view-header">
        <h3>Workflow Structure</h3>
      </div>
      
      <div className="tree-view-content">
        {sortedPanels.map(panel => renderPanel(panel))}
        
        {panels.length === 0 && (
          <div className="tree-view-empty">
            <p>No panels created yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreeView;