import React, { useState, useRef, useCallback } from 'react';
import type { WorkflowNode, Connection, Position } from '../types';
import NodeComponent from './NodeComponent';
import ConnectionLine from './ConnectionLine';
import NodePalette from './NodePalette';
import PropertiesPanel from './PropertiesPanel';

const WorkflowEditor: React.FC = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [connecting, setConnecting] = useState<{
    nodeId: string;
    outputId: string;
  } | null>(null);

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
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type,
      position,
      properties: {},
      inputs: getDefaultInputs(type),
      outputs: getDefaultOutputs(type),
    };
    setNodes(prev => [...prev, newNode]);
  }, []);

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
    <div className="editor-container">
      {/* Left Toolbar - Node Palette */}
      <NodePalette onAddNode={handleAddNode} />

      {/* Canvas Area */}
      <div className="canvas-area" ref={canvasRef}>
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

          {/* Connections */}
          {connections.map(connection => (
            <ConnectionLine
              key={connection.id}
              connection={connection}
              nodes={nodes}
            />
          ))}

          {/* Canvas Instructions */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center" style={{color: '#9ca3af'}}>
                <div className="text-6xl mb-4">🧩</div>
                <h2 className="text-xl mb-2">Start Building Your Agent</h2>
                <p>Drag nodes from the left panel to create your workflow</p>
              </div>
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