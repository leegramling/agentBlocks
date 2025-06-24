// Template-based code generator for AgentBlocks nodes
import type { WorkflowNode, Connection } from '../../types';
import NodeDefinitionProvider from '../NodeDefinitionProvider';

interface NodeDefinition {
  type: string;
  name: string;
  category: string;
  version: string;
  description: string;
  icon: string;
  color: string;
  properties: Record<string, any>;
  inputs: any[];
  outputs: any[];
  codeGeneration?: {
    python?: {
      imports: string[];
      template: string;
      functions: string[];
    };
    rust?: {
      imports: string[];
      structs: string[];
      template: string;
      functions: string[];
    };
  };
}

export class TemplateBasedPythonGenerator {
  private imports: Set<string> = new Set();
  private variables: Map<string, string> = new Map();
  private functionHelpers: Set<string> = new Set();
  private definitionProvider: NodeDefinitionProvider;

  constructor() {
    this.definitionProvider = NodeDefinitionProvider.getInstance();
  }

  generateWorkflowCode(nodes: WorkflowNode[], connections: Connection[]): string {
    this.imports.clear();
    this.variables.clear();
    this.functionHelpers.clear();

    // Add standard imports
    this.imports.add('import re');
    this.imports.add('import os');
    this.imports.add('import json');
    this.imports.add('from typing import Dict, List, Any, Optional');

    let code = '';
    
    if (nodes.length === 0) {
      code = '# No nodes in workflow\nprint("Empty workflow - add some nodes to generate code")\n';
    } else {
      // Only include top-level nodes (nodes without parentId) in the main execution order
      const topLevelNodes = nodes.filter(n => !n.parentId);
      const executionOrder = this.getExecutionOrder(topLevelNodes, connections);
      
      for (const node of executionOrder) {
        code += this.generateNodeCode(node, connections, nodes);
        code += '\n';
      }
    }

    // Generate helper functions
    code += this.generateHelperFunctions();

    // Combine imports and code
    const importsCode = Array.from(this.imports).join('\n');
    const result = `${importsCode}\n\n# Generated workflow code\n\n${code}`;
    return result;
  }

  private generateNodeCode(node: WorkflowNode, connections: Connection[], allNodes?: WorkflowNode[]): string {
    const definition = this.getNodeDefinition(node.type);
    if (!definition?.codeGeneration?.python) {
      return `# Unsupported node type: ${node.type}\n# Node ID: ${node.id}\n`;
    }

    // Handle function nodes specially (with child nodes)
    if (node.type === 'function') {
      return this.generateFunctionNode(node, connections, allNodes || []);
    }

    const template = definition.codeGeneration.python.template;
    const context = this.buildTemplateContext(node, connections, definition);
    
    // Add imports and functions from this node
    definition.codeGeneration.python.imports.forEach(imp => this.imports.add(imp));
    definition.codeGeneration.python.functions.forEach(func => this.functionHelpers.add(func));
    
    return this.processTemplate(template, context);
  }

  private generateFunctionNode(node: WorkflowNode, connections: Connection[], allNodes: WorkflowNode[]): string {
    const props = node.properties;
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    const functionName = props.function_name || `function_${node.id}`;
    const parameters = props.parameters || '';
    
    // Find all child nodes of this function
    const childNodes = allNodes.filter(n => n.parentId === node.id);
    const childExecutionOrder = this.getExecutionOrder(childNodes, connections);
    
    let code = `# Function node: ${node.id}\n`;
    code += `def ${functionName}(${parameters}):\n`;
    code += `    """Generated function from node ${node.id}"""\n`;
    
    if (childNodes.length > 0) {
      // Generate code for child nodes inside the function
      for (const childNode of childExecutionOrder) {
        const childCode = this.generateNodeCode(childNode, connections, allNodes);
        // Indent the child code to be inside the function
        const indentedCode = childCode.split('\n').map(line => 
          line.trim() ? `    ${line}` : line
        ).join('\n');
        code += indentedCode;
      }
    } else {
      code += `    # Function body - connect nodes to execute here\n`;
    }
    
    code += `    return None\n\n`;
    
    // Call the function
    code += `${nodeVar}_result = ${functionName}()\n`;
    
    this.variables.set(`${node.id}_result`, `${nodeVar}_result`);
    
    return code;
  }

