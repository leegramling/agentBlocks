# Build Instructions for AgentBlocks Desktop Client

## Prerequisites

You'll need to install additional system dependencies for the full Tauri build:

```bash
# Ubuntu/Debian (try one of these package combinations)
# For Ubuntu 20.04 and newer:
sudo apt install -y libgtk-3-dev libatk1.0-dev libcairo2-dev libgdk-pixbuf2.0-dev \
    libglib2.0-dev libpango1.0-dev libsoup2.4-dev libwebkit2gtk-4.0-dev libssl-dev

# If the above doesn't work, try:
sudo apt install -y libgtk-3-dev libwebkit2gtk-4.0-dev libssl-dev

# Alternative package names for some distributions:
# sudo apt install -y libwebkit2gtk-4.1-dev  # Newer versions
# sudo apt install -y webkit2gtk-4.0-dev     # Alternative name

# Fedora/RHEL
sudo dnf install gtk3-devel atk-devel cairo-devel gdk-pixbuf2-devel \
    glib2-devel pango-devel libsoup-devel webkit2gtk3-devel openssl-devel

# Arch Linux
sudo pacman -S gtk3 atk cairo gdk-pixbuf2 glib2 pango libsoup webkit2gtk
```

## Installation

1. **Install Rust** (if not already installed):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

2. **Install Tauri CLI**:
   ```bash
   cargo install tauri-cli
   ```

3. **Install Node.js** (for development server):
   ```bash
   # Ubuntu/Debian
   sudo apt install nodejs npm
   
   # Or use nvm for latest version
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install node
   ```

## Building the Application

1. **Navigate to the desktop client directory**:
   ```bash
   cd desktop-client
   ```

2. **Development Mode** (recommended for testing):
   ```bash
   cargo tauri dev
   ```
   This will:
   - Compile the Rust backend
   - Start the frontend server
   - Open the desktop application window
   - Enable hot-reload for development

3. **Production Build**:
   ```bash
   cargo tauri build
   ```
   This creates a production-ready executable in `target/release/`

## Alternative: Simplified Build

If you encounter dependency issues, you can use the simplified version:

1. **Run the Python demo**:
   ```bash
   python3 demo.py
   ```

2. **Or try building with minimal features**:
   ```bash
   # Edit Cargo.toml to use minimal features
   cargo build
   ```

## Testing the Application

Once built successfully:

1. **Create Variable Node**: Drag "📦 Variable" from the left palette to the canvas
2. **Create Print Node**: Drag "🖨️ Print" from the left palette below the variable
3. **Configure Properties**: Click on nodes to edit their properties in the right panel
4. **Execute Workflow**: Click "▶ Run Workflow" to see the Python execution
5. **Save/Load**: Use the menu buttons to persist workflows

## Expected Output

When you run a Variable → Print workflow, you should see:

```
Generated Python Code:
myVariable = "hello world"
print(myVariable)

Execution Result: hello world
```

## Troubleshooting

1. **Missing System Dependencies**: Install the packages listed in Prerequisites
2. **Rust Version Issues**: Update Rust with `rustup update`
3. **Node.js Issues**: Ensure Node.js is installed for the frontend
4. **Python Issues**: Make sure `python3` is available in PATH
5. **Permission Issues**: Ensure write permissions for temp files

## Features

- ✅ Visual canvas with drag-and-drop
- ✅ Variable and Print node types
- ✅ Real-time property editing
- ✅ Python code generation and execution
- ✅ Workflow save/load (JSON format)
- ✅ Professional dark theme UI
- ✅ Cross-platform desktop application

## Architecture

- **Backend**: Rust with Tauri for native performance
- **Frontend**: HTML/CSS/JavaScript with Tauri bindings
- **Execution**: Python subprocess for workflow execution
- **UI**: Dark theme following design document specifications

This implementation provides a solid foundation for the full AgentBlocks vision!