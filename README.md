# AgentBlocks

AgentBlocks is a **comprehensive visual node-based programming environment** for building CLI tools and agents. It provides an intuitive drag-and-drop interface for creating complex workflows using a sophisticated **panel-based system** with hierarchical node organization.

## 🏗️ Architecture

AgentBlocks consists of multiple integrated components:

- **Frontend**: React TypeScript application with Vite build system
- **Backend**: Python Flask API server for workflow management
- **Desktop Client**: Rust/Tauri application for standalone execution
- **LLM Integration**: Ollama support for AI-assisted development

### Advanced Panel-Based Visual Programming

1. **Panel Container System**: Organize workflows into collapsible main and module panels
2. **Hierarchical Node Management**: Parent-child relationships with visual indentation
3. **Drag-and-Drop Reordering**: Intuitive node reorganization within panels
4. **Real-time Code Generation**: Live Python code preview and execution
5. **AI-Powered Assistance**: Integrated LLM queries for development help

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**
- **Rust** (for desktop client)
- **Ollama** (optional, for LLM features)

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   
   The frontend will be available at: `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd frontend/backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the Flask server:
   ```bash
   python app.py
   ```
   
   The backend API will be available at: `http://localhost:5000`

### Desktop Client Setup (Optional)

1. Navigate to the desktop client directory:
   ```bash
   cd desktop-client
   ```

2. Install system dependencies (Ubuntu/Debian):
   ```bash
   ./INSTALL_DEPS.sh
   ```

3. Build and run:
   ```bash
   cargo run
   ```

### LLM Integration Setup (Optional)

1. Install Ollama:
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. Pull a model (e.g., llama2):
   ```bash
   ollama pull llama2
   ```

3. Start Ollama service:
   ```bash
   ollama serve
   ```
   
   The LLM query feature will automatically detect running Ollama instances.

## 🎮 Usage

### Enhanced Interface

The application features an advanced **panel-based layout**:

- **Left Panel**: 
  - **Block Palette**: Categorized library of coding blocks (Variables, Text, Network, Logic, AI, Custom)
  - **Search Functionality**: Filter blocks by name or category
  - **Mode Toggle**: Switch between visual and code editing modes

- **Central Canvas**: 
  - **Panel Container System**: Main execution panel and modular component panels
  - **Collapsible Panels**: Expand/collapse panels with ▶/▼ controls
  - **Node Hierarchy**: Parent-child relationships with visual indentation
  - **Drag-and-Drop Reordering**: Reorganize nodes within panels
  - **Grid Background**: 25px grid system for precise alignment
  - **Minimap**: Bird's-eye view of workflow structure

- **Right Panel**:
  - **Properties Table**: Detailed node configuration
  - **Tree View**: Hierarchical workflow structure navigation
  - **Action Buttons**: Edit, duplicate, delete operations

- **Bottom Panel**:
  - **Console Output**: Real-time execution results and logs
  - **LLM Query Interface**: AI-assisted development queries
  - **Execution Controls**: Run, stop, and debug workflows

### Creating Advanced Workflows

1. **Create Panels**: Use "Add Module" button to create new organizational panels
2. **Add Nodes**: Drag blocks from palette into specific panels
3. **Organize Hierarchy**: Use parent nodes (functions, loops) to create nested structures
4. **Reorder Nodes**: Drag nodes within panels to change execution order
5. **Configure Properties**: Select nodes to edit properties in detail view
6. **AI Assistance**: Use LLM queries for coding help and optimization suggestions

### Enhanced Node Types

#### **File Operations**
- **find_files**: Search and locate files with patterns
- **read_file**: Read file contents with encoding options
- **write_file**: Create or update files with data
- **copy_file**: Copy files between locations

#### **Text Processing**
- **text_transform**: String manipulation and formatting
- **regex_match**: Advanced pattern matching

#### **Network Operations**
- **http_request**: REST API calls and web requests
- **download_file**: Fetch files from URLs
- **webhook**: Handle incoming HTTP notifications

#### **AI Integration**
- **ai_text_gen**: Generate text content using AI
- **ai_code_gen**: Generate code snippets and functions
- **ai_analysis**: Analyze data and provide insights

#### **Execution & Logic**
- **python_code**: Execute custom Python scripts
- **shell_command**: Run system commands
- **hybrid_template**: Combine visual and code elements

#### **Control Flow**
- **variable**: Store and manage data
- **assignment**: Update variable values
- **if-then**: Conditional logic branching (parent node)
- **foreach**: Iterate over collections (parent node)
- **while**: Loop with conditions (parent node)
- **function**: Reusable code blocks (parent node)

### Panel System Features

#### **Main Panel**
- Primary execution flow for workflows
- Always visible and expanded by default
- Houses the core workflow logic

