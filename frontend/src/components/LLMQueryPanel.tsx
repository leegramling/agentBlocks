import React, { useState, useRef, useEffect } from 'react';

interface LLMQueryPanelProps {
  onConsoleOutput?: (updater: (prev: string[]) => string[]) => void;
  onImportWorkflow?: (workflowData: any) => void;
}

const LLMQueryPanel: React.FC<LLMQueryPanelProps> = ({ onConsoleOutput, onImportWorkflow }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [lastGeneratedWorkflow, setLastGeneratedWorkflow] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check Ollama status on component mount
  useEffect(() => {
    checkOllamaStatus();
    const interval = setInterval(checkOllamaStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkOllamaStatus = async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        const data = await response.json();
        const models = data.models?.map((model: any) => model.name) || [];
        setAvailableModels(models);
        setOllamaStatus('connected');
        if (models.length > 0 && !selectedModel) {
          setSelectedModel(models[0]);
        }
      } else {
        setOllamaStatus('disconnected');
      }
    } catch (error) {
      setOllamaStatus('disconnected');
    }
  };

  const sendQuery = async () => {
    if (!query.trim() || isLoading || ollamaStatus !== 'connected') return;

    setIsLoading(true);
    onConsoleOutput?.(prev => [...prev, `🤖 Query: ${query}`]);

    try {
      // Create system prompt for visual programming assistance
      const systemPrompt = `You are a visual‐programming assistant for AgentBlocks.
When given a programming task, you can respond in two ways:

1. For workflow/node graph requests, output a JSON object with exactly two keys:
   • nodes: an array of objects, each with
     - id: string (unique identifier)
     - type: string (node type like 'variable', 'function', 'if-then', 'foreach', 'python_code', etc.)
     - params: object (node-specific settings/properties)
     - inputs: array of string (names of input ports)
     - outputs: array of string (names of output ports)
   • connections: an array of objects, each with
     - from: node id
     - output: output port name  
     - to: node id
     - input: input port name

2. For general programming questions, provide helpful explanations, code snippets, or guidance.

Available node types include: variable, assignment, if-then, foreach, while, function, execute, print, python_code, shell_command, find_files, read_file, write_file, copy_file, text_transform, regex_match, http_request, download_file, ai_text_gen, ai_code_gen, ai_analysis.

Only emit pure JSON for workflow requests—no extra prose or markdown formatting.`;

      const fullPrompt = `${systemPrompt}\n\nUser: ${query}`;

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel || 'llama2',
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: 0.1, // Lower temperature for more consistent JSON output
            top_p: 0.9
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const answer = data.response || 'No response received';
        
        // Try to parse as JSON first to format it nicely
        try {
          const parsedJson = JSON.parse(answer);
          
          // Check if it's a valid workflow structure
          if (parsedJson.nodes && parsedJson.connections && Array.isArray(parsedJson.nodes)) {
            setLastGeneratedWorkflow(parsedJson);
            onConsoleOutput?.(prev => [...prev, 
              `🧠 LLM Response (Workflow JSON):`,
              '```json',
              JSON.stringify(parsedJson, null, 2),
              '```',
              '✨ Workflow detected! Use the "Import Workflow" button to add these nodes to your canvas.'
            ]);
          } else {
            onConsoleOutput?.(prev => [...prev, 
              `🧠 LLM Response (JSON):`,
              '```json',
              JSON.stringify(parsedJson, null, 2),
              '```'
            ]);
          }
        } catch {
          // If not JSON, display as regular text
          onConsoleOutput?.(prev => [...prev, `🧠 LLM Response:`, answer]);
          setLastGeneratedWorkflow(null);
        }
      } else {
        onConsoleOutput?.(prev => [...prev, `❌ Error: Failed to get response from LLM (${response.status})`]);
      }
    } catch (error) {
      onConsoleOutput?.(prev => [...prev, `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendQuery();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery();
  };

  const insertSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery);
    textareaRef.current?.focus();
  };

  const handleImportWorkflow = () => {
    if (lastGeneratedWorkflow && onImportWorkflow) {
      onImportWorkflow(lastGeneratedWorkflow);
      onConsoleOutput?.(prev => [...prev, `✅ Workflow imported successfully! Check your canvas for the new nodes.`]);
      setLastGeneratedWorkflow(null);
    }
  };

  const sampleQueries = [
    "Create a workflow to read a CSV file and filter rows where column 'age' > 30",
    "Build a node graph to download a file from URL and save it locally",
    "Generate a workflow that processes text files and counts word frequency",
    "Create nodes to call an API, parse JSON response, and save results",
    "How do I optimize workflow performance?",
    "What's the best way to handle errors in Python?"
  ];

  return (
    <div className="llm-query-panel">
      <div className="llm-query-header">
        <div className="llm-query-title">
          <span className="llm-icon">🤖</span>
          <h3>AI Assistant</h3>
          <div className={`ollama-status ${ollamaStatus}`}>
            {ollamaStatus === 'checking' && (
              <>
                <div className="status-spinner"></div>
                <span>Checking Ollama...</span>
              </>
            )}
            {ollamaStatus === 'connected' && (
              <>
                <div className="status-dot connected"></div>
                <span>Connected</span>
                {availableModels.length > 0 && (
                  <select 
                    value={selectedModel} 
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="model-select"
                  >
                    {availableModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                )}
              </>
            )}
            {ollamaStatus === 'disconnected' && (
              <>
                <div className="status-dot disconnected"></div>
                <span>Ollama not running</span>
              </>
            )}
          </div>
        </div>
        
        {ollamaStatus === 'disconnected' && (
          <div className="ollama-help">
            <p>Start Ollama to use AI assistance:</p>
            <code>ollama serve</code>
          </div>
        )}
      </div>

      <div className="llm-query-content">
        {ollamaStatus === 'connected' && (
          <>
            <form onSubmit={handleSubmit} className="query-form">
              <div className="query-input-group">
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about coding, workflows, or programming concepts..."
                  className="query-textarea"
                  rows={3}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className={`query-submit ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading || !query.trim()}
                >
                  {isLoading ? (
                    <>
                      <div className="button-spinner"></div>
                      <span>Thinking...</span>
                    </>
                  ) : (
                    <>
                      <span>Send</span>
                      <span className="keyboard-hint">Ctrl+Enter</span>
                    </>
                  )}
                </button>
              </div>
              
              {lastGeneratedWorkflow && (
                <div className="import-workflow-section">
                  <button
                    onClick={handleImportWorkflow}
                    className="import-workflow-button"
                    title="Import the generated workflow to your canvas"
                  >
                    ✨ Import Workflow
                  </button>
                </div>
              )}
            </form>

            <div className="sample-queries">
              <div className="sample-queries-label">Quick questions:</div>
              <div className="sample-queries-list">
                {sampleQueries.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => insertSampleQuery(sample)}
                    className="sample-query-button"
                    disabled={isLoading}
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LLMQueryPanel;