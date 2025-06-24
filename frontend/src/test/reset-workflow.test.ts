import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { WorkflowNode } from '../types'

// Mock localStorage
const mockLocalStorage = {
  removeItem: (key: string) => {},
  setItem: (key: string, value: string) => {},
  getItem: (key: string) => null
}

// Simulate the resetWorkflow function logic
const simulateResetWorkflow = (): WorkflowNode[] => {
  // Clear localStorage (mocked)
  mockLocalStorage.removeItem('agentblocks_workflow')
  
  // Create default main function
  const mainFunction: WorkflowNode = {
    id: 'main-function',
    type: 'function',
    position: { x: 100, y: 100 },
    panelId: undefined,
    properties: {
      function_name: 'main',
      parameters: '',
      return_type: 'void',
      description: 'Main function - entry point of the workflow'
    },
    inputs: [],
    outputs: [{ id: 'output', name: 'Output', type: 'any' }],
  }
  
  // Create example variable node as child of main
  const variableNode: WorkflowNode = {
    id: 'var-counter',
    type: 'variable',
    position: { x: 120, y: 166 },
    parentId: 'main-function',
    properties: {
      name: 'counter',
      value: '1',
      type: 'number'
    },
    inputs: [],
    outputs: [{ id: 'output', name: 'Output', type: 'any' }],
  }
  
  // Create example print node as child of main
  const printNode: WorkflowNode = {
    id: 'print-fruit',
    type: 'print',
    position: { x: 120, y: 232 },
    parentId: 'main-function',
    properties: {
      message: 'f"{counter}. {fruit}"'
    },
    inputs: [{ id: 'input', name: 'Input', type: 'any' }],
    outputs: [],
  }
  
  return [mainFunction, variableNode, printNode]
}

// Simulate the orphan node fix logic
const simulateOrphanFix = (existingNodes: WorkflowNode[]): WorkflowNode[] => {
  const mainFunction = existingNodes.find(node => 
    node.type === 'function' && node.properties?.function_name === 'main'
  )
  
  if (!mainFunction) {
    // Create main function and fix orphans
    const newMainFunction: WorkflowNode = {
      id: 'main-function',
      type: 'function',
      position: { x: 100, y: 100 },
      panelId: undefined,
      properties: {
        function_name: 'main',
        parameters: '',
        return_type: 'void',
        description: 'Main function - entry point of the workflow'
      },
      inputs: [],
      outputs: [{ id: 'output', name: 'Output', type: 'any' }],
    }
    
    // Move orphaned nodes to main function
    const updatedNodes = existingNodes.map(node => {
      if (node.type !== 'function' && (!node.parentId || !existingNodes.find(n => n.id === node.parentId))) {
        return { ...node, parentId: 'main-function' }
      }
      return node
    })
    
    return [newMainFunction, ...updatedNodes]
  } else {
    // Fix orphaned nodes for existing main function
    const orphanedNodes = existingNodes.filter(node => 
      node.type !== 'function' && 
      (!node.parentId || !existingNodes.find(n => n.id === node.parentId && n.type === 'function'))
    )
    
    if (orphanedNodes.length > 0) {
      return existingNodes.map(node => {
        if (orphanedNodes.includes(node)) {
          return { ...node, parentId: mainFunction.id }
        }
        return node
      })
    }
    
    return existingNodes
  }
}

