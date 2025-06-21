import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
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
          <button className="action-button btn-save">Save</button>
          <button className="action-button btn-execute">Execute</button>
          <button className="action-button btn-export">Export</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default Layout;