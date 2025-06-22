import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { WorkflowNode, Connection, Position, WorkflowPanel } from '../types';
import NodeComponent from './NodeComponent';
import ConnectionLine from './ConnectionLine';
import NodePalette from './NodePalette';
import PropertiesPanel from './PropertiesPanel';
import PanelComponent from './PanelComponent';
import PanelModal from './PanelModal';

interface WorkflowEditorProps {
  onConsoleOutput?: (updater: (prev: string[]) => string[]) => void;
  onExecutionState?: (isExecuting: boolean) => void;
  onRegisterExecute?: (callback: () => void) => void;
  onRegisterGenerateCode?: (callback: () => string) => void;
  onRegisterSave?: (callback: () => void) => void;
  onRegisterImportWorkflow?: (callback: (workflowData: any) => void) => void;
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  onConsoleOutput,
  onExecutionState,
  onRegisterExecute,
  onRegisterGenerateCode,
  onRegisterSave,
  onRegisterImportWorkflow
}) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [panels, setPanels] = useState<WorkflowPanel[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<WorkflowPanel | null>(null);
  const [connecting, setConnecting] = useState<{
    nodeId: string;
    outputId: string;
  } | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showPanelModal, setShowPanelModal] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Refs to capture current state for callbacks
  const nodesRef = useRef<WorkflowNode[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  
  // Initialize with main panel and try to restore from localStorage
  useEffect(() => {
    if (panels.length === 0) {
      // Try to restore from localStorage first
      try {
        const savedWorkflow = localStorage.getItem('agentblocks_workflow');
        if (savedWorkflow) {
          const workflowData = JSON.parse(savedWorkflow);
          if (workflowData.nodes && workflowData.panels) {
            setNodes(workflowData.nodes);
            setConnections(workflowData.connections || []);
            setPanels(workflowData.panels);
            setSelectedPanel(workflowData.panels[0]);
            onConsoleOutput?.(prev => [...prev, `🔄 Restored workflow from browser storage (${workflowData.nodes.length} nodes)`]);
            return;
          }
        }
      } catch (error) {
        onConsoleOutput?.(prev => [...prev, `⚠️ Could not restore from storage: ${error}`]);
      }
      
      // If no saved workflow, create default main panel
      const mainPanel: WorkflowPanel = {
        id: 'main-panel',
        name: 'Main',
        type: 'main',
        position: { x: 100, y: 100 },
        size: { width: 400, height: 300 },
        color: '#3b82f6',
        isExpanded: true
      };
      setPanels([mainPanel]);
      setSelectedPanel(mainPanel);
    }
  }, [panels.length, onConsoleOutput]);
  
  // Update refs when state changes
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  
  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);

  const handleNodeSelect = useCallback((node: WorkflowNode) => {
    setSelectedNode(node);
  }, []);

  const handleNodeDrag = useCallback((nodeId: string, position: Position) => {
    setNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        const updatedNode = { ...node, position };
        
        // Update panel position when nodes move (nodes should move panels)
        const panel = panels.find(p => p.id === node.panelId);
        if (panel) {
          const panelNodes = prev.filter(n => n.panelId === panel.id);
          if (panelNodes.length === 1) {
            // If this is the only node, move the panel with it
            const newPanelPosition = {
              x: position.x - 16, // Account for panel padding
              y: position.y - 56  // Account for panel header + padding
            };
            setPanels(prevPanels => prevPanels.map(p => 
              p.id === panel.id ? { ...p, position: newPanelPosition } : p
            ));
          }
        }
        
        return updatedNode;
      }
      return node;
    }));
  }, [panels]);

  const handleAddNode = useCallback((type: string, position: Position, panelId?: string, insertAfterNodeId?: string) => {
    const targetPanelId = panelId || selectedPanel?.id || 'main-panel';
    const targetPanel = panels.find(p => p.id === targetPanelId);
    
    // Position is relative to panel if panelId is provided
    let nodePosition = { ...position };
    if (panelId && targetPanel) {
      // Convert relative position to absolute
      nodePosition = {
        x: targetPanel.position.x + position.x,
        y: targetPanel.position.y + 40 + position.y // Add header height
      };
    }

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type,
      position: nodePosition,
      panelId: targetPanelId,
      properties: getDefaultProperties(type),
      inputs: getDefaultInputs(type),
      outputs: getDefaultOutputs(type),
    };
    
    setNodes(prev => [...prev, newNode]);
    
    // Expand panel if it was collapsed
    if (targetPanel && !targetPanel.isExpanded) {
      setPanels(prevPanels => prevPanels.map(panel => 
        panel.id === targetPanelId ? { ...panel, isExpanded: true } : panel
      ));
    }
  }, [nodes, selectedPanel, panels]);

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

  const generatePythonCodeFromNodes = useCallback((nodeList: WorkflowNode[]) => {
    if (nodeList.length === 0) return '';
    
    let code = '# Generated Python Code\n';
    
    // Sort nodes by their vertical position to maintain execution order
    const sortedNodes = [...nodeList].sort((a, b) => a.position.y - b.position.y);
    
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
        // Data structure nodes
        case 'list_create':
          const listName = node.properties.name || 'my_list';
          const listItems = node.properties.items || '[]';
          code += `${listName} = ${listItems}\n`;
          break;
        case 'list_append':
          const targetList = node.properties.list || 'my_list';
          const appendItem = node.properties.item || 'item';
          code += `${targetList}.append(${appendItem})\n`;
          break;
        case 'list_get':
          const getList = node.properties.list || 'my_list';
          const getIndex = node.properties.index || '0';
          const getVar = node.properties.variable || 'item';
          code += `${getVar} = ${getList}[${getIndex}]\n`;
          break;
        case 'list_length':
          const lengthList = node.properties.list || 'my_list';
          const lengthVar = node.properties.variable || 'length';
          code += `${lengthVar} = len(${lengthList})\n`;
          break;
        case 'list_comprehension':
          const compVar = node.properties.variable || 'result';
          const compExpression = node.properties.expression || 'x';
          const compIterable = node.properties.iterable || 'range(10)';
          const compCondition = node.properties.condition || '';
          const condition_part = compCondition ? ` if ${compCondition}` : '';
          code += `${compVar} = [${compExpression} for x in ${compIterable}${condition_part}]\n`;
          break;
        case 'set_create':
          const setName = node.properties.name || 'my_set';
          const setItems = node.properties.items || 'set()';
          code += `${setName} = ${setItems}\n`;
          break;
        case 'set_add':
          const targetSet = node.properties.set || 'my_set';
          const addItem = node.properties.item || 'item';
          code += `${targetSet}.add(${addItem})\n`;
          break;
        case 'dict_create':
          const dictName = node.properties.name || 'my_dict';
          const dictItems = node.properties.items || '{}';
          code += `${dictName} = ${dictItems}\n`;
          break;
        case 'dict_get':
          const getDict = node.properties.dict || 'my_dict';
          const getKey = node.properties.key || 'key';
          const getDictVar = node.properties.variable || 'value';
          code += `${getDictVar} = ${getDict}[${getKey}]\n`;
          break;
        case 'dict_set':
          const setDict = node.properties.dict || 'my_dict';
          const setKey = node.properties.key || 'key';
          const setValue = node.properties.value || 'value';
          code += `${setDict}[${setKey}] = ${setValue}\n`;
          break;
      }
    });
    
    return code;
  }, []);

  const generatePythonCode = useCallback(() => {
    return generatePythonCodeFromNodes(nodes);
  }, [nodes, generatePythonCodeFromNodes]);

  const executeWorkflow = useCallback(async () => {
    const currentNodes = nodesRef.current;
    if (currentNodes.length === 0) {
      onConsoleOutput?.(prev => [...prev, 'Error: No nodes to execute']);
      return;
    }

    onExecutionState?.(true);
    onConsoleOutput?.(prev => [...prev, '=== Execution Started ===']);
    
    try {
      // Generate Python code using current nodes
      const pythonCode = generatePythonCodeFromNodes(currentNodes);
      onConsoleOutput?.(prev => [...prev, 'Generated Python Code:', pythonCode]);
      
      // Simulate execution for demo purposes
      setTimeout(() => {
        // Simple interpreter for demo - just handle variable and print
        const lines = pythonCode.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        const variables: Record<string, string> = {};
        
        onConsoleOutput?.(prev => [...prev, `Processing ${lines.length} lines of code`]);
        
        lines.forEach(line => {
          const trimmedLine = line.trim();
          
          // Handle variable assignment
          if (trimmedLine.includes(' = ')) {
            const [varName, value] = trimmedLine.split(' = ');
            const cleanValue = value.replace(/"/g, '');
            variables[varName.trim()] = cleanValue;
            onConsoleOutput?.(prev => [...prev, `Variable assigned: ${varName.trim()} = ${cleanValue}`]);
          }
          
          // Handle print statements
          if (trimmedLine.startsWith('print(')) {
            const printContent = trimmedLine.match(/print\((.*)\)/)?.[1];
            if (printContent) {
              let output = printContent.replace(/"/g, '');
              // Replace variable references
              Object.keys(variables).forEach(varName => {
                if (output === varName) {
                  output = variables[varName];
                }
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
  }, [onConsoleOutput, onExecutionState]); // Removed dependencies that cause re-creation

  const saveWorkflow = useCallback(() => {
    const currentNodes = nodesRef.current;
    const currentConnections = connectionsRef.current;
    
    const workflowData = {
      nodes: currentNodes,
      connections: currentConnections,
      panels: panels,
      metadata: {
        created: new Date().toISOString(),
        version: '1.0.0',
        nodeCount: currentNodes.length,
        panelCount: panels.length
      }
    };
    
    // Just log the save action instead of downloading
    onConsoleOutput?.(prev => [...prev, `💾 Workflow saved to memory (${currentNodes.length} nodes, ${currentConnections.length} connections, ${panels.length} panels)`]);
    
    // Optional: Store in localStorage for persistence
    try {
      localStorage.setItem('agentblocks_workflow', JSON.stringify(workflowData));
      onConsoleOutput?.(prev => [...prev, `✅ Workflow also saved to browser storage`]);
    } catch (error) {
      onConsoleOutput?.(prev => [...prev, `⚠️ Could not save to browser storage: ${error}`]);
    }
  }, [onConsoleOutput, panels]); // Stable dependencies only

  const importWorkflow = useCallback((workflowData: any) => {
    try {
      if (workflowData.nodes && Array.isArray(workflowData.nodes)) {
        // Convert imported nodes to ensure they have proper IDs and positions
        const importedNodes = workflowData.nodes.map((node: any, index: number) => ({
          id: node.id || `imported-${Date.now()}-${index}`,
          type: node.type || 'variable',
          position: node.position || { x: 100 + (index * 30), y: 100 + (index * 150) },
          properties: node.properties || node.params || {},
          panelId: 'main-panel'
        }));
        
        setNodes(prev => [...prev, ...importedNodes]);
        
        if (workflowData.connections && Array.isArray(workflowData.connections)) {
          setConnections(prev => [...prev, ...workflowData.connections]);
        }
        
        onConsoleOutput?.(prev => [...prev, `✅ Imported ${importedNodes.length} nodes successfully`]);
      } else {
        onConsoleOutput?.(prev => [...prev, `❌ Invalid workflow format - missing nodes array`]);
      }
    } catch (error) {
      onConsoleOutput?.(prev => [...prev, `❌ Error importing workflow: ${error}`]);
    }
  }, [onConsoleOutput]);

  // Register callbacks with parent
  useEffect(() => {
    if (onRegisterExecute) {
      onRegisterExecute(executeWorkflow);
    }
  }, [executeWorkflow, onRegisterExecute]);

  useEffect(() => {
    if (onRegisterGenerateCode) {
      onRegisterGenerateCode(generatePythonCode);
    }
  }, [generatePythonCode, onRegisterGenerateCode]);

  useEffect(() => {
    if (onRegisterSave) {
      onRegisterSave(saveWorkflow);
    }
  }, [saveWorkflow, onRegisterSave]);

  useEffect(() => {
    if (onRegisterImportWorkflow) {
      onRegisterImportWorkflow(importWorkflow);
    }
  }, [importWorkflow, onRegisterImportWorkflow]);

  // Panel management functions
  const handleCreatePanel = useCallback((name: string) => {
    const newPanel: WorkflowPanel = {
      id: `panel_${Date.now()}`,
      name,
      type: 'module',
      position: { x: 200 + panels.length * 50, y: 150 + panels.length * 50 },
      size: { width: 400, height: 300 },
      color: '#8b5cf6',
      isExpanded: true
    };
    setPanels(prev => [...prev, newPanel]);
    setSelectedPanel(newPanel);
    setShowPanelModal(false);
  }, [panels]);

  const handlePanelSelect = useCallback((panel: WorkflowPanel) => {
    setSelectedPanel(panel);
    setSelectedNode(null);
  }, []);

  const handlePanelDrag = useCallback((panelId: string, newPosition: Position) => {
    const panel = panels.find(p => p.id === panelId);
    if (panel) {
      const deltaX = newPosition.x - panel.position.x;
      const deltaY = newPosition.y - panel.position.y;
      
      // Move panel
      setPanels(prev => prev.map(p => 
        p.id === panelId ? { ...p, position: newPosition } : p
      ));
      
      // Move all nodes in the panel
      setNodes(prev => prev.map(node => {
        if (node.panelId === panelId) {
          return {
            ...node,
            position: {
              x: node.position.x + deltaX,
              y: node.position.y + deltaY
            }
          };
        }
        return node;
      }));
    }
  }, [panels]);

  const handlePanelResize = useCallback((panelId: string, size: { width: number; height: number }) => {
    setPanels(prev => prev.map(panel => 
      panel.id === panelId ? { ...panel, size } : panel
    ));
  }, []);

  const handleNodeDropInPanel = useCallback((panelId: string, position: Position, blockType: string, insertAfterNodeId?: string) => {
    handleAddNode(blockType, position, panelId, insertAfterNodeId);
  }, [handleAddNode]);
  
  const handleTogglePanelExpanded = useCallback((panelId: string) => {
    setPanels(prev => prev.map(panel => 
      panel.id === panelId ? { ...panel, isExpanded: !panel.isExpanded } : panel
    ));
  }, []);
  
  const handleNodeDragInPanel = useCallback((nodeId: string, newPosition: Position) => {
    setNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        const panel = panels.find(p => p.id === node.panelId);
        if (panel) {
          // Convert relative position to absolute
          return {
            ...node,
            position: {
              x: panel.position.x + newPosition.x,
              y: panel.position.y + 40 + newPosition.y
            }
          };
        }
      }
      return node;
    }));
  }, [panels]);
  
  const handleNodeReorder = useCallback((panelId: string, nodeId: string, newIndex: number) => {
    setNodes(prev => {
      const panelNodes = prev.filter(node => node.panelId === panelId).sort((a, b) => a.position.y - b.position.y);
      const targetNode = prev.find(node => node.id === nodeId);
      
      if (!targetNode || !panelNodes.length) return prev;
      
      // Remove the dragged node from its current position
      const filteredNodes = panelNodes.filter(node => node.id !== nodeId);
      
      // Insert at new position
      const reorderedPanelNodes = [...filteredNodes];
      reorderedPanelNodes.splice(newIndex, 0, targetNode);
      
      // Update positions for all nodes in the panel
      const panel = panels.find(p => p.id === panelId);
      if (panel) {
        const updatedNodes = prev.map(node => {
          if (node.panelId === panelId) {
            const nodeIndex = reorderedPanelNodes.findIndex(n => n.id === node.id);
            if (nodeIndex !== -1) {
              return {
                ...node,
                position: {
                  x: panel.position.x + 16 + ((node.indentLevel || 0) * 24),
                  y: panel.position.y + 56 + (nodeIndex * 52) // header + padding + spacing
                }
              };
            }
          }
          return node;
        });
        
        return updatedNodes;
      }
      
      return prev;
    });
  }, [panels]);
  
  const handleDeleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      setNodes(prev => prev.filter(node => node.id !== selectedNode.id));
      setSelectedNode(null);
    }
  }, [selectedNode]);
  
  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedNode) {
        handleDeleteSelectedNode();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, handleDeleteSelectedNode]);

  const handleImportWorkflow = useCallback((workflowData: any) => {
    try {
      if (workflowData.nodes && Array.isArray(workflowData.nodes)) {
        const importedNodes: WorkflowNode[] = workflowData.nodes.map((nodeData: any, index: number) => ({
          id: nodeData.id || `imported_node_${Date.now()}_${index}`,
          type: nodeData.type || 'variable',
          position: {
            x: 200 + (index * 50), // Offset imported nodes
            y: 200 + (index * 80)
          },
          panelId: 'main-panel', // Import to main panel by default
          properties: nodeData.params || {},
          inputs: nodeData.inputs ? nodeData.inputs.map((input: any) => ({
            id: typeof input === 'string' ? input : input.id || input.name,
            name: typeof input === 'string' ? input : input.name || input.id,
            type: typeof input === 'object' ? input.type || 'any' : 'any',
            required: false
          })) : [],
          outputs: nodeData.outputs ? nodeData.outputs.map((output: any) => ({
            id: typeof output === 'string' ? output : output.id || output.name,
            name: typeof output === 'string' ? output : output.name || output.id,
            type: typeof output === 'object' ? output.type || 'any' : 'any'
          })) : []
        }));

        setNodes(prev => [...prev, ...importedNodes]);

        // Import connections if provided
        if (workflowData.connections && Array.isArray(workflowData.connections)) {
          const importedConnections: Connection[] = workflowData.connections.map((connData: any, index: number) => ({
            id: `imported_conn_${Date.now()}_${index}`,
            source_node: connData.from || connData.source_node,
            source_output: connData.output || connData.source_output,
            target_node: connData.to || connData.target_node,
            target_input: connData.input || connData.target_input
          }));

          setConnections(prev => [...prev, ...importedConnections]);
        }

        onConsoleOutput?.(prev => [...prev, `✅ Successfully imported ${importedNodes.length} nodes${workflowData.connections ? ` and ${workflowData.connections.length} connections` : ''}`]);
      } else {
        onConsoleOutput?.(prev => [...prev, `❌ Invalid workflow data: missing or invalid nodes array`]);
      }
    } catch (error) {
      onConsoleOutput?.(prev => [...prev, `❌ Error importing workflow: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }
  }, [onConsoleOutput]);

  const loadWorkflow = useCallback((jsonData: string) => {
    try {
      const workflowData = JSON.parse(jsonData);
      if (workflowData.nodes && Array.isArray(workflowData.nodes)) {
        setNodes(workflowData.nodes);
        setConnections(workflowData.connections || []);
        setPanels(workflowData.panels || []);
        onConsoleOutput?.(prev => [...prev, `Workflow loaded (${workflowData.nodes.length} nodes, ${(workflowData.panels || []).length} panels)`]);
      }
    } catch (error) {
      onConsoleOutput?.(prev => [...prev, `Error loading workflow: ${error}`]);
    }
  }, [onConsoleOutput]);

  const getNodeColor = (type: string) => {
    const colors: Record<string, string> = {
      // Original node types
      bash: '#3b82f6',
      regex: '#8b5cf6',
      curl: '#10b981',
      scp: '#f97316',
      input: '#6b7280',
      output: '#6b7280',
      conditional: '#eab308',
      loop: '#ef4444',
      transform: '#6366f1',
      agent: '#ec4899',
      // New coding block types
      variable: '#f97316',
      assignment: '#eab308',
      'if-then': '#22c55e',
      foreach: '#8b5cf6',
      while: '#ec4899',
      function: '#3b82f6',
      execute: '#ef4444',
      print: '#10b981',
      // New block types from design
      find_files: '#3b82f6',
      read_file: '#3b82f6',
      write_file: '#3b82f6',
      copy_file: '#3b82f6',
      text_transform: '#22c55e',
      regex_match: '#8b5cf6',
      http_request: '#10b981',
      download_file: '#10b981',
      webhook: '#10b981',
      ai_text_gen: '#10b981',
      ai_code_gen: '#10b981',
      ai_analysis: '#10b981',
      python_code: '#ef4444',
      shell_command: '#ef4444',
      hybrid_template: '#8b5cf6'
    };
    return colors[type] || '#6b7280';
  };

  // Register callbacks with parent (stable callbacks)
  useEffect(() => {
    onRegisterExecute?.(executeWorkflow);
    onRegisterGenerateCode?.(generatePythonCode);
    onRegisterSave?.(saveWorkflow);
    onRegisterImportWorkflow?.(handleImportWorkflow);
  }, [onRegisterExecute, onRegisterGenerateCode, onRegisterSave, onRegisterImportWorkflow, handleImportWorkflow]); // Remove callback dependencies to prevent re-registration

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
      {/* Block Palette */}
      <NodePalette onAddNode={handleAddNode} />

      {/* Canvas Area */}
      <div className="canvas-area" ref={canvasRef} onDrop={handleDrop} onDragOver={handleDragOver}>
        <div className="canvas-content">
          <div className="grid-background" />
          
          {/* Panels */}
          {panels.map(panel => (
            <PanelComponent
              key={panel.id}
              panel={panel}
              nodes={nodes}
              selected={selectedPanel?.id === panel.id}
              onSelect={handlePanelSelect}
              onDrag={handlePanelDrag}
              onResize={handlePanelResize}
              onNodeDrop={handleNodeDropInPanel}
              onToggleExpanded={handleTogglePanelExpanded}
              onNodeDrag={handleNodeDragInPanel}
              onNodeReorder={handleNodeReorder}
            />
          ))}

          {/* Nodes - only render nodes that are in expanded panels or not in any panel */}
          {nodes
            .filter(node => {
              if (!node.panelId) return true; // Orphaned nodes
              const panel = panels.find(p => p.id === node.panelId);
              return panel?.isExpanded !== false; // Show if panel is expanded or doesn't exist
            })
            .map(node => {
              const panel = panels.find(p => p.id === node.panelId);
              let nodePosition = node.position;
              
              // If node is in a panel, position it relative to the panel
              if (panel && panel.isExpanded) {
                const panelNodes = nodes.filter(n => n.panelId === panel.id);
                const nodeIndex = panelNodes.findIndex(n => n.id === node.id);
                nodePosition = {
                  x: panel.position.x + 16 + ((node.indentLevel || 0) * 24),
                  y: panel.position.y + 56 + (nodeIndex * 52) // header + padding + node spacing
                };
              }
              
              return (
                <NodeComponent
                  key={node.id}
                  node={{ ...node, position: nodePosition }}
                  selected={selectedNode?.id === node.id}
                  onSelect={handleNodeSelect}
                  onDrag={handleNodeDrag}
                  onStartConnection={handleStartConnection}
                  onCompleteConnection={handleCompleteConnection}
                  connecting={connecting}
                  connections={connections}
                />
              );
            })}

          {/* Auto-generated connections between vertically stacked nodes */}
          <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            {nodes.map((node, index) => {
              if (index === 0) return null; // Skip first node
              const prevNode = nodes[index - 1];
              
              // Connect from output connector (bottom triangle) to input connector (top triangle)
              const startX = prevNode.position.x + 110; // Center of node (220px / 2)
              const startY = prevNode.position.y + 120; // Bottom of previous node (output connector)
              const endX = node.position.x + 110; // Center of current node
              const endY = node.position.y - 8; // Top of current node (input connector)
              
              // Create smooth curve
              const midY = startY + (endY - startY) / 2;
              
              return (
                <g key={`auto-connection-${index}`}>
                  <path
                    d={`M ${startX} ${startY} Q ${startX} ${midY} ${endX} ${endY}`}
                    stroke="#10b981"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="none"
                  />
                  {/* Connection glow effect */}
                  <path
                    d={`M ${startX} ${startY} Q ${startX} ${midY} ${endX} ${endY}`}
                    stroke="#10b981"
                    strokeWidth="6"
                    fill="none"
                    opacity="0.3"
                  />
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

        </div>
        
        {/* Canvas Info */}
        <div className="canvas-info">
          <div className="canvas-info-title">Workflow Editor</div>
          <div className="canvas-info-subtitle">Drag nodes to connect</div>
        </div>

        {/* Minimap */}
        <div className="minimap">
          <div className="minimap-header">Minimap</div>
          <div className="minimap-content">
            <svg width="120" height="80" viewBox="0 0 1600 1200" className="minimap-svg">
              <rect width="1600" height="1200" fill="#111827" />
              {nodes.map(node => (
                <rect
                  key={`minimap-${node.id}`}
                  x={node.position.x / 8}
                  y={node.position.y / 8}
                  width="22.5"
                  height="10"
                  fill={getNodeColor(node.type)}
                  opacity="0.8"
                />
              ))}
            </svg>
          </div>
        </div>
        
        {/* Canvas Controls */}
        <div className="canvas-controls">
          <button 
            className="canvas-control-button primary"
            onClick={() => setShowPanelModal(true)}
          >
            + Add Module
          </button>
        </div>

        {/* Node Action Controls */}
        {selectedNode && (
          <div className="node-action-controls">
            <button 
              className="node-action-button"
              onClick={() => window.open(`/block-editor/${selectedNode.id}`, '_blank')}
              title="Edit Blocks"
            >
              ✏️
            </button>
            <button 
              className="node-action-button"
              onClick={() => {
                // Duplicate node logic would go here
                console.log('Duplicate node:', selectedNode.id);
              }}
              title="Duplicate Node"
            >
              📋
            </button>
            <button 
              className="node-action-button delete"
              onClick={handleDeleteSelectedNode}
              title="Delete Node"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Panel Modal */}
      <PanelModal
        isOpen={showPanelModal}
        onCreatePanel={handleCreatePanel}
        onClose={() => setShowPanelModal(false)}
      />

      {/* Right Panel - Properties */}
      <PropertiesPanel 
        selectedNode={selectedNode}
        selectedPanel={selectedPanel}
        nodes={nodes}
        panels={panels}
        onUpdateNode={(node) => {
          setNodes(prev => prev.map(n => n.id === node.id ? node : n));
          setSelectedNode(node);
        }}
        onNodeSelect={handleNodeSelect}
        onPanelSelect={handlePanelSelect}
      />
    </div>
  );
};

export default WorkflowEditor;