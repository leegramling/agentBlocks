import React, { useState, useRef, useEffect } from 'react';

interface LLMQueryPanelProps {
  onConsoleOutput?: (updater: (prev: string[]) => string[]) => void;
}

const LLMQueryPanel: React.FC<LLMQueryPanelProps> = ({ onConsoleOutput }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
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
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel || 'llama2',
          prompt: query,
          stream: false
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const answer = data.response || 'No response received';
        onConsoleOutput?.(prev => [...prev, `🧠 LLM Response:`, answer]);
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

  const sampleQueries = [
    "How do I optimize this workflow?",
    "Generate a regex pattern for email validation",
    "What's the best way to handle errors in Python?",
    "Create a function to process CSV files",
    "Explain how to implement API authentication"
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