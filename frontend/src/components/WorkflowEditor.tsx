import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { WorkflowNode, Connection, Position } from '../types';
import NodeComponent from './NodeComponent';
import ConnectionLine from './ConnectionLine';
import NodePalette from './NodePalette';
import PropertiesPanel, { type PropertiesPanelRef } from './PropertiesPanel';
import CanvasPropertyPanel from './CanvasPropertyPanel';
// import { toPythonFString, hasVariableReferences } from '../utils/variableSubstitution';
import { PythonNodeGenerator } from '../nodes/generators/PythonNodeGenerator';
import { RustNodeGenerator } from '../nodes/generators/RustNodeGenerator';
import { WorkflowExporter } from '../nodes/WorkflowExporter';

interface WorkflowEditorProps {
  onConsoleOutput?: (updater: (prev: string[]) => string[]) => void;
  onExecutionState?: (isExecuting: boolean) => void;
  onNodeCountChange?: (count: number) => void;
  onNodesChange?: (nodes: WorkflowNode[]) => void;
  onRegisterExecute?: (callback: () => void) => void;
  onRegisterGeneratePythonCode?: (callback: () => string) => void;
  onRegisterGenerateRustCode?: (callback: () => string) => void;
  onRegisterSave?: (callback: () => void) => void;
  onRegisterImportWorkflow?: (callback: (workflowData: any) => void) => void;
  onRegisterExport?: (callback: () => void) => void;
  onRegisterNew?: (callback: () => void) => void;
  onRegisterPerformSearch?: (callback: (term: string) => void) => void;
  onRegisterFindNext?: (callback: () => void) => void;
  onRegisterFindPrevious?: (callback: () => void) => void;
  onSetSearchResults?: (results: WorkflowNode[]) => void;
  onSetCurrentSearchIndex?: (index: number) => void;
  toggleHelpModalCallback?: React.MutableRefObject<(() => void) | null>;
  focusSearchFieldCallback?: React.MutableRefObject<(() => void) | null>;
  isSearchFieldFocused?: boolean;
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  onConsoleOutput,
  onExecutionState,
  onNodeCountChange,
  onNodesChange,
  onRegisterExecute,
  onRegisterGeneratePythonCode,
  onRegisterGenerateRustCode,
  onRegisterSave,
  onRegisterImportWorkflow,
  onRegisterExport,
  onRegisterNew,
  onRegisterPerformSearch,
  onRegisterFindNext,
  onRegisterFindPrevious,
  onSetSearchResults,
  onSetCurrentSearchIndex,
  toggleHelpModalCallback,
  focusSearchFieldCallback,
  isSearchFieldFocused = false
}) => {
  console.log('WorkflowEditor component rendering');
  
  // Test if useEffect works at all
  useEffect(() => {
    console.log('Basic useEffect is working!');
  }, []);
  
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [activeFunctionId, setActiveFunctionId] = useState<string>('main-function');
  const [connecting, setConnecting] = useState<{
    nodeId: string;
    outputId: string;
  } | null>(null);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  const [showKeyMappings, setShowKeyMappings] = useState(false);
  const [showCanvasPropertyPanel, setShowCanvasPropertyPanel] = useState(false);
  const [showNodePalette, setShowNodePalette] = useState(false);
  const [showInsertPopup, setShowInsertPopup] = useState(false);
  const [insertSearchTerm, setInsertSearchTerm] = useState('');
  const [selectedInsertIndex, setSelectedInsertIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<WorkflowNode[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [commandFieldValue, setCommandFieldValue] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);
  const propertiesPanelRef = useRef<PropertiesPanelRef>(null);
  
  // Refs to capture current state for callbacks
  const nodesRef = useRef<WorkflowNode[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  
  // Initialize with main function and try to restore from localStorage
  useEffect(() => {
    if (nodes.length === 0) {
      // Try to restore from localStorage first
      try {
        const savedWorkflow = localStorage.getItem('agentblocks_workflow');
        if (savedWorkflow) {
          const workflowData = JSON.parse(savedWorkflow);
          if (workflowData.nodes) {
            setNodes(workflowData.nodes);
            setConnections(workflowData.connections || []);
            // Find the main function or set the first function as active
            const mainFunction = workflowData.nodes.find((n: WorkflowNode) => n.type === 'function' && n.properties?.function_name === 'main');
            const firstFunction = workflowData.nodes.find((n: WorkflowNode) => n.type === 'function');
            setActiveFunctionId(mainFunction?.id || firstFunction?.id || 'main-function');
            onConsoleOutput?.(prev => [...prev, `🔄 Restored workflow from browser storage (${workflowData.nodes.length} nodes)`]);
            return;
          }
        }
      } catch (error) {
        onConsoleOutput?.(prev => [...prev, `⚠️ Could not restore from storage: ${error}`]);
      }
      
      // If no saved workflow, create default workflow with main function, variable, and print
      const mainFunction: WorkflowNode = {
        id: 'main-function',
        type: 'function',
        position: { x: 100, y: 100 },
        panelId: undefined,
        parentId: undefined,
        properties: {
          function_name: 'main',
          parameters: '',
          return_type: 'void',
          description: 'Main function - entry point of the workflow'
        },
        inputs: [],
        outputs: [{ id: 'output', name: 'Output', type: 'any' }],
      };

      // Create default variable node as child of main function
      const variableNode: WorkflowNode = {
        id: 'default-variable',
        type: 'variable',
        position: { x: 120, y: 166 }, // Below main function with indent
        panelId: undefined,
        parentId: 'main-function',
        properties: getDefaultProperties('variable'),
        inputs: getDefaultInputs('variable'),
        outputs: getDefaultOutputs('variable'),
      };

      // Create default print node as child of main function
      const printNode: WorkflowNode = {
        id: 'default-print',
        type: 'print',
        position: { x: 120, y: 232 }, // Below variable node
        panelId: undefined,
        parentId: 'main-function',
        properties: getDefaultProperties('print'),
        inputs: getDefaultInputs('print'),
        outputs: getDefaultOutputs('print'),
      };

      setNodes([mainFunction, variableNode, printNode]);
      setActiveFunctionId('main-function');
      onConsoleOutput?.(prev => [...prev, '🎯 Created default workflow with main function, variable, and print nodes']);
    }
  }, [nodes.length, onConsoleOutput]);

  // Ensure main function always exists and orphaned nodes belong to it
  useEffect(() => {
    if (nodes.length > 0) {
      const mainFunction = nodes.find(node => 
        node.type === 'function' && node.properties?.function_name === 'main'
      );
      
      if (!mainFunction) {
        // Create main function
        const newMainFunction: WorkflowNode = {
          id: 'main-function',
          type: 'function',
          position: { x: 100, y: 100 },
          panelId: undefined,
          properties: {
            function_name: 'main',
            parameters: '',
            return_type: 'void',
            description: 'Main function - entry point of the workflow'
          },
          inputs: [],
          outputs: [{ id: 'output', name: 'Output', type: 'any' }],
        };
        
        // Move orphaned nodes (nodes without parentId or with invalid parentId) to main function
        const updatedNodes = nodes.map(node => {
          if (node.type !== 'function' && (!node.parentId || !nodes.find(n => n.id === node.parentId))) {
            return { ...node, parentId: 'main-function' };
          }
          return node;
        });
        
        setNodes([newMainFunction, ...updatedNodes]);
        setActiveFunctionId('main-function');
        onConsoleOutput?.(prev => [...prev, '🎯 Added missing main function and organized nodes']);
      } else {
        // Main function exists, but check for orphaned nodes
        const orphanedNodes = nodes.filter(node => 
          node.type !== 'function' && 
          (!node.parentId || !nodes.find(n => n.id === node.parentId && n.type === 'function'))
        );
        
        if (orphanedNodes.length > 0) {
          const updatedNodes = nodes.map(node => {
            if (orphanedNodes.includes(node)) {
              return { ...node, parentId: mainFunction.id };
            }
            return node;
          });
          
          setNodes(updatedNodes);
          onConsoleOutput?.(prev => [...prev, `🔧 Moved ${orphanedNodes.length} orphaned nodes to main function`]);
        }
      }
    }
  }, [nodes, onConsoleOutput]);
  
  // Update refs when state changes
  useEffect(() => {
    nodesRef.current = nodes;
    onNodeCountChange?.(nodes.length);
  }, [nodes, onNodeCountChange]);
  
  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);

  // Notify parent when nodes change
  useEffect(() => {
    onNodesChange?.(nodes);
  }, [nodes, onNodesChange]);


  const handleNodeSelect = useCallback((node: WorkflowNode) => {
    setSelectedNode(node);
    
    // If clicking on a function node, make it the active function
    if (node.type === 'function') {
      setActiveFunctionId(node.id);
      onConsoleOutput?.(prev => [...prev, `🎯 Switched to function: ${node.properties?.function_name || node.id}`]);
    }
    // If clicking on a child node, make its parent function active
    else if (node.parentId) {
      const parentFunction = nodes.find(n => n.id === node.parentId && n.type === 'function');
      if (parentFunction) {
        setActiveFunctionId(node.parentId);
        onConsoleOutput?.(prev => [...prev, `🎯 Switched to function: ${parentFunction.properties?.function_name || node.parentId}`]);
      }
    }
  }, [nodes, onConsoleOutput]);

  const handleRefreshCanvas = useCallback(() => {
    // Force a re-render of all nodes by updating their keys/positions slightly
    setNodes(prev => prev.map(node => ({
      ...node,
      // Force update by adding a tiny random offset that gets rounded away
      position: {
        x: Math.round(node.position.x + (Math.random() - 0.5) * 0.001),
        y: Math.round(node.position.y + (Math.random() - 0.5) * 0.001)
      }
    })));
    
    
    onConsoleOutput?.(prev => [...prev, '🔄 Canvas refreshed - all nodes redrawn']);
  }, [onConsoleOutput]);

  // Reset workflow to default with main function, variable, and print
  const resetWorkflow = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem('agentblocks_workflow');
    
    // Create default main function
    const mainFunction: WorkflowNode = {
      id: 'main-function',
      type: 'function',
      position: { x: 100, y: 100 },
      panelId: undefined,
      parentId: undefined,
      properties: {
        function_name: 'main',
        parameters: '',
        return_type: 'void',
        description: 'Main function - entry point of the workflow'
      },
      inputs: [],
      outputs: [{ id: 'output', name: 'Output', type: 'any' }],
    };

    // Create default variable node as child of main function
    const variableNode: WorkflowNode = {
      id: 'default-variable',
      type: 'variable',
      position: { x: 120, y: 166 }, // Below main function with indent
      panelId: undefined,
      parentId: 'main-function',
      properties: getDefaultProperties('variable'),
      inputs: getDefaultInputs('variable'),
      outputs: getDefaultOutputs('variable'),
    };

    // Create default print node as child of main function
    const printNode: WorkflowNode = {
      id: 'default-print',
      type: 'print',
      position: { x: 120, y: 232 }, // Below variable node
      panelId: undefined,
      parentId: 'main-function',
      properties: getDefaultProperties('print'),
      inputs: getDefaultInputs('print'),
      outputs: getDefaultOutputs('print'),
    };
    
    setNodes([mainFunction, variableNode, printNode]);
    setConnections([]);
    setSelectedNode(null);
    setActiveFunctionId('main-function');
    onConsoleOutput?.(prev => [...prev, '🔄 Created new workflow with main function, variable, and print nodes']);
  }, [onConsoleOutput]);

  const handleNodeDrag = useCallback((nodeId: string, position: Position) => {
    setNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        return { ...node, position };
      }
      return node;
    }));
  }, []);

  const handleAddNode = useCallback((type: string, position: Position, functionId?: string) => {
    let nodePosition = { ...position };
    let parentId: string | undefined;
    let newNodeId = `node_${Date.now()}`;
    
    // Special handling for function nodes
    if (type === 'function') {
      const targetFunctionId = functionId || activeFunctionId;
      const activeFunction = nodes.find(n => n.id === targetFunctionId);
      
      // If we're dropping a function inside another function, create a function call/instance
      if (activeFunction && targetFunctionId !== undefined) {
        // Check if any existing function has the default name that would be assigned
        const defaultProps = getDefaultProperties('function');
        const defaultFunctionName = defaultProps.function_name || 'myFunction';
        const existingFunction = nodes.find(n => 
          n.type === 'function' && 
          n.properties?.function_name === defaultFunctionName
        );
        
        if (existingFunction) {
          // Create a function call node instead of a new function
          type = 'function_call'; // Change the type to function call
          parentId = targetFunctionId;
          
          // Position it like a regular node inside the function
          const functionNodes = nodes.filter(n => n.parentId === targetFunctionId);
          const nodeHeight = 66; // min-height (50px) + padding (16px)
          const baseY = activeFunction.position.y + nodeHeight;
          nodePosition = {
            x: activeFunction.position.x + 20,
            y: baseY + (functionNodes.length * nodeHeight)
          };
          
          onConsoleOutput?.(prev => [...prev, `📞 Creating function call to existing function: ${defaultFunctionName}`]);
        } else {
          // Create a new function definition but as a child of the current function
          parentId = targetFunctionId;
          newNodeId = `function_${Date.now()}`;
          
          const functionNodes = nodes.filter(n => n.parentId === targetFunctionId);
          const nodeHeight = 66; // min-height (50px) + padding (16px)
          const baseY = activeFunction.position.y + nodeHeight;
          nodePosition = {
            x: activeFunction.position.x + 20,
            y: baseY + (functionNodes.length * nodeHeight)
          };
        }
      } else {
        // Function nodes dropped outside any function create new function chains
        parentId = undefined;
        newNodeId = `function_${Date.now()}`;
        
        // Position function nodes independently on the canvas
        const existingFunctions = nodes.filter(n => n.type === 'function');
        if (existingFunctions.length > 0) {
          const rightmostFunction = existingFunctions.reduce((rightmost, func) => 
            func.position.x > rightmost.position.x ? func : rightmost
          );
          nodePosition = {
            x: rightmostFunction.position.x + 300,
            y: rightmostFunction.position.y
          };
        }
      }
    } else {
      // Regular nodes attach to the active function
      const targetFunctionId = functionId || activeFunctionId;
      const activeFunction = nodes.find(n => n.id === targetFunctionId);
      parentId = targetFunctionId;
      
      if (activeFunction) {
        // Position new nodes below the function, creating a vertical layout with no gaps
        const functionNodes = nodes.filter(n => n.parentId === targetFunctionId);
        const nodeHeight = 66; // min-height (50px) + padding (16px)
        const baseY = activeFunction.position.y + nodeHeight; // Start immediately below function
        nodePosition = {
          x: activeFunction.position.x + 20, // Slight indent
          y: baseY + (functionNodes.length * nodeHeight) // Stack nodes with no gaps
        };
      }
    }

    const newNode: WorkflowNode = {
      id: newNodeId,
      type,
      position: nodePosition,
      parentId,
      properties: getDefaultProperties(type),
      inputs: getDefaultInputs(type),
      outputs: getDefaultOutputs(type),
    };
    
    setNodes(prev => [...prev, newNode]);
    
    // Auto-connect nodes in function chains (except for function nodes themselves)
    if (type !== 'function' && parentId) {
      const functionNodes = nodes.filter(n => n.parentId === parentId);
      if (functionNodes.length > 0) {
        // Find the last node in the function (the one with the highest y position)
        const lastNode = functionNodes.reduce((prev, current) => 
          current.position.y > prev.position.y ? current : prev
        );
        
        // Create a connection from the last node's output to the new node's input
        const lastNodeOutputs = lastNode.outputs || [];
        const newNodeInputs = newNode.inputs || [];
        
        if (lastNodeOutputs.length > 0 && newNodeInputs.length > 0) {
          const newConnection: Connection = {
            id: `conn_${Date.now()}`,
            source_node: lastNode.id,
            source_output: lastNodeOutputs[0].id, // Use first output
            target_node: newNode.id,
            target_input: newNodeInputs[0].id, // Use first input
          };
          
          setConnections(prev => [...prev, newConnection]);
          onConsoleOutput?.(prev => [...prev, `🔗 Auto-connected ${lastNode.type} → ${newNode.type}`]);
        }
      }
    }
    
    // Handle function node creation
    if (type === 'function') {
      if (parentId) {
        // Function dropped inside another function - create a function instance/call
        const parentFunction = nodes.find(n => n.id === parentId);
        const functionName = newNode.properties?.function_name || 'myFunction';
        const existingFunction = nodes.find(n => n.type === 'function' && n.properties?.function_name === functionName && !n.parentId);
        
        if (existingFunction) {
          // This is an instance of an existing function
          newNode.properties = {
            ...newNode.properties,
            function_name: functionName,
            instance_of: existingFunction.id,
            call_type: 'instance'
          };
          onConsoleOutput?.(prev => [...prev, `📞 Created function instance "${functionName}" in ${parentFunction?.properties?.function_name || 'function'}`]);
        } else {
          // This is a new function definition inside another function (local function)
          newNode.properties = {
            ...newNode.properties,
            function_name: functionName,
            call_type: 'local_definition'
          };
          onConsoleOutput?.(prev => [...prev, `📦 Created local function "${functionName}" in ${parentFunction?.properties?.function_name || 'function'}`]);
        }
      } else {
        // Function dropped on canvas - create a new function chain
        setActiveFunctionId(newNodeId);
        onConsoleOutput?.(prev => [...prev, `🔧 Created new function chain: ${newNode.properties?.function_name || 'unnamed'}`]);
      }
    } else {
      const activeFunction = nodes.find(n => n.id === parentId);
      onConsoleOutput?.(prev => [...prev, `➕ Added ${type} node to function ${activeFunction?.properties?.function_name || 'unknown'}`]);
      
      // Debug: Print JSON structure for main function and its children
      if (activeFunction?.properties?.function_name === 'main') {
        const mainChildren = [...nodes, newNode].filter(n => n.parentId === activeFunction.id);
        const debugInfo = {
          mainFunction: {
            id: activeFunction.id,
            name: activeFunction.properties?.function_name,
            position: activeFunction.position
          },
          children: mainChildren.map(child => ({
            id: child.id,
            type: child.type,
            parentId: child.parentId,
            position: child.position,
            properties: child.properties
          }))
        };
        console.log('📊 Main function structure:', JSON.stringify(debugInfo, null, 2));
        onConsoleOutput?.(prev => [...prev, `📊 Main has ${mainChildren.length} children: ${mainChildren.map(c => c.type).join(', ')}`]);
        onConsoleOutput?.(prev => [...prev, `🔍 Main function JSON structure logged to browser console`]);
        
        // Also show the JSON structure in the console output (truncated for readability)
        const jsonString = JSON.stringify(debugInfo, null, 2);
        const jsonLines = jsonString.split('\n');
        if (jsonLines.length > 10) {
          onConsoleOutput?.(prev => [...prev, `📋 JSON structure (first 10 lines):`]);
          jsonLines.slice(0, 10).forEach(line => {
            onConsoleOutput?.(prev => [...prev, `    ${line}`]);
          });
          onConsoleOutput?.(prev => [...prev, `    ... (${jsonLines.length - 10} more lines in console)`]);
        } else {
          onConsoleOutput?.(prev => [...prev, `📋 Complete JSON structure:`]);
          jsonLines.forEach(line => {
            onConsoleOutput?.(prev => [...prev, `    ${line}`]);
          });
        }
      }
    }
    
    // Hide the node palette after adding a node
    setShowNodePalette(false);
  }, [nodes, activeFunctionId, onConsoleOutput]);

  // Insert node after selected node
  const handleInsertNode = useCallback((nodeType: string) => {
    if (!selectedNode) {
      // If no node is selected, insert at the end of the active function
      const activeFunction = nodes.find(n => n.id === activeFunctionId);
      if (activeFunction) {
        const functionChildren = nodes.filter(n => n.parentId === activeFunctionId);
        const nodeHeight = 66;
        const insertPosition = {
          x: activeFunction.position.x + 20,
          y: activeFunction.position.y + nodeHeight + (functionChildren.length * nodeHeight)
        };
        handleAddNode(nodeType, insertPosition, activeFunctionId);
        setShowInsertPopup(false);
        setInsertSearchTerm('');
        onConsoleOutput?.(prev => [...prev, `📥 Inserted ${nodeType} at end of ${activeFunction.properties?.function_name || 'function'}`]);
        return;
      } else {
        onConsoleOutput?.(prev => [...prev, '⚠️ No active function found for insertion']);
        return;
      }
    }

    // Find the position after the selected node
    let insertPosition: Position;
    
    if (selectedNode.parentId) {
      // Get all sibling nodes in the same function
      const siblings = nodes.filter(n => n.parentId === selectedNode.parentId);
      const selectedIndex = siblings.findIndex(n => n.id === selectedNode.id);
      
      // Position the new node below the selected node
      const nodeHeight = 66;
      insertPosition = {
        x: selectedNode.position.x,
        y: selectedNode.position.y + nodeHeight
      };
      
      // Shift all nodes below the insertion point down
      const nodesToShift = siblings.slice(selectedIndex + 1);
      nodesToShift.forEach(node => {
        setNodes(prev => prev.map(n => 
          n.id === node.id 
            ? { ...n, position: { ...n.position, y: n.position.y + nodeHeight } }
            : n
        ));
      });
    } else {
      // If selected node is a function, add below it
      const nodeHeight = 66;
      insertPosition = {
        x: selectedNode.position.x + 20,
        y: selectedNode.position.y + nodeHeight
      };
    }

    // Add the new node
    handleAddNode(nodeType, insertPosition, selectedNode.parentId || selectedNode.id);
    
    setShowInsertPopup(false);
    setInsertSearchTerm('');
    
    onConsoleOutput?.(prev => [...prev, `📥 Inserted ${nodeType} after ${selectedNode.type}`]);
  }, [selectedNode, nodes, handleAddNode, onConsoleOutput, activeFunctionId]);

  // Navigate to previous node (up/k)
  const selectPreviousNode = useCallback(() => {
    if (nodes.length === 0) return;
    
    // Get all nodes in display order (functions first, then their children)
    const orderedNodes: WorkflowNode[] = [];
    
    // Add function nodes first
    const functionNodes = nodes.filter(n => n.type === 'function').sort((a, b) => a.position.x - b.position.x);
    functionNodes.forEach(fn => {
      orderedNodes.push(fn);
      // Add children of this function
      const children = nodes.filter(n => n.parentId === fn.id).sort((a, b) => a.position.y - b.position.y);
      orderedNodes.push(...children);
    });
    
    if (orderedNodes.length === 0) return;
    
    if (!selectedNode) {
      // Select first node
      handleNodeSelect(orderedNodes[0]);
      return;
    }
    
    const currentIndex = orderedNodes.findIndex(n => n.id === selectedNode.id);
    if (currentIndex > 0) {
      handleNodeSelect(orderedNodes[currentIndex - 1]);
    } else {
      // Wrap to last node
      handleNodeSelect(orderedNodes[orderedNodes.length - 1]);
    }
  }, [nodes, selectedNode, handleNodeSelect]);

  // Navigate to next node (down/j)
  const selectNextNode = useCallback(() => {
    if (nodes.length === 0) return;
    
    // Get all nodes in display order (functions first, then their children)
    const orderedNodes: WorkflowNode[] = [];
    
    // Add function nodes first
    const functionNodes = nodes.filter(n => n.type === 'function').sort((a, b) => a.position.x - b.position.x);
    functionNodes.forEach(fn => {
      orderedNodes.push(fn);
      // Add children of this function
      const children = nodes.filter(n => n.parentId === fn.id).sort((a, b) => a.position.y - b.position.y);
      orderedNodes.push(...children);
    });
    
    if (orderedNodes.length === 0) return;
    
    if (!selectedNode) {
      // Select first node
      handleNodeSelect(orderedNodes[0]);
      return;
    }
    
    const currentIndex = orderedNodes.findIndex(n => n.id === selectedNode.id);
    if (currentIndex < orderedNodes.length - 1) {
      handleNodeSelect(orderedNodes[currentIndex + 1]);
    } else {
      // Wrap to first node
      handleNodeSelect(orderedNodes[0]);
    }
  }, [nodes, selectedNode, handleNodeSelect]);

  // Function navigation
  const selectPreviousFunction = useCallback(() => {
    const functionNodes = nodes.filter(n => n.type === 'function');
    if (functionNodes.length === 0) return;
    
    const currentFunctionIndex = functionNodes.findIndex(n => n.id === activeFunctionId);
    let previousIndex;
    
    if (currentFunctionIndex <= 0) {
      // Wrap to last function
      previousIndex = functionNodes.length - 1;
    } else {
      previousIndex = currentFunctionIndex - 1;
    }
    
    const previousFunction = functionNodes[previousIndex];
    setActiveFunctionId(previousFunction.id);
    handleNodeSelect(previousFunction);
    onConsoleOutput?.(prev => [...prev, `🔧 Switched to function: ${previousFunction.properties?.function_name || 'unnamed'}`]);
  }, [nodes, activeFunctionId, handleNodeSelect, onConsoleOutput]);

  const selectNextFunction = useCallback(() => {
    const functionNodes = nodes.filter(n => n.type === 'function');
    if (functionNodes.length === 0) return;
    
    const currentFunctionIndex = functionNodes.findIndex(n => n.id === activeFunctionId);
    let nextIndex;
    
    if (currentFunctionIndex >= functionNodes.length - 1) {
      // Wrap to first function
      nextIndex = 0;
    } else {
      nextIndex = currentFunctionIndex + 1;
    }
    
    const nextFunction = functionNodes[nextIndex];
    setActiveFunctionId(nextFunction.id);
    handleNodeSelect(nextFunction);
    onConsoleOutput?.(prev => [...prev, `🔧 Switched to function: ${nextFunction.properties?.function_name || 'unnamed'}`]);
  }, [nodes, activeFunctionId, handleNodeSelect, onConsoleOutput]);

  // Search functionality
  const performSearch = useCallback((term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    const results = nodes.filter(node => {
      const searchableText = [
        node.type,
        node.properties?.function_name,
        node.properties?.name,
        node.properties?.message,
        node.properties?.variable,
        node.properties?.command,
        node.properties?.code,
        node.id
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchableText.includes(term.toLowerCase());
    });

    setSearchResults(results);
    setCurrentSearchIndex(0);
    
    if (results.length > 0) {
      handleNodeSelect(results[0]);
      onConsoleOutput?.(prev => [...prev, `🔍 Found ${results.length} matches for "${term}"`]);
    } else {
      onConsoleOutput?.(prev => [...prev, `❌ No matches found for "${term}"`]);
    }
  }, [nodes, handleNodeSelect, onConsoleOutput]);

  // Generate Python code
  const generatePythonCode = useCallback(() => {
    console.log('generatePythonCode called, nodes:', nodes.length, 'connections:', connections.length);
    onConsoleOutput?.(prev => [...prev, '🐍 Generating Python code...']);
    onConsoleOutput?.(prev => [...prev, `📊 Processing ${nodes.length} nodes and ${connections.length} connections`]);
    
    const functionNodes = nodes.filter(n => n.type === 'function');
    const regularNodes = nodes.filter(n => n.type !== 'function');
    
    console.log('Function nodes:', functionNodes.map(n => ({ id: n.id, type: n.type, name: n.properties?.function_name })));
    console.log('Regular nodes:', regularNodes.map(n => ({ id: n.id, type: n.type, parent: n.parentId })));
    
    onConsoleOutput?.(prev => [...prev, `🔧 Found ${functionNodes.length} functions: ${functionNodes.map(n => n.properties?.function_name || 'unnamed').join(', ')}`]);
    onConsoleOutput?.(prev => [...prev, `📦 Found ${regularNodes.length} regular nodes: ${regularNodes.map(n => n.type).join(', ')}`]);
    
    const generator = new PythonNodeGenerator();
    const result = generator.generateWorkflowCode(nodes, connections);
    
    console.log('Generated Python code:', result);
    onConsoleOutput?.(prev => [...prev, `✅ Generated Python code (${result.length} characters, ${result.split('\n').length} lines)`]);
    
    // Show first few lines of code
    if (result.length > 0) {
      const codePreview = result.split('\n').slice(0, 3).join('\n');
      onConsoleOutput?.(prev => [...prev, `📝 Code preview:\n${codePreview}${result.split('\n').length > 3 ? '\n...' : ''}`]);
    } else {
      onConsoleOutput?.(prev => [...prev, '⚠️ No code generated - check node structure']);
    }
    
    return result;
  }, [nodes, connections, onConsoleOutput]);

  // Generate Rust code
  const generateRustCode = useCallback(() => {
    onConsoleOutput?.(prev => [...prev, '🦀 Generating Rust code...']);
    onConsoleOutput?.(prev => [...prev, `📊 Processing ${nodes.length} nodes and ${connections.length} connections`]);
    
    const functionNodes = nodes.filter(n => n.type === 'function');
    const regularNodes = nodes.filter(n => n.type !== 'function');
    
    onConsoleOutput?.(prev => [...prev, `🔧 Found ${functionNodes.length} functions: ${functionNodes.map(n => n.properties?.function_name || 'unnamed').join(', ')}`]);
    onConsoleOutput?.(prev => [...prev, `📦 Found ${regularNodes.length} regular nodes: ${regularNodes.map(n => n.type).join(', ')}`]);
    
    const generator = new RustNodeGenerator();
    const result = generator.generateWorkflowCode(nodes, connections);
    
    onConsoleOutput?.(prev => [...prev, `✅ Generated Rust code (${result.length} characters, ${result.split('\n').length} lines)`]);
    
    // Show first few lines of code
    const codePreview = result.split('\n').slice(0, 3).join('\n');
    onConsoleOutput?.(prev => [...prev, `📝 Code preview:\n${codePreview}${result.split('\n').length > 3 ? '\n...' : ''}`]);
    
    return result;
  }, [nodes, connections, onConsoleOutput]);

  // Register search and find callbacks directly (these are defined above)
  if (onRegisterPerformSearch) {
    onRegisterPerformSearch(performSearch);
  }
  
  // Register code generation callbacks directly (now that functions are defined)
  if (onRegisterGeneratePythonCode) {
    console.log('Direct registration: Registering generatePythonCode');
    onRegisterGeneratePythonCode(generatePythonCode);
  }
  
  if (onRegisterGenerateRustCode) {
    console.log('Direct registration: Registering generateRustCode');
    onRegisterGenerateRustCode(generateRustCode);
  }

  const findNext = useCallback(() => {
    if (searchResults.length === 0) return;
    
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    handleNodeSelect(searchResults[nextIndex]);
    onConsoleOutput?.(prev => [...prev, `🔍 Match ${nextIndex + 1} of ${searchResults.length}`]);
  }, [searchResults, currentSearchIndex, handleNodeSelect, onConsoleOutput]);

  const findPrevious = useCallback(() => {
    if (searchResults.length === 0) return;
    
    const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    handleNodeSelect(searchResults[prevIndex]);
    onConsoleOutput?.(prev => [...prev, `🔍 Match ${prevIndex + 1} of ${searchResults.length}`]);
  }, [searchResults, currentSearchIndex, handleNodeSelect, onConsoleOutput]);

  // Register findNext and findPrevious callbacks directly
  if (onRegisterFindNext) {
    onRegisterFindNext(findNext);
  }
  if (onRegisterFindPrevious) {
    onRegisterFindPrevious(findPrevious);
  }

  // Register remaining callbacks that are defined later in the component
  if (onRegisterNew) {
    onRegisterNew(resetWorkflow);
  }

  // Keyboard handler for F2, 'i', navigation keys (moved after function definitions)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle most shortcuts if search field is focused (except specific ones)
      if (isSearchFieldFocused) {
        // Let the Layout component handle search field interactions
        return;
      }

      // Don't handle navigation if popup is open
      if (showInsertPopup || showNodePalette) {
        if (e.key === 'F2') {
          e.preventDefault();
          setShowNodePalette(prev => !prev);
        } else if (e.key === 'Escape') {
          setShowInsertPopup(false);
          setShowNodePalette(false);
          setInsertSearchTerm('');
          setSelectedInsertIndex(0);
        }
        return;
      }

      // Handle global keyboard shortcuts
      if (e.key === 'F1') {
        e.preventDefault();
        setShowKeyMappings(prev => !prev);
      } else if (e.key === 'F2') {
        e.preventDefault();
        setShowNodePalette(prev => !prev);
      } else if (e.key === 'i' && !isSearchFieldFocused) {
        e.preventDefault();
        setShowInsertPopup(true);
        setInsertSearchTerm('');
        setSelectedInsertIndex(0);
      } else if (e.key === 'Escape') {
        setShowInsertPopup(false);
        setShowNodePalette(false);
        setInsertSearchTerm('');
        setSelectedInsertIndex(0);
      } else if ((e.key === 'ArrowUp' || e.key === 'k') && !isSearchFieldFocused) {
        e.preventDefault();
        selectPreviousNode();
      } else if ((e.key === 'ArrowDown' || e.key === 'j') && !isSearchFieldFocused) {
        e.preventDefault();
        selectNextNode();
      } else if ((e.key === 'ArrowLeft' || e.key === 'h') && !isSearchFieldFocused) {
        e.preventDefault();
        selectPreviousFunction();
      } else if ((e.key === 'ArrowRight' || e.key === 'l') && !isSearchFieldFocused) {
        e.preventDefault();
        selectNextFunction();
      } else if (e.key === '/' || (e.ctrlKey && e.key === 'f')) {
        e.preventDefault();
        // Focus the search field in Layout
        if (focusSearchFieldCallback?.current) {
          focusSearchFieldCallback.current();
        }
      } else if (e.key === 'n' && searchResults.length > 0) {
        e.preventDefault();
        findNext();
      } else if (e.key === 'N' && searchResults.length > 0) {
        e.preventDefault();
        findPrevious();
      } else if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        resetWorkflow();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInsertPopup, showNodePalette, selectPreviousNode, selectNextNode, selectPreviousFunction, selectNextFunction, searchResults.length, findNext, findPrevious, isSearchFieldFocused, resetWorkflow]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const blockType = e.dataTransfer.getData('blockType');
    if (blockType && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const viewportDropPosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      // Convert viewport coordinates to canvas coordinates (accounting for zoom and pan)
      const canvasDropPosition = {
        x: (viewportDropPosition.x - canvasPan.x) / canvasZoom,
        y: (viewportDropPosition.y - canvasPan.y) / canvasZoom
      };
      
      // Add node to the active function
      handleAddNode(blockType, canvasDropPosition);
    }
  }, [handleAddNode, canvasPan, canvasZoom]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const getDefaultProperties = (type: string): Record<string, any> => {
    switch (type) {
      case 'variable':
        return { name: 'counter', value: '1' };
      case 'print':
        return { message: '{counter}. {fruit}' };
      case 'assignment':
        return { variable: 'result', expression: 'value' };
      case 'if-then':
        return { condition: 'variable == "hello world"' };
      case 'foreach':
        return { iterable: 'fruits', variable: 'fruit' };
      case 'while':
        return { condition: 'counter < 10' };
      case 'function':
        return { function_name: 'myFunction', parameters: 'param1, param2', return_type: 'void' };
      case 'function_call':
        return { function_name: 'myFunction', arguments: '' };
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
    if (nodes.length === 0) return;

    // Calculate bounds of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + 200); // Assume node width ~200px
      maxY = Math.max(maxY, node.position.y + 100); // Assume node height ~100px
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

    // Optionally adjust zoom to fit all nodes
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const zoomX = viewportWidth / contentWidth;
    const zoomY = viewportHeight / contentHeight;
    const newZoom = Math.min(Math.min(zoomX, zoomY), 1); // Don't zoom in beyond 100%

    if (newZoom > 0.2) {
      setCanvasZoom(newZoom);
    }
  }, [nodes]);

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
        // Set active function from loaded data or find first function
        const mainFunction = workflowData.nodes.find((n: WorkflowNode) => n.type === 'function' && n.properties?.function_name === 'main');
        const firstFunction = workflowData.nodes.find((n: WorkflowNode) => n.type === 'function');
        setActiveFunctionId(mainFunction?.id || firstFunction?.id || 'main-function');
        const functionCount = workflowData.nodes.filter((n: WorkflowNode) => n.type === 'function').length;
        onConsoleOutput?.(prev => [...prev, `Workflow loaded (${workflowData.nodes.length} nodes, ${functionCount} functions)`]);
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
      case 'function_call':
        return [{ id: 'arguments', name: 'Arguments', type: 'string' }];
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
      case 'function_call':
        return [{ id: 'result', name: 'Result', type: 'any' }];
      default:
        return [{ id: 'output', name: 'Output', type: 'any' }];
    }
  };

  // Available node types for autocomplete
  const nodeTypes = [
    { type: 'variable', name: 'Variable' },
    { type: 'print', name: 'Print' },
    { type: 'if-then', name: 'If/Then' },
    { type: 'foreach', name: 'For Each' },
    { type: 'while', name: 'While Loop' },
    { type: 'function', name: 'Function' },
    { type: 'find_files', name: 'Find Files' },
    { type: 'read_file', name: 'Read File' },
    { type: 'write_file', name: 'Write File' },
    { type: 'copy_file', name: 'Copy File' },
    { type: 'text_transform', name: 'Transform Text' },
    { type: 'regex_match', name: 'Regex Match' },
    { type: 'http_request', name: 'HTTP Request' },
    { type: 'download_file', name: 'Download' },
    { type: 'ai_text_gen', name: 'AI Text Generation' },
    { type: 'ai_code_gen', name: 'AI Code Generation' },
    { type: 'python_code', name: 'Python Code' },
    { type: 'shell_command', name: 'Shell Command' }
  ];

  // Filter node types based on search term
  const filteredNodeTypes = nodeTypes.filter(nodeType =>
    nodeType.name.toLowerCase().includes(insertSearchTerm.toLowerCase()) ||
    nodeType.type.toLowerCase().includes(insertSearchTerm.toLowerCase())
  );

  // Handle search term changes and reset selection
  const handleInsertSearchChange = useCallback((value: string) => {
    setInsertSearchTerm(value);
    setSelectedInsertIndex(0);
  }, []);

  // Handle keyboard navigation in insert popup
  const handleInsertKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (filteredNodeTypes.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedInsertIndex(prev => Math.min(prev + 1, filteredNodeTypes.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedInsertIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredNodeTypes[selectedInsertIndex]) {
          handleInsertNode(filteredNodeTypes[selectedInsertIndex].type);
        }
        break;
      case 'Escape':
        setShowInsertPopup(false);
        setInsertSearchTerm('');
        setSelectedInsertIndex(0);
        break;
    }
  }, [filteredNodeTypes, selectedInsertIndex, handleInsertNode]);



  console.log('About to return component JSX...');

  return (
    <div className="editor-workspace">
      {/* Block Palette - shown only when F2 is pressed */}
      {showNodePalette && <NodePalette onAddNode={handleAddNode} autoFocus={true} />}

      {/* Insert Node Popup - shown when 'i' is pressed */}
      {showInsertPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '20px',
            minWidth: '400px',
            maxHeight: '500px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ color: '#f1f5f9', margin: '0 0 16px 0' }}>
              Insert Node {selectedNode ? `after ${selectedNode.type}` : ''}
            </h3>
            
            <input
              type="text"
              value={insertSearchTerm}
              onChange={(e) => handleInsertSearchChange(e.target.value)}
              onKeyDown={handleInsertKeyDown}
              placeholder="Type node name..."
              autoFocus
              style={{
                padding: '8px 12px',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                color: '#f1f5f9',
                marginBottom: '12px',
                outline: 'none'
              }}
            />
            
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid #374151',
              borderRadius: '4px'
            }}>
              {filteredNodeTypes.length > 0 ? (
                filteredNodeTypes.slice(0, 10).map((nodeType, index) => (
                  <div
                    key={nodeType.type}
                    onClick={() => handleInsertNode(nodeType.type)}
                    onMouseEnter={() => setSelectedInsertIndex(index)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      backgroundColor: index === selectedInsertIndex ? '#374151' : 'transparent',
                      color: '#f1f5f9',
                      borderBottom: index < filteredNodeTypes.length - 1 ? '1px solid #374151' : 'none'
                    }}
                  >
                    <strong>{nodeType.name}</strong>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{nodeType.type}</div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
                  No matching nodes found
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#9ca3af' }}>
              Use ↑↓ arrows to navigate, Enter to insert, Escape to cancel
            </div>
          </div>
        </div>
      )}


      {/* Canvas Container */}
      <div className="canvas-container">
        {/* Toolbar */}
        <div className="canvas-toolbar">
          <div className="toolbar-left">
            <button 
              className="toolbar-button"
              onClick={handleRefreshCanvas}
              title="Refresh Canvas - Redraw all nodes"
            >
              🔄 Refresh
            </button>
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
            <span className="toolbar-info">
              Active Function: {nodes.find(n => n.id === activeFunctionId)?.properties?.function_name || 'main'}
            </span>
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
          
          {/* Function Nodes and their children */}
          {nodes.map(node => {
            // Render function nodes with visual emphasis for active function
            const isActiveFunction = node.type === 'function' && node.id === activeFunctionId;
            const isFunctionNode = node.type === 'function';
            
            return (
              <NodeComponent
                key={node.id}
                node={{
                  ...node,
                  // Add visual styling for active function
                  data: {
                    ...node.data,
                    isActiveFunction,
                    isFunctionNode
                  }
                }}
                selected={selectedNode?.id === node.id}
                onSelect={handleNodeSelect}
                onDrag={handleNodeDrag}
                onStartConnection={handleStartConnection}
                onCompleteConnection={handleCompleteConnection}
                connecting={connecting}
                connections={connections}
                allNodes={nodes}
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

        {/* Key Mappings Help */}
        {showKeyMappings && (
          <div 
            className="key-mappings-help"
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: 'rgba(17, 24, 39, 0.7)',
              border: '1px solid #374151',
              borderRadius: '8px',
              padding: '16px',
              color: '#d1d5db',
              fontSize: '12px',
              fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              minWidth: '300px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              zIndex: 0
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#f1f5f9' }}>
              🎹 Key Mappings
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4px', fontSize: '11px' }}>
              <div style={{ fontWeight: '600' }}>Navigation:</div>
              <div></div>
              
              <div>↑ / k</div>
              <div>Select previous node</div>
              
              <div>↓ / j</div>
              <div>Select next node</div>
              
              <div>h / ←</div>
              <div>Previous function</div>
              
              <div>l / →</div>
              <div>Next function</div>
              
              <div style={{ fontWeight: '600', paddingTop: '8px' }}>Actions:</div>
              <div></div>
              
              <div>i</div>
              <div>Insert node after selection</div>
              
              <div>/ or Ctrl+F</div>
              <div>Search nodes</div>
              
              <div>n</div>
              <div>Find next in search</div>
              
              <div>N</div>
              <div>Find previous in search</div>
              
              <div style={{ fontWeight: '600', paddingTop: '8px' }}>Panels:</div>
              <div></div>
              
              <div>F1</div>
              <div>Toggle this help</div>
              
              <div>F2</div>
              <div>Toggle node palette</div>
              
              <div>f</div>
              <div>Toggle properties panel</div>
              
              <div>p</div>
              <div>Toggle canvas properties</div>
              
              <div style={{ fontWeight: '600', paddingTop: '8px' }}>Canvas:</div>
              <div></div>
              
              <div>Space</div>
              <div>Recenter canvas</div>
              
              <div>Mouse Wheel</div>
              <div>Zoom in/out</div>
              
              <div>Ctrl+Click</div>
              <div>Pan canvas</div>
              
              <div>Escape</div>
              <div>Close popups</div>
            </div>
          </div>
        )}

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
              
              {/* Function node rectangles */}
              {nodes.filter(node => node.type === 'function').map(node => (
                <rect
                  key={`minimap-function-${node.id}`}
                  x={node.position.x / 8}
                  y={node.position.y / 8}
                  width={240 / 8} // Assume function node width ~240px
                  height={120 / 8} // Assume function node height ~120px
                  fill={node.id === activeFunctionId ? '#10b981' : '#3b82f6'}
                  stroke="#ffffff"
                  strokeWidth="0.5"
                  opacity="0.6"
                />
              ))}
              
              {/* Other node dots */}
              {nodes.filter(node => node.type !== 'function').map(node => (
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


      {/* Canvas Property Panel (conditionally rendered) */}
      {showCanvasPropertyPanel && selectedNode && (() => {
        // Show properties for the selected node's function
        const parentFunction = nodes.find(n => n.id === selectedNode.parentId && n.type === 'function');
        if (!parentFunction && selectedNode.type !== 'function') return null;
        
        // Calculate position to avoid overlapping with selected node
        // Position to the right of the selected node
        const panelPosition = {
          x: selectedNode.position.x + 220, // Node width ~200px + 20px margin
          y: selectedNode.position.y
        };
        
        // Check if this would go off screen
        const propertyPanelWidth = 280; // Width of canvas property panel (matches CSS)
        const canvasWidth = 1200; // Approximate canvas width
        
        // If positioning to the right would go off screen, try left side
        if (panelPosition.x + propertyPanelWidth > canvasWidth) {
          panelPosition.x = selectedNode.position.x - propertyPanelWidth - 20;
          
          // If left side would also go off screen, position it below
          if (panelPosition.x < 0) {
            panelPosition.x = selectedNode.position.x;
            panelPosition.y = selectedNode.position.y + 120; // Node height ~100px + 20px margin
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
          nodes={nodes}
          connections={connections}
          activeFunctionId={activeFunctionId}
          onUpdateNode={(node) => {
            setNodes(prev => prev.map(n => n.id === node.id ? node : n));
            setSelectedNode(node);
          }}
          onNodeSelect={handleNodeSelect}
        />
      )}
    </div>
  );

  // Save workflow
  const saveWorkflow = useCallback(() => {
    const workflowData = {
      nodes,
      connections,
      activeFunctionId,
      version: '1.0',
      timestamp: Date.now()
    };
    
    localStorage.setItem('agentblocks_workflow', JSON.stringify(workflowData));
    const functionCount = nodes.filter(n => n.type === 'function').length;
    onConsoleOutput?.(prev => [...prev, `💾 Workflow saved with ${nodes.length} nodes and ${functionCount} functions`]);
  }, [nodes, connections, activeFunctionId, onConsoleOutput]);

  // Export workflow
  const exportWorkflow = useCallback(() => {
    const exporter = new WorkflowExporter();
    const functionCount = nodes.filter(n => n.type === 'function').length;
    const workflow = {
      id: `workflow_${Date.now()}`,
      name: 'Generated Workflow',
      description: 'Exported from AgentBlocks',
      version: '1.0.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      nodes,
      connections,
      panels: [], // No panels in new system
      metadata: {
        nodeCount: nodes.length,
        connectionCount: connections.length,
        functionCount: functionCount,
        activeFunctionId
      }
    };
    
    // Export as JSON by default
    const jsonContent = exporter.exportWorkflow(workflow, 'json');
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exporter.getExportFilename(workflow, 'json');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    onConsoleOutput?.(prev => [...prev, `📤 Workflow exported as JSON`]);
  }, [nodes, connections, activeFunctionId, onConsoleOutput]);

  // Execute workflow
  const executeWorkflow = useCallback(() => {
    console.log('Executing workflow with nodes:', nodes.length);
    onConsoleOutput?.(prev => [...prev, '⚡ Starting workflow execution...']);
    
    // Get the active function or default to main
    const activeFunction = nodes.find(n => n.id === activeFunctionId && n.type === 'function');
    if (!activeFunction) {
      onConsoleOutput?.(prev => [...prev, '❌ No active function found to execute']);
      return;
    }
    
    // Get all nodes that belong to the active function
    const functionNodes = nodes.filter(n => n.parentId === activeFunctionId || n.id === activeFunctionId);
    
    onConsoleOutput?.(prev => [...prev, `🔧 Executing function: ${activeFunction.properties?.function_name || 'main'}`]);
    onConsoleOutput?.(prev => [...prev, `📊 Function contains ${functionNodes.length} nodes`]);
    
    // Generate Python code for the active function
    const pythonCode = generatePythonCode();
    onConsoleOutput?.(prev => [...prev, `🐍 Generated Python code (${pythonCode.length} characters)`]);
    
    // Show first few lines of generated code
    const codeLines = pythonCode.split('\n').slice(0, 5);
    codeLines.forEach(line => {
      if (line.trim()) {
        onConsoleOutput?.(prev => [...prev, `    ${line}`]);
      }
    });
    
    if (pythonCode.split('\n').length > 5) {
      onConsoleOutput?.(prev => [...prev, `    ... (${pythonCode.split('\n').length - 5} more lines)`]);
    }
    
    onConsoleOutput?.(prev => [...prev, '✅ Workflow execution completed']);
  }, [nodes, connections, activeFunctionId, generatePythonCode, onConsoleOutput]);


  // Register search results and index updates
  useEffect(() => {
    if (onSetSearchResults) {
      onSetSearchResults(searchResults);
    }
  }, [onSetSearchResults, searchResults]);

  useEffect(() => {
    if (onSetCurrentSearchIndex) {
      onSetCurrentSearchIndex(currentSearchIndex);
    }
  }, [onSetCurrentSearchIndex, currentSearchIndex]);


};

export default WorkflowEditor;