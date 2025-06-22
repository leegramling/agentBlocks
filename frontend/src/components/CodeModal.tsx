import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  title?: string;
}

const CodeModal: React.FC<CodeModalProps> = ({ 
  isOpen, 
  onClose, 
  code, 
  title = "Generated Python Code" 
}) => {
  const [filename, setFilename] = useState('generated_workflow.py');
  
  if (!isOpen) return null;

  const handleSaveCode = () => {
    const blob = new Blob([code], { type: 'text/python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="code-modal-overlay" onClick={onClose}>
      <div className="code-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="code-modal-header">
          <h3 className="code-modal-title">{title}</h3>
          <div className="filename-input-container">
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="filename-input"
              placeholder="Enter filename..."
            />
          </div>
          <div className="code-modal-actions">
            <button 
              className="code-action-button"
              onClick={handleSaveCode}
              title="Save as .py file"
            >
              <Save size={16} />
              Save
            </button>
            <button 
              className="code-action-button close"
              onClick={onClose}
              title="Close"
            >
              <X size={16} />
              Close
            </button>
          </div>
        </div>

        {/* Code Display */}
        <div className="code-modal-content">
          <pre className="code-display">
            <code>{code || '# No code generated yet'}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeModal;