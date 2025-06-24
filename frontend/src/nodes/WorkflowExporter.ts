// Workflow exporter for AgentBlocks - exports to multiple formats

import { PythonNodeGenerator } from './generators/PythonNodeGenerator';
import { RustNodeGenerator } from './generators/RustNodeGenerator';
import type { WorkflowNode, Connection, WorkflowPanel as Panel } from '../types';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  created: string;
  modified: string;
  nodes: WorkflowNode[];
  connections: Connection[];
  panels: Panel[];
  metadata?: Record<string, any>;
}

export type ExportFormat = 'json' | 'python' | 'rust';

export class WorkflowExporter {
  private pythonGenerator = new PythonNodeGenerator();
  private rustGenerator = new RustNodeGenerator();

  /**
   * Export workflow to the specified format
   */
  exportWorkflow(workflow: Workflow, format: ExportFormat): string {
    switch (format) {
      case 'json':
        return this.exportToJSON(workflow);
      case 'python':
        return this.exportToPython(workflow);
      case 'rust':
        return this.exportToRust(workflow);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export workflow as JSON for storage/loading
   */
  private exportToJSON(workflow: Workflow): string {
    // Clean up the workflow object for export
    const cleanWorkflow = {
      ...workflow,
      nodes: workflow.nodes.map(node => ({
        id: node.id,
        type: node.type,
        properties: node.properties,
        position: node.position,
        panelId: node.panelId
      })),
      connections: workflow.connections.map(conn => ({
        id: conn.id,
        sourceNodeId: conn.source_node,
        sourceOutput: conn.source_output,
        targetNodeId: conn.target_node,
        targetInput: conn.target_input
      })),
      panels: workflow.panels.map(panel => ({
        id: panel.id,
        name: panel.name,
        type: panel.type,
        position: panel.position
      }))
    };

    return JSON.stringify(cleanWorkflow, null, 2);
  }

  /**
   * Export workflow as executable Python code
   */
  private exportToPython(workflow: Workflow): string {
    const header = this.generatePythonHeader(workflow);
    const code = this.pythonGenerator.generateWorkflowCode(workflow.nodes, workflow.connections);
    
    return `${header}\n\n${code}`;
  }

  /**
   * Export workflow as executable Rust code
   */
  private exportToRust(workflow: Workflow): string {
    const header = this.generateRustHeader(workflow);
    const code = this.rustGenerator.generateWorkflowCode(workflow.nodes, workflow.connections);
    
    return `${header}\n\n${code}`;
  }

  /**
   * Generate Python header with metadata
   */
  private generatePythonHeader(workflow: Workflow): string {
    return `#!/usr/bin/env python3
\"\"\"
Generated AgentBlocks Workflow: ${workflow.name}
Description: ${workflow.description}
Generated: ${new Date().toISOString()}
AgentBlocks Version: ${workflow.version || '1.0'}

Nodes: ${workflow.nodes.length}
Connections: ${workflow.connections.length}
Panels: ${workflow.panels.length}
\"\"\"`;
  }

  /**
   * Generate Rust header with metadata and Cargo.toml dependencies
   */
  private generateRustHeader(workflow: Workflow): string {
    const cargoToml = `// Add these dependencies to your Cargo.toml:
//
// [dependencies]
// regex = "1.0"
// serde_json = "1.0"
// walkdir = "2.0"
// serde = { version = "1.0", features = ["derive"] }

/*
Generated AgentBlocks Workflow: ${workflow.name}
Description: ${workflow.description}
Generated: ${new Date().toISOString()}
AgentBlocks Version: ${workflow.version || '1.0'}

Nodes: ${workflow.nodes.length}
Connections: ${workflow.connections.length}
Panels: ${workflow.panels.length}
*/`;

    return cargoToml;
  }

  /**
   * Generate download filename for the export
   */
  getExportFilename(workflow: Workflow, format: ExportFormat): string {
    const safeName = workflow.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const timestamp = new Date().toISOString().slice(0, 10);
    
    switch (format) {
      case 'json':
        return `${safeName}_${timestamp}.json`;
      case 'python':
        return `${safeName}_${timestamp}.py`;
      case 'rust':
        return `${safeName}_${timestamp}.rs`;
      default:
        return `${safeName}_${timestamp}.txt`;
    }
  }

  /**
   * Get MIME type for the export format
   */
  getExportMimeType(format: ExportFormat): string {
    switch (format) {
      case 'json':
        return 'application/json';
      case 'python':
        return 'text/x-python';
      case 'rust':
        return 'text/x-rust';
      default:
        return 'text/plain';
    }
  }

  /**
   * Download the exported workflow
   */
  downloadWorkflow(workflow: Workflow, format: ExportFormat): void {
    const content = this.exportWorkflow(workflow, format);
    const filename = this.getExportFilename(workflow, format);
    const mimeType = this.getExportMimeType(format);

    // Create download link
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  }

  /**
   * Validate workflow before export
   */
  validateWorkflow(workflow: Workflow): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for required fields
    if (!workflow.name?.trim()) {
      errors.push('Workflow name is required');
    }

    if (!workflow.nodes || workflow.nodes.length === 0) {
      errors.push('Workflow must contain at least one node');
    }

    // Validate nodes
    for (const node of workflow.nodes) {
      if (!node.id || !node.type) {
        errors.push(`Invalid node: missing id or type`);
      }
    }

    // Validate connections
    const nodeIds = new Set(workflow.nodes.map(n => n.id));
    for (const connection of workflow.connections || []) {
      if (!nodeIds.has(connection.source_node)) {
        errors.push(`Connection references invalid source node: ${connection.source_node}`);
      }
      if (!nodeIds.has(connection.target_node)) {
        errors.push(`Connection references invalid target node: ${connection.target_node}`);
      }
    }

    // Check for circular dependencies
    if (this.hasCircularDependencies(workflow.nodes, workflow.connections || [])) {
      errors.push('Workflow contains circular dependencies');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Check for circular dependencies in the workflow
   */
  private hasCircularDependencies(nodes: WorkflowNode[], connections: Connection[]): boolean {
    const graph = new Map<string, string[]>();
    
    // Build adjacency list
    for (const node of nodes) {
      graph.set(node.id, []);
    }
    
    for (const conn of connections) {
      graph.get(conn.source_node)?.push(conn.target_node);
    }

    // DFS to detect cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      for (const neighbor of graph.get(nodeId) || []) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of graph.keys()) {
      if (!visited.has(nodeId)) {
        if (hasCycle(nodeId)) return true;
      }
    }

    return false;
  }

  /**
   * Get workflow statistics
   */
  getWorkflowStats(workflow: Workflow): {
    nodeCount: number;
    connectionCount: number;
    panelCount: number;
    nodeTypes: Record<string, number>;
    complexity: 'simple' | 'moderate' | 'complex';
  } {
    const nodeTypes: Record<string, number> = {};
    
    for (const node of workflow.nodes) {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
    }

    const nodeCount = workflow.nodes.length;
    const connectionCount = workflow.connections?.length || 0;
    const panelCount = workflow.panels?.length || 0;

    // Determine complexity
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (nodeCount > 20 || connectionCount > 30 || panelCount > 5) {
      complexity = 'complex';
    } else if (nodeCount > 10 || connectionCount > 15 || panelCount > 2) {
      complexity = 'moderate';
    }

    return {
      nodeCount,
      connectionCount,
      panelCount,
      nodeTypes,
      complexity
    };
  }
}