  private buildTemplateContext(node: WorkflowNode, connections: Connection[], definition: NodeDefinition): Record<string, any> {
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Build context with node properties and helper functions
    const context: Record<string, any> = {
      nodeId: node.id,
      nodeVar,
      sanitizedNodeId,
      ...node.properties,
      // Helper functions for templates
      formatValue: this.formatPythonValue(node.properties.value, node.properties.type),
      formatMessage: this.formatPythonMessage(node.properties.message, connections, node.id),
      quote: (value: string) => JSON.stringify(value),
      inputVar: this.getInputVariable(node, connections) || 'None'
    };

    // Add node-specific context values
    if (node.type === 'variable') {
      const varName = node.properties.name || `var_${node.id}`;
      context.varName = varName;
      this.variables.set(node.id, varName);
    }

    return context;
  }

  private formatPythonValue(value: string, type?: string): string {
    if (!value) return 'None';
    
    if (type === 'boolean' || value === 'true' || value === 'false') {
      return value === 'true' ? 'True' : 'False';
    } else if (type === 'number' || (!isNaN(Number(value)) && value.trim() !== '')) {
      return value;
    } else {
      return JSON.stringify(value);
    }
  }

  private formatPythonMessage(message: string, connections: Connection[], nodeId: string): string {
    if (!message) return '""';
    
    // Check if message is connected to another node's output
    const inputConnection = connections.find(c => 
      c.target_node === nodeId && c.target_input === 'message'
    );
    
    if (inputConnection) {
      const sourceVar = this.variables.get(`${inputConnection.source_node}_${inputConnection.source_output}`);
      if (sourceVar) return sourceVar;
    }
    
    // Check if it's already an f-string
    if (message.startsWith('f"') && message.endsWith('"')) {
      return message;
    }
    
    // Check if text contains variable references like {variable}
    const variablePattern = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/;
    if (variablePattern.test(message)) {
      return `f"${message}"`;
    }
    
    // Regular string
    return JSON.stringify(message);
  }

  private getInputVariable(node: WorkflowNode, connections: Connection[]): string | null {
    const inputConnection = connections.find(c => c.target_node === node.id);
    if (inputConnection) {
      return this.variables.get(`${inputConnection.source_node}_${inputConnection.source_output}`) || null;
    }
    return null;
  }

  private processTemplate(template: string, context: Record<string, any>): string {
    let result = template;
    
    // Simple template processing - replace {{variable}} with context values
    // This is a basic implementation - in production you'd use a proper template engine
    for (const [key, value] of Object.entries(context)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
    
    // Handle helper function calls like {{quote pattern}}
    result = result.replace(/\{\{(\w+)\s+(\w+)\}\}/g, (match, funcName, propName) => {
      if (context[funcName] && typeof context[funcName] === 'function') {
        return context[funcName](context[propName]);
      }
      return match;
    });
    
    return result;
  }

  private generateHelperFunctions(): string {
    let functions = '';
    
    if (this.functionHelpers.has('grep_helpers')) {
      functions += `\n# Grep helper functions\ndef execute_grep_function(config, input_text):\n    # Implementation of grep functionality\n    pass\n`;
    }
    
    return functions;
  }

  private getNodeDefinition(type: string): NodeDefinition | null {
    return this.definitionProvider.getDefinition(type);
  }

  private getExecutionOrder(nodes: WorkflowNode[], connections: Connection[]): WorkflowNode[] {
    // Simple topological sort based on connections
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const inDegree = new Map(nodes.map(n => [n.id, 0]));
    const adjList = new Map(nodes.map(n => [n.id, [] as string[]]));
    
    // Build graph
    for (const conn of connections) {
      adjList.get(conn.source_node)?.push(conn.target_node);
      inDegree.set(conn.target_node, (inDegree.get(conn.target_node) || 0) + 1);
    }
    
    // Topological sort
    const queue = nodes.filter(n => inDegree.get(n.id) === 0);
    const result: WorkflowNode[] = [];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);
      
      for (const neighborId of adjList.get(current.id) || []) {
        const newInDegree = (inDegree.get(neighborId) || 0) - 1;
        inDegree.set(neighborId, newInDegree);
        
        if (newInDegree === 0) {
          const neighbor = nodeMap.get(neighborId);
          if (neighbor) queue.push(neighbor);
        }
      }
    }
    
    return result;
  }
}

export class TemplateBasedRustGenerator {
  private imports: Set<string> = new Set();
  private structs: Set<string> = new Set();
  private variables: Map<string, string> = new Map();
  private functionHelpers: Set<string> = new Set();
  private definitionProvider: NodeDefinitionProvider;

