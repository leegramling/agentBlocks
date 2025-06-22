use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::Manager;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct WorkflowNode {
    id: String,
    node_type: String,
    position: Position,
    properties: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Position {
    x: f64,
    y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Connection {
    id: String,
    source_node: String,
    target_node: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Workflow {
    id: String,
    name: String,
    nodes: Vec<WorkflowNode>,
    connections: Vec<Connection>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ExecutionResult {
    success: bool,
    output: String,
    error: Option<String>,
}

// Tauri Commands
#[tauri::command]
async fn create_workflow(name: String) -> Result<Workflow, String> {
    Ok(Workflow {
        id: Uuid::new_v4().to_string(),
        name,
        nodes: vec![],
        connections: vec![],
    })
}

#[tauri::command]
async fn add_node(mut workflow: Workflow, node_type: String, position: Position) -> Result<Workflow, String> {
    let properties = match node_type.as_str() {
        "variable" => {
            let mut props = HashMap::new();
            props.insert("name".to_string(), serde_json::Value::String("myVariable".to_string()));
            props.insert("value".to_string(), serde_json::Value::String("hello world".to_string()));
            props
        },
        "print" => {
            let mut props = HashMap::new();
            props.insert("message".to_string(), serde_json::Value::String("myVariable".to_string()));
            props
        },
        _ => HashMap::new(),
    };

    let node = WorkflowNode {
        id: Uuid::new_v4().to_string(),
        node_type,
        position,
        properties,
    };
    
    workflow.nodes.push(node);
    Ok(workflow)
}

#[tauri::command]
async fn update_node_position(mut workflow: Workflow, node_id: String, position: Position) -> Result<Workflow, String> {
    if let Some(node) = workflow.nodes.iter_mut().find(|n| n.id == node_id) {
        node.position = position;
        Ok(workflow)
    } else {
        Err("Node not found".to_string())
    }
}

#[tauri::command]
async fn update_node_properties(mut workflow: Workflow, node_id: String, properties: HashMap<String, serde_json::Value>) -> Result<Workflow, String> {
    if let Some(node) = workflow.nodes.iter_mut().find(|n| n.id == node_id) {
        node.properties = properties;
        Ok(workflow)
    } else {
        Err("Node not found".to_string())
    }
}

#[tauri::command]
async fn execute_workflow(workflow: Workflow) -> Result<ExecutionResult, String> {
    let mut python_code = String::from("# Generated Python Code\n");
    let mut variables = HashMap::new();

    // Sort nodes by execution order (simple left-to-right, top-to-bottom)
    let mut sorted_nodes = workflow.nodes.clone();
    sorted_nodes.sort_by(|a, b| {
        a.position.y.partial_cmp(&b.position.y).unwrap_or(std::cmp::Ordering::Equal)
            .then(a.position.x.partial_cmp(&b.position.x).unwrap_or(std::cmp::Ordering::Equal))
    });

    for node in sorted_nodes {
        match node.node_type.as_str() {
            "variable" => {
                let name = node.properties.get("name")
                    .and_then(|v| v.as_str())
                    .unwrap_or("myVariable");
                let value = node.properties.get("value")
                    .and_then(|v| v.as_str())
                    .unwrap_or("hello world");
                
                python_code.push_str(&format!("{} = \"{}\"\n", name, value));
                variables.insert(name.to_string(), value.to_string());
            },
            "print" => {
                let message = node.properties.get("message")
                    .and_then(|v| v.as_str())
                    .unwrap_or("myVariable");
                
                // Check if message is a variable name
                if variables.contains_key(message) {
                    python_code.push_str(&format!("print({})\n", message));
                } else {
                    python_code.push_str(&format!("print(\"{}\")\n", message));
                }
            },
            _ => {
                python_code.push_str(&format!("# Unknown node type: {}\n", node.node_type));
            }
        }
    }

    // Execute Python code
    match execute_python_code(&python_code).await {
        Ok(output) => Ok(ExecutionResult {
            success: true,
            output,
            error: None,
        }),
        Err(e) => Ok(ExecutionResult {
            success: false,
            output: python_code,
            error: Some(e),
        }),
    }
}

async fn execute_python_code(code: &str) -> Result<String, String> {
    use std::process::Command;

    // Create a temporary Python file
    let temp_file = format!("/tmp/agentblocks_{}.py", Uuid::new_v4());
    
    // Write code to file
    std::fs::write(&temp_file, code)
        .map_err(|e| format!("Failed to write Python file: {}", e))?;

    // Execute Python script
    let output = Command::new("python3")
        .arg(&temp_file)
        .output()
        .map_err(|e| format!("Failed to execute Python: {}", e))?;

    // Clean up temp file
    let _ = std::fs::remove_file(&temp_file);

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn save_workflow(workflow: Workflow, path: String) -> Result<(), String> {
    let json = serde_json::to_string_pretty(&workflow)
        .map_err(|e| format!("Failed to serialize workflow: {}", e))?;
    
    std::fs::write(&path, json)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn load_workflow(path: String) -> Result<Workflow, String> {
    let contents = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    let workflow: Workflow = serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse workflow: {}", e))?;
    
    Ok(workflow)
}

#[tauri::command]
async fn save_workflow_json(workflow: Workflow) -> Result<String, String> {
    let json = serde_json::to_string_pretty(&workflow)
        .map_err(|e| format!("Failed to serialize workflow: {}", e))?;
    
    Ok(json)
}

#[tauri::command]
async fn load_workflow_json(json_content: String) -> Result<Workflow, String> {
    let workflow: Workflow = serde_json::from_str(&json_content)
        .map_err(|e| format!("Failed to parse workflow: {}", e))?;
    
    Ok(workflow)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            create_workflow,
            add_node,
            update_node_position,
            update_node_properties,
            execute_workflow,
            save_workflow,
            load_workflow,
            save_workflow_json,
            load_workflow_json
        ])
        .setup(|app| {
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

