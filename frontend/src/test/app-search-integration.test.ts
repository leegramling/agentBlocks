import { describe, it, expect, beforeEach } from 'vitest';

// Mock the App.tsx search integration behavior
interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  parentId?: string;
  properties?: Record<string, any>;
  inputs?: any[];
  outputs?: any[];
}

class AppSearchIntegration {
  // State similar to App.tsx
  private searchValue: string = '';
  private searchResults: WorkflowNode[] = [];
  private currentSearchIndex: number = 0;
  private isSearchFieldFocused: boolean = false;

  // Callback refs similar to App.tsx
  private performSearchCallbackRef: ((term: string) => void) | null = null;
  private findNextCallbackRef: (() => void) | null = null;
  private findPreviousCallbackRef: (() => void) | null = null;

  // Mock WorkflowEditor that would register these callbacks
  private workflowEditor: {
    nodes: WorkflowNode[];
    selectedNode: WorkflowNode | null;
    searchResults: WorkflowNode[];
    currentSearchIndex: number;
    performSearch: (term: string) => void;
    findNext: () => void;
    findPrevious: () => void;
    handleNodeSelect: (node: WorkflowNode) => void;
  };

  constructor() {
    this.workflowEditor = {
      nodes: [],
      selectedNode: null,
      searchResults: [],
      currentSearchIndex: 0,
      performSearch: (term: string) => {
        if (!term.trim()) {
          this.workflowEditor.searchResults = [];
          this.workflowEditor.currentSearchIndex = 0;
          // Update App state asynchronously (simulates React state update)
          setTimeout(() => {
            this.updateSearchResults(this.workflowEditor.searchResults);
            this.updateCurrentSearchIndex(this.workflowEditor.currentSearchIndex);
          }, 0);
          return;
        }

        const results = this.workflowEditor.nodes.filter(node => {
          const searchableText = [
            node.type,
            node.properties?.function_name,
            node.properties?.name,
            node.properties?.message,
            node.properties?.variable,
            node.properties?.command,
            node.properties?.code,
            node.id
          ].filter(Boolean).join(' ').toLowerCase();
          
          return searchableText.includes(term.toLowerCase());
        });

        this.workflowEditor.searchResults = results;
        this.workflowEditor.currentSearchIndex = 0;
        
        if (results.length > 0) {
          this.workflowEditor.handleNodeSelect(results[0]);
        }

        // Update App state asynchronously (simulates React state update)
        setTimeout(() => {
          this.updateSearchResults(this.workflowEditor.searchResults);
          this.updateCurrentSearchIndex(this.workflowEditor.currentSearchIndex);
        }, 0);
      },
      findNext: () => {
        if (this.workflowEditor.searchResults.length === 0) return;
        
        const nextIndex = (this.workflowEditor.currentSearchIndex + 1) % this.workflowEditor.searchResults.length;
        this.workflowEditor.currentSearchIndex = nextIndex;
        this.workflowEditor.handleNodeSelect(this.workflowEditor.searchResults[nextIndex]);
        
        // Update App state asynchronously
        setTimeout(() => {
          this.updateCurrentSearchIndex(this.workflowEditor.currentSearchIndex);
        }, 0);
      },
      findPrevious: () => {
        if (this.workflowEditor.searchResults.length === 0) return;
        
        const prevIndex = this.workflowEditor.currentSearchIndex === 0 
          ? this.workflowEditor.searchResults.length - 1 
          : this.workflowEditor.currentSearchIndex - 1;
        this.workflowEditor.currentSearchIndex = prevIndex;
        this.workflowEditor.handleNodeSelect(this.workflowEditor.searchResults[prevIndex]);
        
        // Update App state asynchronously
        setTimeout(() => {
          this.updateCurrentSearchIndex(this.workflowEditor.currentSearchIndex);
        }, 0);
      },
      handleNodeSelect: (node: WorkflowNode) => {
        this.workflowEditor.selectedNode = node;
      }
    };

    // Register callbacks (simulates useEffect in App.tsx)
    this.setPerformSearchCallback(this.workflowEditor.performSearch);
    this.setFindNextCallback(this.workflowEditor.findNext);
    this.setFindPreviousCallback(this.workflowEditor.findPrevious);
  }

  // Callback setters (similar to App.tsx)
  setPerformSearchCallback = (callback: ((term: string) => void) | null) => {
    this.performSearchCallbackRef = callback;
  };

  setFindNextCallback = (callback: (() => void) | null) => {
    this.findNextCallbackRef = callback;
  };

  setFindPreviousCallback = (callback: (() => void) | null) => {
    this.findPreviousCallbackRef = callback;
  };

  // State updaters called by WorkflowEditor (simulates App.tsx)
  updateSearchResults = (results: WorkflowNode[]) => {
    this.searchResults = results;
  };

  updateCurrentSearchIndex = (index: number) => {
    this.currentSearchIndex = index;
  };

  // Search handlers (from App.tsx)
  handleSearchChange = (value: string) => {
    this.searchValue = value;
    if (this.performSearchCallbackRef) {
      this.performSearchCallbackRef(value);
    }
  };

  handleSearchFocus = () => {
    this.isSearchFieldFocused = true;
  };

  handleSearchBlur = () => {
    this.isSearchFieldFocused = false;
  };

  // This is the critical function where the bug might be
  handleSearchKeyDown = (key: string) => {
    if (key === 'Enter' && this.searchResults.length > 0) {
      if (this.findNextCallbackRef) {
        this.findNextCallbackRef();
      }
    } else if (key === 'Escape') {
      this.searchValue = '';
      this.searchResults = [];
      this.isSearchFieldFocused = false;
      if (this.performSearchCallbackRef) {
        this.performSearchCallbackRef('');
      }
    }
  };

  // Helper methods for testing
  setNodes = (nodes: WorkflowNode[]) => {
    this.workflowEditor.nodes = nodes;
  };

  getSearchValue = () => this.searchValue;
  getSearchResults = () => this.searchResults;
  getCurrentSearchIndex = () => this.currentSearchIndex;
  getSelectedNode = () => this.workflowEditor.selectedNode;
  getIsSearchFieldFocused = () => this.isSearchFieldFocused;

  // Create default workflow
  createDefaultWorkflow = () => {
    const nodes: WorkflowNode[] = [
      {
        id: 'main-function',
        type: 'function',
        position: { x: 100, y: 100 },
        properties: {
          function_name: 'main',
          parameters: '',
          return_type: 'void',
          description: 'Main function - entry point of the workflow'
        },
        inputs: [],
        outputs: [{ id: 'output', name: 'Output', type: 'any' }],
      },
      {
        id: 'default-variable',
        type: 'variable',
        position: { x: 120, y: 166 },
        parentId: 'main-function',
        properties: { name: 'counter', value: '1' },
        inputs: [{ id: 'input', name: 'Input', type: 'any' }],
        outputs: [{ id: 'output', name: 'Output', type: 'any' }],
      },
      {
        id: 'default-print',
        type: 'print',
        position: { x: 120, y: 232 },
        parentId: 'main-function',
        properties: { message: '{counter}. {fruit}' },
        inputs: [{ id: 'input', name: 'Input', type: 'any' }],
        outputs: [{ id: 'output', name: 'Output', type: 'any' }],
      }
    ];
    this.setNodes(nodes);
  };

  // Simulate a delay for async operations
  async waitForStateUpdate() {
    return new Promise(resolve => setTimeout(resolve, 10));
  }
}

