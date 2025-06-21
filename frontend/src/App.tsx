import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WorkflowEditor from './components/WorkflowEditor';
import BlockEditor from './components/BlockEditor';
import Layout from './components/Layout';

function App() {
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // These will be passed to and managed by WorkflowEditor
  const [executeCallback, setExecuteCallback] = useState<(() => void) | null>(null);
  const [generateCodeCallback, setGenerateCodeCallback] = useState<(() => string) | null>(null);

  const handleConsoleOutput = useCallback((updater: (prev: string[]) => string[]) => {
    setConsoleOutput(updater);
  }, []);

  const handleClearConsole = useCallback(() => {
    setConsoleOutput([]);
  }, []);

  const handleExecute = useCallback(() => {
    if (executeCallback) {
      executeCallback();
    }
  }, [executeCallback]);

  const handleGenerateCode = useCallback(() => {
    if (generateCodeCallback) {
      return generateCodeCallback();
    }
    return '';
  }, [generateCodeCallback]);

  return (
    <div className="app-container">
      <Router>
        <Layout
          consoleOutput={consoleOutput}
          isExecuting={isExecuting}
          onExecute={handleExecute}
          onClearConsole={handleClearConsole}
          onGenerateCode={handleGenerateCode}
        >
          <Routes>
            <Route 
              path="/" 
              element={
                <WorkflowEditor 
                  onConsoleOutput={handleConsoleOutput}
                  onExecutionState={setIsExecuting}
                  onRegisterExecute={setExecuteCallback}
                  onRegisterGenerateCode={setGenerateCodeCallback}
                />
              } 
            />
            <Route 
              path="/workflow/:id" 
              element={
                <WorkflowEditor 
                  onConsoleOutput={handleConsoleOutput}
                  onExecutionState={setIsExecuting}
                  onRegisterExecute={setExecuteCallback}
                  onRegisterGenerateCode={setGenerateCodeCallback}
                />
              } 
            />
            <Route path="/block-editor/:nodeId" element={<BlockEditor />} />
          </Routes>
        </Layout>
      </Router>
    </div>
  );
}

export default App;