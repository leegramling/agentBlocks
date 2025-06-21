# AgentBlocks

AgentBlocks is a visual node-based programming environment for building CLI tools and agents. It provides an intuitive drag-and-drop interface for creating complex workflows and logic using a dual-level programming approach.

## 🏗️ Architecture

AgentBlocks consists of two main components:

- **Frontend**: React TypeScript application with Vite build system
- **Backend**: Python Flask API server for workflow management

### Dual-Level Visual Programming

1. **High-Level Node System**: Create workflows by connecting different node types (bash, regex, curl, scp, etc.)
2. **Low-Level Block Programming**: Scratch-like programming environment within individual nodes

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**

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

## 🎮 Usage

### Main Interface

The application features a three-panel layout:

- **Left Panel (5%)**: 
  - Top 25%: Icon toolbar for quick access to tools
  - Bottom 75%: Scrollable library of colored coding blocks (Variable, Assignment, If/Then, ForEach, While, Function, Execute)

- **Central Canvas (75%)**: 
  - Main workspace with grid background
  - Drag and drop nodes to create workflows
  - Connect nodes by dragging from outputs to inputs

- **Right Panel (20%)**:
  - Property table showing selected node details
  - Editable form fields for node configuration
  - Action buttons (Edit Blocks, Duplicate, Delete)

### Creating Workflows

1. **Add Nodes**: Click or drag coding blocks from the left panel to the canvas
2. **Configure Properties**: Select a node to view and edit its properties in the right panel
3. **Connect Nodes**: Drag from output ports to input ports to create connections
4. **Edit Block Logic**: Double-click nodes to open the block editor for Scratch-like programming

### Available Node Types

- **bash**: Execute shell commands
- **regex**: Pattern matching and text processing  
- **curl**: HTTP requests and API calls
- **scp**: File transfer operations
- **input**: Workflow input parameters
- **output**: Workflow output results
- **conditional**: If/else logic branching
- **loop**: Iteration and repetition
- **transform**: Data transformation
- **agent**: AI agent integration

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

### Project Structure

```
agentBlocks/
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── WorkflowEditor.tsx
│   │   │   ├── BlockEditor.tsx  
│   │   │   ├── NodePalette.tsx
│   │   │   ├── PropertiesPanel.tsx
│   │   │   └── ...
│   │   ├── types/          # TypeScript interfaces
│   │   └── index.css       # CSS styling with dark theme
│   ├── backend/
│   │   ├── app.py          # Flask API server
│   │   └── requirements.txt
│   └── package.json
├── CLAUDE.md               # Development guidelines
└── README.md              # This file
```

## 🌐 API Endpoints

The Flask backend provides the following REST endpoints:

- `GET /api/health` - Health check
- `GET /api/workflows` - List all workflows
- `POST /api/workflows` - Create new workflow
- `GET /api/workflows/{id}` - Get specific workflow
- `PUT /api/workflows/{id}` - Update workflow
- `POST /api/workflows/{id}/nodes` - Add node to workflow
- `POST /api/workflows/{id}/connections` - Add connection to workflow
- `POST /api/execute/{id}` - Execute workflow (not yet implemented)

## 🎨 Styling

The application uses a dark theme with:
- **Primary Background**: `#111827` (gray-900)
- **Secondary Background**: `#1f2937` (gray-800) 
- **Border Color**: `#374151` (gray-700)
- **Text Color**: `#ffffff` (white)
- **Grid Pattern**: Subtle dot grid for visual guidance

### Block Colors

- **Variable**: Orange (`#f97316`)
- **Assignment**: Yellow (`#eab308`)
- **If/Then**: Green (`#22c55e`)
- **ForEach**: Purple (`#8b5cf6`)
- **While**: Pink (`#ec4899`)
- **Function**: Blue (`#3b82f6`)
- **Execute**: Red (`#ef4444`)

## 🔄 Navigation

- **Main Route** (`/`): Workflow Editor
- **Workflow Route** (`/workflow/:id`): Specific workflow editor
- **Block Editor Route** (`/block-editor/:nodeId`): Scratch-like block programming interface

## 🛠️ Technologies Used

### Frontend
- **React** 19.1.0 - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Lucide React** - Icon library
- **CSS** - Custom styling (replaced Tailwind)

### Backend
- **Flask** 3.0.3 - Web framework
- **Flask-CORS** - Cross-origin resource sharing
- **Python-dotenv** - Environment variables

## 🚧 Current Status

This is the **first interface mockup** with:
- ✅ Complete UI layout and styling
- ✅ Node palette with draggable blocks
- ✅ Property panel with table view
- ✅ Basic Flask API structure
- ⚠️ Workflow execution engine (planned)
- ⚠️ Block editor functionality (in development)
- ⚠️ Node connection logic (in development)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly  
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.