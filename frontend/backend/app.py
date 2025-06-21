from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# In-memory storage for development
workflows = {}
nodes = {}
connections = {}

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

@app.route('/api/workflows', methods=['GET'])
def get_workflows():
    return jsonify(list(workflows.values()))

@app.route('/api/workflows', methods=['POST'])
def create_workflow():
    data = request.json
    workflow_id = data.get('id', f"workflow_{len(workflows) + 1}")
    workflow = {
        "id": workflow_id,
        "name": data.get('name', 'Untitled Workflow'),
        "description": data.get('description', ''),
        "nodes": [],
        "connections": [],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    workflows[workflow_id] = workflow
    return jsonify(workflow), 201

@app.route('/api/workflows/<workflow_id>', methods=['GET'])
def get_workflow(workflow_id):
    workflow = workflows.get(workflow_id)
    if not workflow:
        return jsonify({"error": "Workflow not found"}), 404
    return jsonify(workflow)

@app.route('/api/workflows/<workflow_id>', methods=['PUT'])
def update_workflow(workflow_id):
    workflow = workflows.get(workflow_id)
    if not workflow:
        return jsonify({"error": "Workflow not found"}), 404
    
    data = request.json
    workflow.update({
        "name": data.get('name', workflow['name']),
        "description": data.get('description', workflow['description']),
        "nodes": data.get('nodes', workflow['nodes']),
        "connections": data.get('connections', workflow['connections']),
        "updated_at": datetime.now().isoformat()
    })
    return jsonify(workflow)

@app.route('/api/workflows/<workflow_id>/nodes', methods=['POST'])
def add_node_to_workflow(workflow_id):
    workflow = workflows.get(workflow_id)
    if not workflow:
        return jsonify({"error": "Workflow not found"}), 404
    
    data = request.json
    node = {
        "id": data.get('id', f"node_{len(workflow['nodes']) + 1}"),
        "type": data.get('type', 'default'),
        "position": data.get('position', {"x": 0, "y": 0}),
        "properties": data.get('properties', {}),
        "inputs": data.get('inputs', []),
        "outputs": data.get('outputs', [])
    }
    
    workflow['nodes'].append(node)
    workflow['updated_at'] = datetime.now().isoformat()
    return jsonify(node), 201

@app.route('/api/workflows/<workflow_id>/connections', methods=['POST'])
def add_connection_to_workflow(workflow_id):
    workflow = workflows.get(workflow_id)
    if not workflow:
        return jsonify({"error": "Workflow not found"}), 404
    
    data = request.json
    connection = {
        "id": data.get('id', f"conn_{len(workflow['connections']) + 1}"),
        "source_node": data['source_node'],
        "source_output": data['source_output'],
        "target_node": data['target_node'],
        "target_input": data['target_input']
    }
    
    workflow['connections'].append(connection)
    workflow['updated_at'] = datetime.now().isoformat()
    return jsonify(connection), 201

@app.route('/api/execute/<workflow_id>', methods=['POST'])
def execute_workflow(workflow_id):
    workflow = workflows.get(workflow_id)
    if not workflow:
        return jsonify({"error": "Workflow not found"}), 404
    
    # TODO: Implement workflow execution logic
    return jsonify({
        "status": "executed",
        "workflow_id": workflow_id,
        "result": "Workflow execution not yet implemented"
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)