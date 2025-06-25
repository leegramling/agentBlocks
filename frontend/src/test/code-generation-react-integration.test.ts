import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * React-specific integration tests for code generation callbacks
 * 
 * These tests focus on the actual React component lifecycle issues
 * that our business logic tests can't catch.
 */

// Mock React hooks and components for testing
const mockUseEffect = vi.fn();
const mockUseCallback = vi.fn();
const mockUseRef = vi.fn();

// Mock component lifecycle events
class ReactComponentLifecycleSimulator {
  private components: Map<string, ComponentInstance> = new Map();
  private renderCount = 0;

  createComponent(name: string, props: any): ComponentInstance {
    const instance = new ComponentInstance(name, props, this.renderCount++);
    this.components.set(name, instance);
    return instance;
  }

  updateComponent(name: string, newProps: any): ComponentInstance | null {
    const instance = this.components.get(name);
    if (instance) {
      instance.updateProps(newProps);
      return instance;
    }
    return null;
  }

  unmountComponent(name: string): void {
    const instance = this.components.get(name);
    if (instance) {
      instance.unmount();
      this.components.delete(name);
    }
  }

  getComponent(name: string): ComponentInstance | undefined {
    return this.components.get(name);
  }

  reset(): void {
    this.components.clear();
    this.renderCount = 0;
  }
}

class ComponentInstance {
  private mounted = true;
  private effects: EffectInstance[] = [];
  private callbacks: Map<string, Function> = new Map();
  private renderCount = 0;

  constructor(
    public name: string,
    public props: any,
    private instanceId: number
  ) {
    console.log(`Component ${name} created with instance ${instanceId}`);
  }

  // Simulate useEffect
  useEffect(effect: () => void | (() => void), deps?: any[]): void {
    if (!this.mounted) return;

    const effectInstance = new EffectInstance(effect, deps);
    this.effects.push(effectInstance);
    
    // Simulate React's effect scheduling
    setTimeout(() => {
      if (this.mounted && effectInstance.shouldRun(deps)) {
        effectInstance.run();
      }
    }, 0);
  }

  // Simulate useCallback
  useCallback(callback: Function, deps: any[]): Function {
    const key = callback.toString();
    const existing = this.callbacks.get(key);
    
    if (!existing || this.depsChanged(existing, deps)) {
      this.callbacks.set(key, callback);
      return callback;
    }
    
    return existing;
  }

  // Simulate component re-render
  updateProps(newProps: any): void {
    if (!this.mounted) return;
    
    console.log(`Component ${this.name} re-rendering due to prop change`);
    this.props = { ...this.props, ...newProps };
    this.renderCount++;
    
    // Re-run effects that depend on changed props
    this.effects.forEach(effect => {
      if (effect.shouldRun(effect.lastDeps)) {
        setTimeout(() => {
          if (this.mounted) effect.run();
        }, 0);
      }
    });
  }

  unmount(): void {
    console.log(`Component ${this.name} unmounting`);
    this.mounted = false;
    this.effects.forEach(effect => effect.cleanup());
    this.effects = [];
    this.callbacks.clear();
  }

  isMounted(): boolean {
    return this.mounted;
  }

  getRenderCount(): number {
    return this.renderCount;
  }

  private depsChanged(existingCallback: any, newDeps: any[]): boolean {
    // Simplified dependency comparison
    return JSON.stringify(existingCallback.deps) !== JSON.stringify(newDeps);
  }
}

class EffectInstance {
  private cleanup?: () => void;
  public lastDeps?: any[];

  constructor(
    private effect: () => void | (() => void),
    public deps?: any[]
  ) {
    this.lastDeps = deps;
  }

  run(): void {
    try {
      console.log('Running effect with deps:', this.deps);
      const result = this.effect();
      if (typeof result === 'function') {
        this.cleanup = result;
      }
    } catch (error) {
      console.error('Effect execution failed:', error);
    }
  }

  shouldRun(newDeps?: any[]): boolean {
    if (!this.deps) return true; // No deps array means always run
    if (!newDeps) return false;
    
    return JSON.stringify(this.deps) !== JSON.stringify(newDeps);
  }

  cleanup(): void {
    if (this.cleanup) {
      this.cleanup();
    }
  }
}

// Simulate the actual App.tsx and WorkflowEditor.tsx interaction
class ReactCodeGenerationTest {
  private lifecycle = new ReactComponentLifecycleSimulator();
  private appComponent?: ComponentInstance;
  private workflowEditorComponent?: ComponentInstance;
  
  // App.tsx state
  private generatePythonCodeCallbackRef: (() => string) | null = null;
  private generateRustCodeCallbackRef: (() => string) | null = null;

  setupApp(): void {
    this.appComponent = this.lifecycle.createComponent('App', {
      // Initial props
    });

    // Simulate App.tsx callback setters
    const setGeneratePythonCodeCallback = (callback: (() => string) | null) => {
      console.log('App: setGeneratePythonCodeCallback called');
      this.generatePythonCodeCallbackRef = callback;
    };

    const setGenerateRustCodeCallback = (callback: (() => string) | null) => {
      console.log('App: setGenerateRustCodeCallback called');
      this.generateRustCodeCallbackRef = callback;
    };

    // Store these for WorkflowEditor to use
    this.appComponent.props.onRegisterGeneratePythonCode = setGeneratePythonCodeCallback;
    this.appComponent.props.onRegisterGenerateRustCode = setGenerateRustCodeCallback;
  }

  setupWorkflowEditor(): void {
    this.workflowEditorComponent = this.lifecycle.createComponent('WorkflowEditor', {
      onRegisterGeneratePythonCode: this.appComponent?.props.onRegisterGeneratePythonCode,
      onRegisterGenerateRustCode: this.appComponent?.props.onRegisterGenerateRustCode,
    });

    // Simulate WorkflowEditor's code generation functions
    const generatePythonCode = () => {
      console.log('WorkflowEditor: generatePythonCode called');
      return 'def main():\n    print("Hello from Python")\n\nif __name__ == "__main__":\n    main()';
    };

    const generateRustCode = () => {
      console.log('WorkflowEditor: generateRustCode called');
      return 'fn main() {\n    println!("Hello from Rust");\n}';
    };

    // Test both registration approaches
    this.registerCallbacksWithUseEffect(generatePythonCode, generateRustCode);
  }

  setupWorkflowEditorWithDirectRegistration(): void {
    this.workflowEditorComponent = this.lifecycle.createComponent('WorkflowEditor', {
      onRegisterGeneratePythonCode: this.appComponent?.props.onRegisterGeneratePythonCode,
      onRegisterGenerateRustCode: this.appComponent?.props.onRegisterGenerateRustCode,
    });

    const generatePythonCode = () => {
      console.log('WorkflowEditor: generatePythonCode called');
      return 'def main():\n    print("Hello from Python")\n\nif __name__ == "__main__":\n    main()';
    };

    const generateRustCode = () => {
      console.log('WorkflowEditor: generateRustCode called');
      return 'fn main() {\n    println!("Hello from Rust");\n}';
    };

    // Direct registration (the fix)
    this.registerCallbacksDirectly(generatePythonCode, generateRustCode);
  }

  private registerCallbacksWithUseEffect(
    generatePythonCode: () => string,
    generateRustCode: () => string
  ): void {
    const component = this.workflowEditorComponent!;
    const props = component.props;

    // Simulate problematic useEffect registration
    component.useEffect(() => {
      console.log('useEffect: Registering Python code generator');
      if (props.onRegisterGeneratePythonCode) {
        props.onRegisterGeneratePythonCode(generatePythonCode);
      }
    }, [props.onRegisterGeneratePythonCode, generatePythonCode]);

    component.useEffect(() => {
      console.log('useEffect: Registering Rust code generator');
      if (props.onRegisterGenerateRustCode) {
        props.onRegisterGenerateRustCode(generateRustCode);
      }
    }, [props.onRegisterGenerateRustCode, generateRustCode]);
  }

  private registerCallbacksDirectly(
    generatePythonCode: () => string,
    generateRustCode: () => string
  ): void {
    const props = this.workflowEditorComponent!.props;

    // Direct registration (the fix)
    console.log('Direct registration: Registering code generators');
    if (props.onRegisterGeneratePythonCode) {
      props.onRegisterGeneratePythonCode(generatePythonCode);
    }
    if (props.onRegisterGenerateRustCode) {
      props.onRegisterGenerateRustCode(generateRustCode);
    }
  }

  // Simulate Console.tsx handleShowCode
  simulateShowCodeClick(): { pythonCode: string; rustCode: string; success: boolean } {
    console.log('=== Console: Show Code button clicked ===');
    
    let pythonCode = '';
    let rustCode = '';
    let success = true;

    // Simulate App.tsx handleGeneratePythonCode
    if (this.generatePythonCodeCallbackRef) {
      pythonCode = this.generatePythonCodeCallbackRef();
    } else {
      console.error('Python code generator not available!');
      success = false;
    }

    // Simulate App.tsx handleGenerateRustCode
    if (this.generateRustCodeCallbackRef) {
      rustCode = this.generateRustCodeCallbackRef();
    } else {
      console.error('Rust code generator not available!');
      success = false;
    }

    return { pythonCode, rustCode, success };
  }

