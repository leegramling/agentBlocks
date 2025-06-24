import React, { useState } from 'react';
import { WorkflowExporter } from '../nodes/WorkflowExporter';
import type { Workflow, ExportFormat } from '../nodes/WorkflowExporter';

interface ExportPanelProps {
  workflow: Workflow;
  isOpen: boolean;
  onClose: () => void;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ workflow, isOpen, onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [exportPreview, setExportPreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const exporter = new WorkflowExporter();

  if (!isOpen) return null;

  const handleFormatChange = (format: ExportFormat) => {
    setSelectedFormat(format);
    setShowPreview(false);
    setExportPreview('');
  };

  const handlePreview = async () => {
    setIsExporting(true);
    try {
      const content = exporter.exportWorkflow(workflow, selectedFormat);
      setExportPreview(content);
      setShowPreview(true);
    } catch (error) {
      console.error('Export preview failed:', error);
      alert('Failed to generate preview');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    const validation = exporter.validateWorkflow(workflow);
    if (!validation.valid) {
      alert(`Workflow validation failed:\n${validation.errors.join('\n')}`);
      return;
    }

    try {
      exporter.downloadWorkflow(workflow, selectedFormat);
    } catch (error) {
      console.error('Export download failed:', error);
      alert('Failed to download workflow');
    }
  };

  const stats = exporter.getWorkflowStats(workflow);
  const validation = exporter.validateWorkflow(workflow);

  const formatDescriptions = {
    json: {
      title: 'JSON Workflow',
      description: 'Save workflow for loading back into AgentBlocks',
      icon: '📄',
      extension: '.json',
      features: ['Complete workflow data', 'Node positions', 'All properties', 'Connections & panels']
    },
    python: {
      title: 'Python Executable',
      description: 'Generate standalone Python script',
      icon: '🐍',
      extension: '.py',
      features: ['Executable code', 'All node logic', 'Proper imports', 'Error handling']
    },
    rust: {
      title: 'Rust Executable', 
      description: 'Generate high-performance Rust code',
      icon: '🦀',
      extension: '.rs',
      features: ['Fast execution', 'Type safety', 'Memory efficiency', 'Concurrent processing']
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Export Workflow</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Workflow Info */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">{workflow.name}</h3>
          <p className="text-gray-300 mb-3">{workflow.description}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Nodes:</span>
              <span className="text-white ml-2">{stats.nodeCount}</span>
            </div>
            <div>
              <span className="text-gray-400">Connections:</span>
              <span className="text-white ml-2">{stats.connectionCount}</span>
            </div>
            <div>
              <span className="text-gray-400">Panels:</span>
              <span className="text-white ml-2">{stats.panelCount}</span>
            </div>
            <div>
              <span className="text-gray-400">Complexity:</span>
              <span className={`ml-2 ${
                stats.complexity === 'simple' ? 'text-green-400' :
                stats.complexity === 'moderate' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {stats.complexity}
              </span>
            </div>
          </div>
        </div>

        {/* Validation Status */}
        {!validation.valid && (
          <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-red-200 mb-2">⚠️ Validation Issues:</h4>
            <ul className="text-red-300 text-sm space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Format Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select Export Format</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.keys(formatDescriptions) as ExportFormat[]).map((format) => {
              const info = formatDescriptions[format];
              const isSelected = selectedFormat === format;
              
              return (
                <div
                  key={format}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-900 bg-opacity-30'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                  onClick={() => handleFormatChange(format)}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">{info.icon}</span>
                    <h4 className="font-semibold text-white">{info.title}</h4>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{info.description}</p>
                  <div className="text-xs text-gray-400">
                    <div className="font-medium mb-1">Features:</div>
                    <ul className="space-y-1">
                      {info.features.map((feature, index) => (
                        <li key={index}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={handlePreview}
            disabled={isExporting}
            className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isExporting ? 'Generating...' : '👁️ Preview'}
          </button>
          
          <button
            onClick={handleDownload}
            disabled={!validation.valid}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-400 text-white px-6 py-2 rounded-lg transition-colors font-semibold"
          >
            📥 Download {formatDescriptions[selectedFormat].extension}
          </button>
        </div>

        {/* Preview Section */}
        {showPreview && exportPreview && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-white">Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white"
              >
                Hide Preview
              </button>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap">
                {exportPreview.length > 5000 
                  ? `${exportPreview.substring(0, 5000)}\n\n... (truncated, full content will be in download)`
                  : exportPreview
                }
              </pre>
            </div>
          </div>
        )}

        {/* Node Types Summary */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-2">Node Types Used</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.nodeTypes).map(([type, count]) => (
              <span
                key={type}
                className="bg-gray-600 text-gray-200 px-2 py-1 rounded text-sm"
              >
                {type} ({count})
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;