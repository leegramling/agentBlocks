import React, { useState, useEffect, useRef } from 'react';
import type { WorkflowNode } from '../types';

interface Variable {
  name: string;
  type: string;
  source: string; // The node ID or scope where it was defined
  scope: number; // Indentation level where it's accessible
}

interface VariablePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  currentNode: WorkflowNode;
  allNodes: WorkflowNode[];
  className?: string;
  allowFreeText?: boolean; // Allow typing custom text beyond variables
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

const VariablePicker: React.FC<VariablePickerProps> = ({
  value,
  onChange,
  placeholder,
  currentNode,
  allNodes,
  className = '',
  allowFreeText = true,
  onKeyDown
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredVariables, setFilteredVariables] = useState<Variable[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract variables from nodes that are accessible in the current scope
  const getAccessibleVariables = (): Variable[] => {
    const variables: Variable[] = [];
    const currentScope = currentNode.indentLevel || 0;
    
    // Sort nodes by position to process them in execution order
    const sortedNodes = [...allNodes].sort((a, b) => a.position.y - b.position.y);
    
    // Find the index of the current node
    const currentNodeIndex = sortedNodes.findIndex(n => n.id === currentNode.id);
    
    // Only consider nodes that come before the current node in execution order
    const precedingNodes = sortedNodes.slice(0, currentNodeIndex);
    
    for (const node of precedingNodes) {
      const nodeScope = node.indentLevel || 0;
      
      // Variables are accessible if they're in the same scope or a parent scope
      if (nodeScope <= currentScope) {
        switch (node.type) {
          case 'variable':
            if (node.properties.name) {
              variables.push({
                name: node.properties.name,
                type: 'string',
                source: node.id,
                scope: nodeScope
              });
            }
            break;
          case 'assignment':
            if (node.properties.variable) {
              variables.push({
                name: node.properties.variable,
                type: 'any',
                source: node.id,
                scope: nodeScope
              });
            }
            break;
          case 'foreach':
            if (node.properties.variable) {
              // Loop variables are only accessible within the loop scope
              if (currentScope > nodeScope) {
                variables.push({
                  name: node.properties.variable,
                  type: 'any',
                  source: node.id,
                  scope: nodeScope + 1
                });
              }
            }
            if (node.properties.iterable) {
              variables.push({
                name: node.properties.iterable,
                type: 'list',
                source: node.id,
                scope: nodeScope
              });
            }
            break;
          case 'list_create':
            if (node.properties.name) {
              variables.push({
                name: node.properties.name,
                type: 'list',
                source: node.id,
                scope: nodeScope
              });
            }
            break;
          case 'list_get':
          case 'list_length':
            if (node.properties.variable) {
              variables.push({
                name: node.properties.variable,
                type: 'any',
                source: node.id,
                scope: nodeScope
              });
            }
            break;
          case 'set_create':
            if (node.properties.name) {
              variables.push({
                name: node.properties.name,
                type: 'set',
                source: node.id,
                scope: nodeScope
              });
            }
            break;
          case 'dict_create':
            if (node.properties.name) {
              variables.push({
                name: node.properties.name,
                type: 'dict',
                source: node.id,
                scope: nodeScope
              });
            }
            break;
          case 'dict_get':
            if (node.properties.variable) {
              variables.push({
                name: node.properties.variable,
                type: 'any',
                source: node.id,
                scope: nodeScope
              });
            }
            break;
          case 'increment':
            if (node.properties.variable) {
              variables.push({
                name: node.properties.variable,
                type: 'number',
                source: node.id,
                scope: nodeScope
              });
            }
            break;
          case 'function':
            if (node.properties.parameters) {
              // Parse function parameters
              const params = node.properties.parameters.split(',').map((p: string) => p.trim());
              params.forEach((param: string) => {
                if (param && currentScope > nodeScope) { // Function params only accessible inside function
                  variables.push({
                    name: param,
                    type: 'any',
                    source: node.id,
                    scope: nodeScope + 1
                  });
                }
              });
            }
            break;
        }
      }
    }
    
    // Remove duplicates (keep the latest definition)
    const uniqueVariables: Variable[] = [];
    const seenNames = new Set<string>();
    
    // Reverse to prioritize later definitions
    for (let i = variables.length - 1; i >= 0; i--) {
      const variable = variables[i];
      if (!seenNames.has(variable.name)) {
        uniqueVariables.unshift(variable);
        seenNames.add(variable.name);
      }
    }
    
    return uniqueVariables;
  };

  // Filter variables based on input value
  useEffect(() => {
    const availableVariables = getAccessibleVariables();
    
    if (!value || value.length === 0) {
      setFilteredVariables(availableVariables);
    } else {
      const filtered = availableVariables.filter(variable =>
        variable.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredVariables(filtered);
    }
    setHighlightedIndex(-1);
  }, [value, currentNode, allNodes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay closing to allow clicking on dropdown items
    setTimeout(() => {
      if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
        setIsOpen(false);
      }
    }, 150);
  };

  const handleVariableSelect = (variable: Variable, insertWithBraces: boolean = false) => {
    const variableText = insertWithBraces ? `{${variable.name}}` : variable.name;
    
    if (insertWithBraces && inputRef.current) {
      // Insert at cursor position if possible
      const input = inputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentValue = value || '';
      const newValue = currentValue.slice(0, start) + variableText + currentValue.slice(end);
      onChange(newValue);
      
      // Set cursor position after the inserted text
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + variableText.length, start + variableText.length);
      }, 0);
    } else {
      onChange(variableText);
    }
    
    setIsOpen(false);
    if (!insertWithBraces) {
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onKeyDown) {
      onKeyDown(e);
    }

    if (!isOpen || filteredVariables.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredVariables.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredVariables.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredVariables.length) {
          // Use Shift+Enter to insert with braces
          const insertWithBraces = e.shiftKey;
          handleVariableSelect(filteredVariables[highlightedIndex], insertWithBraces);
        } else if (!allowFreeText) {
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const getVariableIcon = (type: string) => {
    switch (type) {
      case 'string': return '📝';
      case 'number': return '🔢';
      case 'list': return '📋';
      case 'set': return '🗂️';
      case 'dict': return '📖';
      default: return '📦';
    }
  };

  const getScopeIndicator = (scope: number) => {
    const currentScope = currentNode.indentLevel || 0;
    if (scope === currentScope) return '📍'; // Same scope
    if (scope < currentScope) return '⬆️'; // Parent scope
    return '⬇️'; // Child scope (shouldn't happen in accessible vars)
  };

  return (
    <div className="variable-picker-container" style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Type variable name or select from list'}
        className={`variable-picker-input ${className}`}
        autoComplete="off"
      />
      
      {isOpen && filteredVariables.length > 0 && (
        <div 
          ref={dropdownRef}
          className="variable-picker-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          {filteredVariables.map((variable, index) => (
            <div
              key={`${variable.name}-${variable.source}`}
              className={`variable-picker-item ${index === highlightedIndex ? 'highlighted' : ''}`}
              style={{
                padding: '8px 12px',
                borderBottom: index < filteredVariables.length - 1 ? '1px solid #374151' : 'none',
                backgroundColor: index === highlightedIndex ? '#374151' : 'transparent'
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>{getVariableIcon(variable.type)}</span>
                <span 
                  style={{ fontWeight: '600', color: '#ffffff', cursor: 'pointer', flex: 1 }}
                  onClick={() => handleVariableSelect(variable)}
                >
                  {variable.name}
                </span>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>({variable.type})</span>
                <button
                  style={{
                    background: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '4px',
                    color: '#d1d5db',
                    padding: '2px 6px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    marginRight: '4px'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVariableSelect(variable, true);
                  }}
                  title="Insert with braces: {variable}"
                >
                  { }
                </button>
                <span style={{ fontSize: '12px' }}>{getScopeIndicator(variable.scope)}</span>
              </div>
            </div>
          ))}
          {filteredVariables.length === 0 && value && (
            <div style={{ padding: '8px 12px', color: '#9ca3af', fontSize: '14px' }}>
              No matching variables found
            </div>
          )}
          
          {filteredVariables.length > 0 && (
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: '#111827', 
              borderTop: '1px solid #374151',
              fontSize: '11px',
              color: '#6b7280'
            }}>
              💡 Click variable name to insert | Click { } to insert with braces | Shift+Enter for braces
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VariablePicker;