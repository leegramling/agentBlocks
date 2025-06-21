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
}

export interface Connection {
  id: string;
  source_node: string;
  source_output: string;
  target_node: string;
  target_input: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: Connection[];
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