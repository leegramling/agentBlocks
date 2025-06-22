# AgentBlocks Desktop Client

A simple desktop application built with Rust and Tauri that provides a visual programming interface for creating workflows with Variable and Print nodes.

## Features

- **Visual Canvas**: Drag and drop nodes to create workflows
- **Variable Nodes**: Store and manage data values
- **Print Nodes**: Output data to the execution console
- **Python Execution**: Execute workflows as Python code
- **Save/Load**: Persist workflows as JSON files

## Requirements

- Rust (latest stable)
- Python 3.x
- Node.js (for Tauri development)

## Installation

1. Install Rust: https://rustup.rs/
2. Install Tauri CLI:
   ```bash
   cargo install tauri-cli
   ```

## Development

1. Navigate to the desktop-client directory:
   ```bash
   cd desktop-client
   ```

2. Run in development mode:
   ```bash
   cargo tauri dev
   ```

## Building

Build for production:
```bash
cargo tauri build
```

## Usage

1. **Create Nodes**: Drag Variable and Print blocks from the left palette onto the canvas
2. **Configure Properties**: Click on a node to edit its properties in the right panel
3. **Arrange Workflow**: Position nodes in execution order (top to bottom, left to right)
4. **Execute**: Click the "Run Workflow" button to execute as Python code
5. **Save/Load**: Use the menu buttons to save and load workflows

## Architecture

- **Backend**: Rust with Tauri for native performance
- **Frontend**: Vanilla HTML/CSS/JavaScript with Tauri bindings
- **Execution**: Python subprocess execution
- **Storage**: JSON file format for workflow persistence

This is a simplified implementation following the design document specifications, focusing on the core visual programming concepts with Variable and Print nodes as a proof of concept.