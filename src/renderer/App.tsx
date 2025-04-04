import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout';
import MCPServers from './pages/MCPServers';
import MCPServerAgents from './pages/MCPServerAgents';
import AgentDetail from './pages/AgentDetail';
import CreateAgent from './pages/CreateAgent';
import EditAgent from './pages/EditAgent';
import './styles/app.css';

const App: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<MCPServers />} />
        <Route path="/servers" element={<MCPServers />} />
        <Route path="/agents" element={<MCPServerAgents />} />
        <Route path="/agents/:id" element={<AgentDetail />} />
        <Route path="/agents/create" element={<CreateAgent />} />
        <Route path="/agents/:id/edit" element={<EditAgent />} />
      </Routes>
    </Layout>
  );
};

export default App;
