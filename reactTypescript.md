# React TypeScript for Senior C++ Developers with Qt Experience

## Table of Contents
1. [Introduction and Mental Model](#introduction-and-mental-model)
2. [TypeScript Fundamentals for C++ Developers](#typescript-fundamentals-for-cpp-developers)
3. [React Components vs Qt Widgets](#react-components-vs-qt-widgets)
4. [State Management vs Qt Signals/Slots](#state-management-vs-qt-signalsslots)
5. [Event Handling and Lifecycle](#event-handling-and-lifecycle)
6. [Advanced Patterns and Hooks](#advanced-patterns-and-hooks)
7. [Architecture and Project Organization](#architecture-and-project-organization)
8. [Performance Optimization](#performance-optimization)
9. [Debugging and Development Tools](#debugging-and-development-tools)
10. [Common Patterns in AgentBlocks Codebase](#common-patterns-in-agentblocks-codebase)

## Introduction and Mental Model

### Key Conceptual Shifts from Qt/C++

**Qt Widget Model → React Component Model:**
- Qt: Inheritance-based widget hierarchy (`QWidget`, `QMainWindow`)
- React: Composition-based component trees (functional components)

**Qt Signals/Slots → React Props/Callbacks:**
- Qt: `connect(sender, SIGNAL(clicked()), receiver, SLOT(handleClick()))`
- React: `<Button onClick={handleClick} />`

**Qt Event Loop → React Virtual DOM:**
- Qt: Manual UI updates, explicit repaints
- React: Declarative UI, automatic reconciliation

### Core Philosophy Differences

```cpp
// Qt/C++ - Imperative
void MainWindow::addNode() {
    Node* node = new Node();
    node->setPosition(100, 100);
    scene->addItem(node);
    nodeList->addItem(node->getName());
    update(); // Manual refresh
}
```

```tsx
// React/TypeScript - Declarative
const WorkflowEditor: React.FC = () => {
    const [nodes, setNodes] = useState<Node[]>([]);
    
    const addNode = () => {
        setNodes(prev => [...prev, {
            id: generateId(),
            position: { x: 100, y: 100 },
            type: 'default'
        }]);
        // UI updates automatically
    };
    
    return (
        <div>
            {nodes.map(node => <NodeComponent key={node.id} node={node} />)}
        </div>
    );
};
```

## TypeScript Fundamentals for C++ Developers

### Type System Comparison

**C++ Templates vs TypeScript Generics:**

```cpp
// C++ Template
template<typename T>
class Container {
    std::vector<T> items;
public:
    void add(const T& item) { items.push_back(item); }
    T get(size_t index) const { return items[index]; }
};
```

```typescript
// TypeScript Generic
interface Container<T> {
    items: T[];
    add(item: T): void;
    get(index: number): T;
}

// Usage from AgentBlocks
interface WorkflowNode {
    id: string;
    type: string;
    position: Position;
    properties: Record<string, any>;
}

interface WorkflowEditorProps {
    onConsoleOutput?: (updater: (prev: string[]) => string[]) => void;
    onNodeCountChange?: (count: number) => void;
}
```

### Interface Definitions (Like C++ Headers)

```typescript
// types.ts - Similar to C++ header files
export interface Position {
    x: number;
    y: number;
}

export interface WorkflowNode {
    id: string;
    type: string;
    position: Position;
    properties: Record<string, any>;
    inputs?: NodeInput[];
    outputs?: NodeOutput[];
    panelId?: string;
    indentLevel?: number;
}

export interface Connection {
    id: string;
    source_node: string;
    source_output: string;
    target_node: string;
    target_input: string;
}
```

### Union Types and Discriminated Unions

```typescript
// Similar to C++ enum class but more powerful
type NodeType = 'variable' | 'print' | 'if-then' | 'foreach' | 'function';

// Discriminated unions (like C++ std::variant)
interface VariableNode {
    type: 'variable';
    properties: {
        name: string;
        value: string;
    };
}

interface PrintNode {
    type: 'print';
    properties: {
        message: string;
    };
}

type AnyNode = VariableNode | PrintNode;

// Type guards (like dynamic_cast)
function isVariableNode(node: AnyNode): node is VariableNode {
    return node.type === 'variable';
}
```

## React Components vs Qt Widgets

### Functional Components (Preferred Modern Approach)

Think of functional components like Qt widget factories that return UI descriptions:

```tsx
// From PropertiesPanel.tsx
interface PropertiesPanelProps {
    selectedNode: WorkflowNode | null;
    nodes: WorkflowNode[];
    onUpdateNode: (node: WorkflowNode) => void;
    onNodeSelect: (node: WorkflowNode) => void;
}

const PropertiesPanel = forwardRef<PropertiesPanelRef, PropertiesPanelProps>(({ 
    selectedNode, 
    nodes,
    onUpdateNode,
    onNodeSelect 
}, ref) => {
    // State hooks (like member variables)
    const propertyInputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

    // Imperative handle (like Qt public slots)
    useImperativeHandle(ref, () => ({
        focusFirstProperty: () => {
            const firstInputKey = Object.keys(propertyInputRefs.current)[0];
            if (firstInputKey && propertyInputRefs.current[firstInputKey]) {
                propertyInputRefs.current[firstInputKey]?.focus();
            }
        }
    }));

    // Event handlers (like Qt slot methods)
    const handlePropertyChange = (key: string, value: any) => {
        if (!selectedNode) return;
        
        const updatedNode = {
            ...selectedNode,
            properties: {
                ...selectedNode.properties,
                [key]: value
            }
        };
        onUpdateNode(updatedNode);
    };

    // Render method (like Qt paintEvent but declarative)
    return (
        <div className="right-panel">
            {selectedNode ? (
                <div className="panel-content">
                    {/* Property editors */}
                    {Object.entries(getNodeProperties(selectedNode)).map(([key, config]) => (
                        <div key={key} className="property-group">
                            <label className="property-label">{config.label}</label>
                            {renderPropertyEditor(key, selectedNode.properties[key], config.type)}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-selection">
                    <p>Select a node to view properties</p>
                </div>
            )}
        </div>
    );
});
```

### Component Composition (Like Qt Layout Managers)

```tsx
// From WorkflowEditor.tsx - Main layout composition
const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ 
    onConsoleOutput,
    onExecutionState,
    onNodeCountChange 
}) => {
    return (
        <div className="editor-workspace">
            {/* Left Panel - Like QDockWidget */}
            <NodePalette onAddNode={handleAddNode} />

            {/* Center Area - Like QSplitter */}
            <div className="canvas-container">
                {/* Toolbar - Like QToolBar */}
                <div className="canvas-toolbar">
                    <div className="toolbar-left">
                        {selectedNode && (
                            <>
                                <button onClick={() => propertiesPanelRef.current?.focusFirstProperty()}>
                                    ✏️ Edit
                                </button>
                                <button onClick={handleDuplicateSelectedNode}>
                                    📋 Duplicate
                                </button>
                            </>
                        )}
                    </div>
                    <div className="toolbar-center">
                        <span>Zoom: {Math.round(canvasZoom * 100)}%</span>
                    </div>
                </div>

                {/* Main Canvas - Like QGraphicsView */}
                <div className="canvas-area" 
                     onWheel={handleCanvasWheel}
                     onMouseDown={handleCanvasMouseDown}>
                    
                    {/* Panels - Like QGraphicsItems */}
                    {panels.map(panel => (
                        <PanelComponent
                            key={panel.id}
                            panel={panel}
                            nodes={nodes}
                            onSelect={handlePanelSelect}
                            onDrag={handlePanelDrag}
                        />
                    ))}
                    
                    {/* Nodes - Like custom QGraphicsItems */}
                    {nodes.map(node => (
                        <NodeComponent
                            key={node.id}
                            node={node}
                            selected={selectedNode?.id === node.id}
                            onSelect={handleNodeSelect}
                            onDrag={handleNodeDrag}
                        />
                    ))}
                </div>
            </div>

            {/* Right Panel - Like another QDockWidget */}
            <PropertiesPanel 
                ref={propertiesPanelRef}
                selectedNode={selectedNode}
                nodes={nodes}
                onUpdateNode={handleUpdateNode}
                onNodeSelect={handleNodeSelect}
            />
        </div>
    );
};
```

## State Management vs Qt Signals/Slots

### useState Hook (Like Qt Properties)

```tsx
// From WorkflowEditor.tsx
const WorkflowEditor: React.FC<WorkflowEditorProps> = () => {
    // State declarations (like private member variables)
    const [nodes, setNodes] = useState<WorkflowNode[]>([]);
    const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
    const [canvasZoom, setCanvasZoom] = useState(1);
    const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });

    // State updates trigger re-renders (like Qt property notifications)
    const handleAddNode = useCallback((type: string, position: Position) => {
        const newNode: WorkflowNode = {
            id: `${type}-${Date.now()}`,
            type,
            position,
            properties: {}
        };
        
        // Functional update (like Qt property setter)
        setNodes(prev => [...prev, newNode]);
    }, []);
};
```

### useEffect Hook (Like Qt Event Handlers + Timers)

```tsx
// From WorkflowEditor.tsx - Various lifecycle management
const WorkflowEditor: React.FC<WorkflowEditorProps> = () => {
    // Component mount/unmount (like constructor/destructor)
    useEffect(() => {
        // Initialization (like Qt constructor)
        const savedWorkflow = localStorage.getItem('agentblocks_workflow');
        if (savedWorkflow) {
            const workflowData = JSON.parse(savedWorkflow);
            setNodes(workflowData.nodes);
            setConnections(workflowData.connections || []);
        }
        
        // Cleanup (like Qt destructor)
        return () => {
            // Save state before unmount
            localStorage.setItem('agentblocks_workflow', JSON.stringify({
                nodes, connections, panels
            }));
        };
    }, []); // Empty dependency array = run once on mount

    // State synchronization (like Qt property bindings)
    useEffect(() => {
        onNodeCountChange?.(nodes.length);
    }, [nodes.length, onNodeCountChange]);

    // Event listener management (like Qt connect/disconnect)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

            if (e.key === 'Delete' && selectedNode && !isTyping) {
                handleDeleteSelectedNode();
            } else if (e.key === ' ' && !e.repeat && !isTyping) {
                e.preventDefault();
                handleRecenterCanvas();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNode, handleDeleteSelectedNode, handleRecenterCanvas]);
};
```

### Callback Props (Like Qt Signals)

```tsx
// From Console.tsx - Emitting events upward
interface ConsoleProps {
    output: string[];
    isExecuting: boolean;
    onExecute: () => void;        // Like Qt signal
    onClear: () => void;          // Like Qt signal
    onGenerateCode?: () => string; // Optional callback
}

const Console: React.FC<ConsoleProps> = ({ 
    output, 
    isExecuting, 
    onExecute, 
    onClear,
    onGenerateCode 
}) => {
    const handleShowCode = () => {
        if (onGenerateCode) {
            const code = onGenerateCode();
            setGeneratedCode(code);
            setIsCodeModalOpen(true);
        }
    };

    return (
        <div className="console-panel">
            <button onClick={onExecute} disabled={isExecuting}>
                {isExecuting ? 'Running...' : 'Execute'}
            </button>
            <button onClick={onClear}>Clear</button>
            <button onClick={handleShowCode}>Code</button>
        </div>
    );
};
```

### useCallback and useMemo (Performance Optimization)

```tsx
// From WorkflowEditor.tsx - Preventing unnecessary re-renders
const WorkflowEditor: React.FC<WorkflowEditorProps> = () => {
    // useCallback - Like Qt slot with stable address
    const handleNodeDrag = useCallback((nodeId: string, position: Position) => {
        setNodes(prev => prev.map(node => 
            node.id === nodeId ? { ...node, position } : node
        ));
    }, []); // Dependencies determine when callback is recreated

    const handleDuplicateSelectedNode = useCallback(() => {
        if (selectedNode) {
            const newNode: WorkflowNode = {
                ...selectedNode,
                id: `${selectedNode.type}-${Date.now()}`,
                position: {
                    x: selectedNode.position.x + 30,
                    y: selectedNode.position.y + 30
                }
            };
            setNodes(prev => [...prev, newNode]);
            setSelectedNode(newNode);
        }
    }, [selectedNode]);

    // useMemo - Like computed property with caching
    const filteredNodes = useMemo(() => {
        return nodes.filter(node => {
            if (!node.panelId) return true;
            const panel = panels.find(p => p.id === node.panelId);
            return panel?.isExpanded;
        });
    }, [nodes, panels]);

    // Expensive computation cached until dependencies change
    const generatePythonCode = useCallback(() => {
        return generatePythonCodeFromNodes(nodes);
    }, [nodes]);
};
```

## Event Handling and Lifecycle

### Mouse and Keyboard Events

```tsx
// From NodeComponent.tsx - Custom drag handling
const NodeComponent: React.FC<NodeComponentProps> = ({ node, onDrag, onSelect }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
    const nodeRef = useRef<HTMLDivElement>(null);

    // Mouse down (like Qt mousePressEvent)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.detail === 2) {
            // Double click - open block editor
            window.open(`/block-editor/${node.id}`, '_blank');
            return;
        }

        setIsDragging(true);
        onSelect(node);
        
        // Calculate relative mouse position
        const rect = nodeRef.current?.getBoundingClientRect();
        if (rect) {
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    // Mouse move (like Qt mouseMoveEvent)
    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            const canvasElement = document.querySelector('.canvas-content');
            if (canvasElement) {
                const canvasRect = canvasElement.getBoundingClientRect();
                const newPosition = {
                    x: e.clientX - canvasRect.left - dragOffset.x,
                    y: e.clientY - canvasRect.top - dragOffset.y
                };
                onDrag(node.id, newPosition);
            }
        }
    };

    // Mouse up (like Qt mouseReleaseEvent)
    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Event listener management (like Qt event filters)
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragOffset]);

    return (
        <div
            ref={nodeRef}
            onMouseDown={handleMouseDown}
            style={{
                position: 'absolute',
                left: node.position.x,
                top: node.position.y,
                cursor: 'move'
            }}
        >
            {/* Node content */}
        </div>
    );
};
```

### Form Handling and Validation

```tsx
// From PropertiesPanel.tsx - Form input handling
const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedNode, onUpdateNode }) => {
    const propertyInputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

    // Input validation and change handling
    const handlePropertyChange = (key: string, value: any) => {
        if (!selectedNode) return;
        
        // Validation logic (like Qt validator)
        let validatedValue = value;
        if (key === 'timeout' && typeof value === 'string') {
            const numValue = parseFloat(value);
            validatedValue = isNaN(numValue) ? 0 : numValue;
        }
        
        // Immutable update pattern
        const updatedNode = {
            ...selectedNode,
            properties: {
                ...selectedNode.properties,
                [key]: validatedValue
            }
        };
        onUpdateNode(updatedNode);
    };

    // Tab navigation between fields
    const handleTabNavigation = (e: React.KeyboardEvent, currentKey: string) => {
        if (e.key === 'Tab') {
            const keys = Object.keys(propertyInputRefs.current);
            const currentIndex = keys.indexOf(currentKey);
            const nextIndex = e.shiftKey 
                ? (currentIndex - 1 + keys.length) % keys.length
                : (currentIndex + 1) % keys.length;
            
            const nextKey = keys[nextIndex];
            if (nextKey && propertyInputRefs.current[nextKey]) {
                e.preventDefault();
                propertyInputRefs.current[nextKey]?.focus();
            }
        }
    };

    // Dynamic form generation based on node type
    const renderPropertyEditor = (key: string, value: any, type: string = 'string') => {
        switch (type) {
            case 'boolean':
                return (
                    <input
                        ref={(el) => { propertyInputRefs.current[key] = el; }}
                        type="checkbox"
                        checked={value || false}
                        onChange={(e) => handlePropertyChange(key, e.target.checked)}
                        onKeyDown={(e) => handleTabNavigation(e, key)}
                    />
                );
            case 'number':
                return (
                    <input
                        ref={(el) => { propertyInputRefs.current[key] = el; }}
                        type="number"
                        value={value || ''}
                        onChange={(e) => handlePropertyChange(key, parseFloat(e.target.value))}
                        onKeyDown={(e) => handleTabNavigation(e, key)}
                        className="property-input"
                    />
                );
            default:
                return (
                    <input
                        ref={(el) => { propertyInputRefs.current[key] = el; }}
                        type="text"
                        value={value || ''}
                        onChange={(e) => handlePropertyChange(key, e.target.value)}
                        onKeyDown={(e) => handleTabNavigation(e, key)}
                        className="property-input"
                    />
                );
        }
    };
};
```

## Advanced Patterns and Hooks

### Custom Hooks (Like Qt Helper Classes)

```tsx
// Custom hook for canvas zoom and pan
const useCanvasNavigation = () => {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const zoomFactor = 0.1;
        const newZoom = e.deltaY > 0 
            ? Math.max(0.2, zoom - zoomFactor)
            : Math.min(3, zoom + zoomFactor);
        setZoom(newZoom);
    }, [zoom]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
            setIsPanning(true);
        }
    }, []);

    const recenter = useCallback((bounds: { minX: number, minY: number, maxX: number, maxY: number }) => {
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        setPan({ x: 400 - centerX, y: 300 - centerY });
    }, []);

    return {
        zoom,
        pan,
        isPanning,
        handleWheel,
        handleMouseDown,
        recenter
    };
};

// Usage in component
const WorkflowEditor: React.FC = () => {
    const { zoom, pan, handleWheel, recenter } = useCanvasNavigation();
    
    // Use the hook's functionality
    const handleRecenterCanvas = useCallback(() => {
        if (panels.length === 0) return;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        panels.forEach(panel => {
            minX = Math.min(minX, panel.position.x);
            minY = Math.min(minY, panel.position.y);
            maxX = Math.max(maxX, panel.position.x + panel.size.width);
            maxY = Math.max(maxY, panel.position.y + panel.size.height);
        });
        
        recenter({ minX, minY, maxX, maxY });
    }, [panels, recenter]);
};
```

### forwardRef and useImperativeHandle (Like Qt Public Interface)

```tsx
// PropertiesPanel exposes imperative methods
export interface PropertiesPanelRef {
    focusFirstProperty: () => void;
}

const PropertiesPanel = forwardRef<PropertiesPanelRef, PropertiesPanelProps>(({ 
    selectedNode, 
    onUpdateNode 
}, ref) => {
    const propertyInputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

    // Expose imperative API (like Qt public slots)
    useImperativeHandle(ref, () => ({
        focusFirstProperty: () => {
            const firstInputKey = Object.keys(propertyInputRefs.current)[0];
            if (firstInputKey && propertyInputRefs.current[firstInputKey]) {
                propertyInputRefs.current[firstInputKey]?.focus();
            }
        }
    }));

    return (
        <div className="properties-panel">
            {/* Property inputs */}
        </div>
    );
});

// Usage in parent component
const WorkflowEditor: React.FC = () => {
    const propertiesPanelRef = useRef<PropertiesPanelRef>(null);

    const handleEditNode = () => {
        // Call imperative method
        propertiesPanelRef.current?.focusFirstProperty();
    };

    return (
        <div>
            <button onClick={handleEditNode}>Edit Node</button>
            <PropertiesPanel 
                ref={propertiesPanelRef}
                selectedNode={selectedNode}
                onUpdateNode={handleUpdateNode}
            />
        </div>
    );
};
```

### Context API (Like Qt Application-wide Settings)

```tsx
// Theme context for application-wide theming
interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
    colors: {
        primary: string;
        background: string;
        text: string;
    };
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDark, setIsDark] = useState(true);

    const colors = {
        primary: isDark ? '#3b82f6' : '#2563eb',
        background: isDark ? '#111827' : '#ffffff',
        text: isDark ? '#ffffff' : '#000000'
    };

    const toggleTheme = () => setIsDark(!isDark);

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Custom hook for using theme
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

// Usage in components
const NodeComponent: React.FC = () => {
    const { colors } = useTheme();
    
    return (
        <div style={{ backgroundColor: colors.background, color: colors.text }}>
            {/* Node content */}
        </div>
    );
};
```

## Architecture and Project Organization

### File Structure (Like Qt Project Organization)

```
frontend/src/
├── components/           # Like Qt widgets
│   ├── WorkflowEditor.tsx    # Main editor (like QMainWindow)
│   ├── NodeComponent.tsx     # Individual nodes (like QGraphicsItem)
│   ├── PropertiesPanel.tsx   # Property editor (like QPropertyBrowser)
│   ├── Console.tsx           # Output console (like QTextEdit)
│   └── Layout.tsx            # App layout (like QSplitter)
├── types/               # Type definitions (like .h files)
│   └── index.ts             # Common interfaces
├── hooks/               # Custom hooks (like Qt helper classes)
│   ├── useCanvas.ts         # Canvas management
│   └── useWorkflow.ts       # Workflow state
├── utils/               # Utility functions (like Qt static helpers)
│   ├── codeGenerator.ts     # Python code generation
│   └── storage.ts           # LocalStorage helpers
└── App.tsx              # Application root (like main.cpp)
```

### Component Communication Patterns

```tsx
// App.tsx - Top-level state management (like Qt Application)
function App() {
    // Centralized state
    const [nodeCount, setNodeCount] = useState(0);
    const [isExecuting, setIsExecuting] = useState(false);
    
    // Callback registration pattern (like Qt signal forwarding)
    const [executeCallback, setExecuteCallback] = useState<(() => void) | null>(null);
    const [generateCodeCallback, setGenerateCodeCallback] = useState<(() => string) | null>(null);

    const handleExecute = useCallback(() => {
        if (executeCallback) {
            executeCallback();
        }
    }, [executeCallback]);

    return (
        <Router>
            <Layout
                nodeCount={nodeCount}
                isExecuting={isExecuting}
                onExecute={handleExecute}
            >
                <WorkflowEditor 
                    onNodeCountChange={setNodeCount}
                    onExecutionState={setIsExecuting}
                    onRegisterExecute={setExecuteCallback}
                    onRegisterGenerateCode={setGenerateCodeCallback}
                />
            </Layout>
        </Router>
    );
}

// Layout.tsx - Layout manager (like QMainWindow)
const Layout: React.FC<LayoutProps> = ({ 
    children, 
    nodeCount, 
    isExecuting, 
    onExecute 
}) => {
    return (
        <div className="layout">
            {/* Menu bar */}
            <div className="menu-bar">
                <button onClick={onExecute} disabled={isExecuting}>
                    {isExecuting ? 'Running...' : 'Execute'}
                </button>
            </div>

            {/* Main content */}
            <div className="main-content">
                {children}
            </div>

            {/* Status bar */}
            <div className="status-bar">
                <span>{nodeCount} nodes</span>
                <span>{isExecuting ? 'Running...' : 'Ready'}</span>
            </div>
        </div>
    );
};

// WorkflowEditor.tsx - Main editor logic
const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
    onNodeCountChange,
    onExecutionState,
    onRegisterExecute,
    onRegisterGenerateCode
}) => {
    const [nodes, setNodes] = useState<WorkflowNode[]>([]);

    // Register callbacks with parent (like Qt signal connections)
    useEffect(() => {
        onRegisterExecute?.(executeWorkflow);
        onRegisterGenerateCode?.(generatePythonCode);
    }, [executeWorkflow, generatePythonCode]);

    // Notify parent of state changes
    useEffect(() => {
        onNodeCountChange?.(nodes.length);
    }, [nodes.length, onNodeCountChange]);

    const executeWorkflow = useCallback(async () => {
        onExecutionState?.(true);
        try {
            // Execute workflow logic
            const code = generatePythonCodeFromNodes(nodes);
            // ... execution logic
        } finally {
            onExecutionState?.(false);
        }
    }, [nodes, onExecutionState]);

    return (
        <div className="editor-workspace">
            {/* Editor components */}
        </div>
    );
};
```

## Performance Optimization

### React.memo (Like Qt Widget Optimization)

```tsx
// Prevent unnecessary re-renders of expensive components
const NodeComponent = React.memo<NodeComponentProps>(({ 
    node, 
    selected, 
    onSelect, 
    onDrag 
}) => {
    return (
        <div className={`workflow-node ${selected ? 'selected' : ''}`}>
            <div className="node-icon">{getNodeIcon(node.type)}</div>
            <div className="node-title">{node.type}</div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function (like Qt's widget update optimization)
    return (
        prevProps.node.id === nextProps.node.id &&
        prevProps.node.position.x === nextProps.node.position.x &&
        prevProps.node.position.y === nextProps.node.position.y &&
        prevProps.selected === nextProps.selected
    );
});

// Memoized expensive computations
const WorkflowEditor: React.FC = () => {
    const [nodes, setNodes] = useState<WorkflowNode[]>([]);
    const [panels, setPanels] = useState<WorkflowPanel[]>([]);

    // Expensive filtering operation - only recalculate when dependencies change
    const visibleNodes = useMemo(() => {
        return nodes.filter(node => {
            if (!node.panelId) return true;
            const panel = panels.find(p => p.id === node.panelId);
            return panel?.isExpanded;
        });
    }, [nodes, panels]);

    // Memoized Python code generation
    const generatedCode = useMemo(() => {
        return generatePythonCodeFromNodes(nodes);
    }, [nodes]);

    return (
        <div>
            {visibleNodes.map(node => (
                <NodeComponent key={node.id} node={node} />
            ))}
        </div>
    );
};
```

### Virtual Scrolling (For Large Lists)

```tsx
// For rendering thousands of items efficiently
import { FixedSizeList as List } from 'react-window';

const NodeList: React.FC<{ nodes: WorkflowNode[] }> = ({ nodes }) => {
    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const node = nodes[index];
        return (
            <div style={style}>
                <NodeComponent node={node} />
            </div>
        );
    };

    return (
        <List
            height={600}
            itemCount={nodes.length}
            itemSize={50}
            width="100%"
        >
            {Row}
        </List>
    );
};
```

## Debugging and Development Tools

### React Developer Tools

Similar to Qt's debugger, React has browser extensions for debugging:

1. **React Developer Tools** - Component hierarchy and props inspection
2. **Redux DevTools** - State management debugging (if using Redux)

### TypeScript Error Debugging

```typescript
// Common TypeScript errors and solutions

// Error: Property 'foo' does not exist on type 'Node'
interface WorkflowNode {
    id: string;
    type: string;
    // Add missing property
    foo?: string;  // Optional property
}

// Error: Type 'string | undefined' is not assignable to type 'string'
const getNodeName = (node: WorkflowNode): string => {
    // Use type guards or defaults
    return node.properties.name || 'Unnamed Node';
    
    // Or use non-null assertion (be careful!)
    return node.properties.name!;
};

// Error: Cannot invoke an object which is possibly 'undefined'
const handleClick = () => {
    // Check callback exists before calling
    if (onNodeSelect) {
        onNodeSelect(node);
    }
    
    // Or use optional chaining
    onNodeSelect?.(node);
};
```

### Common Debugging Patterns

```tsx
// Add logging to track component lifecycle
const WorkflowEditor: React.FC = () => {
    const [nodes, setNodes] = useState<WorkflowNode[]>([]);

    // Debug state changes
    useEffect(() => {
        console.log('Nodes changed:', nodes.length, nodes);
    }, [nodes]);

    // Debug render cycles
    console.log('WorkflowEditor render:', { nodesCount: nodes.length });

    // Debug callback execution
    const handleAddNode = useCallback((type: string, position: Position) => {
        console.log('Adding node:', type, position);
        setNodes(prev => {
            const newNodes = [...prev, newNode];
            console.log('New nodes array:', newNodes);
            return newNodes;
        });
    }, []);

    return <div>{/* Component JSX */}</div>;
};
```

## Common Patterns in AgentBlocks Codebase

### 1. Event Bubbling Pattern

```tsx
// Child component emits events upward
const NodeComponent: React.FC<NodeComponentProps> = ({ 
    node, 
    onSelect, 
    onDrag, 
    onStartConnection 
}) => {
    const handleClick = () => {
        onSelect(node);  // Bubble selection event up
    };

    const handleDragStart = (e: React.DragEvent) => {
        onStartConnection(node.id, 'output');  // Bubble connection event up
    };

    return (
        <div onClick={handleClick} onDragStart={handleDragStart}>
            {/* Node content */}
        </div>
    );
};

// Parent handles all events centrally
const WorkflowEditor: React.FC = () => {
    const handleNodeSelect = (node: WorkflowNode) => {
        setSelectedNode(node);
        // Update properties panel, etc.
    };

    const handleStartConnection = (nodeId: string, outputId: string) => {
        setConnecting({ nodeId, outputId });
        // Start connection visualization
    };

    return (
        <div>
            {nodes.map(node => (
                <NodeComponent
                    key={node.id}
                    node={node}
                    onSelect={handleNodeSelect}
                    onStartConnection={handleStartConnection}
                />
            ))}
        </div>
    );
};
```

### 2. Modal Management Pattern

```tsx
// From CodeModal.tsx - Modal component pattern
const CodeModal: React.FC<CodeModalProps> = ({ 
    isOpen, 
    onClose, 
    code, 
    title 
}) => {
    if (!isOpen) return null;  // Conditional rendering

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();  // Close on overlay click
        }
    };

    const handleSaveCode = () => {
        const blob = new Blob([code], { type: 'text/python' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated_workflow.py';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="code-modal-overlay" onClick={handleOverlayClick}>
            <div className="code-modal" onClick={e => e.stopPropagation()}>
                <div className="code-modal-header">
                    <h3>{title}</h3>
                    <button onClick={handleSaveCode}>Save</button>
                    <button onClick={onClose}>Close</button>
                </div>
                <div className="code-modal-content">
                    <pre><code>{code}</code></pre>
                </div>
            </div>
        </div>
    );
};

// Usage in parent component
const Console: React.FC = () => {
    const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');

    const handleShowCode = () => {
        const code = generateCode();
        setGeneratedCode(code);
        setIsCodeModalOpen(true);
    };

    return (
        <div>
            <button onClick={handleShowCode}>Show Code</button>
            <CodeModal
                isOpen={isCodeModalOpen}
                onClose={() => setIsCodeModalOpen(false)}
                code={generatedCode}
                title="Generated Python Code"
            />
        </div>
    );
};
```

### 3. Drag and Drop Pattern

```tsx
// From WorkflowEditor.tsx - Canvas drop handling
const WorkflowEditor: React.FC = () => {
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        
        const blockType = e.dataTransfer.getData('blockType');
        if (blockType) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
                const position = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
                handleAddNode(blockType, position);
            }
        }
    }, [handleAddNode]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();  // Allow drop
    }, []);

    return (
        <div 
            className="canvas-area"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            {/* Canvas content */}
        </div>
    );
};

// From NodePalette.tsx - Draggable items
const NodePalette: React.FC = () => {
    const handleDragStart = (e: React.DragEvent, blockType: string) => {
        e.dataTransfer.setData('blockType', blockType);
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="node-palette">
            {blockTypes.map(block => (
                <div
                    key={block.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, block.type)}
                    className="palette-block"
                >
                    {block.name}
                </div>
            ))}
        </div>
    );
};
```

### 4. Auto-save Pattern

```tsx
// From WorkflowEditor.tsx - Automatic persistence
const WorkflowEditor: React.FC = () => {
    const [nodes, setNodes] = useState<WorkflowNode[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);

    // Auto-save to localStorage when state changes
    useEffect(() => {
        const workflowData = {
            nodes,
            connections,
            panels,
            timestamp: Date.now()
        };
        
        // Debounce saves to avoid excessive writes
        const timeoutId = setTimeout(() => {
            localStorage.setItem('agentblocks_workflow', JSON.stringify(workflowData));
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [nodes, connections, panels]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const savedWorkflow = localStorage.getItem('agentblocks_workflow');
            if (savedWorkflow) {
                const workflowData = JSON.parse(savedWorkflow);
                setNodes(workflowData.nodes || []);
                setConnections(workflowData.connections || []);
                setPanels(workflowData.panels || []);
            }
        } catch (error) {
            console.error('Failed to load workflow:', error);
        }
    }, []);
};
```

## Conclusion

This tutorial covers the essential patterns and concepts needed to work effectively with the AgentBlocks React TypeScript codebase. The key mental shifts from Qt/C++ are:

1. **Declarative UI** - Describe what the UI should look like based on state
2. **Immutable State** - Always create new objects instead of modifying existing ones
3. **Functional Patterns** - Use hooks and functional components instead of classes
4. **Composition over Inheritance** - Build complex UIs by composing simple components
5. **Unidirectional Data Flow** - Data flows down via props, events bubble up via callbacks

The codebase demonstrates modern React patterns including hooks, TypeScript integration, performance optimization, and proper component architecture. Understanding these patterns will enable you to effectively debug and extend the AgentBlocks application.