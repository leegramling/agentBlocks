import React from 'react';
import { Play, Trash2, FileText } from 'lucide-react';

interface ConsoleProps {
  output: string[];
  isExecuting: boolean;
  onExecute: () => void;
  onClear: () => void;
  onGenerateCode?: () => string;
}

const Console: React.FC<ConsoleProps> = ({ 
  output, 
  isExecuting, 
  onExecute, 
  onClear,
  onGenerateCode 
}) => {
  const handleShowCode = () => {
    if (onGenerateCode) {
      const code = onGenerateCode();
      console.log('Generated Code:', code);
    }
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
            Code
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
      <div className="console-output">
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
    </div>
  );
};

export default Console;