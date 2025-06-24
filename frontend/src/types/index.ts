export interface Position {
  x: number;
  y: number;
}

export interface NodeInput {
  id: string;
  name: string;
  type: string;
  required?: boolean;
}

export interface NodeOutput {
  id: string;
  name: string;
  type: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: Position;
  properties: Record<string, any>;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  data?: any;
  panelId?: string; // Which panel this node belongs to
  parentId?: string; // Parent node for nesting (foreach, if, function)
  children?: string[]; // Child node IDs for parent nodes
  indentLevel?: number; // Visual indentation level
}

export interface Connection {
  id: string;
  source_node: string;
  source_output: string;
  target_node: string;
  target_input: string;
}

export interface WorkflowPanel {
  id: string;
  name: string;
  type: 'main' | 'module';
  position: Position;
  size: { width: number; height: number };
  color?: string;
  isExpanded?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: Connection[];
  panels: WorkflowPanel[];
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: string;
  type: string;
  category: string;
  position: Position;
  properties: Record<string, any>;
  inputs: string[];
  outputs: string[];
  parentId?: string; // Parent block for nesting (loops, conditionals)
  children?: string[]; // Child block IDs for parent blocks
  indentLevel?: number; // Visual indentation level
}

export type NodeType = 
  | 'bash'
  | 'regex'
  | 'curl'
  | 'scp'
  | 'input'
  | 'output'
  | 'conditional'
  | 'loop'
  | 'transform'
  | 'agent';