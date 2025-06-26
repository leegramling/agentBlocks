import React, { useState, useRef, useEffect } from 'react';

interface LLMQueryPanelProps {
  onConsoleOutput?: (updater: (prev: string[]) => string[]) => void;
  onImportWorkflow?: (workflowData: any) => void;
  nodes?: any[];
  generatePythonCode?: () => string;
}

const LLMQueryPanel: React.FC<LLMQueryPanelProps> = ({ onConsoleOutput, onImportWorkflow, nodes, generatePythonCode }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [lastGeneratedWorkflow, setLastGeneratedWorkflow] = useState<any>(null);
  const [queryMode, setQueryMode] = useState<'nodes' | 'general' | 'review'>('nodes');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check Ollama status on component mount
  useEffect(() => {
    checkOllamaStatus();
    const interval = setInterval(checkOllamaStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkOllamaStatus = async () => {
    try {
      console.log('Checking Ollama connection at http://localhost:11434/api/tags');
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      });
      
      console.log('Ollama response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Ollama response data:', data);
        const models = data.models?.map((model: any) => model.name) || [];
        setAvailableModels(models);
        setOllamaStatus('connected');
        console.log('Ollama connected successfully. Available models:', models);
        if (models.length > 0 && !selectedModel) {
          setSelectedModel(models[0]);
        }
      } else {
        console.error('Ollama returned non-OK status:', response.status, response.statusText);
        setOllamaStatus('disconnected');
      }
    } catch (error) {
      console.error('Ollama connection error:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        // Check for specific error types
        if (error.name === 'AbortError') {
          console.error('Ollama request timed out');
        } else if (error.message.includes('fetch')) {
          console.error('Network error - make sure Ollama is running on localhost:11434');
        }
      }
      setOllamaStatus('disconnected');
    }
  };

  const sendQuery = async () => {
    if (!query.trim() || isLoading || ollamaStatus !== 'connected') return;

    setIsLoading(true);
    onConsoleOutput?.(prev => [...prev, `🤖 Query: ${query}`]);

    try {
      // Create system prompt based on query mode
      const systemPrompt = queryMode === 'review'
        ? `You are an expert code reviewer analyzing a visual node-based workflow and its generated Python code.

ROLE: Act as a senior software engineer conducting a thorough code review.

REVIEW CRITERIA:
• Code Quality: Clean, readable, maintainable code
• Best Practices: PEP 8 compliance, proper naming conventions
• Performance: Efficient algorithms and data structures
• Security: Potential vulnerabilities or security issues
• Error Handling: Proper exception handling and edge cases
• Logic Flow: Workflow structure and node connections
• Optimization: Suggestions for improvement

FORMAT YOUR REVIEW AS:
## Code Review Summary
- Overall assessment (rating out of 5 stars)
- Key strengths
- Major concerns

## Detailed Analysis
### Code Quality
[Your analysis]

### Best Practices
[Your analysis]

### Performance & Efficiency
[Your analysis]

### Security Considerations
[Your analysis]

### Recommended Improvements
1. [Specific suggestion with line/node references]
2. [Specific suggestion with line/node references]

Be constructive, specific, and provide actionable feedback. Reference specific nodes or code sections when possible.`
        : queryMode === 'nodes' 
        ? `You are a visual programming assistant for AgentBlocks, a node-based workflow editor.

WORKFLOW JSON FORMAT: For workflow creation requests, output pure JSON with these exact keys:
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "node_type",
      "properties": { /* node-specific settings */ }
    }
  ],
  "connections": [
    {
      "from": "source-node-id",
      "to": "target-node-id"
    }
  ]
}

AVAILABLE NODE TYPES:

📁 FILES:
• find_files - Search for files matching patterns
• read_file - Read file contents
• write_file - Write content to file
• copy_file - Copy files or directories

📝 TEXT:
• variable - Store and retrieve values (properties: name, value)
• print - Output text to console (properties: message)
• text_transform - Modify text content
• regex_match - Pattern matching with regex

📊 DATA:
• list_create - Create lists (properties: name, items)
• list_append - Add to lists (properties: list, item)
• list_get - Get from lists (properties: list, index, variable)
• list_comprehension - List comprehensions (properties: variable, expression, iterable, condition)
• set_create - Create sets (properties: name, items)
• dict_create - Create dictionaries (properties: name, items)

🌐 NETWORK:
• http_request - Make web API calls
• download_file - Download files from URLs
• webhook - Receive HTTP callbacks

🔀 LOGIC:
• if-then - Conditional execution (properties: condition)
• foreach - Loop over collections (properties: iterable, variable)
• while - Conditional loops (properties: condition)
• function - Reusable code blocks (properties: name, parameters)

🤖 AI:
• ai_text_gen - Generate text with AI
• ai_code_gen - Generate code with AI
• ai_analysis - Analyze content with AI

⚙️ CUSTOM CODE:
• python_code - Custom Python scripts (use this for complex Python code that doesn't fit other node types)
• shell_command - Execute shell commands

EXAMPLES:
User: "Create a workflow with a variable and print"
Response: {"nodes":[{"id":"var1","type":"variable","properties":{"name":"myVar","value":"hello"}},{"id":"print1","type":"print","properties":{"message":"myVar"}}],"connections":[{"from":"var1","to":"print1"}]}

For non-workflow questions, provide helpful programming guidance.`
        : `You are a helpful coding assistant. Provide clear, concise programming advice and code examples. Focus on:

• Python programming concepts and best practices
• Code optimization and debugging
• Algorithm explanations
• Programming patterns and techniques
• Library recommendations and usage
• General software development guidance

Keep responses practical and coding-focused. Provide code examples when helpful.`;

      let fullPrompt = `${systemPrompt}\n\nUser: ${query}`;
      
      // For code review mode, include the workflow data and generated Python code
      if (queryMode === 'review' && nodes && generatePythonCode) {
        const pythonCode = generatePythonCode();
        const workflowData = {
          nodes: nodes.map(node => ({
            id: node.id,
            type: node.type,
            properties: node.properties,
            panelId: node.panelId
          })),
          nodeCount: nodes.length
        };
        
        fullPrompt += `\n\n## WORKFLOW DATA (JSON):
\`\`\`json
${JSON.stringify(workflowData, null, 2)}
\`\`\`

## GENERATED PYTHON CODE:
\`\`\`python
${pythonCode}
\`\`\``;
      }

      console.log('Sending query to Ollama with model:', selectedModel);
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
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
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(30000)
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
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Ollama API error:', response.status, response.statusText, errorText);
        onConsoleOutput?.(prev => [...prev, `❌ Error: Failed to get response from LLM (${response.status}: ${response.statusText})`]);
      }
    } catch (error) {
      console.error('LLM query error:', error);
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out - LLM may be slow to respond';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Connection error - ensure Ollama is running on localhost:11434';
        }
      }
      onConsoleOutput?.(prev => [...prev, `❌ Error: ${errorMessage}`]);
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

  const sampleQueries = queryMode === 'nodes' 
    ? [
        "Create a simple workflow with a variable and print statement",
        "Build a workflow to read a file, process it with python_code, and save results", 
        "Generate nodes to download a file from URL and save it locally",
        "Create a workflow that loops through files and transforms text",
        "Make a workflow with list comprehension and data processing"
      ]
    : queryMode === 'review'
    ? [
        "Review this workflow for code quality and best practices",
        "Analyze the generated Python code for performance improvements",
        "Check this workflow for potential security vulnerabilities",
        "Evaluate the error handling and edge cases in this code",
        "Suggest optimizations for this node-based workflow"
      ]
    : [
        "How do I optimize Python code for better performance?",
        "What's the difference between lists and tuples in Python?",
        "Explain list comprehensions with examples",
        "How to handle errors and exceptions in Python?",
        "Best practices for writing clean, readable code"
      ];

  return (
    <div className="llm-query-panel">
      <div className="llm-query-header">
        <div className="llm-query-title">
          <span className="llm-icon">🤖</span>
          <h3>AI Assistant</h3>
          <div className="query-mode-toggle">
            <button 
              className={`mode-toggle-button ${queryMode === 'nodes' ? 'active' : ''}`}
              onClick={() => setQueryMode('nodes')}
            >
              🔗 Nodes
            </button>
            <button 
              className={`mode-toggle-button ${queryMode === 'general' ? 'active' : ''}`}
              onClick={() => setQueryMode('general')}
            >
              💡 Code Help
            </button>
            <button 
              className={`mode-toggle-button ${queryMode === 'review' ? 'active' : ''}`}
              onClick={() => setQueryMode('review')}
              disabled={!nodes || nodes.length === 0}
              title={!nodes || nodes.length === 0 ? 'Add nodes to your workflow to enable code review' : 'Review your workflow and generated code'}
            >
              🔍 Review
            </button>
          </div>
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
                <button
                  onClick={checkOllamaStatus}
                  style={{
                    marginLeft: '8px',
                    padding: '2px 6px',
                    fontSize: '10px',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '3px',
                    color: '#d1d5db',
                    cursor: 'pointer'
                  }}
                  title="Retry connection to Ollama"
                >
                  Retry
                </button>
              </>
            )}
          </div>
        </div>
        
        {ollamaStatus === 'disconnected' && (
          <div className="ollama-help">
            <p>Start Ollama to use AI assistance:</p>
            <code>ollama serve</code>
            <p style={{fontSize: '12px', color: '#9ca3af', marginTop: '8px'}}>
              Make sure Ollama is running on <strong>localhost:11434</strong><br/>
              Check console for detailed connection errors.
            </p>
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