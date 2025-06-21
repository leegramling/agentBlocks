import React from 'react';
import type { WorkflowNode, WorkflowPanel } from '../types';
import TreeView from './TreeView';

interface PropertiesPanelProps {
  selectedNode: WorkflowNode | null;
  selectedPanel?: WorkflowPanel | null;
  nodes: WorkflowNode[];
  panels: WorkflowPanel[];
  onUpdateNode: (node: WorkflowNode) => void;
  onNodeSelect: (node: WorkflowNode) => void;
  onPanelSelect: (panel: WorkflowPanel) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  selectedNode, 
  selectedPanel,
  nodes,
  panels,
  onUpdateNode,
  onNodeSelect,
  onPanelSelect 
}) => {
  const handlePropertyChange = (key: string, value: any) => {
    if (!selectedNode) return;
    
    const updatedNode = {
      ...selectedNode,
      properties: {
        ...selectedNode.properties,
        [key]: value
      }
    };
    onUpdateNode(updatedNode);
  };

  const renderPropertyEditor = (key: string, value: any, type: string = 'string') => {
    switch (type) {
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handlePropertyChange(key, e.target.checked)}
            className="rounded"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handlePropertyChange(key, parseFloat(e.target.value))}
            className="property-input"
          />
        );
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handlePropertyChange(key, e.target.value)}
            className="property-input"
            rows={3}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handlePropertyChange(key, e.target.value)}
            className="property-input"
          />
        );
    }
  };

  const getNodeProperties = (node: WorkflowNode) => {
    switch (node.type) {
      case 'bash':
        return {
          command: { type: 'textarea', label: 'Command' },
          workingDir: { type: 'string', label: 'Working Directory' },
          timeout: { type: 'number', label: 'Timeout (seconds)' }
        };
      case 'regex':
        return {
          pattern: { type: 'string', label: 'Regex Pattern' },
          flags: { type: 'string', label: 'Flags (g, i, m)' },
          global: { type: 'boolean', label: 'Global Match' }
        };
      case 'curl':
        return {
          url: { type: 'string', label: 'URL' },
          method: { type: 'string', label: 'HTTP Method' },
          headers: { type: 'textarea', label: 'Headers (JSON)' },
          timeout: { type: 'number', label: 'Timeout (seconds)' }
        };
      case 'scp':
        return {
          source: { type: 'string', label: 'Source Path' },
          destination: { type: 'string', label: 'Destination Path' },
          host: { type: 'string', label: 'Remote Host' },
          user: { type: 'string', label: 'Username' },
          port: { type: 'number', label: 'Port' }
        };
      case 'conditional':
        return {
          condition: { type: 'string', label: 'Condition' },
          operator: { type: 'string', label: 'Operator (==, !=, >, <)' }
        };
      case 'loop':
        return {
          type: { type: 'string', label: 'Loop Type (for, while)' },
          condition: { type: 'string', label: 'Condition/Iterator' },
          maxIterations: { type: 'number', label: 'Max Iterations' }
        };
      // New coding block types
      case 'variable':
        return {
          name: { type: 'string', label: 'Variable Name' },
          value: { type: 'string', label: 'Value' }
        };
      case 'print':
        return {
          message: { type: 'string', label: 'Message to Print' }
        };
      case 'assignment':
        return {
          variable: { type: 'string', label: 'Variable Name' },
          expression: { type: 'string', label: 'Expression' }
        };
      case 'if-then':
        return {
          condition: { type: 'string', label: 'Condition' }
        };
      case 'foreach':
        return {
          iterable: { type: 'string', label: 'Iterable' },
          variable: { type: 'string', label: 'Loop Variable' }
        };
      case 'while':
        return {
          condition: { type: 'string', label: 'Condition' }
        };
      case 'function':
        return {
          name: { type: 'string', label: 'Function Name' },
          parameters: { type: 'string', label: 'Parameters' }
        };
      case 'execute':
        return {
          command: { type: 'string', label: 'Command to Execute' }
        };
      default:
        return {};
    }
  };

  if (!selectedNode) {
    return (
      <div className="right-panel">
        <div className="panel-header">
          <h3 className="panel-title">Properties</h3>
        </div>
        <div className="panel-content">
          <div className="empty-selection">
            <div className="text-4xl mb-2">📋</div>
            <p className="empty-selection-text">Select a node to view its property table</p>
          </div>
        </div>
      </div>
    );
  }

  const properties = getNodeProperties(selectedNode);

  return (
    <div className="right-panel">
      {/* Header */}
      <div className="panel-header">
        <h3 className="panel-title">Properties</h3>
        <div style={{fontSize: '12px', color: '#9ca3af', marginTop: '4px'}}>
          {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)} Node
        </div>
      </div>

      {/* Properties */}
      <div className="panel-content">
        <div className="properties-section">
          {/* Property Table */}
          <table className="property-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Node ID</td>
                <td className="value">{selectedNode.id}</td>
              </tr>
              <tr>
                <td>Type</td>
                <td className="value">{selectedNode.type}</td>
              </tr>
              <tr>
                <td>Position X</td>
                <td className="value">{selectedNode.position.x}</td>
              </tr>
              <tr>
                <td>Position Y</td>
                <td className="value">{selectedNode.position.y}</td>
              </tr>
              
              {/* Dynamic Properties */}
              {Object.entries(properties).map(([key, config]) => (
                <tr key={key}>
                  <td>{config.label}</td>
                  <td className="value">
                    {selectedNode.properties[key] || 'Not set'}
                  </td>
                </tr>
              ))}
              
              <tr>
                <td>Inputs</td>
                <td className="value">{selectedNode.inputs?.length || 0}</td>
              </tr>
              <tr>
                <td>Outputs</td>
                <td className="value">{selectedNode.outputs?.length || 0}</td>
              </tr>
            </tbody>
          </table>

          {/* Editable Properties Form */}
          <div style={{marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #374151'}}>
            <div style={{fontSize: '12px', fontWeight: '600', color: '#d1d5db', marginBottom: '12px'}}>
              Edit Properties
            </div>
            
            {Object.entries(properties).map(([key, config]) => (
              <div key={key} className="property-group">
                <label className="property-label">
                  {config.label}
                </label>
                {renderPropertyEditor(key, selectedNode.properties[key], config.type)}
              </div>
            ))}

            {Object.keys(properties).length === 0 && (
              <div style={{textAlign: 'center', color: '#6b7280', fontSize: '14px'}}>
                No configurable properties for this node type
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{borderTop: '1px solid #374151', paddingTop: '16px', marginTop: '16px'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <button
                onClick={() => window.open(`/block-editor/${selectedNode.id}`, '_blank')}
                className="action-button btn-save"
                style={{width: '100%', fontSize: '12px', padding: '8px 12px'}}
              >
                Edit Blocks
              </button>
              <button 
                className="action-button btn-export"
                style={{width: '100%', fontSize: '12px', padding: '8px 12px'}}
              >
                Duplicate Node
              </button>
              <button 
                style={{
                  width: '100%', 
                  fontSize: '12px', 
                  padding: '8px 12px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#b91c1c'}
                onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#dc2626'}
              >
                Delete Node
              </button>
            </div>
          </div>
        </div>

        {/* Tree View */}
        <TreeView
          nodes={nodes}
          panels={panels}
          selectedNodeId={selectedNode?.id}
          onNodeSelect={onNodeSelect}
          onPanelSelect={onPanelSelect}
        />
      </div>
    </div>
  );
};

export default PropertiesPanel;