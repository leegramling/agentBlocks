import React, { useState, useRef } from 'react';
import Console from './Console';
import LLMQueryPanel from './LLMQueryPanel';
import HelpModal from './HelpModal';

interface LayoutProps {
  children: React.ReactNode;
  consoleOutput?: string[];
  isExecuting?: boolean;
  nodeCount?: number;
  nodes?: any[];
  onExecute?: () => void;
  onClearConsole?: () => void;
  onGeneratePythonCode?: () => string;
  onGenerateRustCode?: () => string;
  onSave?: () => void;
  onConsoleOutput?: (updater: (prev: string[]) => string[]) => void;
  onImportWorkflow?: (workflowData: any) => void;
  onExport?: () => void;
  // Search functionality
  searchValue?: string;
  searchResults?: any[];
  currentSearchIndex?: number;
  isSearchFieldFocused?: boolean;
  onSearchChange?: (value: string) => void;
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
  onSearchKeyDown?: (e: React.KeyboardEvent) => void;
  // Help modal functionality
  onRegisterToggleHelpModal?: (callback: (() => void) | null) => void;
  onRegisterFocusSearchField?: (callback: (() => void) | null) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  consoleOutput = [], 
  isExecuting = false, 
  nodeCount = 0,
  nodes,
  onExecute, 
  onClearConsole,
  onGeneratePythonCode,
  onGenerateRustCode,
  onSave,
  onConsoleOutput,
  onImportWorkflow,
  onExport,
  // Search props
  searchValue = '',
  searchResults = [],
  currentSearchIndex = 0,
  isSearchFieldFocused = false,
  onSearchChange,
  onSearchFocus,
  onSearchBlur,
  onSearchKeyDown,
  // Help modal registration
  onRegisterToggleHelpModal,
  onRegisterFocusSearchField
}) => {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Register callbacks with parent components
  React.useEffect(() => {
    if (onRegisterToggleHelpModal) {
      onRegisterToggleHelpModal(() => setShowHelpModal(prev => !prev));
    }
    if (onRegisterFocusSearchField) {
      onRegisterFocusSearchField(() => searchInputRef.current?.focus());
    }
  }, [onRegisterToggleHelpModal, onRegisterFocusSearchField]);

  return (
    <div className="layout">
      {/* Menu Bar */}
      <div className="menu-bar">
        <div className="menu-left">
          <h1 className="app-title">AgentBlocks</h1>
          <nav className="nav-menu">
            <button className="nav-button">File</button>
            <button className="nav-button">Edit</button>
            <button className="nav-button">View</button>
            <button className="nav-button">Workflow</button>
            <button className="nav-button">Tools</button>
            <button className="nav-button" onClick={() => setShowHelpModal(true)}>Help</button>
          </nav>
        </div>
        <div className="menu-right">
          <button className="action-button btn-save" onClick={onSave}>Save</button>
          <button 
            className="action-button btn-execute"
            onClick={onExecute}
            disabled={true}
            title="Temporarily disabled"
          >
            Execute
          </button>
          <button className="action-button btn-export" onClick={onExport}>Export</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {children}
      </div>

      {/* Execution Controls */}
      <div className="execution-controls">
        {/* Search Field */}
        <div className="execution-search-container">
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            onKeyDown={onSearchKeyDown}
            placeholder="Search nodes... (/ or Ctrl+F)"
            className="execution-search-input"
          />
          
          {/* Search Results Indicator */}
          {searchResults && searchResults.length > 0 && (
            <span className="execution-search-results">
              {currentSearchIndex + 1}/{searchResults.length}
            </span>
          )}
        </div>
        
        <button 
          className="control-button disabled"
          disabled={true}
          title="Temporarily disabled"
        >
          ▶ Run
        </button>
        <button className="control-button disabled" disabled={true} title="Temporarily disabled">
          ⏸ Pause
        </button>
        <button className="control-button disabled" disabled={true} title="Temporarily disabled">
          ⏹ Stop
        </button>
        <button className="control-button disabled" disabled={true} title="Temporarily disabled">
          🔧
        </button>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <span className="status-item">{isExecuting ? 'Running...' : 'Ready'}</span>
        <span className="status-separator">|</span>
        <span className="status-item">{nodeCount} node{nodeCount !== 1 ? 's' : ''}</span>
        <span className="status-separator">|</span>
        <span className="status-item">Last saved: Never</span>
        <span className="status-separator">|</span>
        <span className="status-item">Python 3.11</span>
      </div>

      {/* LLM Query Panel */}
      <LLMQueryPanel 
        onConsoleOutput={onConsoleOutput} 
        onImportWorkflow={onImportWorkflow}
        nodes={nodes}
        generatePythonCode={onGeneratePythonCode}
      />

      {/* Console Panel */}
      <Console 
        output={consoleOutput}
        isExecuting={isExecuting}
        onExecute={onExecute || (() => {})}
        onClear={onClearConsole || (() => {})}
        onGeneratePythonCode={onGeneratePythonCode}
        onGenerateRustCode={onGenerateRustCode}
      />

      {/* Help Modal */}
      <HelpModal 
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
};

export default Layout;