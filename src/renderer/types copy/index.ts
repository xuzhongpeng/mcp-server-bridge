// MCP服务器类型
export interface MCPServer {
  id: string;
  name: string;
  url: string;
  mode: 'stdio' | 'sse';
  status: 'online' | 'offline';
  description?: string;
  createdAt: string;
  lastConnected?: string;
}

// MCP服务器代理类型
export interface MCPServerAgent {
  id: string;
  name: string;
  description?: string;
  servers: string[]; // 包含的MCP服务器ID列表
  exposedEndpoints: string[]; // 暴露的接口列表
  createdAt: string;
  updatedAt: string;
}
