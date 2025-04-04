import { MCPServer, MCPServerAgent } from '../types';

// 模拟数据
const mockServers: MCPServer[] = [
  {
    id: '1',
    name: 'Main MCP Server',
    url: 'http://localhost:3000',
    mode: 'stdio',
    status: 'online',
    description: '主要的MCP服务器',
    createdAt: '2023-06-15T10:00:00Z',
    lastConnected: '2023-06-20T15:30:00Z'
  },
  {
    id: '2',
    name: 'Secondary MCP Server',
    url: 'http://localhost:3001',
    mode: 'sse',
    status: 'online',
    description: '次要的MCP服务器',
    createdAt: '2023-06-16T09:00:00Z',
    lastConnected: '2023-06-20T14:45:00Z'
  },
  {
    id: '3',
    name: 'Test MCP Server',
    url: 'http://localhost:3002',
    mode: 'stdio',
    status: 'offline',
    description: '测试用MCP服务器',
    createdAt: '2023-06-17T11:00:00Z',
    lastConnected: '2023-06-19T16:20:00Z'
  }
];

const mockAgents: MCPServerAgent[] = [
  {
    id: '1',
    name: 'Production Agent',
    description: '生产环境代理',
    servers: ['1', '2'],
    exposedEndpoints: ['/api/v1/query', '/api/v1/execute'],
    createdAt: '2023-06-18T10:30:00Z',
    updatedAt: '2023-06-19T14:20:00Z'
  },
  {
    id: '2',
    name: 'Testing Agent',
    description: '测试环境代理',
    servers: ['3'],
    exposedEndpoints: ['/api/v1/query'],
    createdAt: '2023-06-18T11:00:00Z',
    updatedAt: '2023-06-19T15:10:00Z'
  }
];

// MCP服务器API
export const getMCPServers = (): Promise<MCPServer[]> => {
  return Promise.resolve(mockServers);
};

export const getMCPServerById = (id: string): Promise<MCPServer | undefined> => {
  return Promise.resolve(mockServers.find(server => server.id === id));
};

export const addMCPServer = (server: Omit<MCPServer, 'id' | 'createdAt'>): Promise<MCPServer> => {
  const newServer: MCPServer = {
    ...server,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  mockServers.push(newServer);
  return Promise.resolve(newServer);
};

export const updateMCPServer = (id: string, updates: Partial<MCPServer>): Promise<MCPServer | undefined> => {
  const index = mockServers.findIndex(server => server.id === id);
  if (index === -1) return Promise.resolve(undefined);
  
  mockServers[index] = { ...mockServers[index], ...updates };
  return Promise.resolve(mockServers[index]);
};

export const deleteMCPServer = (id: string): Promise<boolean> => {
  const index = mockServers.findIndex(server => server.id === id);
  if (index === -1) return Promise.resolve(false);
  
  mockServers.splice(index, 1);
  return Promise.resolve(true);
};

// MCP服务器代理API
export const getMCPServerAgents = (): Promise<MCPServerAgent[]> => {
  return Promise.resolve(mockAgents);
};

export const getMCPServerAgentById = (id: string): Promise<MCPServerAgent | undefined> => {
  return Promise.resolve(mockAgents.find(agent => agent.id === id));
};

export const addMCPServerAgent = (agent: Omit<MCPServerAgent, 'id' | 'createdAt' | 'updatedAt'>): Promise<MCPServerAgent> => {
  const now = new Date().toISOString();
  const newAgent: MCPServerAgent = {
    ...agent,
    id: Date.now().toString(),
    createdAt: now,
    updatedAt: now
  };
  mockAgents.push(newAgent);
  return Promise.resolve(newAgent);
};

export const updateMCPServerAgent = (id: string, updates: Partial<MCPServerAgent>): Promise<MCPServerAgent | undefined> => {
  const index = mockAgents.findIndex(agent => agent.id === id);
  if (index === -1) return Promise.resolve(undefined);
  
  mockAgents[index] = { 
    ...mockAgents[index], 
    ...updates,
    updatedAt: new Date().toISOString()
  };
  return Promise.resolve(mockAgents[index]);
};

export const deleteMCPServerAgent = (id: string): Promise<boolean> => {
  const index = mockAgents.findIndex(agent => agent.id === id);
  if (index === -1) return Promise.resolve(false);
  
  mockAgents.splice(index, 1);
  return Promise.resolve(true);
};
