# Events and Callbacks Pattern

This document explains the event and callback pattern used in AgentBlocks for cross-component communication.

## Overview

AgentBlocks uses a callback registration pattern to enable communication between the main App component and child components like WorkflowEditor and Layout. This pattern allows child components to expose functionality to their parents without tight coupling.

## Pattern Structure

### 1. Callback References in App.tsx

```typescript
// Callback refs store function references from child components
const performSearchCallbackRef = useRef<((term: string) => void) | null>(null);
const executeCallbackRef = useRef<(() => void) | null>(null);

// Setter functions that child components use to register their callbacks
const setPerformSearchCallback = useCallback((callback: ((term: string) => void) | null) => {
  performSearchCallbackRef.current = callback;
}, []);
```

### 2. Prop Interface in Child Components

```typescript
interface WorkflowEditorProps {
  // Callback registration props
  onRegisterPerformSearch?: (callback: (term: string) => void) => void;
  onRegisterExecute?: (callback: () => void) => void;
  
  // Event handler props
  onSearchChange?: (value: string) => void;
  onNodeCountChange?: (count: number) => void;
}
```

### 3. Callback Registration in Child Components

```typescript
// PREFERRED: Direct registration in component body
if (onRegisterPerformSearch) {
  onRegisterPerformSearch(performSearch);
}

// AVOID: useEffect registration (can be unreliable)
useEffect(() => {
  if (onRegisterPerformSearch) {
    onRegisterPerformSearch(performSearch);
  }
}, [onRegisterPerformSearch, performSearch]);
```

### 4. Using Callbacks in Parent

```typescript
const handleSearchChange = useCallback((value: string) => {
  setSearchValue(value);
  if (performSearchCallbackRef.current) {
    performSearchCallbackRef.current(value);
  }
}, []);
```

## Key Principles

### 1. Direct Registration vs useEffect

**✅ PREFERRED - Direct Registration:**
```typescript
// Register callbacks directly in component body
if (onRegisterPerformSearch) {
  onRegisterPerformSearch(performSearch);
}
```

**❌ AVOID - useEffect Registration:**
```typescript
// Can be unreliable due to dependency changes and render cycles
useEffect(() => {
  if (onRegisterPerformSearch) {
    onRegisterPerformSearch(performSearch);
  }
}, [onRegisterPerformSearch, performSearch]);
```

**Why Direct Registration Works Better:**
- Executes on every render, ensuring callback is always current
- Avoids dependency array issues that can prevent useEffect from running
- More predictable behavior during component mounting/unmounting cycles
- No timing issues with React's effect scheduling

### 2. Callback Dependencies

When creating callbacks with `useCallback`, be mindful of dependencies:

```typescript
// ✅ Stable dependencies
const performSearch = useCallback((term: string) => {
  const results = nodes.filter(/* search logic */);
  setSearchResults(results);
  if (results.length > 0) {
    handleNodeSelect(results[0]);
  }
}, [nodes, handleNodeSelect]); // Only depend on what you actually use
```

### 3. Ref vs State for Callbacks

Use `useRef` for storing callback functions, not state:

```typescript
// ✅ Correct - useRef for function storage
const callbackRef = useRef<(() => void) | null>(null);

// ❌ Incorrect - useState causes unnecessary re-renders
const [callback, setCallback] = useState<(() => void) | null>(null);
```

## Common Patterns

### Search Functionality
```typescript
// App.tsx
const performSearchCallbackRef = useRef<((term: string) => void) | null>(null);
const setPerformSearchCallback = useCallback((callback) => {
  performSearchCallbackRef.current = callback;
}, []);

// WorkflowEditor.tsx
const performSearch = useCallback((term: string) => {
  // Search implementation
}, [dependencies]);

// Direct registration
if (onRegisterPerformSearch) {
  onRegisterPerformSearch(performSearch);
}
```

### Execute/Action Callbacks
```typescript
// App.tsx
const executeCallbackRef = useRef<(() => void) | null>(null);

const handleExecute = useCallback(() => {
  if (executeCallbackRef.current) {
    executeCallbackRef.current();
  }
}, []);

// WorkflowEditor.tsx
const executeWorkflow = useCallback(() => {
  // Execution logic
}, []);

if (onRegisterExecute) {
  onRegisterExecute(executeWorkflow);
}
```

## Troubleshooting

### Callback Not Executing
1. **Check registration**: Ensure callback is being registered
2. **Verify ref is set**: Check if `callbackRef.current` is not null
3. **Timing issues**: Use direct registration instead of useEffect
4. **Component mounting**: Ensure child component is actually mounting

### Debug Steps
```typescript
// Add logging to verify registration
if (onRegisterCallback) {
  console.log("Registering callback");
  onRegisterCallback(myCallback);
}

// Add logging to verify execution
if (callbackRef.current) {
  console.log("Executing callback");
  callbackRef.current();
} else {
  console.log("Callback not available");
}
```

## Best Practices

1. **Name consistently**: Use `onRegister[Action]` for registration props
2. **Keep callbacks stable**: Use `useCallback` with minimal dependencies
3. **Direct registration**: Register callbacks directly in component body
4. **Null checks**: Always check if callback ref is set before calling
5. **Clean interfaces**: Group related callbacks in prop interfaces
6. **Document dependencies**: Comment why specific dependencies are needed

## Anti-Patterns to Avoid

1. **Complex useEffect dependencies** that cause frequent re-registration
2. **Storing callbacks in state** instead of refs
3. **Circular dependencies** between callback functions
4. **Missing null checks** when calling callback refs
5. **Over-engineering** with unnecessary callback abstractions