import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { WorkflowNode, Connection, Position } from '../types';
import NodeComponent from './NodeComponent';
import ConnectionLine from './ConnectionLine';
import NodePalette from './NodePalette';
import PropertiesPanel from './PropertiesPanel';

interface WorkflowEditorProps {
  onConsoleOutput?: (updater: (prev: string[]) => string[]) => void;
  onExecutionState?: (isExecuting: boolean) => void;
  onRegisterExecute?: (callback: () => void) => void;
  onRegisterGenerateCode?: (callback: () => string) => void;
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  onConsoleOutput,
  onExecutionState,
  onRegisterExecute,
  onRegisterGenerateCode
}) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [connecting, setConnecting] = useState<{
    nodeId: string;
    outputId: string;
  } | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  const handleNodeSelect = useCallback((node: WorkflowNode) => {
    setSelectedNode(node);
  }, []);

  const handleNodeDrag = useCallback((nodeId: string, position: Position) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, position } : node
    ));
  }, []);

  const handleAddNode = useCallback((type: string, position: Position) => {
    // Snap to vertical position if there are existing nodes
    let snappedPosition = { ...position };
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      snappedPosition = {
        x: position.x,
        y: lastNode.position.y + 80 // 80px spacing between nodes
      };
    }

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type,
      position: snappedPosition,
      properties: getDefaultProperties(type),
      inputs: getDefaultInputs(type),
      outputs: getDefaultOutputs(type),
    };
    setNodes(prev => [...prev, newNode]);
  }, [nodes]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const blockType = e.dataTransfer.getData('blockType');
    if (blockType && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const position = {
        x: e.clientX - rect.left - 60, // Center the node
        y: e.clientY - rect.top - 20
      };
      handleAddNode(blockType, position);
    }
  }, [handleAddNode]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const getDefaultProperties = (type: string): Record<string, any> => {
    switch (type) {
      case 'variable':
        return { name: 'myVariable', value: 'hello world' };
      case 'print':
        return { message: 'myVariable' };
      case 'assignment':
        return { variable: 'result', expression: 'value' };
      case 'if-then':
        return { condition: 'variable == "hello world"' };
      case 'foreach':
        return { iterable: 'items', variable: 'item' };
      case 'while':
        return { condition: 'counter < 10' };
      case 'function':
        return { name: 'myFunction', parameters: 'param1, param2' };
      case 'execute':
        return { command: 'print("Executing...")' };
      default:
        return {};
    }
  };

  const handleStartConnection = useCallback((nodeId: string, outputId: string) => {
    setConnecting({ nodeId, outputId });
  }, []);

  const handleCompleteConnection = useCallback((targetNodeId: string, inputId: string) => {
    if (connecting) {
      const newConnection: Connection = {
        id: `conn_${Date.now()}`,
        source_node: connecting.nodeId,
        source_output: connecting.outputId,
        target_node: targetNodeId,
        target_input: inputId,
      };
      setConnections(prev => [...prev, newConnection]);
      setConnecting(null);
    }
  }, [connecting]);

  const generatePythonCode = useCallback(() => {
    if (nodes.length === 0) return '';
    
    let code = '# Generated Python Code\n';
    
    // Sort nodes by their vertical position to maintain execution order
    const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);
    
    sortedNodes.forEach(node => {
      switch (node.type) {
        case 'variable':
          const varName = node.properties.name || 'myVariable';
          const varValue = node.properties.value || 'hello world';
          code += `${varName} = "${varValue}"\n`;
          break;
        case 'print':
          const message = node.properties.message || 'myVariable';
          // If message is just a variable name (no quotes), use it directly
          if (message && !message.includes('"') && !message.includes("'") && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(message)) {
            code += `print(${message})\n`;
          } else {
            code += `print("${message}")\n`;
          }
          break;
        case 'assignment':
          const assignVar = node.properties.variable || 'result';
          const expression = node.properties.expression || 'value';
          code += `${assignVar} = ${expression}\n`;
          break;
        case 'if-then':
          const condition = node.properties.condition || 'True';
          code += `if ${condition}:\n    pass  # Add code here\n`;
          break;
        case 'foreach':
          const iterable = node.properties.iterable || 'items';
          const loopVar = node.properties.variable || 'item';
          code += `for ${loopVar} in ${iterable}:\n    pass  # Add code here\n`;
          break;
        case 'while':
          const whileCondition = node.properties.condition || 'True';
          code += `while ${whileCondition}:\n    pass  # Add code here\n`;
          break;
        case 'function':
          const funcName = node.properties.name || 'myFunction';
          const params = node.properties.parameters || '';
          code += `def ${funcName}(${params}):\n    pass  # Add code here\n`;
          break;
        case 'execute':
          const command = node.properties.command || 'print("Executing...")';
          code += `${command}\n`;
          break;
      }
    });
    
    return code;
  }, [nodes]);

  const executeWorkflow = useCallback(async () => {
    if (nodes.length === 0) {
      onConsoleOutput?.(prev => [...prev, 'Error: No nodes to execute']);
      return;
    }

    onExecutionState?.(true);
    onConsoleOutput?.(prev => [...prev, '=== Execution Started ===']);
    
    try {
      const pythonCode = generatePythonCode();
      onConsoleOutput?.(prev => [...prev, 'Generated Python Code:', pythonCode]);
      
      // Simulate execution for demo purposes
      setTimeout(() => {
        // Simple interpreter for demo - just handle variable and print
        const lines = pythonCode.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        const variables: Record<string, string> = {};
        
        lines.forEach(line => {
          const trimmedLine = line.trim();
          
          // Handle variable assignment
          if (trimmedLine.includes(' = ')) {
            const [varName, value] = trimmedLine.split(' = ');
            variables[varName.trim()] = value.replace(/"/g, '');
          }
          
          // Handle print statements
          if (trimmedLine.startsWith('print(')) {
            const printContent = trimmedLine.match(/print\((.*)\)/)?.[1];
            if (printContent) {
              let output = printContent.replace(/"/g, '');
              // Replace variable references
              Object.keys(variables).forEach(varName => {
                output = output.replace(new RegExp(varName, 'g'), variables[varName]);
              });
              onConsoleOutput?.(prev => [...prev, `> ${output}`]);
            }
          }
        });
        
        onConsoleOutput?.(prev => [...prev, '=== Execution Completed ===']);
        onExecutionState?.(false);
      }, 1000);
      
    } catch (error) {
      onConsoleOutput?.(prev => [...prev, `Error: ${error}`]);
      onExecutionState?.(false);
    }
  }, [nodes, generatePythonCode, onConsoleOutput, onExecutionState]);

  // Register callbacks with parent
  useEffect(() => {
    onRegisterExecute?.(executeWorkflow);
    onRegisterGenerateCode?.(generatePythonCode);
  }, [executeWorkflow, generatePythonCode, onRegisterExecute, onRegisterGenerateCode]);

  const getDefaultInputs = (type: string) => {
    switch (type) {
      case 'bash':
        return [
          { id: 'command', name: 'Command', type: 'string', required: true },
          { id: 'input', name: 'Input', type: 'string' }
        ];
      case 'regex':
        return [
          { id: 'pattern', name: 'Pattern', type: 'string', required: true },
          { id: 'text', name: 'Text', type: 'string', required: true }
        ];
      case 'curl':
        return [
          { id: 'url', name: 'URL', type: 'string', required: true },
          { id: 'method', name: 'Method', type: 'string' },
          { id: 'headers', name: 'Headers', type: 'object' },
          { id: 'data', name: 'Data', type: 'string' }
        ];
      default:
        return [{ id: 'input', name: 'Input', type: 'any' }];
    }
  };

  const getDefaultOutputs = (type: string) => {
    switch (type) {
      case 'bash':
        return [
          { id: 'stdout', name: 'Output', type: 'string' },
          { id: 'stderr', name: 'Error', type: 'string' },
          { id: 'exitCode', name: 'Exit Code', type: 'number' }
        ];
      case 'regex':
        return [
          { id: 'matches', name: 'Matches', type: 'array' },
          { id: 'groups', name: 'Groups', type: 'array' }
        ];
      case 'curl':
        return [
          { id: 'response', name: 'Response', type: 'string' },
          { id: 'status', name: 'Status', type: 'number' },
          { id: 'headers', name: 'Headers', type: 'object' }
        ];
      default:
        return [{ id: 'output', name: 'Output', type: 'any' }];
    }
  };

  return (
    <div className="editor-workspace">
      {/* Left Toolbar - Node Palette */}
      <NodePalette onAddNode={handleAddNode} />

      {/* Canvas Area */}
      <div className="canvas-area" ref={canvasRef} onDrop={handleDrop} onDragOver={handleDragOver}>
        <div className="canvas-content">
          <div className="grid-background" />
          
          {/* Nodes */}
          {nodes.map(node => (
            <NodeComponent
              key={node.id}
              node={node}
              selected={selectedNode?.id === node.id}
              onSelect={handleNodeSelect}
              onDrag={handleNodeDrag}
              onStartConnection={handleStartConnection}
              onCompleteConnection={handleCompleteConnection}
              connecting={connecting}
            />
          ))}

          {/* Auto-generated connections between vertically stacked nodes */}
          <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            {nodes.map((node, index) => {
              if (index === 0) return null; // Skip first node
              const prevNode = nodes[index - 1];
              const startX = prevNode.position.x + 90; // Center of node width
              const startY = prevNode.position.y + 60; // Bottom of node
              const endX = node.position.x + 90;
              const endY = node.position.y; // Top of node
              
              return (
                <path
                  key={`auto-connection-${index}`}
                  d={`M ${startX} ${startY} L ${endX} ${endY}`}
                  stroke="#10b981"
                  strokeWidth="3"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
            
            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#10b981"
                />
              </marker>
            </defs>
          </svg>

          {/* Manual Connections */}
          {connections.map(connection => (
            <ConnectionLine
              key={connection.id}
              connection={connection}
              nodes={nodes}
            />
          ))}

          {/* Canvas Tooltip */}
          {nodes.length === 0 && (
            <div 
              className="absolute"
              style={{
                top: '20px',
                left: '20px',
                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                border: '1px solid #374151',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#d1d5db',
                fontSize: '14px',
                maxWidth: '300px',
                zIndex: 10
              }}
            >
              💡 <strong>Tip:</strong> Drag coding blocks from the left panel to start creating your workflow. Try adding a Variable block followed by a Print block!
            </div>
          )}
        </div>
        
        {/* Canvas Info */}
        <div className="canvas-info">
          <div className="canvas-info-title">Workflow Editor</div>
          <div className="canvas-info-subtitle">Drag nodes to connect</div>
        </div>
      </div>

      {/* Right Panel - Properties */}
      <PropertiesPanel 
        selectedNode={selectedNode}
        onUpdateNode={(node) => {
          setNodes(prev => prev.map(n => n.id === node.id ? node : n));
          setSelectedNode(node);
        }}
      />
    </div>
  );
};

export default WorkflowEditor;