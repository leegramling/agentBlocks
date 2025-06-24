import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

type CodeLanguage = 'python' | 'rust';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pythonCode: string;
  rustCode: string;
  title?: string;
}

const CodeModal: React.FC<CodeModalProps> = ({ 
  isOpen, 
  onClose, 
  pythonCode, 
  rustCode, 
  title = "Generated Code" 
}) => {
  const [language, setLanguage] = useState<CodeLanguage>('python');
  const [filename, setFilename] = useState('generated_workflow.py');
  
  if (!isOpen) return null;

  const handleLanguageChange = (newLanguage: CodeLanguage) => {
    setLanguage(newLanguage);
    const extension = newLanguage === 'python' ? '.py' : '.rs';
    const baseName = filename.replace(/\.[^/.]+$/, '');
    setFilename(baseName + extension);
  };

  const getCurrentCode = () => {
    return language === 'python' ? pythonCode : rustCode;
  };

  const handleSaveCode = () => {
    const code = getCurrentCode();
    const mimeType = language === 'python' ? 'text/python' : 'text/rust';
    const blob = new Blob([code], { type: mimeType });
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
          
          {/* Language Selection */}
          <div className="language-selector">
            <button
              className={`lang-button ${language === 'python' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('python')}
            >
              🐍 Python
            </button>
            <button
              className={`lang-button ${language === 'rust' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('rust')}
            >
              🦀 Rust
            </button>
          </div>

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
            <code>{getCurrentCode() || (language === 'python' ? '# No Python code generated yet' : '// No Rust code generated yet')}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeModal;