// Node definition loader for AgentBlocks

export interface NodeProperty {
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea';
  label: string;
  description: string;
  default?: any;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>;
  conditional?: {
    field: string;
    value: any;
  };
}

export interface NodeInput {
  name: string;
  type: string;
  label: string;
  description: string;
  optional?: boolean;
}

export interface NodeOutput {
  name: string;
  type: string;
  label: string;
  description: string;
}

export interface NodeDefinition {
  type: string;
  name: string;
  category: string;
  version: string;
  description: string;
  icon: string;
  color: string;
  properties: Record<string, NodeProperty>;
  inputs: NodeInput[];
  outputs: NodeOutput[];
}

export class NodeDefinitionLoader {
  private static definitions: Map<string, NodeDefinition> = new Map();
  private static categories: Set<string> = new Set();

  static async loadDefinition(nodeType: string): Promise<NodeDefinition | null> {
    if (this.definitions.has(nodeType)) {
      return this.definitions.get(nodeType)!;
    }

    try {
      // Dynamic import of node definition JSON
      const module = await import(`./definitions/${nodeType}.json`);
      const definition = module.default as NodeDefinition;
      
      this.definitions.set(nodeType, definition);
      this.categories.add(definition.category);
      
      return definition;
    } catch (error) {
      console.error(`Failed to load node definition for ${nodeType}:`, error);
      return null;
    }
  }

  static async loadAllDefinitions(): Promise<NodeDefinition[]> {
    // List of all available node types
    const nodeTypes = [
      // Text processing
      'grep',
      'regex',
      'variable', 
      'print',
      
      // Code execution
      'pycode',
      'bash',
      
      // Network
      'curl',
      
      // Logic and control
      'if-then',
      'foreach',
      'while',
      'function',
      
      // Data structures
      'list_create',
      'list_append',
      'list_get',
      
      // Files
      'find_files',
      'read_file',
      'write_file',
      'copy_file',
      
      // System
      'scp',
      'transform',
      'conditional',
      'loop'
    ];

    const definitions: NodeDefinition[] = [];
    
    for (const nodeType of nodeTypes) {
      const definition = await this.loadDefinition(nodeType);
      if (definition) {
        definitions.push(definition);
      }
    }

    return definitions;
  }

  static getDefinition(nodeType: string): NodeDefinition | null {
    return this.definitions.get(nodeType) || null;
  }

  static getAllDefinitions(): NodeDefinition[] {
    return Array.from(this.definitions.values());
  }

  static getCategories(): string[] {
    return Array.from(this.categories);
  }

  static getNodesByCategory(category: string): NodeDefinition[] {
    return Array.from(this.definitions.values())
      .filter(def => def.category === category);
  }

  static validateNodeProperties(nodeType: string, properties: Record<string, any>): {
    valid: boolean;
    errors: string[];
  } {
    const definition = this.getDefinition(nodeType);
    if (!definition) {
      return { valid: false, errors: [`Unknown node type: ${nodeType}`] };
    }

    const errors: string[] = [];

    // Check required properties
    for (const [propName, propDef] of Object.entries(definition.properties)) {
      if (propDef.required && (properties[propName] === undefined || properties[propName] === '')) {
        errors.push(`Required property '${propName}' is missing`);
      }

      // Type validation
      const value = properties[propName];
      if (value !== undefined) {
        switch (propDef.type) {
          case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
              errors.push(`Property '${propName}' must be a number`);
            } else {
              if (propDef.min !== undefined && value < propDef.min) {
                errors.push(`Property '${propName}' must be >= ${propDef.min}`);
              }
              if (propDef.max !== undefined && value > propDef.max) {
                errors.push(`Property '${propName}' must be <= ${propDef.max}`);
              }
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`Property '${propName}' must be a boolean`);
            }
            break;
          case 'select':
            if (propDef.options) {
              const validValues = propDef.options.map(opt => opt.value);
              if (!validValues.includes(value)) {
                errors.push(`Property '${propName}' must be one of: ${validValues.join(', ')}`);
              }
            }
            break;
          case 'string':
          case 'textarea':
            if (typeof value !== 'string') {
              errors.push(`Property '${propName}' must be a string`);
            }
            break;
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  static getDefaultProperties(nodeType: string): Record<string, any> {
    const definition = this.getDefinition(nodeType);
    if (!definition) return {};

    const defaultProps: Record<string, any> = {};
    
    for (const [propName, propDef] of Object.entries(definition.properties)) {
      if (propDef.default !== undefined) {
        defaultProps[propName] = propDef.default;
      }
    }

    return defaultProps;
  }

  static shouldShowProperty(
    nodeType: string,
    propertyName: string,
    currentProperties: Record<string, any>
  ): boolean {
    const definition = this.getDefinition(nodeType);
    if (!definition) return false;

    const propDef = definition.properties[propertyName];
    if (!propDef || !propDef.conditional) return true;

    const { field, value } = propDef.conditional;
    return currentProperties[field] === value;
  }

  static getPropertyGroups(nodeType: string): Record<string, string[]> {
    const definition = this.getDefinition(nodeType);
    if (!definition) return {};

    const groups: Record<string, string[]> = {
      basic: [],
      advanced: [],
      output: []
    };

    for (const propName of Object.keys(definition.properties)) {
      // Group properties based on naming patterns
      if (['pattern', 'input_source', 'file_path', 'message', 'code', 'name', 'value'].includes(propName)) {
        groups.basic.push(propName);
      } else if (['line_numbers', 'count_only'].includes(propName)) {
        groups.output.push(propName);
      } else {
        groups.advanced.push(propName);
      }
    }

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }
}