#### **Module Panels**
- Reusable component containers
- Custom naming via creation modal
- Independent organization and collapse state

#### **Node Management**
- **Parent-Child Relationships**: Functions, loops, and conditionals can contain child nodes
- **Visual Indentation**: Child nodes are visually indented to show hierarchy
- **Drag Reordering**: Use ⋮⋮ handles to reorder nodes within panels
- **Smart Positioning**: Automatic position calculation and spacing
- **Dynamic Sizing**: Panels resize based on content and indentation

### LLM Query System

#### **AI-Assisted Development**
- **Query Interface**: Natural language queries for coding assistance
- **Context Awareness**: LLM understands your current workflow structure
- **Code Generation**: Get code snippets and optimization suggestions
- **Problem Solving**: Debug issues and get architectural advice
- **Real-time Feedback**: Responses appear in console output

#### **Supported Queries**
- "How do I optimize this workflow?"
- "Generate a regex pattern for email validation"
- "What's the best way to handle errors in this function?"
- "Create a Python function to process CSV files"
- "Explain how to implement API authentication"

## 🔧 Development

### Frontend Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production  
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

### Backend Commands

```bash
python app.py     # Start Flask development server
```

### Desktop Client Commands

```bash
cargo run         # Run desktop application
cargo build       # Build executable
./INSTALL_DEPS.sh # Install system dependencies
```

### Project Structure

```
agentBlocks/
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── WorkflowEditor.tsx    # Main canvas with panel system
│   │   │   ├── PanelComponent.tsx    # Individual panel containers
│   │   │   ├── TreeView.tsx          # Hierarchical navigation
│   │   │   ├── PanelModal.tsx        # Panel creation interface
│   │   │   ├── NodePalette.tsx       # Block library with search
│   │   │   ├── PropertiesPanel.tsx   # Node configuration
│   │   │   ├── NodeComponent.tsx     # Individual nodes
│   │   │   └── ...
│   │   ├── types/               # TypeScript interfaces
│   │   │   └── index.ts         # Panel and node type definitions
│   │   └── index.css           # Comprehensive styling system
│   ├── backend/
│   │   ├── app.py              # Flask API server
│   │   └── requirements.txt
│   └── package.json
├── desktop-client/             # Rust/Tauri desktop application
│   ├── src/
│   │   └── main.rs            # Desktop app entry point
│   ├── frontend/              # Desktop UI components
│   ├── Cargo.toml            # Rust dependencies
│   └── INSTALL_DEPS.sh       # System dependency installer
├── agentblocks_design.md      # Complete design specification
├── CLAUDE.md                  # Development guidelines
└── README.md                  # This file
```

## 🌐 API Endpoints

The Flask backend provides comprehensive REST endpoints:

### **Workflow Management**
- `GET /api/health` - Health check
- `GET /api/workflows` - List all workflows with panels
- `POST /api/workflows` - Create new workflow
- `GET /api/workflows/{id}` - Get specific workflow
- `PUT /api/workflows/{id}` - Update workflow with panel data
- `DELETE /api/workflows/{id}` - Remove workflow

### **Node Operations**
- `POST /api/workflows/{id}/nodes` - Add node to specific panel
- `PUT /api/workflows/{id}/nodes/{nodeId}` - Update node properties
- `DELETE /api/workflows/{id}/nodes/{nodeId}` - Remove node
- `POST /api/workflows/{id}/nodes/{nodeId}/reorder` - Reorder nodes in panel

### **Panel Management**
- `POST /api/workflows/{id}/panels` - Create new panel
- `PUT /api/workflows/{id}/panels/{panelId}` - Update panel properties
- `DELETE /api/workflows/{id}/panels/{panelId}` - Remove panel

### **Execution Engine**
- `POST /api/execute/{id}` - Execute workflow with panel hierarchy
- `GET /api/execute/{id}/status` - Get execution status
- `POST /api/execute/{id}/stop` - Stop workflow execution

### **LLM Integration**
- `POST /api/llm/query` - Send query to connected LLM
- `GET /api/llm/status` - Check Ollama connection status
- `GET /api/llm/models` - List available models

## 🎨 Advanced Styling System

The application uses a sophisticated **dark theme** with comprehensive styling:

### **Color Palette**
- **Primary Background**: `#111827` (slate-900)
- **Panel Background**: `#1e293b` with backdrop blur
- **Secondary Background**: `#1f2937` (gray-800) 
- **Border Color**: `#374151` (gray-700)
- **Text Color**: `#ffffff` (white)
- **Accent Blue**: `#3b82f6` (blue-500)
- **Accent Purple**: `#8b5cf6` (violet-500)

### **Panel System Styling**
- **Glass Morphism**: Backdrop blur effects for modern appearance
- **Color Coding**: Blue for main panels, purple for modules
- **Dynamic Sizing**: Responsive to content with smooth transitions
- **Visual Hierarchy**: Clear parent-child relationships through indentation

