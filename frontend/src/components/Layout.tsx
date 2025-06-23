import React, { useState } from 'react';
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
  onGenerateCode?: () => string;
  onSave?: () => void;
  onConsoleOutput?: (updater: (prev: string[]) => string[]) => void;
  onImportWorkflow?: (workflowData: any) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  consoleOutput = [], 
  isExecuting = false, 
  nodeCount = 0,
  nodes,
  onExecute, 
  onClearConsole,
  onGenerateCode,
  onSave,
  onConsoleOutput,
  onImportWorkflow
}) => {
  const [showHelpModal, setShowHelpModal] = useState(false);
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
        generatePythonCode={onGenerateCode}
      />

      {/* Console Panel */}
      <Console 
        output={consoleOutput}
        isExecuting={isExecuting}
        onExecute={onExecute || (() => {})}
        onClear={onClearConsole || (() => {})}
        onGenerateCode={onGenerateCode}
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