  constructor() {
    this.definitionProvider = NodeDefinitionProvider.getInstance();
  }

  generateWorkflowCode(nodes: WorkflowNode[], connections: Connection[]): string {
    this.imports.clear();
    this.structs.clear();
    this.variables.clear();
    this.functionHelpers.clear();

    // Add standard imports
    this.imports.add('use std::collections::HashMap;');
    this.imports.add('use std::fs;');
    this.imports.add('use std::process::Command;');
    this.imports.add('use std::io::Write;');

    let code = '';
    
    // Generate main function
    code += 'fn main() -> Result<(), Box<dyn std::error::Error>> {\n';
    
    if (nodes.length === 0) {
      code += '    // No nodes in workflow\n';
      code += '    println!("Empty workflow - add some nodes to generate code");\n';
    } else {
      // Only include top-level nodes (nodes without parentId) in the main execution order
      const topLevelNodes = nodes.filter(n => !n.parentId);
      const executionOrder = this.getExecutionOrder(topLevelNodes, connections);
      
      for (const node of executionOrder) {
        const nodeCode = this.generateNodeCode(node, connections, nodes);
        code += this.indent(nodeCode, 1);
      }
    }
    
    code += '\n    Ok(())\n';
    code += '}\n\n';

    // Generate helper functions only if needed
    code += this.generateHelperFunctions();

    // Combine all parts
    const importsCode = Array.from(this.imports).join('\n');
    const structsCode = Array.from(this.structs).join('\n\n');
    
    const result = `${importsCode}\n\n${structsCode ? structsCode + '\n\n' : ''}${code}`;
    return result;
  }

  private generateNodeCode(node: WorkflowNode, connections: Connection[], allNodes?: WorkflowNode[]): string {
    const definition = this.getNodeDefinition(node.type);
    if (!definition?.codeGeneration?.rust) {
      return `// Unsupported node type: ${node.type}\n// Node ID: ${node.id}\n`;
    }

    // Handle function nodes specially
    if (node.type === 'function') {
      return this.generateFunctionNode(node, connections, allNodes || []);
    }

    const template = definition.codeGeneration.rust.template;
    const context = this.buildTemplateContext(node, connections, definition);
    
    // Add imports, structs, and functions from this node
    definition.codeGeneration.rust.imports.forEach(imp => this.imports.add(imp));
    definition.codeGeneration.rust.structs?.forEach(struct => this.addStruct(struct));
    definition.codeGeneration.rust.functions.forEach(func => this.functionHelpers.add(func));
    
    return this.processTemplate(template, context);
  }

  private generateFunctionNode(node: WorkflowNode, connections: Connection[], allNodes: WorkflowNode[]): string {
    const props = node.properties;
    const functionName = props.function_name || `function_${node.id}`;
    const parameters = props.parameters || '';
    
    // Find all child nodes of this function
    const childNodes = allNodes.filter(n => n.parentId === node.id);
    const childExecutionOrder = this.getExecutionOrder(childNodes, connections);
    
    let code = `// Function node: ${node.id}\n`;
    code += `fn ${this.sanitizeIdentifier(functionName)}(${parameters}) {\n`;
    
    if (childNodes.length > 0) {
      // Generate code for child nodes inside the function
      for (const childNode of childExecutionOrder) {
        const childCode = this.generateNodeCode(childNode, connections, allNodes);
        // Indent the child code to be inside the function
        const indentedCode = childCode.split('\n').map(line => 
          line.trim() ? `    ${line}` : line
        ).join('\n');
        code += indentedCode;
      }
    } else {
      code += `    // Function body - connect nodes to execute here\n`;
    }
    
    code += `}\n\n`;
    code += `${this.sanitizeIdentifier(functionName)}();\n`;
    
    return code;
  }