### **Node Category Colors**
- **Files**: Blue (`#3b82f6`) - File operations
- **Text**: Green (`#10b981`) - Text processing
- **Network**: Cyan (`#06b6d4`) - HTTP and API calls
- **Variables**: Orange (`#f59e0b`) - Data storage
- **Logic**: Purple (`#8b5cf6`) - Control flow
- **AI**: Pink (`#ec4899`) - AI integration
- **Execution**: Red (`#ef4444`) - Code execution

### **Interactive Elements**
- **Hover Effects**: Subtle transforms and color changes
- **Drag States**: Visual feedback during drag operations
- **Focus States**: Clear keyboard navigation indicators
- **Loading States**: Smooth spinners and progress indicators

## 🔄 Navigation & Routing

- **Main Route** (`/`): Enhanced workflow editor with panel system
- **Workflow Route** (`/workflow/:id`): Specific workflow with full panel hierarchy
- **Block Editor Route** (`/block-editor/:nodeId`): Advanced block programming interface
- **Panel Route** (`/workflow/:id/panel/:panelId`): Focus on specific panel content

## 🛠️ Technologies Used

### **Frontend Stack**
- **React** 19.1.0 - Modern UI framework with hooks
- **TypeScript** - Full type safety and IntelliSense
- **Vite** - Lightning-fast build tool and dev server
- **React Router** - Client-side routing with nested routes
- **Lucide React** - Comprehensive icon library
- **Custom CSS** - Hand-crafted styling system

### **Backend Stack**
- **Flask** 3.0.3 - Lightweight web framework
- **Flask-CORS** - Cross-origin resource sharing
- **Python-dotenv** - Environment configuration
- **SQLAlchemy** - Database ORM for workflow persistence

### **Desktop Client**
- **Rust** - Systems programming language
- **Tauri** - Cross-platform desktop framework
- **WebView** - Native web rendering
- **Python Integration** - Subprocess execution

### **AI Integration**
- **Ollama** - Local LLM serving
- **REST API** - Standard HTTP communication
- **Streaming** - Real-time response handling

## 🚧 Current Status & Roadmap

### **✅ Completed Features**
- ✅ **Comprehensive panel system** with main and module containers
- ✅ **Hierarchical node organization** with parent-child relationships
- ✅ **Drag-and-drop reordering** within panels
- ✅ **Collapsible panels** with expand/collapse controls
- ✅ **Tree view navigation** for workflow structure
- ✅ **Advanced block palette** with search and categorization
- ✅ **Real-time Python code generation** and execution
- ✅ **Properties panel** with detailed node configuration
- ✅ **Workflow save/load** with panel data persistence
- ✅ **Desktop client** with Rust/Tauri implementation
- ✅ **Console output system** for execution feedback

### **🔄 In Development**
- 🔄 **LLM query interface** for AI-assisted development
- 🔄 **Advanced execution engine** with panel-aware processing
- 🔄 **Block editor enhancement** with visual programming
- 🔄 **API integration** for external service connections
- 🔄 **Workflow templates** and sharing system

### **📋 Planned Features**
- 📋 **Multi-user collaboration** with real-time synchronization
- 📋 **Version control integration** with Git workflows
- 📋 **Plugin system** for custom node types
- 📋 **Advanced debugging tools** with breakpoints
- 📋 **Cloud deployment** options and hosting
- 📋 **Mobile companion app** for monitoring

## 🤝 Contributing

We welcome contributions to AgentBlocks! Here's how to get started:

1. **Fork the repository** on GitHub
2. **Create a feature branch** from `master`
3. **Implement your changes** following our coding standards
4. **Test thoroughly** with both unit and integration tests
5. **Update documentation** including README and code comments
6. **Submit a pull request** with detailed description

### **Development Guidelines**
- Follow TypeScript best practices and use strict mode
- Write comprehensive tests for new functionality
- Use semantic commit messages (feat, fix, docs, style, refactor)
- Ensure cross-platform compatibility
- Maintain backward compatibility when possible

### **Code Style**
- Use Prettier for code formatting
- Follow React functional component patterns
- Implement proper error handling and validation
- Use meaningful variable and function names
- Include JSDoc comments for complex functions

## 📝 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

**AgentBlocks** - *Building the future of visual programming, one panel at a time.* 🚀

## 🔗 Quick Links

- [🎮 Live Demo](https://agentblocks.dev) *(coming soon)*
- [📚 Documentation](./docs/) *(in development)*
- [🐛 Issue Tracker](https://github.com/leegramling/agentBlocks/issues)
- [💬 Discussions](https://github.com/leegramling/agentBlocks/discussions)
- [📦 Releases](https://github.com/leegramling/agentBlocks/releases)