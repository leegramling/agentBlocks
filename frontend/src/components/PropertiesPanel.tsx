import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import type { WorkflowNode, Connection } from '../types';
import VariablePicker from './VariablePicker';
import { TemplateBasedPythonGenerator, TemplateBasedRustGenerator } from '../nodes/generators/TemplateBasedGenerator';

interface PropertiesPanelProps {
  selectedNode: WorkflowNode | null;
  nodes: WorkflowNode[];
  connections: Connection[];
  activeFunctionId?: string;
  onUpdateNode: (node: WorkflowNode) => void;
  onNodeSelect: (node: WorkflowNode) => void;
}

export interface PropertiesPanelRef {
  focusFirstProperty: () => void;
}

const PropertiesPanel = forwardRef<PropertiesPanelRef, PropertiesPanelProps>(({ 
  selectedNode, 
  nodes,
  connections,
  activeFunctionId,
  onUpdateNode,
  onNodeSelect
}, ref) => {
  const propertyInputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});
  const [codeLanguage, setCodeLanguage] = useState<'python' | 'rust'>('python');
  const [activeTab, setActiveTab] = useState<'properties' | 'variables'>('properties');

  const generatePreviewCode = () => {
    if (nodes.length === 0) return '// No nodes in workflow';
    
    // Generate code for the entire workflow using template-based generators
    if (codeLanguage === 'python') {
      const generator = new TemplateBasedPythonGenerator();
      return generator.generateWorkflowCode(nodes, connections);
    } else {
      const generator = new TemplateBasedRustGenerator();
      return generator.generateWorkflowCode(nodes, connections);
    }
  };

  const getLocalVariables = () => {
    if (!activeFunctionId) return [];
    
    // Get all nodes in the current function
    const functionNodes = nodes.filter(node => 
      node.parentId === activeFunctionId || node.id === activeFunctionId
    );
    
    // Extract variables from nodes
    const variables: Array<{name: string, type: string, value: string, nodeId: string}> = [];
    
    functionNodes.forEach(node => {
      if (node.type === 'variable' && node.properties?.name) {
        variables.push({
          name: node.properties.name,
          type: 'variable',
          value: node.properties.value || '',
          nodeId: node.id
        });
      } else if (node.type === 'list_create' && node.properties?.name) {
        variables.push({
          name: node.properties.name,
          type: 'list',
          value: JSON.stringify(node.properties.items || []),
          nodeId: node.id
        });
      } else if (node.type === 'dict_create' && node.properties?.name) {
        variables.push({
          name: node.properties.name,
          type: 'dict',
          value: JSON.stringify(node.properties.items || {}),
          nodeId: node.id
        });
      }
    });
    
    return variables;
  };

  useImperativeHandle(ref, () => ({
    focusFirstProperty: () => {
      const firstInputKey = Object.keys(propertyInputRefs.current)[0];
      if (firstInputKey && propertyInputRefs.current[firstInputKey]) {
        propertyInputRefs.current[firstInputKey]?.focus();
      }
    }
  }));
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

  const handleTabNavigation = (e: React.KeyboardEvent, currentKey: string) => {
    if (e.key === 'Tab') {
      const keys = Object.keys(propertyInputRefs.current);
      const currentIndex = keys.indexOf(currentKey);
      const nextIndex = e.shiftKey 
        ? (currentIndex - 1 + keys.length) % keys.length
        : (currentIndex + 1) % keys.length;
      const nextKey = keys[nextIndex];
      
      if (nextKey && propertyInputRefs.current[nextKey]) {
        e.preventDefault();
        propertyInputRefs.current[nextKey]?.focus();
      }
    }
  };

  // Determine if a field should use variable picker
  const shouldUseVariablePicker = (nodeType: string, key: string): boolean => {
    const variableFields: Record<string, string[]> = {
      'print': ['message'],
      'assignment': ['variable', 'expression'],
      'if-then': ['condition'],
      'foreach': ['iterable', 'variable'],
      'while': ['condition'],
      'increment': ['variable'],
      'list_get': ['list', 'variable'],
      'list_length': ['list', 'variable'],
      'list_append': ['list', 'item'],
      'set_add': ['set', 'item'],
      'dict_get': ['dict', 'key', 'variable'],
      'dict_set': ['dict', 'key', 'value'],
      'variable': ['value'], // For variable values that might reference other variables
    };
    
    return variableFields[nodeType]?.includes(key) || false;
  };

  const renderPropertyEditor = (key: string, value: any, type: string = 'string') => {
    const useVariablePicker = selectedNode && shouldUseVariablePicker(selectedNode.type, key);
    
    switch (type) {
      case 'boolean':
        return (
          <input
            ref={(el) => { propertyInputRefs.current[key] = el; }}
            type="checkbox"
            checked={value || false}
            onChange={(e) => handlePropertyChange(key, e.target.checked)}
            onKeyDown={(e) => handleTabNavigation(e, key)}
            className="rounded"
          />
        );
      case 'number':
        return (
          <input
            ref={(el) => { propertyInputRefs.current[key] = el; }}
            type="number"
            value={value || ''}
            onChange={(e) => handlePropertyChange(key, parseFloat(e.target.value))}
            onKeyDown={(e) => handleTabNavigation(e, key)}
            className="property-input"
          />
        );
      case 'textarea':
        return (
          <textarea
            ref={(el) => { propertyInputRefs.current[key] = el; }}
            value={value || ''}
            onChange={(e) => handlePropertyChange(key, e.target.value)}
            onKeyDown={(e) => handleTabNavigation(e, key)}
            className="property-input"
            rows={3}
          />
        );
      default:
        if (useVariablePicker && selectedNode) {
          return (
            <VariablePicker
              value={value || ''}
              onChange={(newValue) => handlePropertyChange(key, newValue)}
              currentNode={selectedNode}
              allNodes={nodes}
              className="property-input"
              placeholder={`Enter ${key} or select variable`}
              onKeyDown={(e) => handleTabNavigation(e, key)}
            />
          );
        }
        return (
          <input
            ref={(el) => { propertyInputRefs.current[key] = el; }}
            type="text"
            value={value || ''}
            onChange={(e) => handlePropertyChange(key, e.target.value)}
            onKeyDown={(e) => handleTabNavigation(e, key)}
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
      case 'increment':
        return {
          variable: { type: 'string', label: 'Variable Name' }
        };
      case 'list_create':
        return {
          name: { type: 'string', label: 'List Variable Name' },
          items: { type: 'textarea', label: 'Items (one per line)' }
        };
      case 'pycode':
        return {
          code: { type: 'textarea', label: 'Python Code' }
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

          {/* Code Preview Section - Always Show */}
          <div style={{marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #374151'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
              <div style={{fontSize: '12px', fontWeight: '600', color: '#d1d5db'}}>
                Workflow Code Preview
              </div>
              <div style={{display: 'flex', gap: '4px'}}>
                <button
                  onClick={() => setCodeLanguage('python')}
                  style={{
                    padding: '2px 8px',
                    fontSize: '10px',
                    borderRadius: '3px',
                    border: 'none',
                    backgroundColor: codeLanguage === 'python' ? '#3b82f6' : '#374151',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Python
                </button>
                <button
                  onClick={() => setCodeLanguage('rust')}
                  style={{
                    padding: '2px 8px',
                    fontSize: '10px',
                    borderRadius: '3px',
                    border: 'none',
                    backgroundColor: codeLanguage === 'rust' ? '#ef4444' : '#374151',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Rust
                </button>
              </div>
            </div>
            
            <textarea
              value={generatePreviewCode()}
              readOnly
              style={{
                width: '100%',
                height: 'calc(100vh - 600px)',
                minHeight: '200px',
                padding: '8px',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '4px',
                color: '#f1f5f9',
                fontSize: '11px',
                fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                resize: 'vertical',
                outline: 'none'
              }}
              placeholder="Generated code will appear here..."
            />
          </div>

        </div>
      </div>
    );
  }

  const properties = getNodeProperties(selectedNode);

  return (
    <div className="right-panel">
      {/* Header with Tabs */}
      <div className="panel-header">
        <h3 className="panel-title">Properties</h3>
        <div style={{fontSize: '12px', color: '#9ca3af', marginTop: '4px'}}>
          {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)} Node
        </div>
        
        {/* Tab Navigation */}
        <div style={{display: 'flex', marginTop: '12px', gap: '8px'}}>
          <button
            onClick={() => setActiveTab('properties')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: activeTab === 'properties' ? '#3b82f6' : '#374151',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Properties
          </button>
          <button
            onClick={() => setActiveTab('variables')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: activeTab === 'variables' ? '#3b82f6' : '#374151',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Local Variables
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="panel-content">
        {activeTab === 'properties' ? (
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

          {/* Code Preview Section */}
          <div style={{marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #374151'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
              <div style={{fontSize: '12px', fontWeight: '600', color: '#d1d5db'}}>
                Code Preview
              </div>
              <div style={{display: 'flex', gap: '4px'}}>
                <button
                  onClick={() => setCodeLanguage('python')}
                  style={{
                    padding: '2px 8px',
                    fontSize: '10px',
                    borderRadius: '3px',
                    border: 'none',
                    backgroundColor: codeLanguage === 'python' ? '#3b82f6' : '#374151',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Python
                </button>
                <button
                  onClick={() => setCodeLanguage('rust')}
                  style={{
                    padding: '2px 8px',
                    fontSize: '10px',
                    borderRadius: '3px',
                    border: 'none',
                    backgroundColor: codeLanguage === 'rust' ? '#ef4444' : '#374151',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Rust
                </button>
              </div>
            </div>
            
            <textarea
              value={generatePreviewCode()}
              readOnly
              style={{
                width: '100%',
                height: 'calc(100vh - 600px)',
                minHeight: '200px',
                padding: '8px',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '4px',
                color: '#f1f5f9',
                fontSize: '11px',
                fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                resize: 'vertical',
                outline: 'none'
              }}
              placeholder="Generated code will appear here..."
            />
          </div>

        </div>
        ) : (
          <div className="variables-section">
            {/* Local Variables Table */}
            <div style={{fontSize: '12px', fontWeight: '600', color: '#d1d5db', marginBottom: '12px'}}>
              Local Variables in Function
            </div>
            
            {(() => {
              const localVars = getLocalVariables();
              if (localVars.length === 0) {
                return (
                  <div style={{textAlign: 'center', color: '#6b7280', fontSize: '14px', padding: '20px'}}>
                    No variables found in current function
                  </div>
                );
              }
              
              return (
                <table className="property-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Value</th>
                      <th>Node</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localVars.map((variable, index) => (
                      <tr key={index}>
                        <td style={{fontWeight: '600', color: '#60a5fa'}}>{variable.name}</td>
                        <td className="value">{variable.type}</td>
                        <td className="value" style={{maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                          {variable.value || 'undefined'}
                        </td>
                        <td className="value">
                          <button
                            onClick={() => {
                              const node = nodes.find(n => n.id === variable.nodeId);
                              if (node) onNodeSelect(node);
                            }}
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              backgroundColor: '#374151',
                              border: '1px solid #4b5563',
                              borderRadius: '3px',
                              color: '#d1d5db',
                              cursor: 'pointer'
                            }}
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
            
            {/* Variables Usage Help */}
            <div style={{marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #374151'}}>
              <div style={{fontSize: '12px', fontWeight: '600', color: '#d1d5db', marginBottom: '8px'}}>
                Usage in Other Nodes
              </div>
              <div style={{fontSize: '11px', color: '#9ca3af', lineHeight: '1.4'}}>
                Reference these variables in other nodes using their names. For example:
                <br />• Use <code style={{backgroundColor: '#374151', padding: '1px 4px', borderRadius: '2px'}}>{'{variable_name}'}</code> in text fields
                <br />• Variables are available within the same function scope
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
});

PropertiesPanel.displayName = 'PropertiesPanel';

export default PropertiesPanel;