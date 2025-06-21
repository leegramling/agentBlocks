# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AgentBlocks is a visual node-based programming environment for building CLI tools and agents. It consists of:

- **Frontend**: React TypeScript application with Vite build system
- **Backend**: Python Flask API server for workflow management
- **Architecture**: Dual-level visual programming - high-level node connections and low-level Scratch-like block programming

## Development Commands

### Frontend (React + Vite)
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend (Flask)
```bash
cd frontend/backend
source venv/bin/activate    # Activate virtual environment
pip install -r requirements.txt  # Install dependencies
python app.py               # Start Flask server (http://localhost:5000)
```

## Architecture

### High-Level Node System
- **WorkflowEditor**: Main canvas for creating visual workflows
- **NodeComponent**: Individual nodes (bash, regex, curl, scp, etc.)
- **ConnectionLine**: Visual connections between node inputs/outputs
- **NodePalette**: Drag-and-drop node creation interface

### Low-Level Block System  
- **BlockEditor**: Scratch-like programming environment within nodes
- **BlockComponent**: Individual programming blocks with connection points
- **BlockPalette**: Categorized blocks (Variables, Text, Network, Files, System, Logic, Math, Arrays)

### API Structure
- REST endpoints for workflow CRUD operations
- Node and connection management
- Future: Workflow execution engine

### Key Directories
- `frontend/src/components/`: React components
- `frontend/src/types/`: TypeScript interfaces
- `frontend/backend/`: Flask API server
- Node types: bash, regex, curl, scp, input, output, conditional, loop, transform, agent

## Development Notes

- Uses Tailwind CSS for styling with dark theme
- React Router for navigation between workflow and block editors
- Double-click nodes to open block editor in new window
- Drag-and-drop interface for both nodes and blocks
- Generated code preview in block editor