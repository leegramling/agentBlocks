import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WorkflowEditor from './components/WorkflowEditor';
import BlockEditor from './components/BlockEditor';
import Layout from './components/Layout';

function App() {
  return (
    <div className="app-container">
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<WorkflowEditor />} />
            <Route path="/workflow/:id" element={<WorkflowEditor />} />
            <Route path="/block-editor/:nodeId" element={<BlockEditor />} />
          </Routes>
        </Layout>
      </Router>
    </div>
  );
}

export default App;