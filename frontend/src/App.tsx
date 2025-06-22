import React, { useState, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WorkflowEditor from './components/WorkflowEditor';
import BlockEditor from './components/BlockEditor';
import Layout from './components/Layout';

function App() {
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [nodeCount, setNodeCount] = useState(0);
  
  // These will be passed to and managed by WorkflowEditor - using refs for stable function references
  const executeCallbackRef = useRef<(() => void) | null>(null);
  const generateCodeCallbackRef = useRef<(() => string) | null>(null);
  const saveCallbackRef = useRef<(() => void) | null>(null);
  const importWorkflowCallbackRef = useRef<((workflowData: any) => void) | null>(null);

  const setExecuteCallback = useCallback((callback: (() => void) | null) => {
    executeCallbackRef.current = callback;
  }, []);

  const setGenerateCodeCallback = useCallback((callback: (() => string) | null) => {
    console.log('setGenerateCodeCallback called with:', !!callback);
    generateCodeCallbackRef.current = callback;
  }, []);

  const setSaveCallback = useCallback((callback: (() => void) | null) => {
    saveCallbackRef.current = callback;
  }, []);

  const setImportWorkflowCallback = useCallback((callback: ((workflowData: any) => void) | null) => {
    importWorkflowCallbackRef.current = callback;
  }, []);

  const handleConsoleOutput = useCallback((updater: (prev: string[]) => string[]) => {
    setConsoleOutput(updater);
  }, []);

  const handleClearConsole = useCallback(() => {
    setConsoleOutput([]);
  }, []);

  const handleExecute = useCallback(() => {
    if (executeCallbackRef.current) {
      executeCallbackRef.current();
    }
  }, []);

  const handleGenerateCode = useCallback(() => {
    console.log('handleGenerateCode called, generateCodeCallback available:', !!generateCodeCallbackRef.current);
    if (generateCodeCallbackRef.current) {
      const result = generateCodeCallbackRef.current();
      console.log('Generated code result:', result);
      return result;
    }
    console.error('generateCodeCallback is null or undefined!');
    return '';
  }, []);

  const handleSave = useCallback(() => {
    if (saveCallbackRef.current) {
      saveCallbackRef.current();
    }
  }, []);

  const handleImportWorkflow = useCallback((workflowData: any) => {
    if (importWorkflowCallbackRef.current) {
      importWorkflowCallbackRef.current(workflowData);
    }
  }, []);

  return (
    <div className="app-container">
      <Router>
        <Layout
          consoleOutput={consoleOutput}
          isExecuting={isExecuting}
          nodeCount={nodeCount}
          onExecute={handleExecute}
          onClearConsole={handleClearConsole}
          onGenerateCode={handleGenerateCode}
          onSave={handleSave}
          onConsoleOutput={handleConsoleOutput}
          onImportWorkflow={handleImportWorkflow}
        >
          <Routes>
            <Route 
              path="/" 
              element={
                <WorkflowEditor 
                  onConsoleOutput={handleConsoleOutput}
                  onExecutionState={setIsExecuting}
                  onNodeCountChange={setNodeCount}
                  onRegisterExecute={setExecuteCallback}
                  onRegisterGenerateCode={setGenerateCodeCallback}
                  onRegisterSave={setSaveCallback}
                  onRegisterImportWorkflow={setImportWorkflowCallback}
                />
              } 
            />
            <Route 
              path="/workflow/:id" 
              element={
                <WorkflowEditor 
                  onConsoleOutput={handleConsoleOutput}
                  onExecutionState={setIsExecuting}
                  onNodeCountChange={setNodeCount}
                  onRegisterExecute={setExecuteCallback}
                  onRegisterGenerateCode={setGenerateCodeCallback}
                  onRegisterSave={setSaveCallback}
                  onRegisterImportWorkflow={setImportWorkflowCallback}
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