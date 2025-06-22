#!/usr/bin/env python3
"""
Simple demonstration of the AgentBlocks desktop client concept.
This shows how the Rust backend would generate and execute Python code.
"""

import json
import subprocess
import tempfile
import uuid
from typing import Dict, List, Any

class WorkflowNode:
    def __init__(self, node_id: str, node_type: str, position: Dict[str, float], properties: Dict[str, Any]):
        self.id = node_id
        self.node_type = node_type
        self.position = position
        self.properties = properties

class Workflow:
    def __init__(self, workflow_id: str, name: str):
        self.id = workflow_id
        self.name = name
        self.nodes: List[WorkflowNode] = []
        self.connections: List[Dict] = []

    def add_node(self, node_type: str, position: Dict[str, float]) -> WorkflowNode:
        properties = {}
        if node_type == "variable":
            properties = {"name": "myVariable", "value": "hello world"}
        elif node_type == "print":
            properties = {"message": "myVariable"}
        
        node = WorkflowNode(
            node_id=str(uuid.uuid4()),
            node_type=node_type,
            position=position,
            properties=properties
        )
        self.nodes.append(node)
        return node

    def execute(self) -> Dict[str, Any]:
        """Generate Python code and execute it."""
        python_code = "# Generated Python Code\n"
        variables = {}

        # Sort nodes by execution order (top to bottom, left to right)
        sorted_nodes = sorted(self.nodes, key=lambda n: (n.position['y'], n.position['x']))

        for node in sorted_nodes:
            if node.node_type == "variable":
                name = node.properties.get("name", "myVariable")
                value = node.properties.get("value", "hello world")
                python_code += f'{name} = "{value}"\n'
                variables[name] = value
            elif node.node_type == "print":
                message = node.properties.get("message", "myVariable")
                if message in variables:
                    python_code += f"print({message})\n"
                else:
                    python_code += f'print("{message}")\n'

        print("Generated Python Code:")
        print("=" * 40)
        print(python_code)
        print("=" * 40)

        # Execute the code
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(python_code)
                temp_file = f.name

            result = subprocess.run(['python3', temp_file], capture_output=True, text=True)
            
            return {
                "success": result.returncode == 0,
                "output": result.stdout,
                "error": result.stderr if result.returncode != 0 else None,
                "code": python_code
            }
        except Exception as e:
            return {
                "success": False,
                "output": "",
                "error": str(e),
                "code": python_code
            }

def demo():
    print("🚀 AgentBlocks Desktop Client Demo")
    print("=" * 50)
    
    # Create a new workflow
    workflow = Workflow("demo-workflow", "Demo Workflow")
    print(f"Created workflow: {workflow.name}")
    
    # Add a variable node
    var_node = workflow.add_node("variable", {"x": 100, "y": 100})
    var_node.properties["name"] = "greeting"
    var_node.properties["value"] = "Hello, AgentBlocks!"
    print(f"Added variable node: {var_node.properties}")
    
    # Add a print node
    print_node = workflow.add_node("print", {"x": 100, "y": 200})
    print_node.properties["message"] = "greeting"
    print(f"Added print node: {print_node.properties}")
    
    # Execute the workflow
    print("\n📋 Executing workflow...")
    result = workflow.execute()
    
    print("\n📊 Execution Result:")
    print(f"Success: {result['success']}")
    if result['success']:
        print(f"Output: {result['output'].strip()}")
    else:
        print(f"Error: {result['error']}")
    
    # Show JSON representation
    workflow_json = {
        "id": workflow.id,
        "name": workflow.name,
        "nodes": [
            {
                "id": node.id,
                "node_type": node.node_type,
                "position": node.position,
                "properties": node.properties
            }
            for node in workflow.nodes
        ],
        "connections": workflow.connections
    }
    
    print("\n💾 Workflow JSON:")
    print(json.dumps(workflow_json, indent=2))

if __name__ == "__main__":
    demo()