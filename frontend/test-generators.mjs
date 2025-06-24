// Quick test of the code generators
import { PythonNodeGenerator } from './src/nodes/generators/PythonNodeGenerator.js';
import { RustNodeGenerator } from './src/nodes/generators/RustNodeGenerator.js';

// Mock test data
const testNodes = [
  {
    id: 'node1',
    type: 'variable',
    properties: { name: 'greeting', value: 'Hello World' },
    position: { x: 100, y: 100 }
  },
  {
    id: 'node2', 
    type: 'print',
    properties: { message: 'greeting' },
    position: { x: 100, y: 200 }
  }
];

const testConnections = [
  {
    id: 'conn1',
    source_node: 'node1',
    source_output: 'value',
    target_node: 'node2',
    target_input: 'message'
  }
];

try {
  console.log('Testing Python generator...');
  const pythonGen = new PythonNodeGenerator();
  const pythonCode = pythonGen.generateWorkflowCode(testNodes, testConnections);
  console.log('Python code generated successfully:', pythonCode.length > 0);
  console.log('Sample Python code:\n', pythonCode.substring(0, 200) + '...\n');
  
  console.log('Testing Rust generator...');
  const rustGen = new RustNodeGenerator();
  const rustCode = rustGen.generateWorkflowCode(testNodes, testConnections);
  console.log('Rust code generated successfully:', rustCode.length > 0);
  console.log('Sample Rust code:\n', rustCode.substring(0, 200) + '...\n');
  
  console.log('✅ All generators working!');
} catch (error) {
  console.error('❌ Generator test failed:', error.message);
  console.error(error.stack);
}