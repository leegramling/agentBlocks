import React from 'react';
import { X } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="help-modal-header">
          <h3 className="help-modal-title">⌨️ Keyboard Shortcuts</h3>
          <button 
            className="help-modal-close"
            onClick={onClose}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Help Content */}
        <div className="help-modal-content">
          <div className="help-section">
            <h4 className="help-section-title">Node Management</h4>
            <div className="help-shortcut">
              <span className="help-key">Tab</span>
              <span className="help-description">Make selected node a child of previous node (indent)</span>
            </div>
            <div className="help-shortcut">
              <span className="help-key">Shift + Tab</span>
              <span className="help-description">Remove parent relationship (unindent)</span>
            </div>
            <div className="help-shortcut">
              <span className="help-key">P</span>
              <span className="help-description">Open property editor panel for selected node</span>
            </div>
            <div className="help-shortcut">
              <span className="help-key">F</span>
              <span className="help-description">Toggle right properties panel</span>
            </div>
          </div>

          <div className="help-section">
            <h4 className="help-section-title">Navigation</h4>
            <div className="help-shortcut">
              <span className="help-key">F2</span>
              <span className="help-description">Toggle focus between search field and canvas</span>
            </div>
            <div className="help-shortcut">
              <span className="help-key">Ctrl + Wheel</span>
              <span className="help-description">Zoom in/out on canvas</span>
            </div>
            <div className="help-shortcut">
              <span className="help-key">Middle Click + Drag</span>
              <span className="help-description">Pan around canvas</span>
            </div>
          </div>

          <div className="help-section">
            <h4 className="help-section-title">Node Operations</h4>
            <div className="help-shortcut">
              <span className="help-key">Double Click</span>
              <span className="help-description">Open block editor for node</span>
            </div>
            <div className="help-shortcut">
              <span className="help-key">Drag & Drop</span>
              <span className="help-description">Reposition nodes or add to panels</span>
            </div>
          </div>

          <div className="help-section">
            <h4 className="help-section-title">Workflow Structure</h4>
            <div className="help-note">
              <strong>Parent Nodes:</strong> foreach, if-then, while, function can have child nodes
            </div>
            <div className="help-note">
              <strong>Child Nodes:</strong> Nodes indented under parent nodes will be executed within the parent's scope
            </div>
            <div className="help-note">
              <strong>Code Generation:</strong> Properly indented Python code is generated based on parent-child relationships
            </div>
          </div>

          <div className="help-section">
            <h4 className="help-section-title">Example Workflow</h4>
            <div className="help-example">
              <div className="help-example-title">Creating a numbered list:</div>
              <ol className="help-example-steps">
                <li>Create a <strong>Variable</strong> node: counter = 0</li>
                <li>Create a <strong>List Create</strong> node: fruits = ["apple", "orange", "pear"]</li>
                <li>Create a <strong>Foreach</strong> node: for fruit in fruits</li>
                <li>Select <strong>Increment</strong> node and press <strong>Tab</strong> to make it a child</li>
                <li>Select <strong>Print</strong> node and press <strong>Tab</strong> to make it a child</li>
                <li>Result: Numbered list output (1. apple, 2. orange, 3. pear)</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;