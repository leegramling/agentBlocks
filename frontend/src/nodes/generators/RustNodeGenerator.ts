// Rust code generator for AgentBlocks nodes
import type { WorkflowNode, Connection } from '../../types';

export class RustNodeGenerator {
  private imports: Set<string> = new Set();
  private structs: Set<string> = new Set();
  private variables: Map<string, string> = new Map();

  generateWorkflowCode(nodes: WorkflowNode[], connections: Connection[]): string {
    console.log('RustNodeGenerator.generateWorkflowCode called with:', nodes.length, 'nodes');
    this.imports.clear();
    this.structs.clear();
    this.variables.clear();

    // Add standard imports and dependencies
    this.imports.add('use std::collections::HashMap;');
    this.imports.add('use std::fs;');
    this.imports.add('use std::process::Command;');
    this.imports.add('use std::io::Write;');
    this.imports.add('use regex::Regex;');
    this.imports.add('use serde_json::Value;');
    this.imports.add('use walkdir::WalkDir;');
    this.imports.add('use reqwest;');

    let code = '';
    
    // Generate structs for complex data types
    this.generateStructs();
    
    // Generate main function
    code += 'fn main() -> Result<(), Box<dyn std::error::Error>> {\n';
    
    // Handle empty workflow
    if (nodes.length === 0) {
      code += '    // No nodes in workflow\n';
      code += '    println!("Empty workflow - add some nodes to generate code");\n';
    } else {
      // Generate code for each node in execution order
      const executionOrder = this.getExecutionOrder(nodes, connections);
      console.log('Rust execution order:', executionOrder.map(n => `${n.type}:${n.id}`));
      
      for (const node of executionOrder) {
        const nodeCode = this.generateNodeCode(node, connections);
        code += this.indent(nodeCode, 1);
      }
    }
    
    code += '\n    Ok(())\n';
    code += '}\n\n';

    // Generate helper functions
    code += this.generateHelperFunctions();

    // Combine all parts
    const importsCode = Array.from(this.imports).join('\n');
    const structsCode = Array.from(this.structs).join('\n\n');
    
    const result = `${importsCode}\n\n${structsCode}\n\n${code}`;
    console.log('Generated Rust code result length:', result.length);
    return result;
  }

  private generateStructs(): void {
    // GrepMatch struct
    this.structs.add(`#[derive(Debug, Clone)]
struct GrepMatch {
    line_number: Option<usize>,
    line_content: String,
    file_path: Option<String>,
    context_before: Vec<String>,
    context_after: Vec<String>,
}

#[derive(Debug)]
struct GrepResult {
    matches: Vec<GrepMatch>,
    match_count: usize,
    success: bool,
    error: Option<String>,
}`);
  }

  private generateNodeCode(node: WorkflowNode, connections: Connection[]): string {
    switch (node.type) {
      case 'grep':
        return this.generateGrepNode(node, connections);
      case 'variable':
        return this.generateVariableNode(node);
      case 'print':
        return this.generatePrintNode(node, connections);
      case 'pycode':
        return this.generateRustEquivalentNode(node, connections);
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
        return this.generateFunctionNode(node, connections);
      default:
        return `// Unsupported node type: ${node.type}\n// Node ID: ${node.id}\n// Properties: ${JSON.stringify(node.properties, null, 2)}\n`;
    }
  }

  private generateGrepNode(node: WorkflowNode, connections: Connection[]): string {
    const props = node.properties;
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    // Get input connections
    const inputConnections = connections.filter(c => c.target_node === node.id);
    const textInput = inputConnections.find(c => c.target_input === 'text_input');
    const inputVar = textInput ? this.variables.get(textInput.source_node) : 'None';

    let code = `// Grep node: ${node.id}\n`;
    
    // Generate grep configuration
    code += `let ${nodeVar}_pattern = ${this.rustStringLiteral(props.pattern || '')};\n`;
    code += `let ${nodeVar}_case_insensitive = ${props.case_insensitive || false};\n`;
    code += `let ${nodeVar}_whole_words = ${props.whole_words || false};\n`;
    code += `let ${nodeVar}_invert_match = ${props.invert_match || false};\n`;
    code += `let ${nodeVar}_line_numbers = ${props.line_numbers || false};\n`;
    code += `let ${nodeVar}_count_only = ${props.count_only || false};\n`;
    code += `let ${nodeVar}_max_count = ${this.rustOptional(props.max_count, 'usize')};\n`;
    code += `let ${nodeVar}_context_before = ${props.context_before || 0}usize;\n`;
    code += `let ${nodeVar}_context_after = ${props.context_after || 0}usize;\n`;
    code += `let ${nodeVar}_input_source = ${this.rustStringLiteral(props.input_source || 'input')};\n`;
    code += `let ${nodeVar}_file_path = ${this.rustStringLiteral(props.file_path || '')};\n`;
    code += `let ${nodeVar}_recursive = ${props.recursive || false};\n`;
    code += `let ${nodeVar}_file_pattern = ${this.rustStringLiteral(props.file_pattern || '*')};\n`;
    code += '\n';

    // Build regex pattern
    code += `let mut regex_pattern = ${nodeVar}_pattern.clone();\n`;
    code += `if ${nodeVar}_whole_words {\n`;
    code += `    regex_pattern = format!(r"\\b{}\\b", regex::escape(&${nodeVar}_pattern));\n`;
    code += `}\n\n`;

    code += `let mut regex_builder = regex::RegexBuilder::new(&regex_pattern);\n`;
    code += `regex_builder.case_insensitive(${nodeVar}_case_insensitive);\n`;
    code += `let ${nodeVar}_regex = match regex_builder.build() {\n`;
    code += `    Ok(r) => r,\n`;
    code += `    Err(e) => {\n`;
    code += `        eprintln!("Invalid regex pattern: {}", e);\n`;
    code += `        let ${nodeVar}_result = GrepResult {\n`;
    code += `            matches: Vec::new(),\n`;
    code += `            match_count: 0,\n`;
    code += `            success: false,\n`;
    code += `            error: Some(format!("Invalid regex: {}", e)),\n`;
    code += `        };\n`;
    code += `        continue;\n`;
    code += `    }\n`;
    code += `};\n\n`;

    // Execute grep operation
    code += `let ${nodeVar}_result = match ${nodeVar}_input_source.as_str() {\n`;
    code += `    "input" => {\n`;
    if (inputVar && inputVar !== 'None') {
      code += `        execute_grep_on_text(&${nodeVar}_regex, &${inputVar}, None, \n`;
    } else {
      code += `        execute_grep_on_text(&${nodeVar}_regex, "", None, \n`;
    }
    code += `            ${nodeVar}_invert_match, ${nodeVar}_line_numbers, ${nodeVar}_context_before, \n`;
    code += `            ${nodeVar}_context_after, ${nodeVar}_max_count)\n`;
    code += `    },\n`;
    code += `    "file" => {\n`;
    code += `        if ${nodeVar}_recursive {\n`;
    code += `            execute_grep_recursive(&${nodeVar}_regex, &${nodeVar}_file_path, &${nodeVar}_file_pattern,\n`;
    code += `                ${nodeVar}_invert_match, ${nodeVar}_line_numbers, ${nodeVar}_context_before,\n`;
    code += `                ${nodeVar}_context_after, ${nodeVar}_max_count)\n`;
    code += `        } else {\n`;
    code += `            execute_grep_on_file(&${nodeVar}_regex, &${nodeVar}_file_path,\n`;
    code += `                ${nodeVar}_invert_match, ${nodeVar}_line_numbers, ${nodeVar}_context_before,\n`;
    code += `                ${nodeVar}_context_after, ${nodeVar}_max_count)\n`;
    code += `        }\n`;
    code += `    },\n`;
    code += `    _ => GrepResult {\n`;
    code += `        matches: Vec::new(),\n`;
    code += `        match_count: 0,\n`;
    code += `        success: false,\n`;
    code += `        error: Some("Invalid input source".to_string()),\n`;
    code += `    }\n`;
    code += `};\n\n`;

    // Extract results
    code += `let ${nodeVar}_matches = if ${nodeVar}_count_only { Vec::new() } else { ${nodeVar}_result.matches };\n`;
    code += `let ${nodeVar}_match_count = ${nodeVar}_result.match_count;\n`;
    code += `let ${nodeVar}_success = ${nodeVar}_result.success;\n\n`;

    // Store variables for output connections
    this.variables.set(`${node.id}_matches`, `${nodeVar}_matches`);
    this.variables.set(`${node.id}_match_count`, `${nodeVar}_match_count`);
    this.variables.set(`${node.id}_success`, `${nodeVar}_success`);

    return code;
  }

  private generateVariableNode(node: WorkflowNode): string {
    const props = node.properties;
    const varName = this.sanitizeIdentifier(props.name || `var_${node.id}`);
    const value = props.value || '';
    
    const code = `// Variable node: ${node.id}\nlet ${varName} = ${this.rustStringLiteral(value)};\n\n`;
    
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
      printVar = sourceVar || `"${message}"`;
    } else if (this.variables.has(message)) {
      printVar = this.variables.get(message)!;
    } else {
      printVar = `"${message}"`;
    }
    
    return `// Print node: ${node.id}\nprintln!("{}", ${printVar});\n\n`;
  }

  private generateRustEquivalentNode(node: WorkflowNode, connections: Connection[]): string {
    const props = node.properties;
    const code = props.code || '// No code provided';
    
    // Convert Python-like code to Rust (basic conversion)
    const rustCode = code
      .replace(/print\(/g, 'println!(')
      .replace(/def /g, 'fn ')
      .replace(/:\s*$/gm, ' {')
      .replace(/^(\s+)/gm, '$1'); // Keep indentation
    
    return `// Rust equivalent node: ${node.id}\n${rustCode}\n\n`;
  }

  private generateBashNode(node: WorkflowNode, connections: Connection[]): string {
    const props = node.properties;
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    const command = props.command || 'echo "No command specified"';
    const workingDir = props.working_directory || '';
    
    let code = `// Bash node: ${node.id}\n`;
    code += `let ${nodeVar}_command = ${this.rustStringLiteral(command)};\n`;
    
    if (workingDir) {
      code += `let ${nodeVar}_cwd = ${this.rustStringLiteral(workingDir)};\n`;
      code += `let ${nodeVar}_output = Command::new("sh")\n`;
      code += `    .arg("-c")\n`;
      code += `    .arg(&${nodeVar}_command)\n`;
      code += `    .current_dir(&${nodeVar}_cwd)\n`;
      code += `    .output()\n`;
      code += `    .expect("Failed to execute command");\n`;
    } else {
      code += `let ${nodeVar}_output = Command::new("sh")\n`;
      code += `    .arg("-c")\n`;
      code += `    .arg(&${nodeVar}_command)\n`;
      code += `    .output()\n`;
      code += `    .expect("Failed to execute command");\n`;
    }
    
    code += `let ${nodeVar}_stdout = String::from_utf8_lossy(&${nodeVar}_output.stdout).to_string();\n`;
    code += `let ${nodeVar}_stderr = String::from_utf8_lossy(&${nodeVar}_output.stderr).to_string();\n`;
    code += `let ${nodeVar}_exit_code = ${nodeVar}_output.status.code().unwrap_or(-1);\n\n`;
    
    this.variables.set(`${node.id}_stdout`, `${nodeVar}_stdout`);
    this.variables.set(`${node.id}_stderr`, `${nodeVar}_stderr`);
    this.variables.set(`${node.id}_exit_code`, `${nodeVar}_exit_code`);
    
    return code;
  }

  private generateHttpRequestNode(node: WorkflowNode, connections: Connection[]): string {
    const props = node.properties;
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    const url = props.url || 'https://httpbin.org/get';
    const method = props.method || 'GET';
    const headers = props.headers || '{}';
    const body = props.body || '';
    
    let code = `// HTTP Request node: ${node.id}\n`;
    code += `let ${nodeVar}_url = ${this.rustStringLiteral(url)};\n`;
    code += `let ${nodeVar}_method = ${this.rustStringLiteral(method)};\n`;
    
    code += `let ${nodeVar}_client = reqwest::blocking::Client::new();\n`;
    code += `let mut ${nodeVar}_request = ${nodeVar}_client.request(\n`;
    code += `    reqwest::Method::from_bytes(${nodeVar}_method.as_bytes()).unwrap(),\n`;
    code += `    &${nodeVar}_url\n`;
    code += `);\n`;
    
    if (body && method !== 'GET') {
      code += `let ${nodeVar}_body = ${this.rustStringLiteral(body)};\n`;
      code += `${nodeVar}_request = ${nodeVar}_request.body(${nodeVar}_body);\n`;
    }
    
    code += `let ${nodeVar}_response = ${nodeVar}_request.send().expect("Failed to send request");\n`;
    code += `let ${nodeVar}_status_code = ${nodeVar}_response.status().as_u16();\n`;
    code += `let ${nodeVar}_text = ${nodeVar}_response.text().expect("Failed to read response");\n\n`;
    
    this.variables.set(`${node.id}_status_code`, `${nodeVar}_status_code`);
    this.variables.set(`${node.id}_text`, `${nodeVar}_text`);
    
    return code;
  }

  private generateReadFileNode(node: WorkflowNode, connections: Connection[]): string {
    const props = node.properties;
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    const filePath = props.file_path || 'input.txt';
    
    let code = `// Read File node: ${node.id}\n`;
    code += `let ${nodeVar}_path = ${this.rustStringLiteral(filePath)};\n`;
    code += `let (${nodeVar}_content, ${nodeVar}_success, ${nodeVar}_error) = match fs::read_to_string(&${nodeVar}_path) {\n`;
    code += `    Ok(content) => (content, true, None),\n`;
    code += `    Err(e) => (String::new(), false, Some(e.to_string())),\n`;
    code += `};\n\n`;
    
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
    const mode = props.mode || 'write'; // 'write' or 'append'
    
    // Check for input connections
    const inputConnection = connections.find(c => 
      c.target_node === node.id && c.target_input === 'content'
    );
    
    let contentVar = this.rustStringLiteral(content);
    if (inputConnection) {
      const sourceVar = this.variables.get(`${inputConnection.source_node}_${inputConnection.source_output}`);
      contentVar = sourceVar || this.rustStringLiteral(content);
    }
    
    let code = `// Write File node: ${node.id}\n`;
    code += `let ${nodeVar}_path = ${this.rustStringLiteral(filePath)};\n`;
    code += `let ${nodeVar}_content = ${contentVar};\n`;
    
    if (mode === 'append') {
      code += `let (${nodeVar}_success, ${nodeVar}_error) = match std::fs::OpenOptions::new()\n`;
      code += `    .create(true)\n`;
      code += `    .append(true)\n`;
      code += `    .open(&${nodeVar}_path) {\n`;
      code += `    Ok(mut file) => {\n`;
      code += `        match file.write_all(${nodeVar}_content.as_bytes()) {\n`;
      code += `            Ok(_) => (true, None),\n`;
      code += `            Err(e) => (false, Some(e.to_string())),\n`;
      code += `        }\n`;
      code += `    },\n`;
      code += `    Err(e) => (false, Some(e.to_string())),\n`;
      code += `};\n\n`;
    } else {
      code += `let (${nodeVar}_success, ${nodeVar}_error) = match fs::write(&${nodeVar}_path, &${nodeVar}_content) {\n`;
      code += `    Ok(_) => (true, None),\n`;
      code += `    Err(e) => (false, Some(e.to_string())),\n`;
      code += `};\n\n`;
    }
    
    this.variables.set(`${node.id}_success`, `${nodeVar}_success`);
    this.variables.set(`${node.id}_error`, `${nodeVar}_error`);
    
    return code;
  }

  private generateIfThenNode(node: WorkflowNode, connections: Connection[]): string {
    const props = node.properties;
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    const condition = props.condition || 'true';
    
    // Get condition input connection
    const conditionConnection = connections.find(c => 
      c.target_node === node.id && c.target_input === 'condition'
    );
    
    let conditionVar = condition;
    if (conditionConnection) {
      const sourceVar = this.variables.get(`${conditionConnection.source_node}_${conditionConnection.source_output}`);
      conditionVar = sourceVar || condition;
    }
    
    let code = `// If-Then node: ${node.id}\n`;
    code += `let ${nodeVar}_condition = ${conditionVar};\n`;
    code += `let ${nodeVar}_result = if ${nodeVar}_condition {\n`;
    code += `    // Then branch - connect nodes to execute here\n`;
    code += `    true\n`;
    code += `} else {\n`;
    code += `    // Else branch\n`;
    code += `    false\n`;
    code += `};\n\n`;
    
    this.variables.set(`${node.id}_result`, `${nodeVar}_result`);
    
    return code;
  }

  private generateForeachNode(node: WorkflowNode, connections: Connection[]): string {
    const props = node.properties;
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    const iterable = props.iterable || 'vec![]';
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
    
    let code = `// ForEach node: ${node.id}\n`;
    code += `let ${nodeVar}_iterable = ${iterableVar};\n`;
    code += `let mut ${nodeVar}_results = Vec::new();\n`;
    code += `for ${itemVar} in &${nodeVar}_iterable {\n`;
    code += `    // Loop body - connect nodes to execute here\n`;
    code += `    ${nodeVar}_results.push(${itemVar}.clone());\n`;
    code += `}\n\n`;
    
    this.variables.set(`${node.id}_results`, `${nodeVar}_results`);
    
    return code;
  }

  private generateWhileNode(node: WorkflowNode, connections: Connection[]): string {
    const props = node.properties;
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    const condition = props.condition || 'false';
    const maxIterations = props.max_iterations || 100;
    
    let code = `// While node: ${node.id}\n`;
    code += `let mut ${nodeVar}_iterations = 0usize;\n`;
    code += `let ${nodeVar}_max_iterations = ${maxIterations}usize;\n`;
    code += `while ${condition} && ${nodeVar}_iterations < ${nodeVar}_max_iterations {\n`;
    code += `    // Loop body - connect nodes to execute here\n`;
    code += `    ${nodeVar}_iterations += 1;\n`;
    code += `    // Update condition variable here\n`;
    code += `    break; // Prevent infinite loop in generated code\n`;
    code += `}\n\n`;
    
    this.variables.set(`${node.id}_iterations`, `${nodeVar}_iterations`);
    
    return code;
  }

  private generateFunctionNode(node: WorkflowNode, connections: Connection[]): string {
    const props = node.properties;
    const nodeVar = `${node.type}_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    const functionName = props.function_name || `function_${node.id}`;
    const parameters = props.parameters || '';
    const returnType = props.return_type || '()';
    
    let code = `// Function node: ${node.id}\n`;
    code += `fn ${this.sanitizeIdentifier(functionName)}(${parameters}) -> ${returnType} {\n`;
    code += `    // Function body - connect nodes to execute here\n`;
    code += `    // Generated function from node ${node.id}\n`;
    if (returnType === '()') {
      code += `}\n\n`;
      code += `${this.sanitizeIdentifier(functionName)}();\n`;
      code += `let ${nodeVar}_result = ();\n\n`;
    } else {
      code += `    Default::default()\n`;
      code += `}\n\n`;
      code += `let ${nodeVar}_result = ${this.sanitizeIdentifier(functionName)}();\n\n`;
    }
    
    this.variables.set(`${node.id}_result`, `${nodeVar}_result`);
    
    return code;
  }

  private generateHelperFunctions(): string {
    return `
// Helper functions for grep operations

fn execute_grep_on_text(
    regex: &Regex,
    text: &str,
    file_path: Option<&str>,
    invert_match: bool,
    line_numbers: bool,
    context_before: usize,
    context_after: usize,
    max_count: Option<usize>,
) -> GrepResult {
    let lines: Vec<&str> = text.lines().collect();
    let mut matches = Vec::new();

    for (i, line) in lines.iter().enumerate() {
        let is_match = regex.is_match(line);
        let should_include = if invert_match { !is_match } else { is_match };

        if should_include {
            let line_number = if line_numbers { Some(i + 1) } else { None };
            
            let context_before_lines = if context_before > 0 {
                let start = i.saturating_sub(context_before);
                lines[start..i].iter().map(|s| s.to_string()).collect()
            } else {
                Vec::new()
            };

            let context_after_lines = if context_after > 0 {
                let end = std::cmp::min(lines.len(), i + 1 + context_after);
                lines[i + 1..end].iter().map(|s| s.to_string()).collect()
            } else {
                Vec::new()
            };

            matches.push(GrepMatch {
                line_number,
                line_content: line.to_string(),
                file_path: file_path.map(|s| s.to_string()),
                context_before: context_before_lines,
                context_after: context_after_lines,
            });

            if let Some(max) = max_count {
                if matches.len() >= max {
                    break;
                }
            }
        }
    }

    GrepResult {
        match_count: matches.len(),
        matches,
        success: true,
        error: None,
    }
}

fn execute_grep_on_file(
    regex: &Regex,
    file_path: &str,
    invert_match: bool,
    line_numbers: bool,
    context_before: usize,
    context_after: usize,
    max_count: Option<usize>,
) -> GrepResult {
    match fs::read_to_string(file_path) {
        Ok(content) => execute_grep_on_text(
            regex,
            &content,
            Some(file_path),
            invert_match,
            line_numbers,
            context_before,
            context_after,
            max_count,
        ),
        Err(e) => GrepResult {
            matches: Vec::new(),
            match_count: 0,
            success: false,
            error: Some(format!("Failed to read file {}: {}", file_path, e)),
        },
    }
}

fn execute_grep_recursive(
    regex: &Regex,
    dir_path: &str,
    file_pattern: &str,
    invert_match: bool,
    line_numbers: bool,
    context_before: usize,
    context_after: usize,
    max_count: Option<usize>,
) -> GrepResult {
    let mut all_matches = Vec::new();
    let mut total_count = 0;

    for entry in WalkDir::new(dir_path) {
        if let Ok(entry) = entry {
            if entry.file_type().is_file() {
                let file_path = entry.path().to_string_lossy();
                
                // Simple pattern matching (for more complex patterns, use glob crate)
                if file_pattern == "*" || file_path.contains(&file_pattern.replace("*", "")) {
                    let result = execute_grep_on_file(
                        regex,
                        &file_path,
                        invert_match,
                        line_numbers,
                        context_before,
                        context_after,
                        max_count.map(|m| m.saturating_sub(total_count)),
                    );
                    
                    if result.success {
                        total_count += result.match_count;
                        all_matches.extend(result.matches);
                        
                        if let Some(max) = max_count {
                            if total_count >= max {
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    GrepResult {
        matches: all_matches,
        match_count: total_count,
        success: true,
        error: None,
    }
}`;
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

  private rustStringLiteral(value: string): string {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }

  private rustOptional(value: any, type: string): string {
    if (value === null || value === undefined || value === 0) {
      return 'None';
    }
    return `Some(${value}${type === 'usize' ? 'usize' : ''})`;
  }

  private sanitizeIdentifier(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&');
  }

  private indent(code: string, level: number): string {
    const indentStr = '    '.repeat(level);
    return code.split('\n').map(line => line ? indentStr + line : line).join('\n');
  }
}