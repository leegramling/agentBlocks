// Node definition provider for template-based code generation
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

export class NodeDefinitionProvider {
  private static instance: NodeDefinitionProvider;
  private definitions: Map<string, NodeDefinition> = new Map();

  static getInstance(): NodeDefinitionProvider {
    if (!NodeDefinitionProvider.instance) {
      NodeDefinitionProvider.instance = new NodeDefinitionProvider();
    }
    return NodeDefinitionProvider.instance;
  }

  constructor() {
    this.initializeBuiltInDefinitions();
  }

  getDefinition(type: string): NodeDefinition | null {
    return this.definitions.get(type) || null;
  }

  getAllDefinitions(): NodeDefinition[] {
    return Array.from(this.definitions.values());
  }

  private initializeBuiltInDefinitions() {
    // Built-in node definitions with code generation templates
    this.definitions.set('variable', {
      type: 'variable',
      name: 'Variable',
      category: 'data',
      version: '1.0',
      description: 'Store and manage data values',
      icon: '📦',
      color: '#8b5cf6',
      properties: {},
      inputs: [],
      outputs: [],
      codeGeneration: {
        python: {
          imports: [],
          template: '# Variable node: {{nodeId}}\n{{varName}} = {{formatValue}}\n',
          functions: []
        },
        rust: {
          imports: [],
          structs: [],
          template: '// Variable node: {{nodeId}}\nlet {{varName}} = {{formatValue}};\n',
          functions: []
        }
      }
    });

    this.definitions.set('print', {
      type: 'print',
      name: 'Print',
      category: 'output',
      version: '1.0',
      description: 'Display text or variable values to the console',
      icon: '🖨️',
      color: '#10b981',
      properties: {},
      inputs: [],
      outputs: [],
      codeGeneration: {
        python: {
          imports: [],
          template: '# Print node: {{nodeId}}\nprint({{formatMessage}})\n',
          functions: []
        },
        rust: {
          imports: [],
          structs: [],
          template: '// Print node: {{nodeId}}\nprintln!("{}", {{formatMessage}});\n',
          functions: []
        }
      }
    });

    this.definitions.set('function', {
      type: 'function',
      name: 'Function',
      category: 'control',
      version: '1.0',
      description: 'Define a reusable function',
      icon: '⚙️',
      color: '#3b82f6',
      properties: {},
      inputs: [],
      outputs: [],
      codeGeneration: {
        python: {
          imports: [],
          template: '# Function will be handled specially by the generator',
          functions: []
        },
        rust: {
          imports: [],
          structs: [],
          template: '// Function will be handled specially by the generator',
          functions: []
        }
      }
    });

    // Add basic definitions for other node types that don't have templates yet
    const basicNodeTypes = [
      'bash', 'curl', 'regex', 'pycode', 'if-then', 'foreach', 'while', 
      'assignment', 'execute', 'increment', 'list_create'
    ];

    basicNodeTypes.forEach(type => {
      this.definitions.set(type, {
        type,
        name: type.charAt(0).toUpperCase() + type.slice(1),
        category: 'misc',
        version: '1.0',
        description: `${type} node`,
        icon: '⚡',
        color: '#6b7280',
        properties: {},
        inputs: [],
        outputs: [],
        codeGeneration: {
          python: {
            imports: [],
            template: `# ${type} node: {{nodeId}}\n# TODO: Implement template for ${type}\n`,
            functions: []
          },
          rust: {
            imports: [],
            structs: [],
            template: `// ${type} node: {{nodeId}}\n// TODO: Implement template for ${type}\n`,
            functions: []
          }
        }
      });
    });
  }
}

export default NodeDefinitionProvider;