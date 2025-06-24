// Python code generator for AgentBlocks nodes
import type { WorkflowNode, Connection } from '../../types';

export class PythonNodeGenerator {
  private imports: Set<string> = new Set();
  private variables: Map<string, string> = new Map();

  generateWorkflowCode(nodes: WorkflowNode[], connections: Connection[]): string {
    console.log('PythonNodeGenerator.generateWorkflowCode called with:', nodes.length, 'nodes');
    this.imports.clear();
    this.variables.clear();

    // Add standard imports
    this.imports.add('import re');
    this.imports.add('import os');
    this.imports.add('import json');
    this.imports.add('from typing import Dict, List, Any, Optional');

    let code = '';
    
    // Handle empty workflow
    if (nodes.length === 0) {
      code = '# No nodes in workflow\nprint("Empty workflow - add some nodes to generate code")\n';
    } else {
      // Only include top-level nodes (nodes without parentId) in the main execution order
      const topLevelNodes = nodes.filter(n => !n.parentId);
      const executionOrder = this.getExecutionOrder(topLevelNodes, connections);
      console.log('Top-level execution order:', executionOrder.map(n => `${n.type}:${n.id}`));
      
      for (const node of executionOrder) {
        code += this.generateNodeCode(node, connections, nodes);
        code += '\n';
      }
    }

    // Combine imports and code
    const importsCode = Array.from(this.imports).join('\n');
    const result = `${importsCode}\n\n# Generated workflow code\n\n${code}`;
    console.log('Generated Python code result length:', result.length);
    return result;
  }

  private generateNodeCode(node: WorkflowNode, connections: Connection[], allNodes?: WorkflowNode[]): string {
    switch (node.type) {
      case 'grep':
        return this.generateGrepNode(node, connections);
      case 'variable':
        return this.generateVariableNode(node);
      case 'print':
        return this.generatePrintNode(node, connections);
      case 'pycode':
        return this.generatePyCodeNode(node, connections);
      case 'bash':
      case 'shell_command':
        return this.generateBashNode(node, connections);
      case 'curl':
      case 'http_request':
        return this.generateHttpRequestNode(node, connections);
      case 'read_file':
        return this.generateReadFileNode(node, connections);
      case 'write_file':
        return this.generateWriteFileNode(node, connections);
      case 'if-then':
        return this.generateIfThenNode(node, connections);
      case 'foreach':
        return this.generateForeachNode(node, connections);
      case 'while':
        return this.generateWhileNode(node, connections);
      case 'function':
        return this.generateFunctionNode(node, connections, allNodes || []);
      default:
        return `# Unsupported node type: ${node.type}\n# Node ID: ${node.id}\n# Properties: ${JSON.stringify(node.properties, null, 2)}\n`;
    }
  }

  private generateGrepNode(node: WorkflowNode, connections: Connection[]): string {
    const props = node.properties;
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    this.imports.add('import glob');
    this.imports.add('from dataclasses import dataclass');
    
    // Get input connections
    const inputConnections = connections.filter(c => c.target_node === node.id);
    const textInput = inputConnections.find(c => c.target_input === 'text_input');
    const inputVar = textInput ? this.variables.get(textInput.source_node) : 'None';

    let code = `# Grep node: ${node.id}\n`;
    
    // Generate grep configuration
    code += `${nodeVar}_config = {\n`;
    code += `    'pattern': ${JSON.stringify(props.pattern || '')},\n`;
    code += `    'input_source': ${JSON.stringify(props.input_source || 'input')},\n`;
    code += `    'file_path': ${JSON.stringify(props.file_path || '')},\n`;
    code += `    'case_insensitive': ${props.case_insensitive || false},\n`;
    code += `    'whole_words': ${props.whole_words || false},\n`;
    code += `    'invert_match': ${props.invert_match || false},\n`;
    code += `    'line_numbers': ${props.line_numbers || false},\n`;
    code += `    'count_only': ${props.count_only || false},\n`;
    code += `    'max_count': ${props.max_count || 0} if ${props.max_count || 0} > 0 else None,\n`;
    code += `    'context_before': ${props.context_before || 0},\n`;
    code += `    'context_after': ${props.context_after || 0},\n`;
    code += `    'recursive': ${props.recursive || false},\n`;
    code += `    'file_pattern': ${JSON.stringify(props.file_pattern || '*')}\n`;
    code += `}\n\n`;

    // Generate grep execution function
    code += `def execute_grep_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}(config, text_input=None):\n`;
    code += `    """Execute grep operation with given configuration"""\n`;
    code += `    \n`;
    code += `    # Compile regex pattern\n`;
    code += `    flags = re.IGNORECASE if config['case_insensitive'] else 0\n`;
    code += `    pattern = config['pattern']\n`;
    code += `    if config['whole_words']:\n`;
    code += `        pattern = rf'\\b{re.escape(pattern)}\\b'\n`;
    code += `    \n`;
    code += `    try:\n`;
    code += `        regex = re.compile(pattern, flags)\n`;
    code += `    except re.error as e:\n`;
    code += `        return {'matches': [], 'match_count': 0, 'success': False, 'error': f'Invalid regex: {e}'}\n`;
    code += `    \n`;
    code += `    matches = []\n`;
    code += `    \n`;
    code += `    def search_text(text, file_path=None):\n`;
    code += `        nonlocal matches\n`;
    code += `        lines = text.split('\\n')\n`;
    code += `        \n`;
    code += `        for i, line in enumerate(lines, 1):\n`;
    code += `            is_match = bool(regex.search(line))\n`;
    code += `            if config['invert_match']:\n`;
    code += `                is_match = not is_match\n`;
    code += `            \n`;
    code += `            if is_match:\n`;
    code += `                match_data = {\n`;
    code += `                    'line_content': line,\n`;
    code += `                    'line_number': i if config['line_numbers'] else None,\n`;
    code += `                    'file_path': file_path\n`;
    code += `                }\n`;
    code += `                \n`;
    code += `                # Add context lines\n`;
    code += `                if config['context_before'] > 0:\n`;
    code += `                    start = max(0, i - 1 - config['context_before'])\n`;
    code += `                    match_data['context_before'] = lines[start:i-1]\n`;
    code += `                \n`;
    code += `                if config['context_after'] > 0:\n`;
    code += `                    end = min(len(lines), i + config['context_after'])\n`;
    code += `                    match_data['context_after'] = lines[i:end]\n`;
    code += `                \n`;
    code += `                matches.append(match_data)\n`;
    code += `                \n`;
    code += `                # Check max count limit\n`;
    code += `                if config['max_count'] and len(matches) >= config['max_count']:\n`;
    code += `                    break\n`;
    code += `    \n`;
    code += `    try:\n`;
    code += `        if config['input_source'] == 'input' and text_input:\n`;
    code += `            search_text(text_input)\n`;
    code += `        elif config['input_source'] == 'file':\n`;
    code += `            file_path = config['file_path']\n`;
    code += `            if config['recursive']:\n`;
    code += `                pattern = os.path.join(file_path, '**', config['file_pattern'])\n`;
    code += `                for file in glob.glob(pattern, recursive=True):\n`;
    code += `                    if os.path.isfile(file):\n`;
    code += `                        try:\n`;
    code += `                            with open(file, 'r', encoding='utf-8', errors='ignore') as f:\n`;
    code += `                                search_text(f.read(), file)\n`;
    code += `                        except IOError:\n`;
    code += `                            continue\n`;
    code += `            else:\n`;
    code += `                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:\n`;
    code += `                    search_text(f.read(), file_path)\n`;
    code += `        \n`;
    code += `        result = {\n`;
    code += `            'match_count': len(matches),\n`;
    code += `            'success': True\n`;
    code += `        }\n`;
    code += `        \n`;
    code += `        if config['count_only']:\n`;
    code += `            result['matches'] = []\n`;
    code += `        else:\n`;
    code += `            result['matches'] = matches\n`;
    code += `        \n`;
    code += `        return result\n`;
    code += `        \n`;
    code += `    except Exception as e:\n`;
    code += `        return {'matches': [], 'match_count': 0, 'success': False, 'error': str(e)}\n`;
    code += `\n`;

    // Execute the function
    code += `${nodeVar}_result = execute_grep_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}(${nodeVar}_config, ${inputVar || 'None'})\n`;
    code += `${nodeVar}_matches = ${nodeVar}_result['matches']\n`;
    code += `${nodeVar}_match_count = ${nodeVar}_result['match_count']\n`;
    code += `${nodeVar}_success = ${nodeVar}_result['success']\n`;

    // Store variables for output connections
    this.variables.set(`${node.id}_matches`, `${nodeVar}_matches`);
    this.variables.set(`${node.id}_match_count`, `${nodeVar}_match_count`);
    this.variables.set(`${node.id}_success`, `${nodeVar}_success`);

    return code;
  }

  private generateVariableNode(node: WorkflowNode): string {
    const props = node.properties;
    const varName = props.name || `var_${node.id}`;
    const value = props.value || '';
    
    // Format the value based on its type
    let formattedValue: string;
    if (value === '') {
      formattedValue = 'None';
    } else if (value === 'true' || value === 'false') {
      // Boolean values
      formattedValue = value === 'true' ? 'True' : 'False';
    } else if (!isNaN(Number(value)) && value.trim() !== '') {
      // Numeric values (integers or floats)
      formattedValue = value;
    } else {
      // String values
      formattedValue = JSON.stringify(value);
    }
    
    const code = `# Variable node: ${node.id}\n${varName} = ${formattedValue}\n`;
    
    this.variables.set(node.id, varName);
    return code;
  }

  private generatePrintNode(node: WorkflowNode, connections: Connection[]): string {
    const props = node.properties;
    const message = props.message || '';
    
    // Check if message is connected to another node's output
    const inputConnection = connections.find(c => 
      c.target_node === node.id && c.target_input === 'message'
    );
    
    let printVar = '';
    if (inputConnection) {
      const sourceVar = this.variables.get(`${inputConnection.source_node}_${inputConnection.source_output}`);
      printVar = sourceVar || this.formatStringForPrint(message);
    } else if (this.variables.has(message)) {
      printVar = this.variables.get(message)!;
    } else {
      printVar = this.formatStringForPrint(message);
    }
    
    return `# Print node: ${node.id}\nprint(${printVar})\n`;
  }

  private formatStringForPrint(text: string): string {
    if (!text) return '""';
    
    // Check if it's already an f-string
    if (text.startsWith('f"') && text.endsWith('"')) {
      return text;
    }
    
    // Check if text contains variable references like {variable}
    const variablePattern = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/;
    if (variablePattern.test(text)) {
      return `f"${text}"`;
    }
    
    // Regular string
    return `"${text}"`;
  }

  private generatePyCodeNode(node: WorkflowNode, connections: Connection[]): string {
    const props = node.properties;
    const code = props.code || '# No code provided';
    
    return `# PyCode node: ${node.id}\n${code}\n`;
  }

  private generateBashNode(node: WorkflowNode, connections: Connection[]): string {
    const props = node.properties;
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    this.imports.add('import subprocess');
    
    const command = props.command || 'echo "No command specified"';
    const workingDir = props.working_directory || '';
    
    let code = `# Bash node: ${node.id}\n`;
    code += `${nodeVar}_command = ${JSON.stringify(command)}\n`;
    
    if (workingDir) {
      code += `${nodeVar}_cwd = ${JSON.stringify(workingDir)}\n`;
      code += `${nodeVar}_result = subprocess.run(${nodeVar}_command, shell=True, capture_output=True, text=True, cwd=${nodeVar}_cwd)\n`;
    } else {
      code += `${nodeVar}_result = subprocess.run(${nodeVar}_command, shell=True, capture_output=True, text=True)\n`;
    }
    
    code += `${nodeVar}_stdout = ${nodeVar}_result.stdout\n`;
    code += `${nodeVar}_stderr = ${nodeVar}_result.stderr\n`;
    code += `${nodeVar}_exit_code = ${nodeVar}_result.returncode\n`;
    
    this.variables.set(`${node.id}_stdout`, `${nodeVar}_stdout`);
    this.variables.set(`${node.id}_stderr`, `${nodeVar}_stderr`);
    this.variables.set(`${node.id}_exit_code`, `${nodeVar}_exit_code`);
    
    return code;
  }

  private generateHttpRequestNode(node: WorkflowNode, connections: Connection[]): string {
    const props = node.properties;
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    this.imports.add('import requests');
    this.imports.add('import json');
    
    const url = props.url || 'https://httpbin.org/get';
    const method = props.method || 'GET';
    const headers = props.headers || '{}';
    const body = props.body || '';
    
    let code = `# HTTP Request node: ${node.id}\n`;
    code += `${nodeVar}_url = ${JSON.stringify(url)}\n`;
    code += `${nodeVar}_method = ${JSON.stringify(method)}\n`;
    code += `${nodeVar}_headers = ${headers}\n`;
    
    if (body && method !== 'GET') {
      code += `${nodeVar}_body = ${JSON.stringify(body)}\n`;
      code += `${nodeVar}_response = requests.request(${nodeVar}_method, ${nodeVar}_url, headers=${nodeVar}_headers, data=${nodeVar}_body)\n`;
    } else {
      code += `${nodeVar}_response = requests.request(${nodeVar}_method, ${nodeVar}_url, headers=${nodeVar}_headers)\n`;
    }
    
    code += `${nodeVar}_status_code = ${nodeVar}_response.status_code\n`;
    code += `${nodeVar}_text = ${nodeVar}_response.text\n`;
    code += `try:\n`;
    code += `    ${nodeVar}_json = ${nodeVar}_response.json()\n`;
    code += `except:\n`;
    code += `    ${nodeVar}_json = None\n`;
    
    this.variables.set(`${node.id}_response`, `${nodeVar}_response`);
    this.variables.set(`${node.id}_status_code`, `${nodeVar}_status_code`);
    this.variables.set(`${node.id}_text`, `${nodeVar}_text`);
    this.variables.set(`${node.id}_json`, `${nodeVar}_json`);
    
    return code;
  }

  private generateReadFileNode(node: WorkflowNode, connections: Connection[]): string {
    const props = node.properties;
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    const filePath = props.file_path || 'input.txt';
    const encoding = props.encoding || 'utf-8';
    
    let code = `# Read File node: ${node.id}\n`;
    code += `${nodeVar}_path = ${JSON.stringify(filePath)}\n`;
    code += `try:\n`;
    code += `    with open(${nodeVar}_path, 'r', encoding='${encoding}') as f:\n`;
    code += `        ${nodeVar}_content = f.read()\n`;
    code += `    ${nodeVar}_success = True\n`;
    code += `    ${nodeVar}_error = None\n`;
    code += `except Exception as e:\n`;
    code += `    ${nodeVar}_content = ''\n`;
    code += `    ${nodeVar}_success = False\n`;
    code += `    ${nodeVar}_error = str(e)\n`;
    
    this.variables.set(`${node.id}_content`, `${nodeVar}_content`);
    this.variables.set(`${node.id}_success`, `${nodeVar}_success`);
    this.variables.set(`${node.id}_error`, `${nodeVar}_error`);
    
    return code;
  }

  private generateWriteFileNode(node: WorkflowNode, connections: Connection[]): string {
    const props = node.properties;
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    const filePath = props.file_path || 'output.txt';
    const content = props.content || '';
    const encoding = props.encoding || 'utf-8';
    const mode = props.mode || 'write'; // 'write' or 'append'
    
    // Check for input connections
    const inputConnection = connections.find(c => 
      c.target_node === node.id && c.target_input === 'content'
    );
    
    let contentVar = JSON.stringify(content);
    if (inputConnection) {
      const sourceVar = this.variables.get(`${inputConnection.source_node}_${inputConnection.source_output}`);
      contentVar = sourceVar || JSON.stringify(content);
    }
    
    let code = `# Write File node: ${node.id}\n`;
    code += `${nodeVar}_path = ${JSON.stringify(filePath)}\n`;
    code += `${nodeVar}_content = ${contentVar}\n`;
    code += `try:\n`;
    
    const fileMode = mode === 'append' ? 'a' : 'w';
    code += `    with open(${nodeVar}_path, '${fileMode}', encoding='${encoding}') as f:\n`;
    code += `        f.write(str(${nodeVar}_content))\n`;
    code += `    ${nodeVar}_success = True\n`;
    code += `    ${nodeVar}_error = None\n`;
    code += `except Exception as e:\n`;
    code += `    ${nodeVar}_success = False\n`;
    code += `    ${nodeVar}_error = str(e)\n`;
    
    this.variables.set(`${node.id}_success`, `${nodeVar}_success`);
    this.variables.set(`${node.id}_error`, `${nodeVar}_error`);
    
    return code;
  }

