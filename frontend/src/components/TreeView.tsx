import React from 'react';
import type { WorkflowNode } from '../types';

interface TreeViewProps {
  nodes: WorkflowNode[];
  activeFunctionId: string;
  selectedNodeId?: string;
  onNodeSelect: (node: WorkflowNode) => void;
}

const TreeView: React.FC<TreeViewProps> = ({ 
  nodes, 
  activeFunctionId,
  selectedNodeId, 
  onNodeSelect
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

  const getFunctionNodes = () => {
    return nodes.filter(node => node.type === 'function');
  };

  const getChildNodes = (parentId: string) => {
    return nodes
      .filter(node => node.parentId === parentId)
      .sort((a, b) => a.position.y - b.position.y);
  };

  const isParentType = (nodeType: string) => {
    return ['function', 'foreach', 'while', 'if-then'].includes(nodeType);
  };

  const renderNode = (node: WorkflowNode, depth: number = 0) => {
    const isSelected = selectedNodeId === node.id;
    const isActiveFunction = node.type === 'function' && node.id === activeFunctionId;
    const isParent = isParentType(node.type);
    const childNodes = getChildNodes(node.id);
    
    return (
      <div key={node.id} className="tree-node-container">
        <div 
          className={`tree-node ${isSelected ? 'selected' : ''} ${isActiveFunction ? 'active-function' : ''}`}
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

  const functionNodes = getFunctionNodes();

  return (
    <div className="tree-view">
      <div className="tree-view-header">
        <h3>Function Structure</h3>
      </div>
      
      <div className="tree-view-content">
        {functionNodes.map(functionNode => (
          <div key={functionNode.id} className="tree-function">
            {renderNode(functionNode, 0)}
          </div>
        ))}
        
        {functionNodes.length === 0 && (
          <div className="tree-view-empty">
            <p>No functions created yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreeView;