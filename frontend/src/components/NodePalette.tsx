import React, { useState, useRef, useEffect } from 'react';
import type { Position } from '../types';

interface NodePaletteProps {
  onAddNode: (type: string, position: Position) => void;
  autoFocus?: boolean;
}

interface BlockDefinition {
  type: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  blockMode: 'visual' | 'code' | 'hybrid' | 'ai';
}

const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode, autoFocus = false }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeMode, setActiveMode] = useState<'simple' | 'advanced'>('simple');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when palette is shown
  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100); // Small delay to ensure the component is fully rendered
    }
  }, [autoFocus]);

  const handleDragStart = (e: React.DragEvent, blockType: string) => {
    e.dataTransfer.setData('blockType', blockType);
  };

  const handleDoubleClick = (blockType: string) => {
    onAddNode(blockType, { x: 100, y: 100 });
  };

  const handleSelectNode = (blockType: string) => {
    // Add node to the bottom of the selected panel or after current selected node
    onAddNode(blockType, { x: 100, y: 100 });
    setSelectedIndex(-1);
    setSearchTerm('');
  };

  // Global F2 key listener for cycling focus between search and canvas
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        
        // If search field is focused, blur it (return to canvas)
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
          setSelectedIndex(-1);
        } else {
          // If not focused on search, focus it
          searchInputRef.current?.focus();
          setSelectedIndex(-1);
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Search input keyboard navigation
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (filteredBlocks.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredBlocks.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredBlocks[selectedIndex]) {
          handleSelectNode(filteredBlocks[selectedIndex].type);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSearchTerm('');
        setSelectedIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  };

  const blockDefinitions: BlockDefinition[] = [
    // Files Category
    { type: 'find_files', name: 'Find Files', description: 'Search for files matching patterns', category: 'files', icon: '📁', blockMode: 'visual' },
    { type: 'read_file', name: 'Read File', description: 'Read file contents', category: 'files', icon: '📖', blockMode: 'visual' },
    { type: 'write_file', name: 'Write File', description: 'Write content to file', category: 'files', icon: '📝', blockMode: 'visual' },
    { type: 'copy_file', name: 'Copy File', description: 'Copy files or directories', category: 'files', icon: '📋', blockMode: 'visual' },
    
    // Text Category
    { type: 'grep', name: 'Grep Search', description: 'Search for patterns in text with Linux grep options', category: 'text', icon: '🔍', blockMode: 'visual' },
    { type: 'variable', name: 'Variable', description: 'Store and retrieve values', category: 'text', icon: '📦', blockMode: 'visual' },
    { type: 'print', name: 'Print', description: 'Output text to console', category: 'text', icon: '🖨️', blockMode: 'visual' },
    { type: 'text_transform', name: 'Transform Text', description: 'Modify text content', category: 'text', icon: '🔤', blockMode: 'visual' },
    { type: 'regex_match', name: 'Regex Match', description: 'Pattern matching with regex', category: 'text', icon: '🔍', blockMode: 'visual' },
    { type: 'increment', name: 'Increment', description: 'Add 1 to a variable', category: 'text', icon: '➕', blockMode: 'visual' },
    
    // Data Structures Category
    { type: 'list_create', name: 'Create List', description: 'Create a new list', category: 'data', icon: '📄', blockMode: 'visual' },
    { type: 'list_append', name: 'List Append', description: 'Add item to end of list', category: 'data', icon: '➕', blockMode: 'visual' },
    { type: 'list_get', name: 'List Get', description: 'Get item from list by index', category: 'data', icon: '📇', blockMode: 'visual' },
    { type: 'list_length', name: 'List Length', description: 'Get length of list', category: 'data', icon: '📏', blockMode: 'visual' },
    { type: 'list_comprehension', name: 'List Comprehension', description: 'Create list with expression', category: 'data', icon: '🔄', blockMode: 'visual' },
    { type: 'set_create', name: 'Create Set', description: 'Create a new set', category: 'data', icon: '🔵', blockMode: 'visual' },
    { type: 'set_add', name: 'Set Add', description: 'Add item to set', category: 'data', icon: '⚪', blockMode: 'visual' },
    { type: 'dict_create', name: 'Create Dict', description: 'Create a new dictionary', category: 'data', icon: '📚', blockMode: 'visual' },
    { type: 'dict_get', name: 'Dict Get', description: 'Get value from dictionary', category: 'data', icon: '🔑', blockMode: 'visual' },
    { type: 'dict_set', name: 'Dict Set', description: 'Set key-value in dictionary', category: 'data', icon: '🏷️', blockMode: 'visual' },
    
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
    { type: 'pycode', name: 'Python Code Block', description: 'Custom Python code with textarea', category: 'custom', icon: '📝', blockMode: 'code' },
    { type: 'shell_command', name: 'Shell Command', description: 'Execute shell commands', category: 'custom', icon: '💻', blockMode: 'code' },
    { type: 'hybrid_template', name: 'Template', description: 'Hybrid code template', category: 'custom', icon: '📄', blockMode: 'hybrid' },
  ];

  const categories = [
    { id: 'all', name: 'All', icon: '📦' },
    { id: 'files', name: 'Files', icon: '📁' },
    { id: 'text', name: 'Text', icon: '📝' },
    { id: 'data', name: 'Data', icon: '📊' },
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

  // Auto-select first item when search changes and there are results
  useEffect(() => {
    if (searchTerm && filteredBlocks.length > 0) {
      setSelectedIndex(0);
    } else {
      setSelectedIndex(-1);
    }
  }, [searchTerm, activeCategory, activeMode, filteredBlocks.length]);

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
          ref={searchInputRef}
          type="text"
          placeholder="Search blocks... (Tab to focus)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearchKeyDown}
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
        {filteredBlocks.map((block, index) => (
          <div
            key={block.type}
            className={`palette-block ${index === selectedIndex ? 'keyboard-selected' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, block.type)}
            onDoubleClick={() => handleDoubleClick(block.type)}
            onClick={() => setSelectedIndex(index)}
            title={block.description}
            style={{ position: 'relative' }}
          >
            <div className="block-header">
              <span className="block-icon">{block.icon}</span>
            </div>
            <div className="block-content">
              <div className="block-name">{block.name}</div>
              <div className="block-description">{block.description}</div>
            </div>
            <div 
              className="block-mode-indicator"
              style={{ backgroundColor: getBlockModeColor(block.blockMode) }}
              title={`${block.blockMode} block`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodePalette;