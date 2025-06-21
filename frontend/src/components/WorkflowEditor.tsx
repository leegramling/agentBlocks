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
  onRegisterSave?: (callback: () => void) => void;
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  onConsoleOutput,
  onExecutionState,
  onRegisterExecute,
  onRegisterGenerateCode,
  onRegisterSave
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

  const saveWorkflow = useCallback(() => {
    const workflowData = {
      nodes,
      connections,
      metadata: {
        created: new Date().toISOString(),
        version: '1.0.0',
        nodeCount: nodes.length
      }
    };
    
    const jsonString = JSON.stringify(workflowData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    onConsoleOutput?.(prev => [...prev, `Workflow saved as JSON (${nodes.length} nodes, ${connections.length} connections)`]);
  }, [nodes, connections, onConsoleOutput]);

  const loadWorkflow = useCallback((jsonData: string) => {
    try {
      const workflowData = JSON.parse(jsonData);
      if (workflowData.nodes && Array.isArray(workflowData.nodes)) {
        setNodes(workflowData.nodes);
        setConnections(workflowData.connections || []);
        onConsoleOutput?.(prev => [...prev, `Workflow loaded (${workflowData.nodes.length} nodes)`]);
      }
    } catch (error) {
      onConsoleOutput?.(prev => [...prev, `Error loading workflow: ${error}`]);
    }
  }, [onConsoleOutput]);

  // Register callbacks with parent
  useEffect(() => {
    onRegisterExecute?.(executeWorkflow);
    onRegisterGenerateCode?.(generatePythonCode);
    onRegisterSave?.(saveWorkflow);
  }, [executeWorkflow, generatePythonCode, saveWorkflow, onRegisterExecute, onRegisterGenerateCode, onRegisterSave]);

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
              
              // Connect from output dot of previous node to input dot of current node
              const startX = prevNode.position.x - 4; // Connection bar position
              const startY = prevNode.position.y + 55; // Near bottom of previous node (output dot)
              const endX = node.position.x - 4; // Connection bar position
              const endY = node.position.y + 15; // Near top of current node (input dot)
              
              return (
                <g key={`auto-connection-${index}`}>
                  <path
                    d={`M ${startX} ${startY} L ${startX} ${startY + 10} L ${endX} ${endY - 10} L ${endX} ${endY}`}
                    stroke="#10b981"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="none"
                  />
                  {/* Connection indicator dots */}
                  <circle cx={startX} cy={startY} r="3" fill="#10b981" />
                  <circle cx={endX} cy={endY} r="3" fill="#3b82f6" />
                </g>
              );
            })}
            
            {/* Foreach loop scope visualization */}
            {nodes.map((node, index) => {
              if (node.type !== 'foreach') return null;
              
              // Find nodes that are part of this loop (next few nodes until another control structure)
              const loopNodes = [];
              for (let i = index + 1; i < nodes.length; i++) {
                const nextNode = nodes[i];
                if (['foreach', 'while', 'if-then', 'function'].includes(nextNode.type)) {
                  break; // Stop at next control structure
                }
                loopNodes.push(nextNode);
              }
              
              if (loopNodes.length === 0) return null;
              
              const firstLoopNode = loopNodes[0];
              const lastLoopNode = loopNodes[loopNodes.length - 1];
              const scopeStartY = node.position.y + 60;
              const scopeEndY = lastLoopNode.position.y + 60;
              const scopeX = node.position.x - 16;
              
              return (
                <g key={`foreach-scope-${index}`}>
                  {/* Vertical line showing loop scope */}
                  <line
                    x1={scopeX}
                    y1={scopeStartY}
                    x2={scopeX}
                    y2={scopeEndY}
                    stroke="#8b5cf6"
                    strokeWidth="3"
                    strokeDasharray="4,2"
                  />
                  {/* Loop indicators */}
                  <circle cx={scopeX} cy={scopeStartY} r="4" fill="#8b5cf6" />
                  <circle cx={scopeX} cy={scopeEndY} r="4" fill="#8b5cf6" />
                  {/* Loop label */}
                  <text
                    x={scopeX - 20}
                    y={scopeStartY + (scopeEndY - scopeStartY) / 2}
                    fill="#8b5cf6"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                    transform={`rotate(-90, ${scopeX - 20}, ${scopeStartY + (scopeEndY - scopeStartY) / 2})`}
                  >
                    LOOP
                  </text>
                </g>
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