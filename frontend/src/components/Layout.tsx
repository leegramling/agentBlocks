import React from 'react';
import Console from './Console';

interface LayoutProps {
  children: React.ReactNode;
  consoleOutput?: string[];
  isExecuting?: boolean;
  onExecute?: () => void;
  onClearConsole?: () => void;
  onGenerateCode?: () => string;
  onSave?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  consoleOutput = [], 
  isExecuting = false, 
  onExecute, 
  onClearConsole,
  onGenerateCode,
  onSave 
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

      {/* Main Content */}
      <div className="main-content">
        {children}
        
        {/* Console Panel */}
        <Console 
          output={consoleOutput}
          isExecuting={isExecuting}
          onExecute={onExecute || (() => {})}
          onClear={onClearConsole || (() => {})}
          onGenerateCode={onGenerateCode}
        />
      </div>
    </div>
  );
};

export default Layout;