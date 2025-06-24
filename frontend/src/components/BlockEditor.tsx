import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import type { Block, Position, WorkflowNode, Connection } from '../types';
import BlockComponent from './BlockComponent';
import { ArrowLeft, Play, Save, Code, Settings, Globe, Terminal, FileText, Search } from 'lucide-react';
import { PythonNodeGenerator } from '../nodes/generators/PythonNodeGenerator';

const BlockEditor: React.FC = () => {
  const { nodeId: _nodeId } = useParams<{ nodeId: string }>();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleAddBlock = (type: string, position: Position) => {
    const newBlock: Block = {
      id: `block_${Date.now()}`,
      type,
      category: getBlockCategory(type),
      position,
      properties: getDefaultProperties(type),
      inputs: [],
      outputs: []
    };
    setBlocks(prev => [...prev, newBlock]);
  };

  const getBlockCategory = (type: string): string => {
    const categories: Record<string, string> = {
      'variable_set': 'Variables',
      'variable_get': 'Variables',
      'text_input': 'Text',
      'text_join': 'Text',
      'text_split': 'Text',
      'regex_match': 'Text',
      'regex_replace': 'Text',
      'curl_get': 'Network',
      'curl_post': 'Network',
      'file_read': 'Files',
      'file_write': 'Files',
      'bash_command': 'System',
      'if_condition': 'Logic',
      'loop_for': 'Logic',
      'loop_while': 'Logic',
      'math_add': 'Math',
      'math_subtract': 'Math',
      'array_create': 'Arrays',
      'array_get': 'Arrays',
      'array_append': 'Arrays'
    };
    return categories[type] || 'General';
  };

  const getDefaultProperties = (type: string): Record<string, unknown> => {
    switch (type) {
      case 'variable_set':
        return { variableName: 'myVar', value: '' };
      case 'variable_get':
        return { variableName: 'myVar' };
      case 'text_input':
        return { text: 'Hello World' };
      case 'text_join':
        return { separator: ' ' };
      case 'regex_match':
        return { pattern: '\\d+', flags: 'g' };
      case 'curl_get':
        return { url: 'https://api.example.com' };
      case 'bash_command':
        return { command: 'echo "Hello"' };
      case 'if_condition':
        return { condition: 'variable == value' };
      default:
        return {};
    }
  };

  const handleBlockSelect = (block: Block) => {
    setSelectedBlock(block);
  };

  const handleBlockDrag = (blockId: string, position: Position) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, position } : block
    ));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const blockType = e.dataTransfer.getData('blockType');
    if (blockType && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const position = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      handleAddBlock(blockType, position);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };


  // Convert blocks to WorkflowNode format for use with generators
  const convertBlocksToNodes = (): WorkflowNode[] => {
    return blocks.map(block => ({
      id: block.id,
      type: mapBlockTypeToNodeType(block.type),
      position: block.position,
      properties: convertBlockPropertiesToNodeProperties(block),
      inputs: [],
      outputs: [],
      parentId: block.parentId,
      children: block.children,
      indentLevel: block.indentLevel
    }));
  };

  // Map block types to node types that generators understand
  const mapBlockTypeToNodeType = (blockType: string): string => {
    const typeMap: Record<string, string> = {
      'variable_set': 'variable',
      'variable_get': 'variable',
      'text_input': 'variable',
      'text_join': 'variable',
      'text_split': 'variable',
      'regex_match': 'grep',
      'regex_replace': 'grep',
      'curl_get': 'curl',
      'curl_post': 'curl',
      'file_read': 'read_file',
      'file_write': 'write_file',
      'bash_command': 'bash',
      'if_condition': 'if-then',
      'loop_for': 'foreach',
      'loop_while': 'while',
      'math_add': 'variable',
      'math_subtract': 'variable',
      'array_create': 'variable',
      'array_get': 'variable',
      'array_append': 'variable'
    };
    return typeMap[blockType] || 'variable';
  };

  // Convert block properties to node properties format
  const convertBlockPropertiesToNodeProperties = (block: Block): Record<string, unknown> => {
    const props = block.properties;
    const blockType = block.type;
    
    switch (blockType) {
      case 'variable_set':
        return { name: props.variableName || 'var', value: props.value || '' };
      case 'variable_get':
        return { name: props.variableName || 'var', value: props.variableName || 'var' };
      case 'text_input':
        return { name: `text_${block.id}`, value: props.text || '' };
      case 'text_join':
        return { name: `joined_${block.id}`, value: `"${props.separator || ' '}".join([${props.parts?.join(', ') || '""'}])` };
      case 'text_split':
        return { name: `split_${block.id}`, value: `(${props.text || '""'}).split("${props.separator || ' '}")` };
      case 'regex_match':
        return { pattern: props.pattern || '', input_source: 'input', case_insensitive: props.ignoreCase || false };
      case 'regex_replace':
        return { pattern: props.pattern || '', replacement: props.replacement || '', input_source: 'input' };
      case 'curl_get':
        return { url: props.url || '', method: 'GET', timeout: props.timeout || 30 };
      case 'curl_post':
        return { url: props.url || '', method: 'POST', body: JSON.stringify(props.data || {}), timeout: props.timeout || 30 };
      case 'file_read':
        return { file_path: props.filepath || '', encoding: props.encoding || 'utf-8' };
      case 'file_write':
        return { file_path: props.filepath || '', content: props.content || '', mode: props.mode || 'write', encoding: props.encoding || 'utf-8' };
      case 'bash_command':
        return { command: props.command || '', timeout: props.timeout || 30 };
      case 'if_condition':
        return { condition: props.condition || 'True' };
      case 'loop_for':
        return { iterable: props.iterable || 'range(10)', item_variable: props.variable || 'item' };
      case 'loop_while':
        return { condition: props.condition || 'False', max_iterations: props.maxIterations || 100 };
      case 'math_add':
        return { name: `math_${block.id}`, value: `(${props.a || 0}) + (${props.b || 0})` };
      case 'math_subtract':
        return { name: `math_${block.id}`, value: `(${props.a || 0}) - (${props.b || 0})` };
      case 'array_create':
        return { name: `array_${block.id}`, value: `[${props.items?.map((item: unknown) => JSON.stringify(item)).join(', ') || ''}]` };
      case 'array_get':
        return { name: `item_${block.id}`, value: `(${props.array || '[]'})[${props.index || 0}]` };
      case 'array_append':
        return { name: `array_${block.id}`, value: `list(${props.array || '[]'}) + [${JSON.stringify(props.item || '')}]` };
      default:
        return props;
    }
  };

  const generateCode = () => {
    if (blocks.length === 0) {
      return '# No blocks in editor\nprint("Empty block editor - add some blocks to generate code")\n';
    }

    // Convert blocks to WorkflowNode format
    const workflowNodes = convertBlocksToNodes();
    const connections: Connection[] = []; // Blocks don't have explicit connections yet

    // Use PythonNodeGenerator to generate code
    const pythonGenerator = new PythonNodeGenerator();
    const generatedCode = pythonGenerator.generateWorkflowCode(workflowNodes, connections);
    
    return generatedCode;
  };


  return (
    <div className="layout">
      {/* Menu Bar */}
      <div className="menu-bar">
        <div className="menu-left">
          <div className="flex items-center space-x-2">
            <button className="nav-button p-1">
              <ArrowLeft size={16} />
            </button>
            <h1 className="app-title">HTTP Request Node - Block Editor</h1>
          </div>
          <nav className="nav-menu">
            <button className="nav-button">Edit</button>
            <button className="nav-button">View</button>
            <button className="nav-button">Debug</button>
            <button className="nav-button">Help</button>
          </nav>
        </div>
        <div className="menu-right">
          <button 
            className="action-button btn-code flex items-center space-x-1"
            onClick={() => setShowCodePreview(true)}
          >
            <Code size={14} />
            <span>Code Preview</span>
          </button>
          <button className="action-button btn-execute flex items-center space-x-1">
            <Play size={14} />
            <span>Test</span>
          </button>
          <button className="action-button btn-save flex items-center space-x-1">
            <Save size={14} />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="editor-container">
        {/* Left Toolbar */}
        <div className="left-toolbar">
          <button className="toolbar-button active" title="Variables">
            <Code size={20} />
          </button>
          <button className="toolbar-button" title="Logic">
            <Settings size={20} />
          </button>
          <button className="toolbar-button" title="HTTP">
            <Globe size={20} />
          </button>
          <button className="toolbar-button" title="Terminal">
            <Terminal size={20} />
          </button>
          <button className="toolbar-button" title="Files">
            <FileText size={20} />
          </button>
          <button className="toolbar-button" title="Regex">
            <Search size={20} />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="canvas-area">
          <div className="canvas-content"
            ref={canvasRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {/* Grid Background */}
            <div className="grid-background"></div>
            
            {/* Blocks */}
            {blocks.map(block => (
              <BlockComponent
                key={block.id}
                block={block}
                selected={selectedBlock?.id === block.id}
                onSelect={handleBlockSelect}
                onDrag={handleBlockDrag}
              />
            ))}

            {/* Instructions */}
            {blocks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">🧩</div>
                  <h2 className="text-xl mb-2">Build Your Node Logic</h2>
                  <p>Drag blocks from the left to create Scratch-like programs</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Canvas Info */}
          <div className="canvas-info">
            <div className="canvas-info-title">Block Programming</div>
            <div className="canvas-info-subtitle">Drag blocks to connect</div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          {/* Properties Header */}
          <div className="panel-header">
            <h3 className="panel-title">
              {selectedBlock ? `${selectedBlock.type} Settings` : 'Block Properties'}
            </h3>
          </div>
          
          {/* Properties Panel */}
          <div className="panel-content">
            {selectedBlock ? (
              <div className="properties-section">
                {/* Block-specific properties */}
                {selectedBlock.type === 'curl_get' && (
                  <>
                    <div className="property-group">
                      <label className="property-label">Method</label>
                      <select className="property-select">
                        <option>GET</option>
                        <option>POST</option>
                        <option>PUT</option>
                        <option>DELETE</option>
                      </select>
                    </div>
                    
                    <div className="property-group">
                      <label className="property-label">URL Variable</label>
                      <input 
                        type="text" 
                        value="URL"
                        className="property-input"
                      />
                    </div>
                    
                    <div className="property-group">
                      <label className="property-label">Headers</label>
                      <textarea 
                        className="property-textarea"
                        placeholder="Content-Type: application/json\nAuthorization: Bearer token"
                      />
                    </div>
                    
                    <div className="property-group">
                      <label className="property-label">Timeout (seconds)</label>
                      <input 
                        type="number" 
                        value="30"
                        className="property-input"
                      />
                    </div>
                  </>
                )}
                
                {selectedBlock.type === 'regex_match' && (
                  <>
                    <div className="property-group">
                      <label className="property-label">Pattern</label>
                      <input 
                        type="text" 
                        value={selectedBlock.properties.pattern}
                        className="property-input"
                        style={{fontFamily: 'Courier New, monospace'}}
                      />
                    </div>
                    
                    <div className="property-group">
                      <label className="property-label">Flags</label>
                      <div className="flex space-x-2">
                        <div className="checkbox-group">
                          <input type="checkbox" />
                          <label>Global (g)</label>
                        </div>
                        <div className="checkbox-group">
                          <input type="checkbox" />
                          <label>Ignore case (i)</label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="property-group">
                      <label className="property-label">Extract Group</label>
                      <input 
                        type="number" 
                        value="0"
                        className="property-input"
                      />
                    </div>
                  </>
                )}
                
                {selectedBlock.type === 'if_condition' && (
                  <>
                    <div className="property-group">
                      <label className="property-label">Left Operand</label>
                      <input 
                        type="text" 
                        value="Status"
                        className="property-input"
                      />
                    </div>
                    
                    <div className="property-group">
                      <label className="property-label">Operator</label>
                      <select className="property-select">
                        <option>==</option>
                        <option>!=</option>
                        <option>&gt;</option>
                        <option>&lt;</option>
                        <option>&gt;=</option>
                        <option>&lt;=</option>
                        <option>contains</option>
                        <option>matches</option>
                      </select>
                    </div>
                    
                    <div className="property-group">
                      <label className="property-label">Right Operand</label>
                      <input 
                        type="text"
                        value="200"
                        className="property-input"
                      />
                    </div>
                  </>
                )}
                
                {/* Common properties for all blocks */}
                <div style={{borderTop: '1px solid #374151', paddingTop: '16px'}}>
                  <div className="property-group">
                    <label className="property-label">Block Name</label>
                    <input 
                      type="text" 
                      value={selectedBlock.type}
                      className="property-input"
                    />
                  </div>
                  
                  <div className="property-group">
                    <label className="property-label">Description</label>
                    <textarea 
                      className="property-textarea"
                      placeholder="Describe what this block does..."
                    />
                  </div>
                  
                  <div className="checkbox-group">
                    <input type="checkbox" />
                    <label>Enable Error Handling</label>
                  </div>
                  
                  <div className="checkbox-group">
                    <input type="checkbox" />
                    <label>Log Debug Info</label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-selection">
                <Code className="empty-selection-icon" />
                <p className="empty-selection-text">Select a block to edit properties</p>
              </div>
            )}
          </div>
          
          {/* Block Library */}
          <div className="block-library">
            <h4 className="library-title">Block Library</h4>
            <div className="library-section">
              <div className="library-section-title">Variables & Logic</div>
              <div className="library-buttons">
                <button className="library-button" style={{backgroundColor: '#3b82f6'}}>Set Var</button>
                <button className="library-button" style={{backgroundColor: '#eab308'}}>If/Else</button>
                <button className="library-button" style={{backgroundColor: '#8b5cf6'}}>Loop</button>
                <button className="library-button" style={{backgroundColor: '#6b7280'}}>Math</button>
              </div>
              
              <div className="library-section-title" style={{marginTop: '12px'}}>Commands</div>
              <div className="library-buttons">
                <button className="library-button" style={{backgroundColor: '#10b981'}}>HTTP</button>
                <button className="library-button" style={{backgroundColor: '#ef4444'}}>Regex</button>
                <button className="library-button" style={{backgroundColor: '#f97316'}}>File I/O</button>
                <button className="library-button" style={{backgroundColor: '#6366f1'}}>Shell</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Preview Modal */}
      {showCodePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg w-4/5 h-4/5 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Generated Python Code</h3>
              <button 
                onClick={() => setShowCodePreview(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {/* Code Content */}
            <div className="flex-1 p-4">
              <pre className="bg-gray-900 text-green-400 p-4 rounded h-full overflow-auto font-mono text-sm">
                {generateCode()}
              </pre>
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-700">
              <div className="text-gray-400 text-sm">
                {blocks.length} block{blocks.length !== 1 ? 's' : ''} • Python 3.x
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generateCode());
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Copy Code
                </button>
                <button 
                  onClick={() => setShowCodePreview(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockEditor;