# ReactJS Tutorial - Learning from AgentBlocks

A comprehensive ReactJS tutorial using real-world examples from the AgentBlocks visual programming interface.

## Table of Contents
1. [React Components](#react-components)
2. [CSS and Styling](#css-and-styling)
3. [useEffect Hook](#useeffect-hook)
4. [useRef Hook](#useref-hook)
5. [Key Bindings](#key-bindings)
6. [Callbacks and Event Handling](#callbacks-and-event-handling)
7. [State Management](#state-management)
8. [Best Practices](#best-practices)

---

## React Components

React components are the building blocks of any React application. In AgentBlocks, we use functional components with hooks.

### Basic Component Structure

```tsx
// src/components/NodeComponent.tsx
import React from 'react';

interface NodeComponentProps {
  node: WorkflowNode;
  selected: boolean;
  onSelect: (node: WorkflowNode) => void;
}

const NodeComponent: React.FC<NodeComponentProps> = ({ node, selected, onSelect }) => {
  return (
    <div 
      className={`node-component ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(node)}
    >
      <h3>{node.type}</h3>
      <p>{node.id}</p>
    </div>
  );
};

export default NodeComponent;
```

**Key Concepts:**
- **Props Interface**: TypeScript interface defines what props the component expects
- **Functional Component**: Uses `React.FC` type with props interface
- **Destructuring**: Extract props directly in function parameters
- **Conditional Classes**: Dynamic CSS classes based on props

### Complex Component with State

```tsx
// src/components/WorkflowEditor.tsx
import React, { useState, useCallback } from 'react';

const WorkflowEditor: React.FC = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleNodeSelect = useCallback((node: WorkflowNode) => {
    setSelectedNode(node);
  }, []);

  const handleNodeDrag = useCallback((nodeId: string, position: Position) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, position } : node
    ));
  }, []);

  return (
    <div className="workflow-editor">
      {nodes.map(node => (
        <NodeComponent
          key={node.id}
          node={node}
          selected={selectedNode?.id === node.id}
          onSelect={handleNodeSelect}
        />
      ))}
    </div>
  );
};
```

**Key Concepts:**
- **useState**: Manages component state
- **useCallback**: Optimizes function references for performance
- **Array.map()**: Renders lists of components
- **Key Prop**: Required for list items in React

---

## CSS and Styling

AgentBlocks uses Tailwind CSS for styling, which provides utility classes for rapid development.

### Tailwind CSS Classes

```tsx
// src/components/PanelComponent.tsx
const PanelComponent: React.FC<PanelComponentProps> = ({ panel, nodes }) => {
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 min-h-[200px] shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-lg">{panel.name}</h3>
        <span className="text-gray-400 text-sm">{nodes.length} nodes</span>
      </div>
      
      <div className="space-y-2">
        {nodes.map((node, index) => (
          <div 
            key={node.id}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded cursor-pointer transition-colors"
          >
            {node.type} - {node.id}
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Tailwind Classes Explained:**
- `bg-gray-800`: Background color (dark gray)
- `border border-gray-600`: Border with gray color
- `rounded-lg`: Large border radius
- `p-4`: Padding on all sides
- `min-h-[200px]`: Minimum height of 200px
- `shadow-lg`: Large drop shadow
- `hover:bg-gray-600`: Background changes on hover
- `transition-colors`: Smooth color transitions

### Dynamic Styling

```tsx
// Dynamic classes based on state
const nodeStyle = `
  absolute cursor-pointer transition-all duration-200
  ${selected ? 'ring-2 ring-blue-500 z-10' : 'hover:ring-1 hover:ring-gray-400'}
  ${isDragging ? 'opacity-75 scale-105' : ''}
  ${node.panelId ? 'relative' : 'absolute'}
`;

return (
  <div 
    className={nodeStyle}
    style={{
      left: node.panelId ? 'auto' : node.position.x,
      top: node.panelId ? 'auto' : node.position.y,
      backgroundColor: getNodeColor(node.type),
    }}
  >
    {/* Node content */}
  </div>
);
```

---

## useEffect Hook

`useEffect` handles side effects like API calls, subscriptions, and DOM manipulation.

### Basic useEffect

```tsx
// src/components/WorkflowEditor.tsx
import React, { useEffect, useState } from 'react';

const WorkflowEditor: React.FC = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);

  // Run once when component mounts
  useEffect(() => {
    console.log('WorkflowEditor mounted');
    
    // Cleanup function (runs when component unmounts)
    return () => {
      console.log('WorkflowEditor unmounting');
    };
  }, []); // Empty dependency array = run once

  // Run when nodes change
  useEffect(() => {
    console.log(`Nodes updated: ${nodes.length} nodes`);
    localStorage.setItem('workflow-nodes', JSON.stringify(nodes));
  }, [nodes]); // Dependency array with nodes

  return <div>...</div>;
};
```

### useEffect with Keyboard Events

```tsx
// src/components/PanelComponent.tsx
const PanelComponent: React.FC<PanelComponentProps> = ({ panel, nodes }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(nodes.length - 1, prev + 1));
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup - remove event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nodes.length]); // Re-run if nodes length changes

  return <div>...</div>;
};
```

### useEffect with API Calls

```tsx
// src/components/LLMQueryPanel.tsx
const LLMQueryPanel: React.FC = () => {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const queryLLM = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/llm/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      setResponse(data.response);
    } catch (error) {
      console.error('LLM query failed:', error);
      setResponse('Error occurred while querying LLM');
    } finally {
      setLoading(false);
    }
  }, []);

  return <div>...</div>;
};
```

---

## useRef Hook

`useRef` provides direct access to DOM elements and persists values across renders.

### DOM Element Reference

```tsx
// src/components/WorkflowEditor.tsx
import React, { useRef, useEffect } from 'react';

const WorkflowEditor: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Access DOM element directly
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      console.log(`Clicked at: ${x}, ${y}`);
    }
  };

  // Trigger file input programmatically
  const handleLoadFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <button onClick={handleLoadFile}>Load File</button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      
      <div
        ref={canvasRef}
        className="canvas"
        onClick={handleCanvasClick}
      >
        {/* Canvas content */}
      </div>
    </div>
  );
};
```

### Storing Mutable Values

```tsx
// Using useRef to store values that don't trigger re-renders
const WorkflowEditor: React.FC = () => {
  const dragStateRef = useRef({
    isDragging: false,
    startPosition: { x: 0, y: 0 },
    currentNode: null as WorkflowNode | null,
  });

  const handleMouseDown = (e: React.MouseEvent, node: WorkflowNode) => {
    dragStateRef.current = {
      isDragging: true,
      startPosition: { x: e.clientX, y: e.clientY },
      currentNode: node,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const dragState = dragStateRef.current;
    if (dragState.isDragging && dragState.currentNode) {
      const deltaX = e.clientX - dragState.startPosition.x;
      const deltaY = e.clientY - dragState.startPosition.y;
      
      // Update node position
      updateNodePosition(dragState.currentNode.id, {
        x: dragState.currentNode.position.x + deltaX,
        y: dragState.currentNode.position.y + deltaY,
      });
    }
  };

  return <div>...</div>;
};
```

---

## Key Bindings

Implementing keyboard shortcuts for better user experience.

### Global Key Bindings

```tsx
// src/components/WorkflowEditor.tsx
const WorkflowEditor: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected node
      if (e.key === 'Delete' && selectedNode) {
        e.preventDefault();
        deleteNode(selectedNode.id);
        setSelectedNode(null);
      }
      
      // Save workflow
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveWorkflow();
      }
      
      // Copy node
      if (e.ctrlKey && e.key === 'c' && selectedNode) {
        e.preventDefault();
        copyNodeToClipboard(selectedNode);
      }
      
      // Paste node
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        pasteNodeFromClipboard();
      }
      
      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedNode(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode]); // Include selectedNode in dependencies

  return <div>...</div>;
};
```

### Component-Specific Key Bindings

```tsx
// src/components/PanelComponent.tsx
const PanelComponent: React.FC<PanelComponentProps> = ({ panel, nodes, onNodeSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focused, setFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!focused) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(0, prev - 1));
        break;
      
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(nodes.length - 1, prev + 1));
        break;
      
      case 'Enter':
        e.preventDefault();
        if (nodes[selectedIndex]) {
          onNodeSelect(nodes[selectedIndex]);
        }
        break;
      
      case 'Tab':
        e.preventDefault();
        // Focus next panel
        focusNextPanel();
        break;
    }
  };

  return (
    <div 
      className="panel"
      tabIndex={0}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={handleKeyDown}
    >
      {nodes.map((node, index) => (
        <div
          key={node.id}
          className={`node ${index === selectedIndex && focused ? 'highlighted' : ''}`}
        >
          {node.type} - {node.id}
        </div>
      ))}
      
      {focused && (
        <div className="navigation-hint">
          Use ↑↓ arrows to navigate, Enter to select, Tab to switch panels
        </div>
      )}
    </div>
  );
};
```

---

## Callbacks and Event Handling

Efficient event handling and passing data between components.

### Basic Event Handlers

```tsx
// src/components/NodeComponent.tsx
const NodeComponent: React.FC<NodeComponentProps> = ({ 
  node, 
  selected, 
  onSelect, 
  onDelete, 
  onDoubleClick 
}) => {
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    onSelect(node);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onDoubleClick(node);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Show context menu
    showContextMenu(e.clientX, e.clientY, [
      { label: 'Delete', action: () => onDelete(node.id) },
      { label: 'Duplicate', action: () => duplicateNode(node) },
      { label: 'Properties', action: () => showProperties(node) },
    ]);
  };

  return (
    <div
      className="node-component"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Node content */}
    </div>
  );
};
```

### Optimized Callbacks with useCallback

```tsx
// src/components/WorkflowEditor.tsx
const WorkflowEditor: React.FC = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);

  // Memoized callbacks prevent unnecessary re-renders
  const handleNodeSelect = useCallback((node: WorkflowNode) => {
    setSelectedNode(node);
  }, []);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
  }, []);

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  }, []);

  const handleDragEnd = useCallback((nodeId: string, position: Position) => {
    // Snap to grid
    const gridSize = 20;
    const snappedPosition = {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize,
    };
    
    handleNodeUpdate(nodeId, { position: snappedPosition });
  }, [handleNodeUpdate]);

  return (
    <div className="workflow-editor">
      {nodes.map(node => (
        <NodeComponent
          key={node.id}
          node={node}
          onSelect={handleNodeSelect}
          onDelete={handleNodeDelete}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
};
```

### Complex Event Handling with State

```tsx
// src/components/DraggableNode.tsx
const DraggableNode: React.FC<DraggableNodeProps> = ({ node, onDragEnd }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y,
    });
  }, [node.position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newPosition = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    };
    
    // Update position immediately for smooth dragging
    updateNodePositionTemporary(node.id, newPosition);
  }, [isDragging, dragOffset, node.id]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd(node.id, getCurrentNodePosition(node.id));
    }
  }, [isDragging, node.id, onDragEnd]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`draggable-node ${isDragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
      style={{
        left: node.position.x,
        top: node.position.y,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {/* Node content */}
    </div>
  );
};
```

---

## State Management

Proper state management for complex applications.

### Local Component State

```tsx
// Simple component state
const [count, setCount] = useState(0);
const [text, setText] = useState('');
const [isVisible, setIsVisible] = useState(false);

// Object state
const [formData, setFormData] = useState({
  name: '',
  email: '',
  message: '',
});

// Update object state
const updateFormField = (field: string, value: string) => {
  setFormData(prev => ({
    ...prev,
    [field]: value,
  }));
};
```

### State with Complex Objects

```tsx
// src/components/WorkflowEditor.tsx
const WorkflowEditor: React.FC = () => {
  const [workflow, setWorkflow] = useState<Workflow>({
    nodes: [],
    connections: [],
    panels: [],
  });

  // Add new node
  const addNode = useCallback((nodeType: string, position: Position) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: nodeType,
      position,
      properties: {},
    };

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
  }, []);

  // Update node properties
  const updateNodeProperties = useCallback((nodeId: string, properties: Record<string, any>) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === nodeId
          ? { ...node, properties: { ...node.properties, ...properties } }
          : node
      ),
    }));
  }, []);

  return <div>...</div>;
};
```

---

## Best Practices

### Performance Optimization

```tsx
// Use React.memo for expensive components
const ExpensiveComponent = React.memo<ExpensiveComponentProps>(({ data }) => {
  return (
    <div>
      {/* Expensive rendering logic */}
    </div>
  );
});