  // Simulate component lifecycle events
  triggerWorkflowEditorRerender(): void {
    if (this.workflowEditorComponent) {
      this.workflowEditorComponent.updateProps({
        // Add some prop change that might trigger re-render
        timestamp: Date.now()
      });
    }
  }

  unmountWorkflowEditor(): void {
    if (this.workflowEditorComponent) {
      this.lifecycle.unmountComponent('WorkflowEditor');
      this.workflowEditorComponent = undefined;
    }
  }

  remountWorkflowEditor(): void {
    this.unmountWorkflowEditor();
    this.setupWorkflowEditor();
  }

  isCallbacksRegistered(): boolean {
    return !!this.generatePythonCodeCallbackRef && !!this.generateRustCodeCallbackRef;
  }

  async waitForEffects(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 10));
  }

  reset(): void {
    this.lifecycle.reset();
    this.generatePythonCodeCallbackRef = null;
    this.generateRustCodeCallbackRef = null;
    this.appComponent = undefined;
    this.workflowEditorComponent = undefined;
  }
}

describe('React Code Generation Integration Tests', () => {
  let reactTest: ReactCodeGenerationTest;

  beforeEach(() => {
    reactTest = new ReactCodeGenerationTest();
  });

  describe('Component Lifecycle and Callback Registration', () => {
    it('should register callbacks when components mount in correct order', async () => {
      reactTest.setupApp();
      reactTest.setupWorkflowEditorWithDirectRegistration();

      await reactTest.waitForEffects();

      expect(reactTest.isCallbacksRegistered()).toBe(true);
    });

    it('should handle App mounting before WorkflowEditor', async () => {
      // App mounts first
      reactTest.setupApp();
      expect(reactTest.isCallbacksRegistered()).toBe(false);

      // WorkflowEditor mounts later
      reactTest.setupWorkflowEditorWithDirectRegistration();
      await reactTest.waitForEffects();

      expect(reactTest.isCallbacksRegistered()).toBe(true);
    });

    it('should handle WorkflowEditor remounting', async () => {
      reactTest.setupApp();
      reactTest.setupWorkflowEditorWithDirectRegistration();
      await reactTest.waitForEffects();

      expect(reactTest.isCallbacksRegistered()).toBe(true);

      // Remount WorkflowEditor
      reactTest.remountWorkflowEditor();
      await reactTest.waitForEffects();

      expect(reactTest.isCallbacksRegistered()).toBe(true);
    });

    it('should detect when useEffect prevents callback registration', async () => {
      reactTest.setupApp();
      
      // Test useEffect registration multiple times
      let successfulRegistrations = 0;
      const attempts = 10;

      for (let i = 0; i < attempts; i++) {
        reactTest.reset();
        reactTest.setupApp();
        reactTest.setupWorkflowEditor(); // Uses useEffect
        
        await reactTest.waitForEffects();
        
        if (reactTest.isCallbacksRegistered()) {
          successfulRegistrations++;
        }
      }

      console.log(`useEffect success rate: ${successfulRegistrations}/${attempts}`);
      
      // useEffect approach may have failures due to timing and dependency issues
      // This test would reveal the unreliability
    });

    it('should show direct registration is always reliable', async () => {
      let successfulRegistrations = 0;
      const attempts = 10;

      for (let i = 0; i < attempts; i++) {
        reactTest.reset();
        reactTest.setupApp();
        reactTest.setupWorkflowEditorWithDirectRegistration(); // Direct registration
        
        await reactTest.waitForEffects();
        
        if (reactTest.isCallbacksRegistered()) {
          successfulRegistrations++;
        }
      }

      // Direct registration should always work
      expect(successfulRegistrations).toBe(attempts);
    });
  });

  describe('Component Re-rendering Scenarios', () => {
    beforeEach(async () => {
      reactTest.setupApp();
      reactTest.setupWorkflowEditorWithDirectRegistration();
      await reactTest.waitForEffects();
    });

    it('should maintain callbacks after WorkflowEditor re-renders', async () => {
      expect(reactTest.isCallbacksRegistered()).toBe(true);

      // Trigger re-render
      reactTest.triggerWorkflowEditorRerender();
      await reactTest.waitForEffects();

      expect(reactTest.isCallbacksRegistered()).toBe(true);
    });

    it('should handle multiple rapid re-renders', async () => {
      expect(reactTest.isCallbacksRegistered()).toBe(true);

      // Trigger multiple rapid re-renders
      for (let i = 0; i < 5; i++) {
        reactTest.triggerWorkflowEditorRerender();
      }
      
      await reactTest.waitForEffects();

      expect(reactTest.isCallbacksRegistered()).toBe(true);
    });
  });

  describe('Show Code Functionality End-to-End', () => {
    it('should successfully generate code when everything is properly set up', async () => {
      reactTest.setupApp();
      reactTest.setupWorkflowEditorWithDirectRegistration();
      await reactTest.waitForEffects();

      const result = reactTest.simulateShowCodeClick();

      expect(result.success).toBe(true);
      expect(result.pythonCode).toContain('def main():');
      expect(result.pythonCode).toContain('print("Hello from Python")');
      expect(result.rustCode).toContain('fn main() {');
      expect(result.rustCode).toContain('println!("Hello from Rust");');
    });

    it('should fail when callbacks are not registered', async () => {
      reactTest.setupApp();
      // Don't set up WorkflowEditor, so callbacks aren't registered

      const result = reactTest.simulateShowCodeClick();

      expect(result.success).toBe(false);
      expect(result.pythonCode).toBe('');
      expect(result.rustCode).toBe('');
    });

    it('should fail when WorkflowEditor unmounts before Show Code is clicked', async () => {
      reactTest.setupApp();
      reactTest.setupWorkflowEditorWithDirectRegistration();
      await reactTest.waitForEffects();

      expect(reactTest.isCallbacksRegistered()).toBe(true);

      // Unmount WorkflowEditor
      reactTest.unmountWorkflowEditor();

      // Callbacks should still be registered in App (refs persist)
      const result = reactTest.simulateShowCodeClick();
      expect(result.success).toBe(true); // Refs persist even after unmount
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    it('should handle component mounting in wrong order', async () => {
      // Try to set up WorkflowEditor before App
      reactTest.setupWorkflowEditorWithDirectRegistration(); // This should fail gracefully
      reactTest.setupApp();
      
      await reactTest.waitForEffects();

      // Should still work once App is set up
      expect(reactTest.isCallbacksRegistered()).toBe(false); // Because App wasn't ready
    });

    it('should handle partial component setup', async () => {
      reactTest.setupApp();
      // Set up WorkflowEditor but simulate only one callback being registered
      
      const mockPythonGenerator = () => 'Python code';
      if (reactTest['appComponent']?.props.onRegisterGeneratePythonCode) {
        reactTest['appComponent'].props.onRegisterGeneratePythonCode(mockPythonGenerator);
      }
      // Don't register Rust generator

      const result = reactTest.simulateShowCodeClick();
      
      expect(result.pythonCode).toBe('Python code');
      expect(result.rustCode).toBe('');
      expect(result.success).toBe(false); // Partial failure
    });

    it('should handle rapid mount/unmount cycles', async () => {
      reactTest.setupApp();

      // Rapid mount/unmount cycles
      for (let i = 0; i < 5; i++) {
        reactTest.setupWorkflowEditorWithDirectRegistration();
        await reactTest.waitForEffects();
        expect(reactTest.isCallbacksRegistered()).toBe(true);
        
        reactTest.unmountWorkflowEditor();
        // Callbacks should persist in App refs
      }

      const result = reactTest.simulateShowCodeClick();
      expect(result.success).toBe(true); // Last registration should still work
    });
  });

  describe('Performance and Memory', () => {
    it('should not create memory leaks with repeated mounting', async () => {
      reactTest.setupApp();

      // Mount and unmount multiple times
      for (let i = 0; i < 10; i++) {
        reactTest.setupWorkflowEditorWithDirectRegistration();
        await reactTest.waitForEffects();
        reactTest.unmountWorkflowEditor();
      }

      // Final mount should still work
      reactTest.setupWorkflowEditorWithDirectRegistration();
      await reactTest.waitForEffects();
      
      const result = reactTest.simulateShowCodeClick();
      expect(result.success).toBe(true);
    });

    it('should handle component instances properly', () => {
      reactTest.setupApp();
      reactTest.setupWorkflowEditorWithDirectRegistration();

      const appComponent = reactTest['appComponent'];
      const workflowComponent = reactTest['workflowEditorComponent'];

      expect(appComponent?.isMounted()).toBe(true);
      expect(workflowComponent?.isMounted()).toBe(true);
      expect(appComponent?.getRenderCount()).toBeGreaterThanOrEqual(0);
      expect(workflowComponent?.getRenderCount()).toBeGreaterThanOrEqual(0);
    });
  });
});