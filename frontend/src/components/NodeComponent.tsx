import React, { useState, useRef } from 'react';
import type { WorkflowNode, Position, Connection } from '../types';
import { toPythonFString, hasVariableReferences } from '../utils/variableSubstitution';

interface NodeComponentProps {
  node: WorkflowNode;
  selected: boolean;
  onSelect: (node: WorkflowNode) => void;
  onDrag: (nodeId: string, position: Position) => void;
  onStartConnection: (nodeId: string, outputId: string) => void;
  onCompleteConnection: (nodeId: string, inputId: string) => void;
  connecting: { nodeId: string; outputId: string } | null;
  connections: Connection[];
  onReorderNode?: (draggedNodeId: string, targetNodeId: string, insertBefore: boolean) => void;
  allNodes?: WorkflowNode[];
}

const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  selected,
  onSelect,
  onDrag,
  onStartConnection,
  onCompleteConnection,
  connecting,
  connections,
  onReorderNode,
  allNodes
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isDropTarget, setIsDropTarget] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  const getNodeIcon = (type: string) => {
    const icons: Record<string, string> = {
      // Original node types
      bash: '💻',
      regex: '🔍',
      grep: '🔍',
      curl: '🌐',
      scp: '📁',
      input: '⬇️',
      output: '⬆️',
      conditional: '❓',
      loop: '🔄',
      transform: '⚙️',
      agent: '🤖',
      // New coding block types
      variable: '📦',
      assignment: '➡️',
      'if-then': '🔀',
      foreach: '🔁',
      while: '⭕',
      function: '🔧',
      execute: '▶️',
      print: '🖨️',
      increment: '➕',
      list_create: '📄',
      pycode: '📝'
    };
    return icons[type] || '📦';
  };

  const getNodeColor = (type: string) => {
    const colors: Record<string, string> = {
      // Original node types
      bash: '#3b82f6',
      regex: '#8b5cf6',
      grep: '#10b981',
      curl: '#10b981',
      scp: '#f97316',
      input: '#6b7280',
      output: '#6b7280',
      conditional: '#eab308',
      loop: '#ef4444',
      transform: '#6366f1',
      agent: '#ec4899',
      // New coding block types (matching left panel colors)
      variable: '#f97316',
      assignment: '#eab308',
      'if-then': '#22c55e',
      foreach: '#8b5cf6',
      while: '#ec4899',
      function: '#3b82f6',
      execute: '#ef4444',
      print: '#10b981',
      increment: '#f59e0b',
      list_create: '#06b6d4',
      pycode: '#8b5cf6'
    };
    return colors[type] || '#6b7280';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.detail === 2) {
      // Double click - open block editor
      window.open(`/block-editor/${node.id}`, '_blank');
      return;
    }

    // Only allow dragging for nodes that are not in panels
    if (!node.panelId) {
      setIsDragging(true);
      
      // Calculate drag offset relative to where the mouse clicked within the node
      const rect = nodeRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
    
    // Always select the node on click
    onSelect(node);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      // Get the canvas container to calculate position relative to it
      const canvasElement = document.querySelector('.canvas-content');
      if (canvasElement) {
        const canvasRect = canvasElement.getBoundingClientRect();
        const newPosition = {
          x: e.clientX - canvasRect.left - dragOffset.x,
          y: e.clientY - canvasRect.top - dragOffset.y
        };
        onDrag(node.id, newPosition);
      }
      
      // Check if we're hovering over another node for reordering feedback
      const elementsUnderMouse = document.elementsFromPoint(e.clientX, e.clientY);
      const hoverNodeElement = elementsUnderMouse.find(el => 
        el.classList.contains('workflow-node') && 
        el.getAttribute('data-type') !== node.type
      );
      
      // Update all nodes' drop target state
      document.querySelectorAll('[data-node-id]').forEach(el => {
        const nodeEl = el as HTMLElement;
        const isCurrentHover = nodeEl === hoverNodeElement?.closest('[data-node-id]');
        const nodeId = nodeEl.getAttribute('data-node-id');
        
        if (nodeId && nodeId !== node.id && onReorderNode) {
          nodeEl.classList.toggle('drop-target', isCurrentHover);
        }
      });
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (isDragging) {
      // Check if we're dropping on top of another node for reordering or auto-connection
      const elementsUnderMouse = document.elementsFromPoint(e.clientX, e.clientY);
      const targetNodeElement = elementsUnderMouse.find(el => 
        el.classList.contains('workflow-node') && 
        el.getAttribute('data-type') !== node.type
      );
      
      if (targetNodeElement) {
        const targetNodeId = targetNodeElement.closest('[data-node-id]')?.getAttribute('data-node-id');
        if (targetNodeId && targetNodeId !== node.id) {
          
          // Check if we should reorder (both nodes in same panel)
          const targetNodeRect = targetNodeElement.getBoundingClientRect();
          const draggedNodeRect = nodeRef.current?.getBoundingClientRect();
          
          if (onReorderNode && draggedNodeRect) {
            // Determine if we should insert before or after based on mouse position
            const mouseY = e.clientY;
            const targetCenterY = targetNodeRect.top + targetNodeRect.height / 2;
            const insertBefore = mouseY < targetCenterY;
            
            onReorderNode(node.id, targetNodeId, insertBefore);
          } else if (hasOutput()) {
            // Auto-connect: current node output to target node input
            onStartConnection(node.id, 'output');
            setTimeout(() => onCompleteConnection(targetNodeId, 'input'), 50);
          }
        }
      }
      
      // Clean up drop target indicators
      document.querySelectorAll('[data-node-id]').forEach(el => {
        el.classList.remove('drop-target');
      });
    }
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handleOutputClick = (outputId: string) => {
    onStartConnection(node.id, outputId);
  };

  const handleInputClick = (inputId: string) => {
    if (connecting && connecting.nodeId !== node.id) {
      onCompleteConnection(node.id, inputId);
    }
  };

  const getNodeProperties = () => {
    switch (node.type) {
      case 'variable':
        return (
          <div style={{fontSize: '12px', color: '#d1d5db', marginTop: '4px'}}>
            <strong>Value:</strong> {node.properties.value || 'hello world'}
          </div>
        );
      case 'print':
        return (
          <div style={{fontSize: '12px', color: '#d1d5db', marginTop: '4px'}}>
            <strong>Message:</strong> {node.properties.message || 'Hello, World!'}
          </div>
        );
      default:
        return null;
    }
  };

  const hasInput = () => {
    // Nodes that can receive input from previous nodes
    return ['print', 'assignment', 'if-then', 'foreach', 'while', 'execute'].includes(node.type);
  };

  const hasOutput = () => {
    // Nodes that can send output to next nodes
    return ['variable', 'assignment', 'if-then', 'foreach', 'while', 'function'].includes(node.type);
  };

  const getNodeColorVariant = (type: string) => {
    const baseColor = getNodeColor(type);
    // Create a slightly darker variant for gradient
    const variants: Record<string, string> = {
      '#3b82f6': '#1d4ed8', // blue
      '#8b5cf6': '#7c3aed', // purple  
      '#10b981': '#047857', // green
      '#f97316': '#ea580c', // orange
      '#6b7280': '#4b5563', // gray
      '#eab308': '#ca8a04', // yellow
      '#ef4444': '#dc2626', // red
      '#22c55e': '#16a34a', // green
      '#ec4899': '#db2777', // pink
      '#6366f1': '#4f46e5', // indigo
    };
    return variants[baseColor] || baseColor;
  };

  const getNodeBlockMode = (type: string): string => {
    const blockModes: Record<string, string> = {
      // Visual blocks
      variable: 'Visual',
      print: 'Visual',
      assignment: 'Visual',
      'if-then': 'Visual',
      foreach: 'Visual',
      while: 'Visual',
      function: 'Visual',
      find_files: 'Visual',
      read_file: 'Visual',
      write_file: 'Visual',
      copy_file: 'Visual',
      text_transform: 'Visual',
      regex_match: 'Visual',
      http_request: 'Visual',
      download_file: 'Visual',
      webhook: 'Visual',
      // AI blocks
      ai_text_gen: 'AI',
      ai_code_gen: 'AI',
      ai_analysis: 'AI',
      // Code blocks
      python_code: 'Code',
      shell_command: 'Code',
      execute: 'Code',
      // Hybrid blocks
      hybrid_template: 'Hybrid',
    };
    return blockModes[type] || 'Visual';
  };

  const getBlockModeColor = (mode: string) => {
    switch (mode) {
      case 'Visual': return '#3b82f6';
      case 'Code': return '#ef4444';
      case 'Hybrid': return '#8b5cf6';
      case 'AI': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getBlockModeIcon = (mode: string) => {
    switch (mode) {
      case 'Visual': return '👁️';
      case 'Code': return '💻';
      case 'Hybrid': return '🔗';
      case 'AI': return '🤖';
      default: return '⚙️';
    }
  };

  const getNodePropertiesSummary = () => {
    switch (node.type) {
      case 'variable':
        return `${node.properties.name || 'myVariable'}: "${node.properties.value || 'hello world'}"`;
      case 'print':
        return `Print: ${node.properties.message || 'myVariable'}`;
      case 'assignment':
        return `${node.properties.variable || 'result'} = ${node.properties.expression || 'value'}`;
      case 'if-then':
        return `If: ${node.properties.condition || 'True'}`;
      case 'foreach':
        return `For ${node.properties.variable || 'item'} in ${node.properties.iterable || 'items'}`;
      case 'while':
        return `While: ${node.properties.condition || 'True'}`;
      case 'function':
        return `${node.properties.name || 'myFunction'}(${node.properties.parameters || ''})`;
      default:
        return 'Configure properties...';
    }
  };

  const generatePythonCodePreview = (): string => {
    switch (node.type) {
      case 'variable':
        const varName = node.properties.name || 'myVariable';
        const varValue = node.properties.value || 'hello world';
        if (hasVariableReferences(varValue)) {
          return `${varName} = ${toPythonFString(varValue)}`;
        }
        else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varValue)) {
          return `${varName} = ${varValue}`;
        }
        return `${varName} = "${varValue}"`;
      case 'print':
        const message = node.properties.message || 'myVariable';
        if (hasVariableReferences(message)) {
          return `print(${toPythonFString(message)})`;
        }
        else if (message && !message.includes('"') && !message.includes("'") && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(message)) {
          return `print(${message})`;
        } else {
          return `print("${message}")`;
        }
      case 'assignment':
        const assignVar = node.properties.variable || 'result';
        const expression = node.properties.expression || 'value';
        return `${assignVar} = ${expression}`;
      case 'if-then':
        const condition = node.properties.condition || 'True';
        return `if ${condition}:`;
      case 'foreach':
        const iterable = node.properties.iterable || 'items';
        const loopVar = node.properties.variable || 'item';
        return `for ${loopVar} in ${iterable}:`;
      case 'while':
        const whileCondition = node.properties.condition || 'True';
        return `while ${whileCondition}:`;
      case 'function':
        const funcName = node.properties.name || 'myFunction';
        const params = node.properties.parameters || '';
        return `def ${funcName}(${params}):`;
      case 'execute':
        const command = node.properties.command || 'print("Executing...")';
        return command;
      case 'list_create':
        const listName = node.properties.name || 'my_list';
        const itemsText = node.properties.items || 'apple\norange\npear';
        const itemsArray = itemsText.split('\n').filter((item: string) => item.trim()).map((item: string) => `"${item.trim()}"`);
        return `${listName} = [${itemsArray.join(', ')}]`;
      case 'increment':
        const incVar = node.properties.variable || 'counter';
        return `${incVar} = ${incVar} + 1`;
      case 'pycode':
        const pyCode = node.properties.code || '# Custom Python code';
        return pyCode;
      case 'bash':
        const bashCommand = node.properties.command || 'echo "Hello"';
        return `# ${bashCommand}`;
      default:
        return '# Configure node properties';
    }
  };

  const truncateCode = (code: string, maxLength: number = 35): string => {
    if (code.length <= maxLength) return code;
    return code.substring(0, maxLength - 3) + '...';
  };

  const isInputConnected = () => {
    return connections.some(conn => conn.target_node === node.id);
  };

  const isOutputConnected = () => {
    return connections.some(conn => conn.source_node === node.id);
  };

  const getFunctionColor = () => {
    if (!allNodes) return '#6b7280'; // Default gray
    
    // If this is a function node, find its color based on its own ID
    if (node.type === 'function') {
      const functionId = node.id;
      return getFunctionColorById(functionId);
    }
    
    // If this is a regular node, find its parent function and use that color
    const parentFunctionId = node.parentId;
    if (parentFunctionId) {
      return getFunctionColorById(parentFunctionId);
    }
    
    return '#6b7280'; // Default gray if no function
  };

  const getFunctionColorById = (functionId: string) => {
    // Generate consistent colors for different functions
    const colors = [
      '#3b82f6', // Blue (main)
      '#10b981', // Green 
      '#f59e0b', // Amber
      '#ef4444', // Red
      '#8b5cf6', // Violet
      '#ec4899', // Pink
      '#06b6d4', // Cyan
      '#84cc16', // Lime
    ];
    
    // Use a simple hash of the function ID to pick a color consistently
    let hash = 0;
    for (let i = 0; i < functionId.length; i++) {
      hash = ((hash << 5) - hash + functionId.charCodeAt(i)) & 0xffffffff;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      ref={nodeRef}
      data-node-id={node.id}
      style={{
        position: node.panelId ? 'relative' : 'absolute',
        left: node.panelId ? 'auto' : node.position.x,
        top: node.panelId ? 'auto' : node.position.y,
        userSelect: 'none',
        cursor: node.panelId ? 'pointer' : 'move',
        outline: selected 
          ? '2px solid #60a5fa' 
          : node.data?.isActiveFunction 
            ? '3px solid #fbbf24' 
            : 'none',
        width: node.panelId ? '100%' : 'auto'
      }}
      onMouseDown={handleMouseDown}
    >
      <div 
        className={`workflow-node ${selected ? 'selected' : ''}`}
        data-type={node.type}
      >
        {/* Function Color Bar - Left vertical bar */}
        <div 
          className="function-color-bar"
          style={{ 
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            backgroundColor: getFunctionColor(),
            borderTopLeftRadius: '6px',
            borderBottomLeftRadius: '6px'
          }}
        />

        {/* Node Icon with Background Color */}
        <div className="node-icon" style={{ background: getNodeColor(node.type) }}>
          {getNodeIcon(node.type)}
        </div>

        {/* Node Content */}
        <div className="node-header">
          <div className="node-title-section">
            <div className="node-title">
              {node.type === 'function' 
                ? (node.properties?.function_name || 'Function').charAt(0).toUpperCase() + (node.properties?.function_name || 'Function').slice(1)
                : node.type.charAt(0).toUpperCase() + node.type.slice(1).replace('_', ' ')
              }
            </div>
            <div 
              className="node-code-preview"
              title={generatePythonCodePreview()}
            >
              {truncateCode(generatePythonCodePreview())}
            </div>
          </div>
        </div>

        {/* Execution Status */}
        <div className="execution-status"></div>
      </div>
    </div>
  );
};

export default NodeComponent;