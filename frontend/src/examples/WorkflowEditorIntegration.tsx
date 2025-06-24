// Example showing how to integrate the new export system into WorkflowEditor

import React from 'react';
import ExportButton from '../components/ExportButton';
import { NodeDefinitionLoader } from '../nodes/NodeDefinitionLoader';

// Add this to your WorkflowEditor component's toolbar section:

const WorkflowEditorToolbar = ({ nodes, connections, panels }) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-800 border-b border-gray-600">
      {/* Existing toolbar buttons */}
      <button className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-lg text-sm">
        ▶️ Execute
      </button>
      
      <button className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg text-sm">
        🔄 Refresh
      </button>

      {/* New Export Button */}
      <ExportButton 
        nodes={nodes}
        connections={connections}
        panels={panels}
      />

      <div className="ml-auto flex items-center gap-2">
        <span className="text-gray-400 text-sm">
          Nodes: {nodes.length} | Connections: {connections.length}
        </span>
      </div>
    </div>
  );
};

// Example of loading node definitions in your main app:

const NodeDefinitionExample = async () => {
  // Load all node definitions on app startup
  const definitions = await NodeDefinitionLoader.loadAllDefinitions();
  console.log('Loaded node definitions:', definitions);

  // Load specific node definition
  const grepNode = await NodeDefinitionLoader.loadDefinition('grep');
  if (grepNode) {
    console.log('Grep node properties:', grepNode.properties);
    
    // Get default properties for a new grep node
    const defaultProps = NodeDefinitionLoader.getDefaultProperties('grep');
    console.log('Default grep properties:', defaultProps);
    
    // Validate node properties
    const validation = NodeDefinitionLoader.validateNodeProperties('grep', {
      pattern: 'error',
      input_source: 'file',
      file_path: '/var/log/app.log'
    });
    console.log('Validation result:', validation);
  }
};

// Example of creating nodes with the new system:

const createNodeFromDefinition = async (nodeType: string, position: { x: number; y: number }) => {
  const definition = await NodeDefinitionLoader.loadDefinition(nodeType);
  if (!definition) {
    throw new Error(`Unknown node type: ${nodeType}`);
  }

  const newNode = {
    id: `${nodeType}_${Date.now()}`,
    type: nodeType,
    properties: NodeDefinitionLoader.getDefaultProperties(nodeType),
    position: position,
    panelId: undefined
  };

  return newNode;
};

// Example of property panel integration:

const NodePropertiesPanel = ({ node, onNodeUpdate }) => {
  const definition = NodeDefinitionLoader.getDefinition(node.type);
  if (!definition) return null;

  const propertyGroups = NodeDefinitionLoader.getPropertyGroups(node.type);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">{definition.name}</h3>
      <p className="text-gray-400 text-sm">{definition.description}</p>

      {Object.entries(propertyGroups).map(([groupName, propertyNames]) => (
        <div key={groupName}>
          <h4 className="font-medium text-white mb-2 capitalize">{groupName}</h4>
          {propertyNames.map(propName => {
            const propDef = definition.properties[propName];
            const shouldShow = NodeDefinitionLoader.shouldShowProperty(
              node.type, 
              propName, 
              node.properties
            );

            if (!shouldShow) return null;

            return (
              <PropertyField
                key={propName}
                name={propName}
                definition={propDef}
                value={node.properties[propName]}
                onChange={(value) => {
                  onNodeUpdate(node.id, {
                    ...node,
                    properties: { ...node.properties, [propName]: value }
                  });
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

const PropertyField = ({ name, definition, value, onChange }) => {
  const { type, label, description, placeholder, options, min, max } = definition;

  switch (type) {
    case 'string':
      return (
        <div className="mb-3">
          <label className="block text-sm font-medium text-white mb-1">
            {label}
            {definition.required && <span className="text-red-400">*</span>}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          />
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
        </div>
      );

    case 'textarea':
      return (
        <div className="mb-3">
          <label className="block text-sm font-medium text-white mb-1">
            {label}
            {definition.required && <span className="text-red-400">*</span>}
          </label>
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm"
          />
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
        </div>
      );

    case 'number':
      return (
        <div className="mb-3">
          <label className="block text-sm font-medium text-white mb-1">
            {label}
            {definition.required && <span className="text-red-400">*</span>}
          </label>
          <input
            type="number"
            value={value || 0}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          />
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
        </div>
      );

    case 'boolean':
      return (
        <div className="mb-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-white">{label}</span>
          </label>
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
        </div>
      );

    case 'select':
      return (
        <div className="mb-3">
          <label className="block text-sm font-medium text-white mb-1">
            {label}
            {definition.required && <span className="text-red-400">*</span>}
          </label>
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          >
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
        </div>
      );

    default:
      return null;
  }
};

export { 
  WorkflowEditorToolbar, 
  NodeDefinitionExample, 
  createNodeFromDefinition, 
  NodePropertiesPanel 
};