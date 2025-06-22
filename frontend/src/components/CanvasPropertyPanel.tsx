import React, { useEffect, useRef } from 'react';
import type { WorkflowNode } from '../types';
import VariablePicker from './VariablePicker';

interface CanvasPropertyPanelProps {
  selectedNode: WorkflowNode;
  position: { x: number; y: number };
  onUpdateNode: (node: WorkflowNode) => void;
  onClose: () => void;
  allNodes: WorkflowNode[];
}

const CanvasPropertyPanel: React.FC<CanvasPropertyPanelProps> = ({
  selectedNode,
  position,
  onUpdateNode,
  onClose,
  allNodes
}) => {
  const firstInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Auto-focus first input when panel opens
  useEffect(() => {
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100); // Small delay to ensure panel is rendered
    return () => clearTimeout(timer);
  }, []);

  // Handle ESC key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    // Add event listener to document so it works even when inputs are focused
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  const handlePropertyChange = (key: string, value: any) => {
    const updatedNode = {
      ...selectedNode,
      properties: {
        ...selectedNode.properties,
        [key]: value
      }
    };
    onUpdateNode(updatedNode);
  };

  const getNodeProperties = (node: WorkflowNode) => {
    switch (node.type) {
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
      default:
        return {};
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
      'bash': ['command'], // Allow variable substitution in bash commands
      'pycode': ['code'], // Allow variable substitution in Python code
    };
    
    return variableFields[nodeType]?.includes(key) || false;
  };

  const renderPropertyEditor = (key: string, value: any, type: string = 'string', isFirst: boolean = false) => {
    const useVariablePicker = shouldUseVariablePicker(selectedNode.type, key);
    
    switch (type) {
      case 'boolean':
        return (
          <input
            ref={isFirst ? firstInputRef as React.RefObject<HTMLInputElement> : undefined}
            type="checkbox"
            checked={value || false}
            onChange={(e) => handlePropertyChange(key, e.target.checked)}
            className="canvas-property-checkbox"
          />
        );
      case 'number':
        return (
          <input
            ref={isFirst ? firstInputRef as React.RefObject<HTMLInputElement> : undefined}
            type="number"
            value={value || ''}
            onChange={(e) => handlePropertyChange(key, parseFloat(e.target.value))}
            className="canvas-property-input"
          />
        );
      case 'textarea':
        if (useVariablePicker) {
          return (
            <VariablePicker
              value={value || ''}
              onChange={(newValue) => handlePropertyChange(key, newValue)}
              currentNode={selectedNode}
              allNodes={allNodes}
              className="canvas-property-input"
              placeholder={`Enter ${key} or select variable`}
            />
          );
        }
        return (
          <textarea
            ref={isFirst ? firstInputRef as React.RefObject<HTMLTextAreaElement> : undefined}
            value={value || ''}
            onChange={(e) => handlePropertyChange(key, e.target.value)}
            className="canvas-property-textarea"
            rows={3}
          />
        );
      default:
        if (useVariablePicker) {
          return (
            <VariablePicker
              value={value || ''}
              onChange={(newValue) => handlePropertyChange(key, newValue)}
              currentNode={selectedNode}
              allNodes={allNodes}
              className="canvas-property-input"
              placeholder={`Enter ${key} or select variable`}
            />
          );
        }
        return (
          <input
            ref={isFirst ? firstInputRef as React.RefObject<HTMLInputElement> : undefined}
            type="text"
            value={value || ''}
            onChange={(e) => handlePropertyChange(key, e.target.value)}
            className="canvas-property-input"
          />
        );
    }
  };

  const properties = getNodeProperties(selectedNode);

  return (
    <div 
      className="canvas-property-panel"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 1000
      }}
    >
      <div className="canvas-property-header">
        <div className="canvas-property-title">
          <span className="canvas-property-icon">⚙️</span>
          <span>Edit {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)}</span>
        </div>
        <button 
          className="canvas-property-close"
          onClick={onClose}
          title="Close (P)"
        >
          ✕
        </button>
      </div>

      <div className="canvas-property-content">
        {Object.entries(properties).length > 0 ? (
          Object.entries(properties).map(([key, config], index) => (
            <div key={key} className="canvas-property-group">
              <label className="canvas-property-label">
                {config.label}
              </label>
              {renderPropertyEditor(key, selectedNode.properties[key], config.type, index === 0)}
            </div>
          ))
        ) : (
          <div className="canvas-property-empty">
            No configurable properties for this node type
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasPropertyPanel;