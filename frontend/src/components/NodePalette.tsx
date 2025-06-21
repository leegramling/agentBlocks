import React, { useState } from 'react';
import type { Position } from '../types';

interface NodePaletteProps {
  onAddNode: (type: string, position: Position) => void;
}

interface BlockDefinition {
  type: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  blockMode: 'visual' | 'code' | 'hybrid' | 'ai';
}

const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeMode, setActiveMode] = useState<'simple' | 'advanced'>('simple');

  const handleDragStart = (e: React.DragEvent, blockType: string) => {
    e.dataTransfer.setData('blockType', blockType);
  };

  const handleDoubleClick = (blockType: string) => {
    onAddNode(blockType, { x: 100, y: 100 });
  };

  const blockDefinitions: BlockDefinition[] = [
    // Files Category
    { type: 'find_files', name: 'Find Files', description: 'Search for files matching patterns', category: 'files', icon: '📁', blockMode: 'visual' },
    { type: 'read_file', name: 'Read File', description: 'Read file contents', category: 'files', icon: '📖', blockMode: 'visual' },
    { type: 'write_file', name: 'Write File', description: 'Write content to file', category: 'files', icon: '📝', blockMode: 'visual' },
    { type: 'copy_file', name: 'Copy File', description: 'Copy files or directories', category: 'files', icon: '📋', blockMode: 'visual' },
    
    // Text Category
    { type: 'variable', name: 'Variable', description: 'Store and retrieve values', category: 'text', icon: '📦', blockMode: 'visual' },
    { type: 'print', name: 'Print', description: 'Output text to console', category: 'text', icon: '🖨️', blockMode: 'visual' },
    { type: 'text_transform', name: 'Transform Text', description: 'Modify text content', category: 'text', icon: '🔤', blockMode: 'visual' },
    { type: 'regex_match', name: 'Regex Match', description: 'Pattern matching with regex', category: 'text', icon: '🔍', blockMode: 'visual' },
    
    // Network Category
    { type: 'http_request', name: 'HTTP Request', description: 'Make web API calls', category: 'network', icon: '🌐', blockMode: 'visual' },
    { type: 'download_file', name: 'Download', description: 'Download files from URLs', category: 'network', icon: '⬇️', blockMode: 'visual' },
    { type: 'webhook', name: 'Webhook', description: 'Receive HTTP callbacks', category: 'network', icon: '🔗', blockMode: 'visual' },
    
    // Logic Category
    { type: 'if-then', name: 'If/Then', description: 'Conditional execution', category: 'logic', icon: '🔀', blockMode: 'visual' },
    { type: 'foreach', name: 'For Each', description: 'Loop over collections', category: 'logic', icon: '🔁', blockMode: 'visual' },
    { type: 'while', name: 'While Loop', description: 'Conditional loops', category: 'logic', icon: '⭕', blockMode: 'visual' },
    { type: 'function', name: 'Function', description: 'Reusable code blocks', category: 'logic', icon: '🔧', blockMode: 'visual' },
    
    // AI Category
    { type: 'ai_text_gen', name: 'AI Text Generation', description: 'Generate text with AI', category: 'ai', icon: '🤖', blockMode: 'ai' },
    { type: 'ai_code_gen', name: 'AI Code Generation', description: 'Generate code with AI', category: 'ai', icon: '💻', blockMode: 'ai' },
    { type: 'ai_analysis', name: 'AI Analysis', description: 'Analyze content with AI', category: 'ai', icon: '🧠', blockMode: 'ai' },
    
    // Custom Category
    { type: 'python_code', name: 'Python Code', description: 'Custom Python scripts', category: 'custom', icon: '🐍', blockMode: 'code' },
    { type: 'shell_command', name: 'Shell Command', description: 'Execute shell commands', category: 'custom', icon: '💻', blockMode: 'code' },
    { type: 'hybrid_template', name: 'Template', description: 'Hybrid code template', category: 'custom', icon: '📄', blockMode: 'hybrid' },
  ];

  const categories = [
    { id: 'all', name: 'All', icon: '📦' },
    { id: 'files', name: 'Files', icon: '📁' },
    { id: 'text', name: 'Text', icon: '📝' },
    { id: 'network', name: 'Network', icon: '🌐' },
    { id: 'logic', name: 'Logic', icon: '🔀' },
    { id: 'ai', name: 'AI', icon: '🤖' },
    { id: 'custom', name: 'Custom', icon: '⚙️' },
  ];

  const filteredBlocks = blockDefinitions.filter(block => {
    const matchesCategory = activeCategory === 'all' || block.category === activeCategory;
    const matchesSearch = searchTerm === '' || 
      block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMode = activeMode === 'simple' ? 
      ['visual', 'ai'].includes(block.blockMode) : 
      true;
    return matchesCategory && matchesSearch && matchesMode;
  });

  const getBlockModeColor = (mode: string) => {
    switch (mode) {
      case 'visual': return '#3b82f6';
      case 'code': return '#ef4444';
      case 'hybrid': return '#8b5cf6';
      case 'ai': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="block-palette">
      {/* Mode Toggle */}
      <div className="palette-header">
        <div className="mode-toggle">
          <button 
            className={`mode-button ${activeMode === 'simple' ? 'active' : ''}`}
            onClick={() => setActiveMode('simple')}
          >
            📦 Simple
          </button>
          <button 
            className={`mode-button ${activeMode === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveMode('advanced')}
          >
            ⚡ Adv
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="palette-search">
        <input
          type="text"
          placeholder="Search blocks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Categories */}
      <div className="category-list">
        <div className="category-title">Categories:</div>
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-button ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Block List */}
      <div className="block-list">
        {filteredBlocks.map(block => (
          <div
            key={block.type}
            className="palette-block"
            draggable
            onDragStart={(e) => handleDragStart(e, block.type)}
            onDoubleClick={() => handleDoubleClick(block.type)}
            title={block.description}
          >
            <div className="block-header">
              <span className="block-icon">{block.icon}</span>
              <div 
                className="block-mode-indicator"
                style={{ backgroundColor: getBlockModeColor(block.blockMode) }}
                title={`${block.blockMode} block`}
              />
            </div>
            <div className="block-name">{block.name}</div>
            <div className="block-description">{block.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodePalette;