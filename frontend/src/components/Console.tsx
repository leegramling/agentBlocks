import React, { useState, useEffect, useRef } from 'react';
import { Play, Trash2, FileText } from 'lucide-react';
import CodeModal from './CodeModal';

interface ConsoleProps {
  output: string[];
  isExecuting: boolean;
  onExecute: () => void;
  onClear: () => void;
  onGeneratePythonCode?: () => string;
  onGenerateRustCode?: () => string;
}

const Console: React.FC<ConsoleProps> = ({ 
  output, 
  isExecuting, 
  onExecute, 
  onClear,
  onGeneratePythonCode,
  onGenerateRustCode 
}) => {
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [generatedPythonCode, setGeneratedPythonCode] = useState('');
  const [generatedRustCode, setGeneratedRustCode] = useState('');
  const consoleOutputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (consoleOutputRef.current) {
      consoleOutputRef.current.scrollTop = consoleOutputRef.current.scrollHeight;
    }
  }, [output]);

  const handleShowCode = () => {
    console.log('handleShowCode called, generators available:', !!onGeneratePythonCode, !!onGenerateRustCode);
    
    let pythonCode = '';
    let rustCode = '';
    
    if (onGeneratePythonCode) {
      pythonCode = onGeneratePythonCode();
      console.log('Generated Python code length:', pythonCode?.length || 0);
      console.log('Python code preview:', pythonCode?.substring(0, 200));
      console.log('Full Python code:', pythonCode);
    } else {
      console.log('No Python code generator available');
    }
    
    if (onGenerateRustCode) {
      rustCode = onGenerateRustCode();
      console.log('Generated Rust code length:', rustCode?.length || 0);
      console.log('Rust code preview:', rustCode?.substring(0, 200));
      console.log('Full Rust code:', rustCode);
    } else {
      console.log('No Rust code generator available');
    }
    
    setGeneratedPythonCode(pythonCode);
    setGeneratedRustCode(rustCode);
    setIsCodeModalOpen(true);
  };

  return (
    <div className="console-panel">
      {/* Console Header */}
      <div className="console-header">
        <span className="console-title">⚡ Console Output</span>
        <div className="console-controls">
          <button 
            className="console-button"
            onClick={handleShowCode}
            title="Show Generated Code"
          >
            <FileText size={12} style={{ marginRight: '4px' }} />
            Show Code
          </button>
          <button 
            className="console-button"
            onClick={onClear}
            title="Clear Console"
          >
            <Trash2 size={12} style={{ marginRight: '4px' }} />
            Clear
          </button>
          <button 
            className={`console-button execute ${isExecuting ? 'disabled' : ''}`}
            onClick={onExecute}
            disabled={isExecuting}
            title="Execute Workflow"
          >
            <Play size={12} style={{ marginRight: '4px' }} />
            {isExecuting ? 'Running...' : 'Execute'}
          </button>
        </div>
      </div>

      {/* Console Output */}
      <div className="console-output" ref={consoleOutputRef}>
        {output.length === 0 ? (
          <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
            Console ready. Add some nodes and click Execute to see output...
          </div>
        ) : (
          output.map((line, index) => (
            <div 
              key={index} 
              className={`output-line ${
                line.startsWith('Error:') ? 'error' :
                line.startsWith('>') ? 'success' :
                line.startsWith('#') || line.includes('def ') || line.includes(' = ') ? 'code' :
                line.includes('===') ? 'info' : ''
              }`}
            >
              {line}
            </div>
          ))
        )}
      </div>

      {/* Code Modal */}
      <CodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        pythonCode={generatedPythonCode}
        rustCode={generatedRustCode}
        title="Generated Code"
      />
    </div>
  );
};

export default Console;