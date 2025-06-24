import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import type { WorkflowNode } from '../types';
import VariablePicker from './VariablePicker';

interface PropertiesPanelProps {
  selectedNode: WorkflowNode | null;
  nodes: WorkflowNode[];
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
  activeFunctionId,
  onUpdateNode,
  onNodeSelect
}, ref) => {
  const propertyInputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

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

        </div>

      </div>
    </div>
  );
});

PropertiesPanel.displayName = 'PropertiesPanel';

export default PropertiesPanel;