  private generateIfThenNode(node: WorkflowNode, connections: Connection[]): string {
    const props = node.properties;
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    const condition = props.condition || 'True';
    
    // Get condition input connection
    const conditionConnection = connections.find(c => 
      c.target_node === node.id && c.target_input === 'condition'
    );
    
    let conditionVar = condition;
    if (conditionConnection) {
      const sourceVar = this.variables.get(`${conditionConnection.source_node}_${conditionConnection.source_output}`);
      conditionVar = sourceVar || condition;
    }
    
    let code = `# If-Then node: ${node.id}\n`;
    code += `${nodeVar}_condition = ${conditionVar}\n`;
    code += `if ${nodeVar}_condition:\n`;
    code += `    # Then branch - connect nodes to execute here\n`;
    code += `    ${nodeVar}_result = True\n`;
    code += `else:\n`;
    code += `    # Else branch\n`;
    code += `    ${nodeVar}_result = False\n`;
    
    this.variables.set(`${node.id}_result`, `${nodeVar}_result`);
    
    return code;
  }

  private generateForeachNode(node: WorkflowNode, connections: Connection[]): string {
    const props = node.properties;
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    const iterable = props.iterable || '[]';
    const itemVar = props.item_variable || 'item';
    
    // Get iterable input connection
    const iterableConnection = connections.find(c => 
      c.target_node === node.id && c.target_input === 'iterable'
    );
    
    let iterableVar = iterable;
    if (iterableConnection) {
      const sourceVar = this.variables.get(`${iterableConnection.source_node}_${iterableConnection.source_output}`);
      iterableVar = sourceVar || iterable;
    }
    
    let code = `# ForEach node: ${node.id}\n`;
    code += `${nodeVar}_iterable = ${iterableVar}\n`;
    code += `${nodeVar}_results = []\n`;
    code += `for ${itemVar} in ${nodeVar}_iterable:\n`;
    code += `    # Loop body - connect nodes to execute here\n`;
    code += `    ${nodeVar}_results.append(${itemVar})\n`;
    
    this.variables.set(`${node.id}_results`, `${nodeVar}_results`);
    this.variables.set(`${node.id}_current_item`, itemVar);
    
    return code;
  }

  private generateWhileNode(node: WorkflowNode, connections: Connection[]): string {
    const props = node.properties;
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    const condition = props.condition || 'False';
    const maxIterations = props.max_iterations || 100;
    
    let code = `# While node: ${node.id}\n`;
    code += `${nodeVar}_iterations = 0\n`;
    code += `${nodeVar}_max_iterations = ${maxIterations}\n`;
    code += `while ${condition} and ${nodeVar}_iterations < ${nodeVar}_max_iterations:\n`;
    code += `    # Loop body - connect nodes to execute here\n`;
    code += `    ${nodeVar}_iterations += 1\n`;
    code += `    # Update condition variable here\n`;
    code += `    break  # Prevent infinite loop in generated code\n`;
    
    this.variables.set(`${node.id}_iterations`, `${nodeVar}_iterations`);
    
    return code;
  }

  private generateFunctionNode(node: WorkflowNode, connections: Connection[], allNodes: WorkflowNode[]): string {
    const props = node.properties;
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    const functionName = props.function_name || `function_${node.id}`;
    const parameters = props.parameters || '';
    const returnType = props.return_type || 'Any';
    
    // Find all child nodes of this function
    const childNodes = allNodes.filter(n => n.parentId === node.id);
    const childExecutionOrder = this.getExecutionOrder(childNodes, connections);
    
    let code = `# Function node: ${node.id}\n`;
    code += `def ${functionName}(${parameters}):\n`;
    code += `    """Generated function from node ${node.id}"""\n`;
    
    if (childNodes.length > 0) {
      // Generate code for child nodes inside the function
      for (const childNode of childExecutionOrder) {
        const childCode = this.generateNodeCode(childNode, connections);
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