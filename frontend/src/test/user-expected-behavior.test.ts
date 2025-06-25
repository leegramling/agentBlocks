import { describe, it, expect, beforeEach } from 'vitest';

// Test the exact user expectations for search behavior
interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  parentId?: string;
  properties?: Record<string, any>;
}

class UserSearchBehaviorTest {
  private searchValue: string = '';
  private searchResults: WorkflowNode[] = [];
  private selectedNode: WorkflowNode | null = null;
  private nodes: WorkflowNode[] = [];

  constructor() {
    this.createDefaultWorkflow();
  }

  // Simulate the exact search behavior as user types
  simulateTyping = (text: string) => {
    // Simulate typing character by character with search triggering on each character
    for (let i = 1; i <= text.length; i++) {
      const currentValue = text.substring(0, i);
      this.searchValue = currentValue;
      this.performSearch(currentValue);
    }
  };

  // Search function (similar to WorkflowEditor.performSearch)
  performSearch = (term: string) => {
    if (!term.trim()) {
      this.searchResults = [];
      this.selectedNode = null;
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
    
    if (results.length > 0) {
      this.selectedNode = results[0]; // Select first match
    } else {
      this.selectedNode = null;
    }
  };

  // Simulate pressing Enter
  pressEnter = () => {
    if (this.searchValue.trim() !== '') {
      if (this.searchResults.length > 0) {
        // If results exist, navigate to next (for now, just ensure first is selected)
        this.selectedNode = this.searchResults[0];
      } else {
        // If no results, ensure search is performed
        this.performSearch(this.searchValue);
      }
    }
  };

  createDefaultWorkflow = () => {
    this.nodes = [
      {
        id: 'main-function',
        type: 'function',
        position: { x: 100, y: 100 },
        properties: { function_name: 'main' },
      },
      {
        id: 'default-variable',
        type: 'variable',
        position: { x: 120, y: 166 },
        parentId: 'main-function',
        properties: { name: 'counter', value: '1' },
      },
      {
        id: 'default-print',
        type: 'print',
        position: { x: 120, y: 232 },
        parentId: 'main-function',
        properties: { message: '{counter}. {fruit}' },
      }
    ];
  };

  // Getters for testing
  getSelectedNode = () => this.selectedNode;
  getSearchResults = () => this.searchResults;
  getSearchValue = () => this.searchValue;

  reset = () => {
    this.searchValue = '';
    this.searchResults = [];
    this.selectedNode = null;
  };
}

describe('User Expected Search Behavior Tests', () => {
  let userTest: UserSearchBehaviorTest;

  beforeEach(() => {
    userTest = new UserSearchBehaviorTest();
  });

  describe('User types and expects node to be selected', () => {
    it('should select variable node when user types "variable"', () => {
      userTest.simulateTyping('variable');
      
      const selectedNode = userTest.getSelectedNode();
      expect(selectedNode).toBeTruthy();
      expect(selectedNode?.type).toBe('variable');
      expect(selectedNode?.id).toBe('default-variable');
    });

    it('should select print node when user types "print"', () => {
      userTest.simulateTyping('print');
      
      const selectedNode = userTest.getSelectedNode();
      expect(selectedNode).toBeTruthy();
      expect(selectedNode?.type).toBe('print');
      expect(selectedNode?.id).toBe('default-print');
    });

    it('should select variable node when user types partial "var"', () => {
      userTest.simulateTyping('var');
      
      const selectedNode = userTest.getSelectedNode();
      expect(selectedNode).toBeTruthy();
      expect(selectedNode?.type).toBe('variable');
    });

    it('should select print node when user types partial "prin"', () => {
      userTest.simulateTyping('prin');
      
      const selectedNode = userTest.getSelectedNode();
      expect(selectedNode).toBeTruthy();
      expect(selectedNode?.type).toBe('print');
    });
  });

  describe('User presses Enter and expects node to be selected', () => {
    it('should select variable node when user types "variable" and presses Enter', () => {
      userTest.simulateTyping('variable');
      userTest.pressEnter();
      
      const selectedNode = userTest.getSelectedNode();
      expect(selectedNode).toBeTruthy();
      expect(selectedNode?.type).toBe('variable');
    });

    it('should select print node when user types "print" and presses Enter', () => {
      userTest.simulateTyping('print');
      userTest.pressEnter();
      
      const selectedNode = userTest.getSelectedNode();
      expect(selectedNode).toBeTruthy();
      expect(selectedNode?.type).toBe('print');
    });

    it('should select variable node when user types "var" and presses Enter', () => {
      userTest.simulateTyping('var');
      userTest.pressEnter();
      
      const selectedNode = userTest.getSelectedNode();
      expect(selectedNode).toBeTruthy();
      expect(selectedNode?.type).toBe('variable');
    });

    it('should select print node when user types "prin" and presses Enter', () => {
      userTest.simulateTyping('prin');
      userTest.pressEnter();
      
      const selectedNode = userTest.getSelectedNode();
      expect(selectedNode).toBeTruthy();
      expect(selectedNode?.type).toBe('print');
    });
  });

  describe('Edge case: User presses Enter without typing first', () => {
    it('should handle Enter key when typing rapidly followed by immediate Enter', () => {
      // Simulate very rapid typing where user types and immediately presses Enter
      // This might not give enough time for all search callbacks to complete
      
      userTest.reset();
      
      // Set search value directly (simulating rapid input)
      userTest['searchValue'] = 'variable';
      
      // Press Enter immediately without calling performSearch
      userTest.pressEnter();
      
      // Should still find and select the variable
      const selectedNode = userTest.getSelectedNode();
      expect(selectedNode).toBeTruthy();
      expect(selectedNode?.type).toBe('variable');
    });
  });

  describe('Search behavior as user types character by character', () => {
    it('should show search progression as user types "variable"', () => {
      // v
      userTest.simulateTyping('v');
      expect(userTest.getSelectedNode()?.type).toBe('variable'); // 'v' matches 'variable'
      
      // va
      userTest.simulateTyping('va');
      expect(userTest.getSelectedNode()?.type).toBe('variable'); // 'va' matches 'variable'
      
      // var
      userTest.simulateTyping('var');
      expect(userTest.getSelectedNode()?.type).toBe('variable'); // 'var' matches 'variable'
      
      // vari
      userTest.simulateTyping('vari');
      expect(userTest.getSelectedNode()?.type).toBe('variable'); // 'vari' matches 'variable'
      
      // variable
      userTest.simulateTyping('variable');
      expect(userTest.getSelectedNode()?.type).toBe('variable'); // 'variable' matches 'variable'
    });

    it('should show search progression as user types "print"', () => {
      // p
      userTest.simulateTyping('p');
      expect(userTest.getSelectedNode()?.type).toBe('print'); // 'p' matches 'print'
      
      // pr
      userTest.simulateTyping('pr');
      expect(userTest.getSelectedNode()?.type).toBe('print'); // 'pr' matches 'print'
      
      // pri
      userTest.simulateTyping('pri');
      expect(userTest.getSelectedNode()?.type).toBe('print'); // 'pri' matches 'print'
      
      // prin
      userTest.simulateTyping('prin');
      expect(userTest.getSelectedNode()?.type).toBe('print'); // 'prin' matches 'print'
      
      // print
      userTest.simulateTyping('print');
      expect(userTest.getSelectedNode()?.type).toBe('print'); // 'print' matches 'print'
    });
  });

  describe('Testing no matches scenario', () => {
    it('should handle search term with no matches', () => {
      userTest.simulateTyping('xyz');
      
      expect(userTest.getSearchResults().length).toBe(0);
      expect(userTest.getSelectedNode()).toBeNull();
    });

    it('should handle Enter key with no matches', () => {
      userTest.simulateTyping('xyz');
      userTest.pressEnter();
      
      expect(userTest.getSearchResults().length).toBe(0);
      expect(userTest.getSelectedNode()).toBeNull();
    });
  });
});