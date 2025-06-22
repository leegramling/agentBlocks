import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { WorkflowNode, Connection, Position, WorkflowPanel } from '../types';
import NodeComponent from './NodeComponent';
import ConnectionLine from './ConnectionLine';
import NodePalette from './NodePalette';
import PropertiesPanel, { type PropertiesPanelRef } from './PropertiesPanel';
import PanelComponent from './PanelComponent';
import PanelModal from './PanelModal';
import CanvasPropertyPanel from './CanvasPropertyPanel';
import { toPythonFString, hasVariableReferences } from '../utils/variableSubstitution';

interface WorkflowEditorProps {
  onConsoleOutput?: (updater: (prev: string[]) => string[]) => void;
  onExecutionState?: (isExecuting: boolean) => void;
  onNodeCountChange?: (count: number) => void;
  onRegisterExecute?: (callback: () => void) => void;
  onRegisterGenerateCode?: (callback: () => string) => void;
  onRegisterSave?: (callback: () => void) => void;
  onRegisterImportWorkflow?: (callback: (workflowData: any) => void) => void;
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  onConsoleOutput,
  onExecutionState,
  onNodeCountChange,
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
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  const [showCanvasPropertyPanel, setShowCanvasPropertyPanel] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const propertiesPanelRef = useRef<PropertiesPanelRef>(null);
  
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
    onNodeCountChange?.(nodes.length);
  }, [nodes, onNodeCountChange]);
  
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
      const dropPosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      // Check if the drop is over any existing panel
      const droppedOnPanel = panels.find(panel => {
        const panelLeft = panel.position.x;
        const panelTop = panel.position.y;
        const panelRight = panelLeft + panel.size.width;
        const panelBottom = panelTop + panel.size.height;
        
        return dropPosition.x >= panelLeft && 
               dropPosition.x <= panelRight && 
               dropPosition.y >= panelTop && 
               dropPosition.y <= panelBottom;
      });
      
      // If dropped on an existing panel, let the panel handle it
      if (droppedOnPanel) {
        return; // Panel's drop handler will take care of this
      }
      
      // Create a new module for canvas drops
      const moduleCount = panels.filter(p => p.type === 'module').length;
      const moduleName = `Module${String(moduleCount + 1).padStart(2, '0')}`;
      
      const newPanel: WorkflowPanel = {
        id: `module_${Date.now()}`,
        name: moduleName,
        type: 'module',
        position: { 
          x: dropPosition.x - 140, // Center panel on drop position
          y: dropPosition.y - 30
        },
        size: { width: 280, height: 120 },
        color: '#8b5cf6',
        isExpanded: true
      };
      
      // Add the new panel
      setPanels(prev => [...prev, newPanel]);
      setSelectedPanel(newPanel);
      
      // Add the node to the new panel
      const nodePosition = {
        x: 16, // Left padding within panel
        y: 16  // Top padding within panel
      };
      
      handleAddNode(blockType, nodePosition, newPanel.id);
      
      onConsoleOutput?.(prev => [...prev, `📦 Created ${moduleName} with ${blockType} node`]);
    }
  }, [handleAddNode, panels, onConsoleOutput]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const getDefaultProperties = (type: string): Record<string, any> => {
    switch (type) {
      case 'variable':
        return { name: 'counter', value: '0' };
      case 'print':
        return { message: 'f"{counter}. {fruit}"' };
      case 'assignment':
        return { variable: 'result', expression: 'value' };
      case 'if-then':
        return { condition: 'variable == "hello world"' };
      case 'foreach':
        return { iterable: 'fruits', variable: 'fruit' };
      case 'while':
        return { condition: 'counter < 10' };
      case 'function':
        return { name: 'myFunction', parameters: 'param1, param2' };
      case 'execute':
        return { command: 'print("Executing...")' };
      case 'increment':
        return { variable: 'counter' };
      case 'list_create':
        return { name: 'fruits', items: 'apple\norange\npear' };
      case 'pycode':
        return { code: '# Custom Python code\nprint("Hello from pycode!")' };
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
    
    // Helper function to generate code for a single node with proper indentation
    const generateNodeCode = (node: WorkflowNode, indentLevel: number = 0): string => {
      const indent = '    '.repeat(indentLevel);
      
      switch (node.type) {
        case 'variable':
          const varName = node.properties.name || 'myVariable';
          const varValue = node.properties.value || 'hello world';
          // Support variable references in values
          if (hasVariableReferences(varValue)) {
            return `${indent}${varName} = ${toPythonFString(varValue)}\n`;
          }
          // If it's a simple variable reference, use it directly
          else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varValue)) {
            return `${indent}${varName} = ${varValue}\n`;
          }
          return `${indent}${varName} = "${varValue}"\n`;
        case 'print':
          const message = node.properties.message || 'myVariable';
          // Check if it contains variable references {variable}
          if (hasVariableReferences(message)) {
            return `${indent}print(${toPythonFString(message)})\n`;
          }
          // If message is just a variable name (no quotes), use it directly
          else if (message && !message.includes('"') && !message.includes("'") && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(message)) {
            return `${indent}print(${message})\n`;
          } else {
            return `${indent}print("${message}")\n`;
          }
        case 'assignment':
          const assignVar = node.properties.variable || 'result';
          const expression = node.properties.expression || 'value';
          return `${indent}${assignVar} = ${expression}\n`;
        case 'if-then':
          const condition = node.properties.condition || 'True';
          let ifCode = `${indent}if ${condition}:\n`;
          const ifChildren = getChildNodes(node.id);
          if (ifChildren.length > 0) {
            ifChildren.forEach(child => {
              ifCode += generateNodeCode(child, indentLevel + 1);
            });
          } else {
            ifCode += `${indent}    pass  # Add code here\n`;
          }
          return ifCode;
        case 'foreach':
          const iterable = node.properties.iterable || 'items';
          const loopVar = node.properties.variable || 'item';
          let forCode = `${indent}for ${loopVar} in ${iterable}:\n`;
          const forChildren = getChildNodes(node.id);
          if (forChildren.length > 0) {
            forChildren.forEach(child => {
              forCode += generateNodeCode(child, indentLevel + 1);
            });
          } else {
            forCode += `${indent}    pass  # Add code here\n`;
          }
          return forCode;
        case 'while':
          const whileCondition = node.properties.condition || 'True';
          let whileCode = `${indent}while ${whileCondition}:\n`;
          const whileChildren = getChildNodes(node.id);
          if (whileChildren.length > 0) {
            whileChildren.forEach(child => {
              whileCode += generateNodeCode(child, indentLevel + 1);
            });
          } else {
            whileCode += `${indent}    pass  # Add code here\n`;
          }
          return whileCode;
        case 'function':
          const funcName = node.properties.name || 'myFunction';
          const params = node.properties.parameters || '';
          let funcCode = `${indent}def ${funcName}(${params}):\n`;
          const funcChildren = getChildNodes(node.id);
          if (funcChildren.length > 0) {
            funcChildren.forEach(child => {
              funcCode += generateNodeCode(child, indentLevel + 1);
            });
          } else {
            funcCode += `${indent}    pass  # Add code here\n`;
          }
          return funcCode;
        case 'execute':
          const command = node.properties.command || 'print("Executing...")';
          return `${indent}${command}\n`;
        case 'list_create':
          const listName = node.properties.name || 'my_list';
          const itemsText = node.properties.items || 'apple\norange\npear';
          const itemsArray = itemsText.split('\n').filter((item: string) => item.trim()).map((item: string) => `"${item.trim()}"`);
          return `${indent}${listName} = [${itemsArray.join(', ')}]\n`;
        case 'list_append':
          const targetList = node.properties.list || 'my_list';
          const appendItem = node.properties.item || 'item';
          return `${indent}${targetList}.append(${appendItem})\n`;
        case 'list_get':
          const getList = node.properties.list || 'my_list';
          const getIndex = node.properties.index || '0';
          const getVar = node.properties.variable || 'item';
          return `${indent}${getVar} = ${getList}[${getIndex}]\n`;
        case 'list_length':
          const lengthList = node.properties.list || 'my_list';
          const lengthVar = node.properties.variable || 'length';
          return `${indent}${lengthVar} = len(${lengthList})\n`;
        case 'list_comprehension':
          const compVar = node.properties.variable || 'result';
          const compExpression = node.properties.expression || 'x';
          const compIterable = node.properties.iterable || 'range(10)';
          const compCondition = node.properties.condition || '';
          const condition_part = compCondition ? ` if ${compCondition}` : '';
          return `${indent}${compVar} = [${compExpression} for x in ${compIterable}${condition_part}]\n`;
        case 'set_create':
          const setName = node.properties.name || 'my_set';
          const setItems = node.properties.items || 'set()';
          return `${indent}${setName} = ${setItems}\n`;
        case 'set_add':
          const targetSet = node.properties.set || 'my_set';
          const addItem = node.properties.item || 'item';
          return `${indent}${targetSet}.add(${addItem})\n`;
        case 'dict_create':
          const dictName = node.properties.name || 'my_dict';
          const dictItems = node.properties.items || '{}';
          return `${indent}${dictName} = ${dictItems}\n`;
        case 'dict_get':
          const getDict = node.properties.dict || 'my_dict';
          const getKey = node.properties.key || 'key';
          const getDictVar = node.properties.variable || 'value';
          return `${indent}${getDictVar} = ${getDict}[${getKey}]\n`;
        case 'dict_set':
          const setDict = node.properties.dict || 'my_dict';
          const setKey = node.properties.key || 'key';
          const setValue = node.properties.value || 'value';
          return `${indent}${setDict}[${setKey}] = ${setValue}\n`;
        case 'increment':
          const incVar = node.properties.variable || 'counter';
          return `${indent}${incVar} = ${incVar} + 1\n`;
        case 'pycode':
          const pyCode = node.properties.code || '# Custom Python code';
          return `${indent}${pyCode}\n`;
        default:
          return '';
      }
    };
    
    // Helper function to get child nodes of a parent
    const getChildNodes = (parentId: string): WorkflowNode[] => {
      return nodeList
        .filter(node => node.parentId === parentId)
        .sort((a, b) => a.position.y - b.position.y);
    };
    
    // Get all top-level nodes (nodes without parents)
    const topLevelNodes = nodeList
      .filter(node => !node.parentId)
      .sort((a, b) => a.position.y - b.position.y);
    
    // Generate code for all top-level nodes
    topLevelNodes.forEach(node => {
      code += generateNodeCode(node, 0);
    });
    
    return code;
  }, []);

  const generatePythonCode = useCallback(() => {
    console.log('generatePythonCode called, nodes count:', nodes.length);
    console.log('nodes:', nodes);
    const result = generatePythonCodeFromNodes(nodes);
    console.log('generatePythonCode result:', result);
    return result;
  }, [nodes, generatePythonCodeFromNodes]);

  const executeWorkflow = useCallback(async () => {
    if (nodes.length === 0) {
      onConsoleOutput?.(prev => [...prev, 'Error: No nodes to execute']);
      return;
    }

    onExecutionState?.(true);
    onConsoleOutput?.(prev => [...prev, '=== Execution Started ===']);
    
    try {
      // Generate Python code using current nodes
      const pythonCode = generatePythonCodeFromNodes(nodes);
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
  }, [nodes, generatePythonCodeFromNodes, onConsoleOutput, onExecutionState]);

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
    console.log('WorkflowEditor: Registering generatePythonCode callback, onRegisterGenerateCode available:', !!onRegisterGenerateCode);
    if (onRegisterGenerateCode) {
      console.log('WorkflowEditor: Calling onRegisterGenerateCode with generatePythonCode function');
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

  const handleParentNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Find all nodes in the same panel
    const panelNodes = nodes.filter(n => n.panelId === node.panelId);
    // Sort by vertical position
    const sortedNodes = panelNodes.sort((a, b) => a.position.y - b.position.y);
    
    const currentIndex = sortedNodes.findIndex(n => n.id === nodeId);
    if (currentIndex <= 0) return; // Can't parent the first node
    
    // Find the previous node that can be a parent (foreach, if-then, while, function)
    let parentIndex = currentIndex - 1;
    let potentialParent = sortedNodes[parentIndex];
    
    // Find a suitable parent (a control structure node)
    while (parentIndex >= 0 && !['foreach', 'if-then', 'while', 'function'].includes(potentialParent.type)) {
      parentIndex--;
      if (parentIndex >= 0) {
        potentialParent = sortedNodes[parentIndex];
      }
    }
    
    if (parentIndex < 0) return; // No suitable parent found
    
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          parentId: potentialParent.id,
          indentLevel: (potentialParent.indentLevel || 0) + 1
        };
      }
      if (n.id === potentialParent.id) {
        const currentChildren = n.children || [];
        return {
          ...n,
          children: [...currentChildren, nodeId]
        };
      }
      return n;
    }));
  }, [nodes]);

  const handleUnparentNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.parentId) return;

    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          parentId: undefined,
          indentLevel: 0
        };
      }
      if (n.id === node.parentId) {
        const currentChildren = n.children || [];
        return {
          ...n,
          children: currentChildren.filter(childId => childId !== nodeId)
        };
      }
      return n;
    }));
  }, [nodes]);

  const handleReorderNode = useCallback((draggedNodeId: string, targetNodeId: string, insertBefore: boolean) => {
    const draggedNode = nodes.find(n => n.id === draggedNodeId);
    const targetNode = nodes.find(n => n.id === targetNodeId);
    
    if (!draggedNode || !targetNode || draggedNode.panelId !== targetNode.panelId) {
      return; // Only allow reordering within the same panel
    }
    
    setNodes(prev => {
      // Separate nodes by panel
      const panelNodes = prev.filter(n => n.panelId === draggedNode.panelId);
      const otherNodes = prev.filter(n => n.panelId !== draggedNode.panelId);
      
      // Sort panel nodes by their current position
      const sortedPanelNodes = panelNodes.sort((a, b) => a.position.y - b.position.y);
      
      // Find indices
      const draggedIndex = sortedPanelNodes.findIndex(n => n.id === draggedNodeId);
      const targetIndex = sortedPanelNodes.findIndex(n => n.id === targetNodeId);
      
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      
      // Create new order by reordering the array
      const reorderedNodes = [...sortedPanelNodes];
      const [draggedNodeObj] = reorderedNodes.splice(draggedIndex, 1); // Remove dragged node
      
      // Calculate insert position
      const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
      const adjustedIndex = insertIndex > draggedIndex ? insertIndex - 1 : insertIndex;
      
      // Insert dragged node at new position
      reorderedNodes.splice(adjustedIndex, 0, draggedNodeObj);
      
      // Update positions to match new order - use same spacing as main canvas (52px)
      const baseY = panels.find(p => p.id === draggedNode.panelId)?.position.y || 100;
      const updatedPanelNodes = reorderedNodes.map((node, index) => ({
        ...node,
        position: {
          ...node.position,
          y: baseY + 56 + (index * 52) // Same calculation as main canvas: panel.y + header + (index * spacing)
        }
      }));
      
      // Combine with other nodes and return
      return [...otherNodes, ...updatedPanelNodes];
    });
  }, [nodes]);

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
      const targetNode = prev.find(node => node.id === nodeId);
      const targetPanel = panels.find(p => p.id === panelId);
      
      if (!targetNode || !targetPanel) return prev;
      
      const sourcePanel = panels.find(p => p.id === targetNode.panelId);
      const isMovingBetweenPanels = targetNode.panelId !== panelId;
      
      if (isMovingBetweenPanels) {
        onConsoleOutput?.(prev => [...prev, `🔄 Moved ${targetNode.type} node from ${sourcePanel?.name || 'unknown'} to ${targetPanel.name}`]);
      }
      
      // Get all nodes except the one being moved
      const otherNodes = prev.filter(node => node.id !== nodeId);
      
      // Get current nodes in target panel, sorted by position
      const targetPanelNodes = otherNodes.filter(node => node.panelId === panelId)
        .sort((a, b) => a.position.y - b.position.y);
      
      // Insert the moved node at the new index
      targetPanelNodes.splice(newIndex, 0, {
        ...targetNode,
        panelId: panelId, // Update panel assignment
        parentId: undefined, // Clear parent when moving between panels
        indentLevel: 0 // Reset indent level when moving between panels
      });
      
      // Update positions for all nodes in the target panel
      const updatedTargetPanelNodes = targetPanelNodes.map((node, index) => ({
        ...node,
        position: {
          x: targetPanel.position.x + 16 + ((node.indentLevel || 0) * 24),
          y: targetPanel.position.y + 56 + (index * 52) // header + padding + spacing
        }
      }));
      
      // Combine with other nodes not in the target panel
      const nodesNotInTargetPanel = otherNodes.filter(node => node.panelId !== panelId);
      
      // If moving between panels, also update positions in source panel
      if (isMovingBetweenPanels && sourcePanel) {
        const sourcePanelNodes = nodesNotInTargetPanel.filter(node => node.panelId === sourcePanel.id)
          .sort((a, b) => a.position.y - b.position.y)
          .map((node, index) => ({
            ...node,
            position: {
              x: sourcePanel.position.x + 16 + ((node.indentLevel || 0) * 24),
              y: sourcePanel.position.y + 56 + (index * 52)
            }
          }));
        
        // Replace source panel nodes with repositioned ones
        const nodesNotInEitherPanel = nodesNotInTargetPanel.filter(node => node.panelId !== sourcePanel.id);
        return [...nodesNotInEitherPanel, ...sourcePanelNodes, ...updatedTargetPanelNodes];
      }
      
      return [...nodesNotInTargetPanel, ...updatedTargetPanelNodes];
    });
  }, [panels, onConsoleOutput]);
  
  const handleDeleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      setNodes(prev => prev.filter(node => node.id !== selectedNode.id));
      setSelectedNode(null);
    }
  }, [selectedNode]);

  const handleDuplicateSelectedNode = useCallback(() => {
    if (selectedNode) {
      const newNode: WorkflowNode = {
        ...selectedNode,
        id: `${selectedNode.type}-${Date.now()}`,
        position: {
          x: selectedNode.position.x + 30,
          y: selectedNode.position.y + 30
        }
      };
      setNodes(prev => [...prev, newNode]);
      setSelectedNode(newNode);
      onConsoleOutput?.(prev => [...prev, `✅ Duplicated node: ${selectedNode.type}`]);
    }
  }, [selectedNode, onConsoleOutput]);
  
  // Handle canvas recenter
  const handleRecenterCanvas = useCallback(() => {
    if (panels.length === 0) return;

    // Calculate bounds of all panels
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    panels.forEach(panel => {
      minX = Math.min(minX, panel.position.x);
      minY = Math.min(minY, panel.position.y);
      maxX = Math.max(maxX, panel.position.x + panel.size.width);
      maxY = Math.max(maxY, panel.position.y + panel.size.height);
    });

    // Add some padding
    const padding = 100;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    // Calculate center point
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Get canvas viewport size (assuming typical values)
    const viewportWidth = 800;
    const viewportHeight = 600;

    // Set pan to center the content
    setCanvasPan({
      x: viewportWidth / 2 - centerX,
      y: viewportHeight / 2 - centerY
    });

    // Optionally adjust zoom to fit all panels
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const zoomX = viewportWidth / contentWidth;
    const zoomY = viewportHeight / contentHeight;
    const newZoom = Math.min(Math.min(zoomX, zoomY), 1); // Don't zoom in beyond 100%

    if (newZoom > 0.2) {
      setCanvasZoom(newZoom);
    }
  }, [panels]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.isContentEditable ||
                      target.closest('input') ||
                      target.closest('textarea');

      if (e.key === 'Delete' && selectedNode && !isTyping) {
        handleDeleteSelectedNode();
      } else if (e.key === ' ' && !e.repeat && !isTyping) {
        e.preventDefault();
        handleRecenterCanvas();
      } else if (e.key === 'Tab' && selectedNode && !isTyping) {
        e.preventDefault();
        if (e.shiftKey) {
          handleUnparentNode(selectedNode.id);
        } else {
          handleParentNode(selectedNode.id);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, handleDeleteSelectedNode, handleRecenterCanvas, handleParentNode, handleUnparentNode]);

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

  // Canvas zoom and pan handlers
  const handleCanvasWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.1;
    const oldZoom = canvasZoom;
    const newZoom = e.deltaY > 0 
      ? Math.max(0.2, canvasZoom - zoomFactor)
      : Math.min(3, canvasZoom + zoomFactor);
    
    if (newZoom !== oldZoom) {
      // Get mouse position relative to canvas
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate the point in canvas coordinates that the mouse is over
        const canvasPointX = (mouseX - canvasPan.x) / oldZoom;
        const canvasPointY = (mouseY - canvasPan.y) / oldZoom;
        
        // Calculate new pan to keep the mouse point stationary
        const newPanX = mouseX - canvasPointX * newZoom;
        const newPanY = mouseY - canvasPointY * newZoom;
        
        setCanvasZoom(newZoom);
        setCanvasPan({ x: newPanX, y: newPanY });
      } else {
        setCanvasZoom(newZoom);
      }
    }
  }, [canvasZoom, canvasPan]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle mouse or Ctrl+click
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasPan.x, y: e.clientY - canvasPan.y });
    }
  }, [canvasPan]);

  const handleCanvasMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      setCanvasPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [isPanning, panStart]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Add global mouse event listeners for panning
  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handleCanvasMouseMove);
      document.addEventListener('mouseup', handleCanvasMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleCanvasMouseMove);
        document.removeEventListener('mouseup', handleCanvasMouseUp);
      };
    }
  }, [isPanning, handleCanvasMouseMove, handleCanvasMouseUp]);

  // Add keyboard event listener for 'f' key to toggle right properties panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        // Only toggle if not typing in an input field
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true'
        );
        
        if (!isInputFocused) {
          e.preventDefault();
          setShowPropertiesPanel(prev => !prev);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Add keyboard event listener for 'p' key to toggle canvas property panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        // Only toggle if not typing in an input field
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true'
        );
        
        if (!isInputFocused && selectedNode) {
          e.preventDefault();
          setShowCanvasPropertyPanel(prev => !prev);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNode]);

  // Add keyboard event listener for tab/shift-tab to handle node parenting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        // Only handle if not typing in an input field
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true'
        );
        
        if (!isInputFocused && selectedNode) {
          e.preventDefault();
          
          if (e.shiftKey) {
            // Shift+Tab: Unparent node (move up one level)
            handleUnparentNode(selectedNode.id);
          } else {
            // Tab: Parent node (make it child of previous node)
            handleParentNode(selectedNode.id);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNode, nodes]);

  // Close canvas property panel when node is deselected
  useEffect(() => {
    if (!selectedNode && showCanvasPropertyPanel) {
      setShowCanvasPropertyPanel(false);
    }
  }, [selectedNode, showCanvasPropertyPanel]);

  // Register callbacks with parent (stable callbacks)
  useEffect(() => {
    onRegisterExecute?.(executeWorkflow);
    onRegisterGenerateCode?.(generatePythonCode);
    onRegisterSave?.(saveWorkflow);
    onRegisterImportWorkflow?.(handleImportWorkflow);
  }, [executeWorkflow, generatePythonCode, saveWorkflow, handleImportWorkflow, onRegisterExecute, onRegisterGenerateCode, onRegisterSave, onRegisterImportWorkflow]);

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

      {/* Canvas Container */}
      <div className="canvas-container">
        {/* Toolbar */}
        <div className="canvas-toolbar">
          <div className="toolbar-left">
            {selectedNode && (
              <>
                <button 
                  className="toolbar-button"
                  onClick={() => propertiesPanelRef.current?.focusFirstProperty()}
                  title="Edit Properties"
                >
                  ✏️ Edit
                </button>
                <button 
                  className="toolbar-button"
                  onClick={handleDuplicateSelectedNode}
                  title="Duplicate Node"
                >
                  📋 Duplicate
                </button>
                <button 
                  className="toolbar-button"
                  onClick={handleDeleteSelectedNode}
                  title="Delete Node"
                >
                  🗑️ Delete
                </button>
              </>
            )}
          </div>
          
          <div className="toolbar-center">
            <span className="zoom-indicator">Zoom: {Math.round(canvasZoom * 100)}%</span>
            <span className="toolbar-hint">Spacebar: Recenter | Mouse wheel: Zoom | Ctrl+Click: Pan</span>
          </div>
          
          <div className="toolbar-right">
            <button 
              className="toolbar-button primary"
              onClick={() => setShowPanelModal(true)}
            >
              + Add Module
            </button>
          </div>
        </div>

        {/* Canvas Area */}
      <div 
        className="canvas-area" 
        ref={canvasRef} 
        onDrop={handleDrop} 
        onDragOver={handleDragOver}
        onWheel={handleCanvasWheel}
        onMouseDown={handleCanvasMouseDown}
        style={{ cursor: isPanning ? 'grabbing' : 'default' }}
      >
        <div 
          className="canvas-content"
          style={{
            transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${canvasZoom})`,
            transformOrigin: '0 0'
          }}
        >
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
                // Use the node's actual position.y if it has been set (for custom ordering)
                // Otherwise calculate based on array index for new nodes
                const panelNodes = nodes.filter(n => n.panelId === panel.id);
                const hasCustomPosition = node.position.y !== undefined && node.position.y > 0;
                
                if (hasCustomPosition) {
                  // Use custom position but still apply panel offset and indentation
                  nodePosition = {
                    x: panel.position.x + 16 + ((node.indentLevel || 0) * 24),
                    y: node.position.y
                  };
                } else {
                  // Calculate position based on array index for new nodes
                  const nodeIndex = panelNodes.findIndex(n => n.id === node.id);
                  nodePosition = {
                    x: panel.position.x + 16 + ((node.indentLevel || 0) * 24),
                    y: panel.position.y + 56 + (nodeIndex * 52) // header + padding + node spacing
                  };
                }
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
                  onReorderNode={handleReorderNode}
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
          <div className="minimap-header">Minimap (Zoom: {Math.round(canvasZoom * 100)}%)</div>
          <div className="minimap-content">
            <svg 
              width="120" 
              height="80" 
              viewBox="0 0 1600 1200" 
              className="minimap-svg"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 1600;
                const y = ((e.clientY - rect.top) / rect.height) * 1200;
                setCanvasPan({ x: -x * canvasZoom + 400, y: -y * canvasZoom + 300 });
              }}
            >
              <rect width="1600" height="1200" fill="#111827" />
              
              {/* Panel rectangles */}
              {panels.map(panel => (
                <rect
                  key={`minimap-panel-${panel.id}`}
                  x={panel.position.x / 8}
                  y={panel.position.y / 8}
                  width={panel.size.width / 8}
                  height={panel.size.height / 8}
                  fill={panel.color || '#3b82f6'}
                  stroke="#ffffff"
                  strokeWidth="0.5"
                  opacity="0.6"
                />
              ))}
              
              {/* Node dots */}
              {nodes.filter(node => !node.panelId).map(node => (
                <circle
                  key={`minimap-${node.id}`}
                  cx={node.position.x / 8 + 5}
                  cy={node.position.y / 8 + 5}
                  r="2"
                  fill={getNodeColor(node.type)}
                  opacity="0.8"
                />
              ))}
              
              {/* Viewport indicator */}
              <rect
                x={-canvasPan.x / 8}
                y={-canvasPan.y / 8}
                width={800 / canvasZoom / 8}
                height={600 / canvasZoom / 8}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="1"
                opacity="0.8"
              />
            </svg>
          </div>
        </div>
      </div>
      </div>

      {/* Panel Modal */}
      <PanelModal
        isOpen={showPanelModal}
        onCreatePanel={handleCreatePanel}
        onClose={() => setShowPanelModal(false)}
      />

      {/* Canvas Property Panel (conditionally rendered) */}
      {showCanvasPropertyPanel && selectedNode && (() => {
        // Find the panel that contains the selected node
        const nodePanel = panels.find(p => p.id === selectedNode.panelId);
        if (!nodePanel) return null;
        
        // Calculate position to avoid overlapping with main panel
        // First try to position to the right of the node's panel
        let panelPosition = {
          x: nodePanel.position.x + nodePanel.size.width + 120, // +100px as requested
          y: nodePanel.position.y
        };
        
        // Check if this would overlap with any other panels
        const propertyPanelWidth = 280; // Width of canvas property panel (matches CSS)
        const canvasWidth = 1200; // Approximate canvas width
        
        // If positioning to the right would go off screen or overlap, try left side
        if (panelPosition.x + propertyPanelWidth > canvasWidth) {
          panelPosition.x = nodePanel.position.x - propertyPanelWidth - 120;
          
          // If left side would also go off screen, position it above/below
          if (panelPosition.x < 0) {
            panelPosition.x = nodePanel.position.x;
            panelPosition.y = nodePanel.position.y + nodePanel.size.height + 20;
          }
        }
        
        return (
          <CanvasPropertyPanel
            selectedNode={selectedNode}
            position={panelPosition}
            onUpdateNode={(node) => {
              setNodes(prev => prev.map(n => n.id === node.id ? node : n));
              setSelectedNode(node);
            }}
            onClose={() => setShowCanvasPropertyPanel(false)}
            allNodes={nodes}
          />
        );
      })()}

      {/* Right Panel - Properties (conditionally rendered) */}
      {showPropertiesPanel && (
        <PropertiesPanel 
          ref={propertiesPanelRef}
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
      )}
    </div>
  );
};

export default WorkflowEditor;