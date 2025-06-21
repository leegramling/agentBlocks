import React, { useState } from 'react';
import { ArrowLeft, Play, Save, Copy, Trash2, Settings, Code, Terminal, Globe, Database, FileText, Search, Plus, Minus } from 'lucide-react';

const BlockProgrammingInterface = () => {
  const [selectedBlock, setSelectedBlock] = useState(null);

  const blocks = [
    { 
      id: 1, 
      type: 'start', 
      label: 'when started', 
      x: 100, 
      y: 50, 
      color: 'bg-yellow-500',
      shape: 'hat',
      code: '# Start execution'
    },
    { 
      id: 2, 
      type: 'variable', 
      label: 'set url to', 
      value: '"https://api.github.com/users"',
      x: 100, 
      y: 120, 
      color: 'bg-orange-500',
      shape: 'stack',
      code: 'url = "https://api.github.com/users"'
    },
    { 
      id: 3, 
      type: 'variable', 
      label: 'set headers to', 
      value: '{"Accept": "application/json"}',
      x: 100, 
      y: 180, 
      color: 'bg-orange-500',
      shape: 'stack',
      code: 'headers = {"Accept": "application/json"}'
    },
    { 
      id: 4, 
      type: 'http', 
      label: 'GET request to', 
      value: 'url',
      x: 100, 
      y: 240, 
      color: 'bg-blue-500',
      shape: 'stack',
      code: 'response = requests.get(url, headers=headers)'
    },
    { 
      id: 5, 
      type: 'condition', 
      label: 'if', 
      condition: 'response.status_code == 200',
      x: 100, 
      y: 300, 
      color: 'bg-yellow-600',
      shape: 'c-block',
      code: 'if response.status_code == 200:'
    },
    { 
      id: 6, 
      type: 'variable', 
      label: 'set data to', 
      value: 'response.json()',
      x: 130, 
      y: 380, 
      color: 'bg-orange-500',
      shape: 'stack',
      code: '    data = response.json()'
    },
    { 
      id: 7, 
      type: 'loop', 
      label: 'for each user in', 
      value: 'data',
      x: 130, 
      y: 440, 
      color: 'bg-purple-500',
      shape: 'c-block',
      code: '    for user in data:'
    },
    { 
      id: 8, 
      type: 'regex', 
      label: 'extract emails from', 
      value: 'user.get("email", "")',
      pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
      x: 160, 
      y: 520, 
      color: 'bg-green-500',
      shape: 'stack',
      code: '        emails = re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", user.get("email", ""))'
    },
    { 
      id: 9, 
      type: 'file', 
      label: 'append to file', 
      value: '"emails.txt"',
      x: 160, 
      y: 580, 
      color: 'bg-red-500',
      shape: 'stack',
      code: '        with open("emails.txt", "a") as f: f.write("\\n".join(emails) + "\\n")'
    },
    { 
      id: 10, 
      type: 'print', 
      label: 'print', 
      value: '"Found emails: " + str(len(emails))',
      x: 160, 
      y: 640, 
      color: 'bg-indigo-500',
      shape: 'stack',
      code: '        print("Found emails: " + str(len(emails)))'
    }
  ];

  const BlockComponent = ({ block, isSelected, onClick }) => {
    const baseClasses = `absolute cursor-pointer transition-all duration-200 ${
      isSelected ? 'scale-105 z-10 ring-2 ring-white' : 'hover:scale-102'
    } ${block.color} text-white shadow-lg`;
    
    // Scratch-like block shapes
    const getBlockShape = (shape) => {
      switch(shape) {
        case 'hat':
          return 'rounded-t-xl rounded-b-lg px-4 py-2 border-b-4 border-black border-opacity-20';
        case 'stack':
          return 'rounded-lg px-3 py-2 border-b-2 border-black border-opacity-20 min-w-[200px]';
        case 'c-block':
          return 'rounded-lg px-3 py-2 border-b-2 border-black border-opacity-20 min-w-[220px]';
        default:
          return 'rounded-lg px-3 py-2';
      }
    };

    const renderBlockContent = () => {
      switch(block.type) {
        case 'start':
          return (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <span className="text-sm font-medium">{block.label}</span>
            </div>
          );
        
        case 'variable':
          return (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{block.label}</span>
              <div className="bg-white bg-opacity-20 rounded px-2 py-1">
                <span className="text-xs font-mono">{block.value}</span>
              </div>
            </div>
          );
        
        case 'http':
          return (
            <div>
              <div className="flex items-center space-x-2">
                <Globe size={14} />
                <span className="text-sm font-medium">{block.label}</span>
                <div className="bg-white bg-opacity-20 rounded px-2 py-1">
                  <span className="text-xs font-mono">{block.value}</span>
                </div>
              </div>
            </div>
          );
        
        case 'condition':
          return (
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{block.label}</span>
                <div className="bg-white bg-opacity-20 rounded px-2 py-1">
                  <span className="text-xs font-mono">{block.condition}</span>
                </div>
              </div>
              {/* C-block inner area indicator */}
              <div className="mt-2 mb-1 ml-4 border-l-2 border-white border-opacity-30 pl-2">
                <div className="text-xs opacity-60">then</div>
              </div>
            </div>
          );
        
        case 'loop':
          return (
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{block.label}</span>
                <div className="bg-white bg-opacity-20 rounded px-2 py-1">
                  <span className="text-xs font-mono">{block.value}</span>
                </div>
              </div>
              <div className="mt-2 mb-1 ml-4 border-l-2 border-white border-opacity-30 pl-2">
                <div className="text-xs opacity-60">do</div>
              </div>
            </div>
          );
        
        case 'regex':
          return (
            <div>
              <div className="flex items-center space-x-2">
                <Search size={14} />
                <span className="text-sm font-medium">{block.label}</span>
              </div>
              <div className="mt-1 bg-white bg-opacity-20 rounded px-2 py-1">
                <span className="text-xs font-mono">{block.value}</span>
              </div>
              <div className="mt-1 text-xs opacity-80">
                pattern: <span className="font-mono">{block.pattern}</span>
              </div>
            </div>
          );
        
        case 'file':
          return (
            <div className="flex items-center space-x-2">
              <FileText size={14} />
              <span className="text-sm font-medium">{block.label}</span>
              <div className="bg-white bg-opacity-20 rounded px-2 py-1">
                <span className="text-xs font-mono">{block.value}</span>
              </div>
            </div>
          );
        
        case 'print':
          return (
            <div className="flex items-center space-x-2">
              <Terminal size={14} />
              <span className="text-sm font-medium">{block.label}</span>
              <div className="bg-white bg-opacity-20 rounded px-2 py-1">
                <span className="text-xs font-mono">{block.value}</span>
              </div>
            </div>
          );
        
        default:
          return <span className="text-sm font-medium">{block.label}</span>;
      }
    };

    return (
      <div
        className={`${baseClasses} ${getBlockShape(block.shape)}`}
        style={{ left: block.x, top: block.y }}
        onClick={() => onClick(block)}
      >
        {renderBlockContent()}
        
        {/* Connection points for non-hat blocks */}
        {block.shape !== 'hat' && (
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-white bg-opacity-30 rounded-t"></div>
        )}
        
        {/* Bottom connection point */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-white bg-opacity-30 rounded-b"></div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 text-white h-screen overflow-hidden">
      {/* Menu Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <button className="text-gray-300 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors">
                <ArrowLeft size={16} />
              </button>
              <h1 className="text-lg font-semibold text-white">HTTP Request Node - Block Editor</h1>
            </div>
            <nav className="flex space-x-4">
              <button className="text-gray-300 hover:text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors">Edit</button>
              <button className="text-gray-300 hover:text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors">View</button>
              <button className="text-gray-300 hover:text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors">Debug</button>
              <button className="text-gray-300 hover:text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors">Help</button>
            </nav>
          </div>
          <div className="flex items-center space-x-2">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm transition-colors flex items-center space-x-1">
              <Play size={14} />
              <span>Test</span>
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm transition-colors flex items-center space-x-1">
              <Save size={14} />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-3rem)]">
        {/* Left Toolbar - Block Library (5%) */}
        <div className="w-[5%] bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 space-y-3">
          <button className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors" title="Variables">
            <Code size={20} className="text-white" />
          </button>
          <button className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors" title="Logic">
            <Settings size={20} className="text-white" />
          </button>
          <button className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors" title="HTTP">
            <Globe size={20} className="text-white" />
          </button>
          <button className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors" title="Terminal">
            <Terminal size={20} className="text-white" />
          </button>
          <button className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors" title="Files">
            <FileText size={20} className="text-white" />
          </button>
          <button className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors" title="Regex">
            <Search size={20} className="text-white" />
          </button>
        </div>

        {/* Canvas Area - Block Programming (75%) */}
        <div className="w-[75%] bg-gray-900 relative overflow-auto">
          {/* Large scrollable content area */}
          <div className="relative" style={{ width: '200%', height: '200%', minWidth: '1600px', minHeight: '1200px' }}>
            {/* Grid Background */}
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(75, 85, 99, 0.2) 1px, transparent 1px),
                linear-gradient(90deg, rgba(75, 85, 99, 0.2) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}>
            </div>
            
            {/* Flow Connections */}
            <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
              {/* Vertical flow connections */}
              <path d="M 200 80 L 200 120" stroke="#6b7280" strokeWidth="3" />
              <path d="M 200 150 L 200 180" stroke="#6b7280" strokeWidth="3" />
              <path d="M 200 210 L 200 240" stroke="#6b7280" strokeWidth="3" />
              <path d="M 200 270 L 200 300" stroke="#6b7280" strokeWidth="3" />
              
              {/* Nested blocks inside if statement */}
              <path d="M 230 330 L 230 380" stroke="#6b7280" strokeWidth="3" />
              <path d="M 230 410 L 230 440" stroke="#6b7280" strokeWidth="3" />
              
              {/* Nested blocks inside for loop */}
              <path d="M 260 470 L 260 520" stroke="#6b7280" strokeWidth="3" />
              <path d="M 260 550 L 260 580" stroke="#6b7280" strokeWidth="3" />
              <path d="M 260 610 L 260 640" stroke="#6b7280" strokeWidth="3" />
            </svg>
            
            {/* Programming Blocks */}
            {blocks.map(block => (
              <BlockComponent
                key={block.id}
                block={block}
                isSelected={selectedBlock?.id === block.id}
                onClick={setSelectedBlock}
              />
            ))}
          </div>
          
          {/* Canvas Info */}
          <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-90 rounded-lg p-2">
            <div className="text-xs text-gray-300">Block Programming</div>
            <div className="text-xs text-gray-500">Drag blocks to connect</div>
          </div>
        </div>

        {/* Right Panel - Block Properties & Code (20%) */}
        <div className="w-[20%] bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Properties Header */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-white">
              {selectedBlock ? `${selectedBlock.label} Settings` : 'Block Properties'}
            </h3>
          </div>
          
          {/* Properties Panel */}
          <div className="flex-1 overflow-y-auto">
            {selectedBlock ? (
              <div className="p-4 space-y-4">
                {/* Block-specific properties */}
                {selectedBlock.type === 'http' && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Method</label>
                      <select className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm">
                        <option>GET</option>
                        <option>POST</option>
                        <option>PUT</option>
                        <option>DELETE</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">URL Variable</label>
                      <input 
                        type="text" 
                        value="URL"
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Headers</label>
                      <textarea 
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm h-16 font-mono"
                        placeholder="Content-Type: application/json&#10;Authorization: Bearer token"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Timeout (seconds)</label>
                      <input 
                        type="number" 
                        value="30"
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                  </>
                )}
                
                {selectedBlock.type === 'regex' && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Pattern</label>
                      <input 
                        type="text" 
                        value={selectedBlock.pattern}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm font-mono"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Flags</label>
                      <div className="flex space-x-2">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-1" />
                          <span className="text-xs">Global (g)</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-1" />
                          <span className="text-xs">Ignore case (i)</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Extract Group</label>
                      <input 
                        type="number" 
                        value="0"
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                  </>
                )}
                
                {selectedBlock.type === 'condition' && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Left Operand</label>
                      <input 
                        type="text" 
                        value="Status"
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Operator</label>
                      <select className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm">
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
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Right Operand</label>
                      <input 
                        type="text"
                        value="200"
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                  </>
                )}
                
                {/* Common properties for all blocks */}
                <div className="border-t border-gray-700 pt-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Block Name</label>
                    <input 
                      type="text" 
                      value={selectedBlock.label}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                    />
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-xs text-gray-400 mb-1">Description</label>
                    <textarea 
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm h-16"
                      placeholder="Describe what this block does..."
                    />
                  </div>
                  
                  <div className="mt-3 flex items-center space-x-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <label className="text-xs text-gray-300">Enable Error Handling</label>
                  </div>
                  
                  <div className="mt-2 flex items-center space-x-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <label className="text-xs text-gray-300">Log Debug Info</label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 mt-8">
                <Code size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm">Select a block to edit properties</p>
              </div>
            )}
          </div>
          
          {/* Block Library */}
          <div className="border-t border-gray-700 p-4">
            <h4 className="text-xs font-semibold text-gray-300 mb-3">Block Library</h4>
            <div className="space-y-2">
              <div className="text-xs text-gray-400 mb-1">Variables & Logic</div>
              <div className="grid grid-cols-2 gap-1">
                <button className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded text-xs">Set Var</button>
                <button className="bg-yellow-500 hover:bg-yellow-600 text-white p-1 rounded text-xs">If/Else</button>
                <button className="bg-purple-500 hover:bg-purple-600 text-white p-1 rounded text-xs">Loop</button>
                <button className="bg-gray-500 hover:bg-gray-600 text-white p-1 rounded text-xs">Math</button>
              </div>
              
              <div className="text-xs text-gray-400 mb-1 mt-3">Commands</div>
              <div className="grid grid-cols-2 gap-1">
                <button className="bg-green-500 hover:bg-green-600 text-white p-1 rounded text-xs">HTTP</button>
                <button className="bg-red-500 hover:bg-red-600 text-white p-1 rounded text-xs">Regex</button>
                <button className="bg-orange-500 hover:bg-orange-600 text-white p-1 rounded text-xs">File I/O</button>
                <button className="bg-indigo-500 hover:bg-indigo-600 text-white p-1 rounded text-xs">Shell</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockProgrammingInterface;