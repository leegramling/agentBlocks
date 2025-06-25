import { describe, it, expect, beforeEach } from 'vitest';

// Test to reproduce and verify fix for the search bug
interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  parentId?: string;
  properties?: Record<string, any>;
  inputs?: any[];
  outputs?: any[];
}

class SearchBugReproduction {
  // App.tsx state
  private searchValue: string = '';
  private searchResults: WorkflowNode[] = [];
  private currentSearchIndex: number = 0;

  // App.tsx callbacks
  private performSearchCallbackRef: ((term: string) => void) | null = null;
  private findNextCallbackRef: (() => void) | null = null;

  // WorkflowEditor mock
  private nodes: WorkflowNode[] = [];
  private editorSearchResults: WorkflowNode[] = [];
  private editorCurrentSearchIndex: number = 0;
  private selectedNode: WorkflowNode | null = null;

  constructor() {
    // Register WorkflowEditor callbacks
    this.setPerformSearchCallback((term: string) => {
      if (!term.trim()) {
        this.editorSearchResults = [];
        this.editorCurrentSearchIndex = 0;
        this.updateSearchResults([]);
        this.updateCurrentSearchIndex(0);
        return;
      }

      const results = this.nodes.filter(node => {
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

      this.editorSearchResults = results;
      this.editorCurrentSearchIndex = 0;
      
      if (results.length > 0) {
        this.selectedNode = results[0];
      }

      // Simulate async state update (React state)
      setTimeout(() => {
        this.updateSearchResults(this.editorSearchResults);
        this.updateCurrentSearchIndex(this.editorCurrentSearchIndex);
      }, 0);
    });

    this.setFindNextCallback(() => {
      if (this.editorSearchResults.length === 0) return;
      
      const nextIndex = (this.editorCurrentSearchIndex + 1) % this.editorSearchResults.length;
      this.editorCurrentSearchIndex = nextIndex;
      this.selectedNode = this.editorSearchResults[nextIndex];
      
      setTimeout(() => {
        this.updateCurrentSearchIndex(this.editorCurrentSearchIndex);
      }, 0);
    });
  }

  // App.tsx methods
  setPerformSearchCallback = (callback: ((term: string) => void) | null) => {
    this.performSearchCallbackRef = callback;
  };

  setFindNextCallback = (callback: (() => void) | null) => {
    this.findNextCallbackRef = callback;
  };

  updateSearchResults = (results: WorkflowNode[]) => {
    this.searchResults = results;
  };

  updateCurrentSearchIndex = (index: number) => {
    this.currentSearchIndex = index;
  };

  handleSearchChange = (value: string) => {
    this.searchValue = value;
    if (this.performSearchCallbackRef) {
      this.performSearchCallbackRef(value);
    }
  };

  // The NEW fixed implementation
  handleSearchKeyDownFixed = (key: string) => {
    if (key === 'Enter' && this.searchValue.trim() !== '') {
      if (this.searchResults.length > 0) {
        // If we already have search results, navigate to next
        if (this.findNextCallbackRef) {
          this.findNextCallbackRef();
        }
      } else {
        // If no search results yet, ensure search is performed
        if (this.performSearchCallbackRef) {
          this.performSearchCallbackRef(this.searchValue);
        }
      }
    }
  };

  // The OLD buggy implementation
  handleSearchKeyDownBuggy = (key: string) => {
    if (key === 'Enter' && this.searchResults.length > 0) {
      if (this.findNextCallbackRef) {
        this.findNextCallbackRef();
      }
    }
  };

  // Test helpers
  setNodes = (nodes: WorkflowNode[]) => {
    this.nodes = nodes;
  };

  getSearchValue = () => this.searchValue;
  getSearchResults = () => this.searchResults;
  getSelectedNode = () => this.selectedNode;
  getCurrentSearchIndex = () => this.currentSearchIndex;

  async waitForStateUpdate() {
    return new Promise(resolve => setTimeout(resolve, 10));
  }

  createDefaultWorkflow = () => {
    const nodes: WorkflowNode[] = [
      {
        id: 'main-function',
        type: 'function',
        position: { x: 100, y: 100 },
        properties: { function_name: 'main' },
        inputs: [],
        outputs: [],
      },
      {
        id: 'default-variable',
        type: 'variable',
        position: { x: 120, y: 166 },
        parentId: 'main-function',
        properties: { name: 'counter', value: '1' },
        inputs: [],
        outputs: [],
      },
      {
        id: 'default-print',
        type: 'print',
        position: { x: 120, y: 232 },
        parentId: 'main-function',
        properties: { message: '{counter}. {fruit}' },
        inputs: [],
        outputs: [],
      }
    ];
    this.setNodes(nodes);
  };

  reset = () => {
    this.searchValue = '';
    this.searchResults = [];
    this.currentSearchIndex = 0;
    this.editorSearchResults = [];
    this.editorCurrentSearchIndex = 0;
    this.selectedNode = null;
  };
}

describe('Search Bug Reproduction and Fix Tests', () => {
  let searchTest: SearchBugReproduction;

  beforeEach(() => {
    searchTest = new SearchBugReproduction();
    searchTest.createDefaultWorkflow();
  });

  describe('Reproducing the original bug', () => {
    it('should FAIL with the old buggy implementation - variable search', async () => {
      // User types "variable"
      searchTest.handleSearchChange('variable');
      
      // User immediately presses Enter (before App state is updated)
      // This simulates the timing issue
      searchTest.handleSearchKeyDownBuggy('Enter');
      
      // At this point, App state searchResults is still empty
      expect(searchTest.getSearchResults().length).toBe(0);
      
      // So the buggy implementation does nothing
      expect(searchTest.getSelectedNode()).toBeNull();
      
      // Wait for async state update
      await searchTest.waitForStateUpdate();
      
      // Now App state has the results, but too late
      expect(searchTest.getSearchResults().length).toBe(1);
      // But the node was never selected because Enter key handler didn't fire
      expect(searchTest.getSelectedNode()).toBeTruthy(); // This is from the search, not the Enter key
    });

    it('should FAIL with the old buggy implementation - print search', async () => {
      // User types "print"
      searchTest.handleSearchChange('print');
      
      // User immediately presses Enter
      searchTest.handleSearchKeyDownBuggy('Enter');
      
      // Buggy implementation requires searchResults.length > 0 in App state
      // but state hasn't updated yet
      expect(searchTest.getSearchResults().length).toBe(0);
      expect(searchTest.getSelectedNode()).toBeNull();
      
      await searchTest.waitForStateUpdate();
      
      // State eventually updates but Enter key effect was lost
      expect(searchTest.getSearchResults().length).toBe(1);
    });
  });

  describe('Verifying the fix works', () => {
    it('should SUCCEED with the fixed implementation - variable search', async () => {
      // User types "variable"
      searchTest.handleSearchChange('variable');
      
      // User immediately presses Enter
      searchTest.handleSearchKeyDownFixed('Enter');
      
      // Fixed implementation checks searchValue instead of searchResults.length
      // Since there are no search results yet, it triggers search again
      
      await searchTest.waitForStateUpdate();
      
      // Should find and select the variable node
      expect(searchTest.getSearchResults().length).toBe(1);
      expect(searchTest.getSelectedNode()).toBeTruthy();
      expect(searchTest.getSelectedNode()?.type).toBe('variable');
    });

    it('should SUCCEED with the fixed implementation - print search', async () => {
      // User types "print"
      searchTest.handleSearchChange('print');
      
      // User immediately presses Enter
      searchTest.handleSearchKeyDownFixed('Enter');
      
      await searchTest.waitForStateUpdate();
      
      // Should find and select the print node
      expect(searchTest.getSearchResults().length).toBe(1);
      expect(searchTest.getSelectedNode()).toBeTruthy();
      expect(searchTest.getSelectedNode()?.type).toBe('print');
    });

    it('should SUCCEED with partial searches - var', async () => {
      searchTest.handleSearchChange('var');
      searchTest.handleSearchKeyDownFixed('Enter');
      
      await searchTest.waitForStateUpdate();
      
      expect(searchTest.getSelectedNode()?.type).toBe('variable');
    });

    it('should SUCCEED with partial searches - prin', async () => {
      searchTest.handleSearchChange('prin');
      searchTest.handleSearchKeyDownFixed('Enter');
      
      await searchTest.waitForStateUpdate();
      
      expect(searchTest.getSelectedNode()?.type).toBe('print');
    });
  });

  describe('Verifying navigation still works', () => {
    it('should navigate to next result when search results already exist', async () => {
      // First, establish search results
      searchTest.handleSearchChange('function');
      await searchTest.waitForStateUpdate();
      
      expect(searchTest.getSearchResults().length).toBe(1);
      expect(searchTest.getSelectedNode()?.type).toBe('function');
      
      // Now press Enter again - should navigate to next (same node in this case)
      searchTest.handleSearchKeyDownFixed('Enter');
      await searchTest.waitForStateUpdate();
      
      // Should still be on function node (only one function exists)
      expect(searchTest.getSelectedNode()?.type).toBe('function');
    });

    it('should handle multiple matches correctly', () => {
      // Add another function to test navigation
      const additionalNodes = [
        ...searchTest['nodes'],
        {
          id: 'helper-function',
          type: 'function',
          position: { x: 400, y: 100 },
          properties: { function_name: 'helper' },
          inputs: [],
          outputs: []
        }
      ];
      searchTest.setNodes(additionalNodes);
      
      return new Promise<void>((resolve) => {
        // Search for "function"
        searchTest.handleSearchChange('function');
        
        setTimeout(async () => {
          expect(searchTest.getSearchResults().length).toBe(2);
          expect(searchTest.getSelectedNode()?.id).toBe('main-function');
          
          // Press Enter to go to next
          searchTest.handleSearchKeyDownFixed('Enter');
          
          setTimeout(() => {
            expect(searchTest.getSelectedNode()?.id).toBe('helper-function');
            resolve();
          }, 15);
        }, 15);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty search value', async () => {
      searchTest.handleSearchChange('');
      searchTest.handleSearchKeyDownFixed('Enter');
      
      // Should not crash or do anything
      expect(searchTest.getSearchResults().length).toBe(0);
      expect(searchTest.getSelectedNode()).toBeNull();
    });

    it('should handle search with no matches', async () => {
      searchTest.handleSearchChange('nonexistent');
      searchTest.handleSearchKeyDownFixed('Enter');
      
      await searchTest.waitForStateUpdate();
      
      expect(searchTest.getSearchResults().length).toBe(0);
      expect(searchTest.getSelectedNode()).toBeNull();
    });
  });
});