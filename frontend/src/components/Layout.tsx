import React from 'react';
import Console from './Console';
import LLMQueryPanel from './LLMQueryPanel';

interface LayoutProps {
  children: React.ReactNode;
  consoleOutput?: string[];
  isExecuting?: boolean;
  onExecute?: () => void;
  onClearConsole?: () => void;
  onGenerateCode?: () => string;
  onSave?: () => void;
  onConsoleOutput?: (updater: (prev: string[]) => string[]) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  consoleOutput = [], 
  isExecuting = false, 
  onExecute, 
  onClearConsole,
  onGenerateCode,
  onSave,
  onConsoleOutput
}) => {
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
            <button className="nav-button">Help</button>
          </nav>
        </div>
        <div className="menu-right">
          <button className="action-button btn-save" onClick={onSave}>Save</button>
          <button 
            className="action-button btn-execute"
            onClick={onExecute}
            disabled={isExecuting}
          >
            {isExecuting ? 'Running...' : 'Execute'}
          </button>
          <button className="action-button btn-export">Export</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {children}
      </div>

      {/* Execution Controls */}
      <div className="execution-controls">
        <button 
          className={`control-button ${isExecuting ? 'disabled' : ''}`}
          onClick={onExecute}
          disabled={isExecuting}
          title="Run Workflow"
        >
          ▶ Run
        </button>
        <button className="control-button" title="Pause Execution">
          ⏸ Pause
        </button>
        <button className="control-button" title="Stop Execution">
          ⏹ Stop
        </button>
        <button className="control-button" title="Settings">
          🔧
        </button>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <span className="status-item">Ready</span>
        <span className="status-separator">|</span>
        <span className="status-item">0 blocks</span>
        <span className="status-separator">|</span>
        <span className="status-item">Last saved: Never</span>
        <span className="status-separator">|</span>
        <span className="status-item">Python 3.11</span>
      </div>

      {/* LLM Query Panel */}
      <LLMQueryPanel onConsoleOutput={onConsoleOutput} />

      {/* Console Panel */}
      <Console 
        output={consoleOutput}
        isExecuting={isExecuting}
        onExecute={onExecute || (() => {})}
        onClear={onClearConsole || (() => {})}
        onGenerateCode={onGenerateCode}
      />
    </div>
  );
};

export default Layout;