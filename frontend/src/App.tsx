import React, { useState, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WorkflowEditor from './components/WorkflowEditor';
import BlockEditor from './components/BlockEditor';
import Layout from './components/Layout';

function App() {
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [nodeCount, setNodeCount] = useState(0);
  const [nodes, setNodes] = useState<any[]>([]);
  
  // Search state
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isSearchFieldFocused, setIsSearchFieldFocused] = useState(false);
  
  // These will be passed to and managed by WorkflowEditor - using refs for stable function references
  const executeCallbackRef = useRef<(() => void) | null>(null);
  const generatePythonCodeCallbackRef = useRef<(() => string) | null>(null);
  const generateRustCodeCallbackRef = useRef<(() => string) | null>(null);
  const saveCallbackRef = useRef<(() => void) | null>(null);
  const importWorkflowCallbackRef = useRef<((workflowData: any) => void) | null>(null);
  const exportCallbackRef = useRef<(() => void) | null>(null);
  const newWorkflowCallbackRef = useRef<(() => void) | null>(null);
  
  // Search callbacks that will be implemented by WorkflowEditor
  const performSearchCallbackRef = useRef<((term: string) => void) | null>(null);
  const findNextCallbackRef = useRef<(() => void) | null>(null);
  const findPreviousCallbackRef = useRef<(() => void) | null>(null);

  // UI callbacks that will be implemented by Layout
  const toggleHelpModalCallbackRef = useRef<(() => void) | null>(null);
  const focusSearchFieldCallbackRef = useRef<(() => void) | null>(null);

  const setExecuteCallback = useCallback((callback: (() => void) | null) => {
    executeCallbackRef.current = callback;
  }, []);

  const setGeneratePythonCodeCallback = useCallback((callback: (() => string) | null) => {
    console.log('setGeneratePythonCodeCallback called with:', !!callback);
    generatePythonCodeCallbackRef.current = callback;
  }, []);

  const setGenerateRustCodeCallback = useCallback((callback: (() => string) | null) => {
    console.log('setGenerateRustCodeCallback called with:', !!callback);
    generateRustCodeCallbackRef.current = callback;
  }, []);

  const setSaveCallback = useCallback((callback: (() => void) | null) => {
    saveCallbackRef.current = callback;
  }, []);

  const setImportWorkflowCallback = useCallback((callback: ((workflowData: any) => void) | null) => {
    importWorkflowCallbackRef.current = callback;
  }, []);

  const setExportCallback = useCallback((callback: (() => void) | null) => {
    exportCallbackRef.current = callback;
  }, []);

  const setNewWorkflowCallback = useCallback((callback: (() => void) | null) => {
    newWorkflowCallbackRef.current = callback;
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

  const handleGeneratePythonCode = useCallback(() => {
    console.log('handleGeneratePythonCode called, callback available:', !!generatePythonCodeCallbackRef.current);
    if (generatePythonCodeCallbackRef.current) {
      const result = generatePythonCodeCallbackRef.current();
      console.log('Generated Python code result:', result);
      return result;
    }
    console.error('generatePythonCodeCallback is null or undefined!');
    return '';
  }, []);

  const handleGenerateRustCode = useCallback(() => {
    console.log('handleGenerateRustCode called, callback available:', !!generateRustCodeCallbackRef.current);
    if (generateRustCodeCallbackRef.current) {
      const result = generateRustCodeCallbackRef.current();
      console.log('Generated Rust code result:', result);
      return result;
    }
    console.error('generateRustCodeCallback is null or undefined!');
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

  const handleExport = useCallback(() => {
    if (exportCallbackRef.current) {
      exportCallbackRef.current();
    }
  }, []);

  const handleNew = useCallback(() => {
    if (newWorkflowCallbackRef.current) {
      newWorkflowCallbackRef.current();
    }
  }, []);

  const handleNodesChange = useCallback((newNodes: any[]) => {
    setNodes(newNodes);
  }, []);

  // Search handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    if (performSearchCallbackRef.current) {
      performSearchCallbackRef.current(value);
    }
  }, []);

  const handleSearchFocus = useCallback(() => {
    setIsSearchFieldFocused(true);
  }, []);

  const handleSearchBlur = useCallback(() => {
    setIsSearchFieldFocused(false);
  }, []);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      e.preventDefault();
      if (findNextCallbackRef.current) {
        findNextCallbackRef.current();
      }
    } else if (e.key === 'Escape') {
      setSearchValue('');
      setSearchResults([]);
      setIsSearchFieldFocused(false);
      if (performSearchCallbackRef.current) {
        performSearchCallbackRef.current('');
      }
    }
  }, [searchResults.length]);

  const handleFindNext = useCallback(() => {
    if (findNextCallbackRef.current) {
      findNextCallbackRef.current();
    }
  }, []);

  // Search callback setters
  const setPerformSearchCallback = useCallback((callback: ((term: string) => void) | null) => {
    performSearchCallbackRef.current = callback;
  }, []);

  const setFindNextCallback = useCallback((callback: (() => void) | null) => {
    findNextCallbackRef.current = callback;
  }, []);

  const setFindPreviousCallback = useCallback((callback: (() => void) | null) => {
    findPreviousCallbackRef.current = callback;
  }, []);

  // UI callback setters
  const setToggleHelpModalCallback = useCallback((callback: (() => void) | null) => {
    toggleHelpModalCallbackRef.current = callback;
  }, []);

  const setFocusSearchFieldCallback = useCallback((callback: (() => void) | null) => {
    focusSearchFieldCallbackRef.current = callback;
  }, []);

  // These will be called by WorkflowEditor to update search state
  const updateSearchResults = useCallback((results: any[]) => {
    setSearchResults(results);
  }, []);

  const updateCurrentSearchIndex = useCallback((index: number) => {
    setCurrentSearchIndex(index);
  }, []);

  return (
    <div className="app-container">
      <Router>
        <Layout
          consoleOutput={consoleOutput}
          isExecuting={isExecuting}
          nodeCount={nodeCount}
          nodes={nodes}
          onExecute={handleExecute}
          onClearConsole={handleClearConsole}
          onGeneratePythonCode={handleGeneratePythonCode}
          onGenerateRustCode={handleGenerateRustCode}
          onSave={handleSave}
          onConsoleOutput={handleConsoleOutput}
          onImportWorkflow={handleImportWorkflow}
          onExport={handleExport}
          onNew={handleNew}
          searchValue={searchValue}
          searchResults={searchResults}
          currentSearchIndex={currentSearchIndex}
          isSearchFieldFocused={isSearchFieldFocused}
          onSearchChange={handleSearchChange}
          onSearchFocus={handleSearchFocus}
          onSearchBlur={handleSearchBlur}
          onSearchKeyDown={handleSearchKeyDown}
          onRegisterToggleHelpModal={setToggleHelpModalCallback}
          onRegisterFocusSearchField={setFocusSearchFieldCallback}
        >
          <Routes>
            <Route 
              path="/" 
              element={
                <WorkflowEditor 
                  onConsoleOutput={handleConsoleOutput}
                  onExecutionState={setIsExecuting}
                  onNodeCountChange={setNodeCount}
                  onNodesChange={handleNodesChange}
                  onRegisterExecute={setExecuteCallback}
                  onRegisterGeneratePythonCode={setGeneratePythonCodeCallback}
                  onRegisterGenerateRustCode={setGenerateRustCodeCallback}
                  onRegisterExport={setExportCallback}
                  onRegisterSave={setSaveCallback}
                  onRegisterImportWorkflow={setImportWorkflowCallback}
                  onRegisterNew={setNewWorkflowCallback}
                  onRegisterPerformSearch={setPerformSearchCallback}
                  onRegisterFindNext={setFindNextCallback}
                  onRegisterFindPrevious={setFindPreviousCallback}
                  onSetSearchResults={updateSearchResults}
                  onSetCurrentSearchIndex={updateCurrentSearchIndex}
                  toggleHelpModalCallback={toggleHelpModalCallbackRef}
                  focusSearchFieldCallback={focusSearchFieldCallbackRef}
                  isSearchFieldFocused={isSearchFieldFocused}
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
                  onNodesChange={handleNodesChange}
                  onRegisterExecute={setExecuteCallback}
                  onRegisterGeneratePythonCode={setGeneratePythonCodeCallback}
                  onRegisterGenerateRustCode={setGenerateRustCodeCallback}
                  onRegisterExport={setExportCallback}
                  onRegisterSave={setSaveCallback}
                  onRegisterImportWorkflow={setImportWorkflowCallback}
                  onRegisterNew={setNewWorkflowCallback}
                  onRegisterPerformSearch={setPerformSearchCallback}
                  onRegisterFindNext={setFindNextCallback}
                  onRegisterFindPrevious={setFindPreviousCallback}
                  onSetSearchResults={updateSearchResults}
                  onSetCurrentSearchIndex={updateCurrentSearchIndex}
                  toggleHelpModalCallback={toggleHelpModalCallbackRef}
                  focusSearchFieldCallback={focusSearchFieldCallbackRef}
                  isSearchFieldFocused={isSearchFieldFocused}
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