describe('App.tsx Search Integration Tests', () => {
  let appSearch: AppSearchIntegration;

  beforeEach(() => {
    appSearch = new AppSearchIntegration();
    appSearch.createDefaultWorkflow();
  });

  describe('Reproducing the search timing bug', () => {
    it('should find variable node when typing "variable" and pressing Enter', async () => {
      // Type "variable" character by character (simulating user typing)
      appSearch.handleSearchChange('v');
      await appSearch.waitForStateUpdate();
      
      appSearch.handleSearchChange('va');
      await appSearch.waitForStateUpdate();
      
      appSearch.handleSearchChange('var');
      await appSearch.waitForStateUpdate();
      
      appSearch.handleSearchChange('vari');
      await appSearch.waitForStateUpdate();
      
      appSearch.handleSearchChange('variable');
      await appSearch.waitForStateUpdate();

      // At this point searchResults should be updated
      const searchResults = appSearch.getSearchResults();
      expect(searchResults.length).toBe(1);
      expect(searchResults[0].type).toBe('variable');

      // Now press Enter - this should call findNext and select the variable node
      appSearch.handleSearchKeyDown('Enter');
      await appSearch.waitForStateUpdate();

      const selectedNode = appSearch.getSelectedNode();
      expect(selectedNode).toBeTruthy();
      expect(selectedNode?.type).toBe('variable');
    });

    it('should find print node when typing "print" and pressing Enter', async () => {
      // Type "print"
      appSearch.handleSearchChange('print');
      await appSearch.waitForStateUpdate();

      // Check search results are available
      const searchResults = appSearch.getSearchResults();
      expect(searchResults.length).toBe(1);
      expect(searchResults[0].type).toBe('print');

      // Press Enter
      appSearch.handleSearchKeyDown('Enter');
      await appSearch.waitForStateUpdate();

      const selectedNode = appSearch.getSelectedNode();
      expect(selectedNode).toBeTruthy();
      expect(selectedNode?.type).toBe('print');
    });

    it('should handle rapid typing followed by Enter', async () => {
      // Type quickly without waiting (simulates fast typing)
      appSearch.handleSearchChange('var');
      appSearch.handleSearchChange('variable');
      
      // Small delay to let async state updates happen
      await appSearch.waitForStateUpdate();

      // Press Enter immediately after typing
      appSearch.handleSearchKeyDown('Enter');
      await appSearch.waitForStateUpdate();

      const selectedNode = appSearch.getSelectedNode();
      expect(selectedNode).toBeTruthy();
      expect(selectedNode?.type).toBe('variable');
    });

    it('should handle Enter key when searchResults is empty initially', async () => {
      // Clear everything first
      appSearch.handleSearchChange('');
      await appSearch.waitForStateUpdate();

      // Try pressing Enter with no search results - should not crash
      appSearch.handleSearchKeyDown('Enter');
      await appSearch.waitForStateUpdate();

      // Should be safe
      expect(appSearch.getSearchResults().length).toBe(0);
    });
  });

  describe('Edge cases that might cause timing issues', () => {
    it('should handle Enter key pressed before search results are updated', () => {
      // Start a search but don't wait for state update
      appSearch.handleSearchChange('variable');
      
      // Immediately press Enter before async state update
      const searchResults = appSearch.getSearchResults();
      
      // At this moment, searchResults might still be empty in App state
      // but the WorkflowEditor should have them
      
      appSearch.handleSearchKeyDown('Enter');
      
      // This test reveals the potential timing issue
      // The App.tsx handleSearchKeyDown checks this.searchResults.length
      // But this.searchResults might not be updated yet
    });

    it('should handle rapid search changes', async () => {
      // Rapid fire search changes
      appSearch.handleSearchChange('v');
      appSearch.handleSearchChange('va');
      appSearch.handleSearchChange('var');
      appSearch.handleSearchChange('vari');
      appSearch.handleSearchChange('variable');
      
      // Only wait once at the end
      await appSearch.waitForStateUpdate();
      
      const searchResults = appSearch.getSearchResults();
      expect(searchResults.length).toBe(1);
      
      appSearch.handleSearchKeyDown('Enter');
      await appSearch.waitForStateUpdate();
      
      const selectedNode = appSearch.getSelectedNode();
      expect(selectedNode?.type).toBe('variable');
    });
  });

  describe('Partial search functionality', () => {
    it('should find variable with "var" and handle Enter', async () => {
      appSearch.handleSearchChange('var');
      await appSearch.waitForStateUpdate();

      const searchResults = appSearch.getSearchResults();
      expect(searchResults.length).toBe(1);
      expect(searchResults[0].type).toBe('variable');

      appSearch.handleSearchKeyDown('Enter');
      await appSearch.waitForStateUpdate();

      const selectedNode = appSearch.getSelectedNode();
      expect(selectedNode?.type).toBe('variable');
    });

    it('should find print with "prin" and handle Enter', async () => {
      appSearch.handleSearchChange('prin');
      await appSearch.waitForStateUpdate();

      const searchResults = appSearch.getSearchResults();
      expect(searchResults.length).toBe(1);
      expect(searchResults[0].type).toBe('print');

      appSearch.handleSearchKeyDown('Enter');
      await appSearch.waitForStateUpdate();

      const selectedNode = appSearch.getSelectedNode();
      expect(selectedNode?.type).toBe('print');
    });
  });
});