# Node Specifications

This document explains how nodes are created, managed, and executed within the AgentBlocks system.

## Node Architecture

AgentBlocks uses a dual-level visual programming approach:
- **High-level**: Node-based workflow editor with drag-and-drop connections
- **Low-level**: Scratch-like block programming within individual nodes

## Node Creation

### JSON Node Definition

Nodes are defined using a standardized JSON structure:

```json
{
  "id": "unique-node-id",
  "type": "node_type",
  "position": { "x": 100, "y": 200 },
  "panelId": "main-panel",
  "properties": {
    "key": "value",
    "parameter": "setting"
  },
  "inputs": [
    {
      "id": "input1",
      "name": "Input Name",
      "type": "string|number|boolean|any",
      "required": true
    }
  ],
  "outputs": [
    {
      "id": "output1", 
      "name": "Output Name",
      "type": "string|number|boolean|any"
    }
  ],
  "parentId": "optional-parent-node-id",
  "indentLevel": 0,
  "children": ["child-node-id-1", "child-node-id-2"]
}
```

### Node Types and Categories

#### File Operations
- `find_files` - Search for files matching patterns
- `read_file` - Read file contents
- `write_file` - Write content to file
- `copy_file` - Copy files or directories

#### Text Processing
- `variable` - Store and retrieve values
- `print` - Output text to console
- `text_transform` - Modify text content
- `regex_match` - Pattern matching with regex
- `increment` - Add 1 to a variable

#### Data Structures
- `list_create` - Create a new list
- `list_append` - Add item to end of list
- `list_get` - Get item from list by index
- `list_length` - Get length of list
- `set_create` - Create a new set
- `dict_create` - Create a new dictionary

#### Control Flow
- `if-then` - Conditional execution
- `foreach` - Loop over collections
- `while` - Conditional loops
- `function` - Reusable code blocks

#### Network Operations
- `http_request` - Make web API calls
- `download_file` - Download files from URLs
- `webhook` - Receive HTTP callbacks

#### Custom Code
- `python_code` - Custom Python scripts
- `pycode` - Python code with textarea input
- `shell_command` - Execute shell commands

#### AI Integration
- `ai_text_gen` - Generate text with AI
- `ai_code_gen` - Generate code with AI
- `ai_analysis` - Analyze content with AI

## Adding Nodes to the System

### 1. Define Node in NodePalette.tsx

Add the node definition to the `blockDefinitions` array:

```typescript
{
  type: 'my_new_node',
  name: 'My New Node', 
  description: 'Description of what this node does',
  category: 'custom',
  icon: '🆕',
  blockMode: 'visual' // 'visual' | 'code' | 'hybrid' | 'ai'
}
```

### 2. Add Node Properties (PropertiesPanel.tsx)

Define the properties interface for the node:

```typescript
case 'my_new_node':
  return (
    <div className="property-group">
      <label className="property-label">Parameter Name:</label>
      <input
        type="text"
        value={node.properties.parameterName || ''}
        onChange={(e) => updateProperty('parameterName', e.target.value)}
        className="property-input"
      />
    </div>
  );
```

### 3. Add Default Properties (WorkflowEditor.tsx)

Add default properties in the `getDefaultProperties` function:

```typescript
case 'my_new_node':
  return { 
    parameterName: 'default_value',
    setting: 'default_setting'
  };
```

### 4. Add Code Generation (WorkflowEditor.tsx)

Add code generation logic in `generateNodeCode`:

```typescript
case 'my_new_node':
  const param = node.properties.parameterName || 'default';
  return `${indent}# My New Node\n${indent}result = my_function("${param}")\n`;
```

### 5. Add Visual Styling (NodeComponent.tsx)

Add icon and color definitions:

```typescript
// In getNodeIcon()
my_new_node: '🆕',

// In getNodeColor() 
my_new_node: '#ff6b6b',
```

### 6. Add CSS Styling (index.css)

Add node-specific styling if needed:

```css
.workflow-node[data-type="my_new_node"] {
  border-left-color: #ff6b6b;
}

.workflow-node[data-type="my_new_node"] .node-icon {
  background-color: #ff6b6b;
}
```

## Node Execution Model

### 1. Execution Order

Nodes are executed based on their hierarchical structure and position:

1. **Top-level nodes** (no parent) are executed first, sorted by Y position
2. **Child nodes** are executed within their parent's scope
3. **Control flow nodes** (foreach, if-then, while) execute their children recursively

### 2. Code Generation Process

```typescript
// 1. Filter top-level nodes (no parentId)
const topLevelNodes = nodes.filter(node => !node.parentId)
  .sort((a, b) => a.position.y - b.position.y);

// 2. Generate code recursively
topLevelNodes.forEach(node => {
  code += generateNodeCode(node, 0); // 0 = base indent level
});

// 3. Child nodes are processed within parent's generateNodeCode()
const childNodes = getChildNodes(parentId)
  .sort((a, b) => a.position.y - b.position.y);

childNodes.forEach(child => {
  code += generateNodeCode(child, indentLevel + 1);
});
```

### 3. Execution Context

Each node executes within a specific context:

- **Variables**: Shared across all nodes in the same scope
- **Scope**: Child nodes inherit parent scope + their own local scope
- **Data Flow**: Connections pass data between node outputs and inputs
- **Error Handling**: Errors in child nodes can affect parent execution

### 4. Parent-Child Relationships

#### Control Structure Parents
Only these node types can have children:
- `foreach` - Children execute for each iteration
- `if-then` - Children execute when condition is true
- `while` - Children execute while condition is true  
- `function` - Children define the function body

#### Indentation and Scope
- Child nodes are indented 4 spaces per level
- `indentLevel` property tracks nesting depth
- Visual indentation shows hierarchy in UI

### 5. Execution Flow Example

```python
# Generated from node hierarchy:
# Variable (counter = 0)
# List Create (fruits = ["apple", "orange", "pear"])  
# Foreach (for fruit in fruits)
#   ├── Print (print counter + fruit)
#   └── Increment (counter += 1)

counter = "0"
fruits = ["apple", "orange", "pear"]
for fruit in fruits:
    print(f"{counter}. {fruit}")
    counter = counter + 1
```

## Best Practices

### Node Design
1. **Single Responsibility**: Each node should do one thing well
2. **Clear Naming**: Use descriptive names and consistent terminology
3. **Proper Categories**: Group related nodes together
4. **Good Defaults**: Provide sensible default values

### Property Design
1. **Validation**: Validate input parameters
2. **Type Safety**: Use appropriate input types
3. **Help Text**: Provide clear descriptions
4. **Required vs Optional**: Mark required properties clearly

### Code Generation
1. **Safe Strings**: Escape user input properly
2. **Error Handling**: Generate robust code
3. **Indentation**: Respect Python syntax rules
4. **Comments**: Add helpful comments to generated code

### Testing
1. **Unit Tests**: Test individual node functionality
2. **Integration Tests**: Test node combinations
3. **Edge Cases**: Test with unusual inputs
4. **Performance**: Test with large workflows