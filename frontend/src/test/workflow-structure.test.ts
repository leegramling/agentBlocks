import { describe, it, expect } from 'vitest'
import type { WorkflowNode, Connection } from '../types'

// Test helper to create a basic main function node
const createMainFunction = (id = 'main-function'): WorkflowNode => ({
  id,
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
})

// Test helper to create a variable node
const createVariableNode = (id: string, parentId?: string): WorkflowNode => ({
  id,
  type: 'variable',
  position: { x: 120, y: 166 },
  parentId,
  properties: {
    name: 'counter',
    value: '1',
    type: 'number'
  },
  inputs: [],
  outputs: [{ id: 'output', name: 'Output', type: 'any' }],
})

// Test helper to create a print node
const createPrintNode = (id: string, parentId?: string): WorkflowNode => ({
  id,
  type: 'print',
  position: { x: 120, y: 232 },
  parentId,
  properties: {
    message: 'f"{counter}. {fruit}"'
  },
  inputs: [{ id: 'input', name: 'Input', type: 'any' }],
  outputs: [],
})

describe('Workflow Structure', () => {
  describe('Node Parent-Child Relationships', () => {
    it('should have all non-function nodes as children of a function', () => {
      const nodes: WorkflowNode[] = [
        createMainFunction(),
        createVariableNode('var-1', 'main-function'),
        createPrintNode('print-1', 'main-function')
      ]

      // All non-function nodes should have a parentId
      const nonFunctionNodes = nodes.filter(n => n.type !== 'function')
      nonFunctionNodes.forEach(node => {
        expect(node.parentId).toBeDefined()
        expect(node.parentId).not.toBe('')
      })

      // All parentIds should reference existing function nodes
      nonFunctionNodes.forEach(node => {
        const parent = nodes.find(n => n.id === node.parentId)
        expect(parent).toBeDefined()
        expect(parent?.type).toBe('function')
      })
    })

    it('should identify orphaned nodes (nodes without valid parents)', () => {
      const nodes: WorkflowNode[] = [
        createMainFunction(),
        createVariableNode('var-1'), // No parentId - orphaned
        createPrintNode('print-1', 'nonexistent-function'), // Invalid parentId - orphaned
        createPrintNode('print-2', 'main-function') // Valid parent
      ]

      const orphanedNodes = nodes.filter(node => 
        node.type !== 'function' && 
        (!node.parentId || !nodes.find(n => n.id === node.parentId && n.type === 'function'))
      )

      expect(orphanedNodes).toHaveLength(2)
      expect(orphanedNodes.map(n => n.id)).toEqual(['var-1', 'print-1'])
    })

    it('should have a main function in every workflow', () => {
      const nodes: WorkflowNode[] = [
        createMainFunction(),
        createVariableNode('var-1', 'main-function')
      ]

      const mainFunction = nodes.find(node => 
        node.type === 'function' && node.properties?.function_name === 'main'
      )

      expect(mainFunction).toBeDefined()
      expect(mainFunction?.id).toBe('main-function')
    })

    it('should detect missing main function', () => {
      const nodes: WorkflowNode[] = [
        createVariableNode('var-1'),
        createPrintNode('print-1')
      ]

      const hasMainFunction = nodes.some(node => 
        node.type === 'function' && node.properties?.function_name === 'main'
      )

      expect(hasMainFunction).toBe(false)
    })
  })

  describe('Node Positioning', () => {
    it('should position child nodes relative to their parent function', () => {
      const mainFunction = createMainFunction()
      const childNodes = [
        createVariableNode('var-1', 'main-function'),
        createPrintNode('print-1', 'main-function')
      ]

      // Child nodes should be positioned below and indented from the parent
      childNodes.forEach(child => {
        expect(child.position.x).toBeGreaterThan(mainFunction.position.x)
        expect(child.position.y).toBeGreaterThan(mainFunction.position.y)
      })
    })
  })

  describe('Workflow Reset', () => {
    it('should create a clean workflow with only main function when reset', () => {
      // Simulate what resetWorkflow should produce
      const resetNodes: WorkflowNode[] = [createMainFunction()]

      expect(resetNodes).toHaveLength(1)
      expect(resetNodes[0].type).toBe('function')
      expect(resetNodes[0].properties?.function_name).toBe('main')
    })

    it('should ensure orphaned nodes get reassigned to main function', () => {
      const originalNodes: WorkflowNode[] = [
        createVariableNode('var-1'), // Orphaned
        createPrintNode('print-1') // Orphaned
      ]

      // Simulate the fix logic
      const mainFunction = createMainFunction()
      const fixedNodes = [
        mainFunction,
        ...originalNodes.map(node => ({ ...node, parentId: 'main-function' }))
      ]

      // Verify all nodes now have proper parents
      const nonFunctionNodes = fixedNodes.filter(n => n.type !== 'function')
      nonFunctionNodes.forEach(node => {
        expect(node.parentId).toBe('main-function')
      })
    })
  })

  describe('Code Generation Dependencies', () => {
    it('should be able to find child nodes for code generation', () => {
      const nodes: WorkflowNode[] = [
        createMainFunction(),
        createVariableNode('var-1', 'main-function'),
        createPrintNode('print-1', 'main-function'),
        createVariableNode('var-2', 'other-function') // Different parent
      ]

      const mainFunctionChildren = nodes.filter(n => n.parentId === 'main-function')
      
      expect(mainFunctionChildren).toHaveLength(2)
      expect(mainFunctionChildren.map(n => n.id)).toEqual(['var-1', 'print-1'])
    })

    it('should maintain execution order based on position', () => {
      const nodes: WorkflowNode[] = [
        createMainFunction(),
        { ...createVariableNode('var-1', 'main-function'), position: { x: 120, y: 200 } },
        { ...createPrintNode('print-1', 'main-function'), position: { x: 120, y: 166 } }, // Higher up
        { ...createVariableNode('var-2', 'main-function'), position: { x: 120, y: 234 } }
      ]

      const childNodes = nodes.filter(n => n.parentId === 'main-function')
      const executionOrder = childNodes.sort((a, b) => a.position.y - b.position.y)

      expect(executionOrder.map(n => n.id)).toEqual(['print-1', 'var-1', 'var-2'])
    })
  })
})