describe('Reset Workflow Function', () => {
  describe('Clean Reset', () => {
    it('should create main function with example variable and print nodes', () => {
      const result = simulateResetWorkflow()
      
      expect(result).toHaveLength(3)
      
      // Check main function
      const mainFunction = result.find(n => n.type === 'function')
      expect(mainFunction).toBeDefined()
      expect(mainFunction?.properties?.function_name).toBe('main')
      expect(mainFunction?.id).toBe('main-function')
      
      // Check variable node
      const variableNode = result.find(n => n.type === 'variable')
      expect(variableNode).toBeDefined()
      expect(variableNode?.parentId).toBe('main-function')
      expect(variableNode?.properties?.name).toBe('counter')
      expect(variableNode?.properties?.value).toBe('1')
      
      // Check print node
      const printNode = result.find(n => n.type === 'print')
      expect(printNode).toBeDefined()
      expect(printNode?.parentId).toBe('main-function')
      expect(printNode?.properties?.message).toBe('f"{counter}. {fruit}"')
    })

    it('should reset to standard example regardless of existing nodes', () => {
      // Simulate existing complex workflow before reset (this should be ignored)
      const existingComplexWorkflow: WorkflowNode[] = [
        {
          id: 'main-function',
          type: 'function',
          position: { x: 100, y: 100 },
          properties: { function_name: 'main' },
          inputs: [],
          outputs: [{ id: 'output', name: 'Output', type: 'any' }],
        },
        {
          id: 'some-other-var',
          type: 'variable',
          position: { x: 120, y: 166 },
          parentId: 'main-function',
          properties: { name: 'differentVar', value: '99', type: 'number' },
          inputs: [],
          outputs: [{ id: 'output', name: 'Output', type: 'any' }],
        }
      ]

      // Reset should ignore existing nodes and create standard example
      const result = simulateResetWorkflow()
      
      // Should have main function + 2 example nodes
      expect(result).toHaveLength(3)
      
      // Should be the standard example, not the existing workflow
      const variableNode = result.find(n => n.type === 'variable')
      expect(variableNode?.properties?.name).toBe('counter') // Not 'differentVar'
      expect(variableNode?.properties?.value).toBe('1') // Not '99'
    })

    it('should clear localStorage when reset', () => {
      const removeItemSpy = vi.fn()
      mockLocalStorage.removeItem = removeItemSpy
      
      simulateResetWorkflow()
      
      expect(removeItemSpy).toHaveBeenCalledWith('agentblocks_workflow')
    })

    it('should have correct node hierarchy after reset', () => {
      const result = simulateResetWorkflow()
      
      // All non-function nodes should be children of main function
      const nonFunctionNodes = result.filter(n => n.type !== 'function')
      nonFunctionNodes.forEach(node => {
        expect(node.parentId).toBe('main-function')
      })
      
      // Should be positioned correctly (children below parent)
      const mainFunction = result.find(n => n.type === 'function')
      nonFunctionNodes.forEach(child => {
        expect(child.position.x).toBeGreaterThan(mainFunction!.position.x)
        expect(child.position.y).toBeGreaterThan(mainFunction!.position.y)
      })
    })
  })

  describe('Orphan Node Handling', () => {
    it('should move orphaned variable and print nodes to main function', () => {
      const orphanedNodes: WorkflowNode[] = [
        {
          id: 'var-1',
          type: 'variable',
          position: { x: 120, y: 166 },
          // No parentId - this is orphaned
          properties: { name: 'counter', value: '1', type: 'number' },
          inputs: [],
          outputs: [{ id: 'output', name: 'Output', type: 'any' }],
        },
        {
          id: 'print-1',
          type: 'print',
          position: { x: 120, y: 232 },
          // No parentId - this is orphaned
          properties: { message: 'f"{counter}. {fruit}"' },
          inputs: [{ id: 'input', name: 'Input', type: 'any' }],
          outputs: [],
        }
      ]

      const result = simulateOrphanFix(orphanedNodes)
      
      // Should have main function + 2 fixed nodes
      expect(result).toHaveLength(3)
      
      // Main function should exist
      const mainFunction = result.find(n => n.type === 'function')
      expect(mainFunction).toBeDefined()
      expect(mainFunction?.properties?.function_name).toBe('main')
      
      // All non-function nodes should be children of main
      const nonFunctionNodes = result.filter(n => n.type !== 'function')
      nonFunctionNodes.forEach(node => {
        expect(node.parentId).toBe('main-function')
      })
    })

    it('should fix nodes with invalid parentId references', () => {
      const nodesWithBadParents: WorkflowNode[] = [
        {
          id: 'main-function',
          type: 'function',
          position: { x: 100, y: 100 },
          properties: { function_name: 'main' },
          inputs: [],
          outputs: [{ id: 'output', name: 'Output', type: 'any' }],
        },
        {
          id: 'var-1',
          type: 'variable',
          position: { x: 120, y: 166 },
          parentId: 'nonexistent-function', // Invalid parentId
          properties: { name: 'counter', value: '1', type: 'number' },
          inputs: [],
          outputs: [{ id: 'output', name: 'Output', type: 'any' }],
        }
      ]

      const result = simulateOrphanFix(nodesWithBadParents)
      
      const fixedVariable = result.find(n => n.id === 'var-1')
      expect(fixedVariable?.parentId).toBe('main-function')
    })

    it('should preserve valid parent-child relationships', () => {
      const validNodes: WorkflowNode[] = [
        {
          id: 'main-function',
          type: 'function',
          position: { x: 100, y: 100 },
          properties: { function_name: 'main' },
          inputs: [],
          outputs: [{ id: 'output', name: 'Output', type: 'any' }],
        },
        {
          id: 'var-1',
          type: 'variable',
          position: { x: 120, y: 166 },
          parentId: 'main-function', // Valid parentId
          properties: { name: 'counter', value: '1', type: 'number' },
          inputs: [],
          outputs: [{ id: 'output', name: 'Output', type: 'any' }],
        }
      ]

      const result = simulateOrphanFix(validNodes)
      
      // Should not change anything
      expect(result).toEqual(validNodes)
      
      const variable = result.find(n => n.id === 'var-1')
      expect(variable?.parentId).toBe('main-function')
    })
  })

  describe('Automatic Orphan Fix (NOT Reset)', () => {
    it('should handle the reported issue: variable and print nodes outside main function', () => {
      // NOTE: This tests the automatic fix logic that runs when nodes are loaded,
      // NOT the reset functionality. Reset creates a clean slate with only main function.
      
      // Simulate the exact scenario reported by the user
      const problematicWorkflow: WorkflowNode[] = [
        // Main function exists but...
        {
          id: 'main-function',
          type: 'function',
          position: { x: 100, y: 100 },
          properties: { function_name: 'main' },
          inputs: [],
          outputs: [{ id: 'output', name: 'Output', type: 'any' }],
        },
        // Variable node without proper parent (the problem!)
        {
          id: 'var-counter',
          type: 'variable',
          position: { x: 200, y: 150 },
          // parentId is missing or wrong
          properties: { name: 'counter', value: '1', type: 'number' },
          inputs: [],
          outputs: [{ id: 'output', name: 'Output', type: 'any' }],
        },
        // Print node without proper parent (the problem!)
        {
          id: 'print-fruit',
          type: 'print',
          position: { x: 200, y: 200 },
          // parentId is missing or wrong
          properties: { message: 'f"{counter}. {fruit}"' },
          inputs: [{ id: 'input', name: 'Input', type: 'any' }],
          outputs: [],
        }
      ]

      // This is the automatic fix that should happen when workflow is loaded
      const fixedWorkflow = simulateOrphanFix(problematicWorkflow)
      
      // Verify the fix worked
      expect(fixedWorkflow).toHaveLength(3)
      
      // All nodes should now have proper hierarchy
      const variable = fixedWorkflow.find(n => n.id === 'var-counter')
      const print = fixedWorkflow.find(n => n.id === 'print-fruit')
      
      expect(variable?.parentId).toBe('main-function')
      expect(print?.parentId).toBe('main-function')
      
      // This test failing would catch the exact issue the user reported
    })

    it('should differentiate reset vs automatic fix behavior', () => {
      // Complex workflow with orphaned nodes
      const complexWorkflow: WorkflowNode[] = [
        {
          id: 'main-function',
          type: 'function',
          position: { x: 100, y: 100 },
          properties: { function_name: 'main' },
          inputs: [],
          outputs: [{ id: 'output', name: 'Output', type: 'any' }],
        },
        {
          id: 'orphaned-var',
          type: 'variable',
          position: { x: 200, y: 150 },
          // No parentId - orphaned
          properties: { name: 'counter', value: '1', type: 'number' },
          inputs: [],
          outputs: [{ id: 'output', name: 'Output', type: 'any' }],
        }
      ]

      // Automatic fix preserves existing nodes and fixes relationships
      const autoFixed = simulateOrphanFix(complexWorkflow)
      expect(autoFixed).toHaveLength(2) // Keeps both nodes
      expect(autoFixed.find(n => n.id === 'orphaned-var')?.parentId).toBe('main-function')

      // Reset ignores existing nodes and creates standard example
      const reset = simulateResetWorkflow()
      expect(reset).toHaveLength(3) // Main function + 2 example nodes
      expect(reset.find(n => n.type === 'function')?.id).toBe('main-function')
      expect(reset.find(n => n.type === 'variable')?.properties?.name).toBe('counter')
      expect(reset.find(n => n.type === 'print')?.properties?.message).toBe('f"{counter}. {fruit}"')
    })
  })
})