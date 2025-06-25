import { describe, it, expect, beforeEach } from 'vitest';

// Mock types and interfaces
interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  panelId?: string;
  parentId?: string;
  properties?: Record<string, any>;
  inputs?: any[];
  outputs?: any[];
}

// Mock search functionality
class SearchTestHarness {
  private nodes: WorkflowNode[] = [];
  private searchResults: WorkflowNode[] = [];
  private currentSearchIndex: number = 0;
  private selectedNode: WorkflowNode | null = null;
  private consoleLogs: string[] = [];

  // Mock functions from WorkflowEditor
  performSearch = (term: string) => {
    if (!term.trim()) {
      this.searchResults = [];
      this.currentSearchIndex = 0;
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

    this.searchResults = results;
    this.currentSearchIndex = 0;
    
    if (results.length > 0) {
      this.handleNodeSelect(results[0]);
      this.consoleLogs.push(`🔍 Found ${results.length} matches for "${term}"`);
    } else {
      this.consoleLogs.push(`❌ No matches found for "${term}"`);
    }
  };

  findNext = () => {
    if (this.searchResults.length === 0) return;
    
    const nextIndex = (this.currentSearchIndex + 1) % this.searchResults.length;
    this.currentSearchIndex = nextIndex;
    this.handleNodeSelect(this.searchResults[nextIndex]);
    this.consoleLogs.push(`🔍 Match ${nextIndex + 1} of ${this.searchResults.length}`);
  };

  findPrevious = () => {
    if (this.searchResults.length === 0) return;
    
    const prevIndex = this.currentSearchIndex === 0 ? this.searchResults.length - 1 : this.currentSearchIndex - 1;
    this.currentSearchIndex = prevIndex;
    this.handleNodeSelect(this.searchResults[prevIndex]);
    this.consoleLogs.push(`🔍 Match ${prevIndex + 1} of ${this.searchResults.length}`);
  };

  handleNodeSelect = (node: WorkflowNode) => {
    this.selectedNode = node;
  };

  // Helper methods for testing
  setNodes = (nodes: WorkflowNode[]) => {
    this.nodes = nodes;
  };

  getSelectedNode = () => this.selectedNode;
  getSearchResults = () => this.searchResults;
  getCurrentSearchIndex = () => this.currentSearchIndex;
  getConsoleLogs = () => this.consoleLogs;
  clearConsoleLogs = () => { this.consoleLogs = []; };

  // Mock the default properties function
  getDefaultProperties = (type: string): Record<string, any> => {
    switch (type) {
      case 'variable':
        return { name: 'counter', value: '1' };
      case 'print':
        return { message: '{counter}. {fruit}' };
      case 'function':
        return { function_name: 'main', parameters: '', return_type: 'void' };
      default:
        return {};
    }
  };

  getDefaultInputs = (type: string) => {
    return [{ id: 'input', name: 'Input', type: 'any' }];
  };

  getDefaultOutputs = (type: string) => {
    return [{ id: 'output', name: 'Output', type: 'any' }];
  };

  // Create the default workflow as in resetWorkflow
  createDefaultWorkflow = () => {
    const mainFunction: WorkflowNode = {
      id: 'main-function',
      type: 'function',
      position: { x: 100, y: 100 },
      panelId: undefined,
      parentId: undefined,
      properties: {
        function_name: 'main',
        parameters: '',
        return_type: 'void',
        description: 'Main function - entry point of the workflow'
      },
      inputs: [],
      outputs: [{ id: 'output', name: 'Output', type: 'any' }],
    };

    const variableNode: WorkflowNode = {
      id: 'default-variable',
      type: 'variable',
      position: { x: 120, y: 166 },
      panelId: undefined,
      parentId: 'main-function',
      properties: this.getDefaultProperties('variable'),
      inputs: this.getDefaultInputs('variable'),
      outputs: this.getDefaultOutputs('variable'),
    };

    const printNode: WorkflowNode = {
      id: 'default-print',
      type: 'print',
      position: { x: 120, y: 232 },
      panelId: undefined,
      parentId: 'main-function',
      properties: this.getDefaultProperties('print'),
      inputs: this.getDefaultInputs('print'),
      outputs: this.getDefaultOutputs('print'),
    };

    this.setNodes([mainFunction, variableNode, printNode]);
    this.selectedNode = null;
  };
}

describe('Search Functionality Tests', () => {
  let searchHarness: SearchTestHarness;

  beforeEach(() => {
    searchHarness = new SearchTestHarness();
    searchHarness.createDefaultWorkflow();
  });

  describe('Reproducing the search bug', () => {
    it('should find and select variable node when searching for "variable"', () => {
      // Perform search for "variable"
      searchHarness.performSearch('variable');
      
      const selectedNode = searchHarness.getSelectedNode();
      const searchResults = searchHarness.getSearchResults();
      
      // Should find the variable node
      expect(searchResults.length).toBe(1);
      expect(searchResults[0].type).toBe('variable');
      expect(searchResults[0].id).toBe('default-variable');
      
      // Should select the variable node
      expect(selectedNode).toBeTruthy();
      expect(selectedNode?.type).toBe('variable');
      expect(selectedNode?.id).toBe('default-variable');
    });

    it('should find and select print node when searching for "print"', () => {
      // Perform search for "print"
      searchHarness.performSearch('print');
      
      const selectedNode = searchHarness.getSelectedNode();
      const searchResults = searchHarness.getSearchResults();
      
      // Should find the print node
      expect(searchResults.length).toBe(1);
      expect(searchResults[0].type).toBe('print');
      expect(searchResults[0].id).toBe('default-print');
      
      // Should select the print node
      expect(selectedNode).toBeTruthy();
      expect(selectedNode?.type).toBe('print');
      expect(selectedNode?.id).toBe('default-print');
    });

    it('should find and select main function when searching for "main"', () => {
      // Perform search for "main"
      searchHarness.performSearch('main');
      
      const selectedNode = searchHarness.getSelectedNode();
      const searchResults = searchHarness.getSearchResults();
      
      // Should find the main function
      expect(searchResults.length).toBe(1);
      expect(searchResults[0].type).toBe('function');
      expect(searchResults[0].id).toBe('main-function');
      
      // Should select the main function
      expect(selectedNode).toBeTruthy();
      expect(selectedNode?.type).toBe('function');
      expect(selectedNode?.id).toBe('main-function');
    });
  });

  describe('Partial search functionality', () => {
    it('should find variable node when searching for "var"', () => {
      // Perform search for "var" (partial match)
      searchHarness.performSearch('var');
      
      const selectedNode = searchHarness.getSelectedNode();
      const searchResults = searchHarness.getSearchResults();
      
      // Should find the variable node
      expect(searchResults.length).toBe(1);
      expect(searchResults[0].type).toBe('variable');
      
      // Should select the variable node
      expect(selectedNode).toBeTruthy();
      expect(selectedNode?.type).toBe('variable');
    });

    it('should find print node when searching for "prin"', () => {
      // Perform search for "prin" (partial match)
      searchHarness.performSearch('prin');
      
      const selectedNode = searchHarness.getSelectedNode();
      const searchResults = searchHarness.getSearchResults();
      
      // Should find the print node
      expect(searchResults.length).toBe(1);
      expect(searchResults[0].type).toBe('print');
      
      // Should select the print node
      expect(selectedNode).toBeTruthy();
      expect(selectedNode?.type).toBe('print');
    });
  });

  describe('Search navigation functionality', () => {
    it('should cycle through multiple search results with findNext', () => {
      // Create additional nodes that match "function"
      const additionalFunction: WorkflowNode = {
        id: 'helper-function',
        type: 'function',
        position: { x: 400, y: 100 },
        properties: { function_name: 'helper' },
        inputs: [],
        outputs: []
      };
      
      const currentNodes = searchHarness.getSearchResults();
      searchHarness.setNodes([...searchHarness['nodes'], additionalFunction]);

      // Search for "function" - should find both function nodes
      searchHarness.performSearch('function');
      
      let searchResults = searchHarness.getSearchResults();
      expect(searchResults.length).toBe(2);
      
      // First result should be selected
      let selectedNode = searchHarness.getSelectedNode();
      expect(selectedNode?.id).toBe('main-function');
      expect(searchHarness.getCurrentSearchIndex()).toBe(0);
      
      // Navigate to next result
      searchHarness.findNext();
      selectedNode = searchHarness.getSelectedNode();
      expect(selectedNode?.id).toBe('helper-function');
      expect(searchHarness.getCurrentSearchIndex()).toBe(1);
      
      // Navigate to next (should wrap to first)
      searchHarness.findNext();
      selectedNode = searchHarness.getSelectedNode();
      expect(selectedNode?.id).toBe('main-function');
      expect(searchHarness.getCurrentSearchIndex()).toBe(0);
    });

    it('should cycle through search results with findPrevious', () => {
      // Create additional nodes that match "function"
      const additionalFunction: WorkflowNode = {
        id: 'helper-function',
        type: 'function',
        position: { x: 400, y: 100 },
        properties: { function_name: 'helper' },
        inputs: [],
        outputs: []
      };
      
      searchHarness.setNodes([...searchHarness['nodes'], additionalFunction]);

      // Search for "function"
      searchHarness.performSearch('function');
      
      // Should start at first result
      let selectedNode = searchHarness.getSelectedNode();
      expect(selectedNode?.id).toBe('main-function');
      expect(searchHarness.getCurrentSearchIndex()).toBe(0);
      
      // Navigate to previous (should wrap to last)
      searchHarness.findPrevious();
      selectedNode = searchHarness.getSelectedNode();
      expect(selectedNode?.id).toBe('helper-function');
      expect(searchHarness.getCurrentSearchIndex()).toBe(1);
      
      // Navigate to previous again
      searchHarness.findPrevious();
      selectedNode = searchHarness.getSelectedNode();
      expect(selectedNode?.id).toBe('main-function');
      expect(searchHarness.getCurrentSearchIndex()).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty search term', () => {
      // Search for empty string
      searchHarness.performSearch('');
      
      const searchResults = searchHarness.getSearchResults();
      expect(searchResults.length).toBe(0);
      expect(searchHarness.getCurrentSearchIndex()).toBe(0);
    });

    it('should handle search with no matches', () => {
      // Search for something that doesn't exist
      searchHarness.performSearch('nonexistent');
      
      const searchResults = searchHarness.getSearchResults();
      const consoleLogs = searchHarness.getConsoleLogs();
      
      expect(searchResults.length).toBe(0);
      expect(consoleLogs.some(log => log.includes('No matches found'))).toBe(true);
    });

    it('should handle findNext/findPrevious with no search results', () => {
      // Clear search results
      searchHarness.performSearch('');
      
      const initialSelected = searchHarness.getSelectedNode();
      
      // Try to navigate with no results
      searchHarness.findNext();
      searchHarness.findPrevious();
      
      // Should not change anything
      expect(searchHarness.getSelectedNode()).toBe(initialSelected);
    });
  });

  describe('Case insensitive search', () => {
    it('should find nodes regardless of case', () => {
      // Test uppercase
      searchHarness.performSearch('VARIABLE');
      expect(searchHarness.getSearchResults().length).toBe(1);
      expect(searchHarness.getSelectedNode()?.type).toBe('variable');
      
      // Test mixed case
      searchHarness.clearConsoleLogs();
      searchHarness.performSearch('VaR');
      expect(searchHarness.getSearchResults().length).toBe(1);
      expect(searchHarness.getSelectedNode()?.type).toBe('variable');
      
      // Test lowercase
      searchHarness.clearConsoleLogs();
      searchHarness.performSearch('print');
      expect(searchHarness.getSearchResults().length).toBe(1);
      expect(searchHarness.getSelectedNode()?.type).toBe('print');
    });
  });
});