// Use useMemo for expensive calculations
const WorkflowEditor: React.FC = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);

  const nodesByPanel = useMemo(() => {
    return nodes.reduce((acc, node) => {
      const panelId = node.panelId || 'main';
      if (!acc[panelId]) acc[panelId] = [];
      acc[panelId].push(node);
      return acc;
    }, {} as Record<string, WorkflowNode[]>);
  }, [nodes]);

  return <div>...</div>;
};
```

### Error Boundaries

```tsx
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details>
            {this.state.error?.message}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Custom Hooks

```tsx
// src/hooks/useKeyboard.ts
export const useKeyboard = (handlers: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const handler = handlers[e.key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
};

// Usage
const WorkflowEditor: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);

  useKeyboard({
    'Delete': () => selectedNode && deleteNode(selectedNode.id),
    'Escape': () => setSelectedNode(null),
    's': () => saveWorkflow(),
  });

  return <div>...</div>;
};
```

---

## Conclusion

This tutorial covered the essential ReactJS concepts used in AgentBlocks:

- **Components**: Building reusable UI elements
- **CSS**: Styling with Tailwind CSS utilities
- **useEffect**: Managing side effects and lifecycle
- **useRef**: Direct DOM access and persistent values
- **Key Bindings**: Implementing keyboard shortcuts
- **Callbacks**: Efficient event handling and data flow

These patterns form the foundation of modern React applications and enable building complex, interactive user interfaces like AgentBlocks' visual programming environment.