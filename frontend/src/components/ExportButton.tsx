import React, { useState } from 'react';
import type { WorkflowNode, Connection, WorkflowPanel } from '../types';
import { WorkflowExporter } from '../nodes/WorkflowExporter';
import type { Workflow, ExportFormat } from '../nodes/WorkflowExporter';
import ExportPanel from './ExportPanel';

interface ExportButtonProps {
  nodes: WorkflowNode[];
  connections: Connection[];
  panels: WorkflowPanel[];
}

const ExportButton: React.FC<ExportButtonProps> = ({ nodes, connections, panels }) => {
  const [showExportPanel, setShowExportPanel] = useState(false);

  const createWorkflow = (): Workflow => {
    return {
      id: `workflow_${Date.now()}`,
      name: 'AgentBlocks Workflow',
      description: 'Generated workflow from AgentBlocks visual editor',
      version: '1.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      nodes: nodes,
      connections: connections,
      panels: panels
    };
  };

  const handleQuickExport = (format: ExportFormat) => {
    const workflow = createWorkflow();
    const exporter = new WorkflowExporter();
    
    try {
      exporter.downloadWorkflow(workflow, format);
    } catch (error) {
      console.error('Quick export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <>
      <div className="relative group">
        <button
          onClick={() => setShowExportPanel(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          title="Export workflow"
        >
          📥 Export
        </button>
        
        {/* Quick export dropdown */}
        <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
          <div className="p-2 w-48">
            <div className="text-xs text-gray-400 mb-2">Quick Export:</div>
            <button
              onClick={() => handleQuickExport('json')}
              className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded text-sm"
            >
              📄 JSON Workflow
            </button>
            <button
              onClick={() => handleQuickExport('python')}
              className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded text-sm"
            >
              🐍 Python Script
            </button>
            <button
              onClick={() => handleQuickExport('rust')}
              className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded text-sm"
            >
              🦀 Rust Code
            </button>
            <hr className="border-gray-600 my-2" />
            <button
              onClick={() => setShowExportPanel(true)}
              className="w-full text-left px-3 py-2 text-blue-400 hover:bg-gray-700 rounded text-sm"
            >
              ⚙️ Advanced Export...
            </button>
          </div>
        </div>
      </div>

      <ExportPanel
        workflow={createWorkflow()}
        isOpen={showExportPanel}
        onClose={() => setShowExportPanel(false)}
      />
    </>
  );
};

export default ExportButton;