  private buildTemplateContext(node: WorkflowNode, connections: Connection[], definition: NodeDefinition): Record<string, any> {
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
    
    const context: Record<string, any> = {
      nodeId: node.id,
      nodeVar,
      sanitizedNodeId,
      ...node.properties,
      // Helper functions
      formatValue: this.formatRustValue(node.properties.value, node.properties.type),
      formatMessage: this.formatRustMessage(node.properties.message, connections, node.id),
      rustString: (value: string) => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`,
      rustOptional: this.rustOptional.bind(this),
      inputVar: this.getInputVariable(node, connections) || 'String::new()'
    };

    // Add node-specific context values
    if (node.type === 'variable') {
      const varName = this.sanitizeIdentifier(node.properties.name || `var_${node.id}`);
      context.varName = varName;
      this.variables.set(node.id, varName);
    }

    return context;
  }

  private formatRustValue(value: string, type?: string): string {
    if (!value) return 'String::new()';
    
    if (type === 'boolean' || value === 'true' || value === 'false') {
      return value;
    } else if (type === 'number' || (!isNaN(Number(value)) && value.trim() !== '')) {
      if (value.includes('.')) {
        return `${value}f64`;
      } else {
        return `${value}i32`;
      }
    } else {
      return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
  }

  private formatRustMessage(message: string, connections: Connection[], nodeId: string): string {
    if (!message) return '""';
    
    // Check if text contains variable references like {variable}
    const variablePattern = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
    if (variablePattern.test(message)) {
      // Convert to Rust format! macro
      const formattedText = message.replace(variablePattern, '{}');
      const variables = [];
      let match;
      variablePattern.lastIndex = 0;
      while ((match = variablePattern.exec(message)) !== null) {
        variables.push(match[1]);
      }
      
      if (variables.length > 0) {
        return `format!("${formattedText}", ${variables.join(', ')})`;
      }
    }
    
    // Regular string
    return `"${message.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }

  private rustOptional(value: any, type: string): string {
    if (value === null || value === undefined || value === 0) {
      return 'None';
    }
    return `Some(${value}${type === 'usize' ? 'usize' : ''})`;
  }

  private getInputVariable(node: WorkflowNode, connections: Connection[]): string | null {
    const inputConnection = connections.find(c => c.target_node === node.id);
    if (inputConnection) {
      return this.variables.get(`${inputConnection.source_node}_${inputConnection.source_output}`) || null;
    }
    return null;
  }

  private processTemplate(template: string, context: Record<string, any>): string {
    let result = template;
    
    // Simple template processing
    for (const [key, value] of Object.entries(context)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
    
    // Handle helper function calls
    result = result.replace(/\{\{(\w+)\s+(\w+)(?:\s+(\w+))?\}\}/g, (match, funcName, propName, param) => {
      if (context[funcName] && typeof context[funcName] === 'function') {
        return param ? context[funcName](context[propName], param) : context[funcName](context[propName]);
      }
      return match;
    });
    
    return result;
  }

  private addStruct(structName: string): void {
    if (structName === 'GrepMatch') {
      this.structs.add(`#[derive(Debug, Clone)]
struct GrepMatch {
    line_number: Option<usize>,
    line_content: String,
    file_path: Option<String>,
    context_before: Vec<String>,
    context_after: Vec<String>,
}`);
    }
    if (structName === 'GrepResult') {
      this.structs.add(`#[derive(Debug)]
struct GrepResult {
    matches: Vec<GrepMatch>,
    match_count: usize,
    success: bool,
    error: Option<String>,
}`);
    }
  }

  private generateHelperFunctions(): string {
    let functions = '';
    
    if (this.functionHelpers.has('grep_helpers')) {
      functions += `// Grep helper functions\n// Implementation would go here\n`;
    }
    
    return functions;
  }

  private getNodeDefinition(type: string): NodeDefinition | null {
    return this.definitionProvider.getDefinition(type);
  }

  private getExecutionOrder(nodes: WorkflowNode[], connections: Connection[]): WorkflowNode[] {
    // Simple topological sort - same as Python version
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const inDegree = new Map(nodes.map(n => [n.id, 0]));
    const adjList = new Map(nodes.map(n => [n.id, [] as string[]]));
    
    for (const conn of connections) {
      adjList.get(conn.source_node)?.push(conn.target_node);
      inDegree.set(conn.target_node, (inDegree.get(conn.target_node) || 0) + 1);
    }
    
    const queue = nodes.filter(n => inDegree.get(n.id) === 0);
    const result: WorkflowNode[] = [];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);
      
      for (const neighborId of adjList.get(current.id) || []) {
        const newInDegree = (inDegree.get(neighborId) || 0) - 1;
        inDegree.set(neighborId, newInDegree);
        
        if (newInDegree === 0) {
          const neighbor = nodeMap.get(neighborId);
          if (neighbor) queue.push(neighbor);
        }
      }
    }
    
    return result;
  }

  private sanitizeIdentifier(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&');
  }

  private indent(code: string, level: number): string {
    const indentStr = '    '.repeat(level);
    return code.split('\n').map(line => line ? indentStr + line : line).join('\n');
  }
}