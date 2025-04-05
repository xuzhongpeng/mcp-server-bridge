interface IpcRenderer {
  send(channel: string, ...args: any[]): void;
  on(channel: string, func: (...args: any[]) => void): () => void;
  once(channel: string, func: (...args: any[]) => void): void;
  removeAllListeners(channel: string): void;
  invoke(channel: string, ...args: any[]): Promise<any>;
  sendSync(channel: string, ...args: any[]): any;
}

// MCP服务器类型
interface MCPServer {
  id: string;
  name: string;
  url: string;
  mode: 'stdio' | 'sse';
  status: 'online' | 'offline';
  description?: string;
  createdAt: string;
  lastConnected?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

// MCP服务器集合类型
interface MCPServerCollection {
  id: string;
  name: string;
  description?: string;
  servers: string[]; // 包含的MCP服务器ID列表
  exposedEndpoints?: string[]; // 暴露的接口列表
  createdAt: string;
  updatedAt: string;
}

// MCP Host API
interface MCPHostAPI {
  // 服务器管理
  getServers(): MCPServer[];
  getServer(id: string): MCPServer | undefined;
  addServer(server: Omit<MCPServer, 'id' | 'createdAt' | 'status'>): Promise<{ success: boolean; data?: MCPServer; error?: string }>;
  updateServer(id: string, updates: Partial<MCPServer>): Promise<{ success: boolean; data?: MCPServer; error?: string }>;
  deleteServer(id: string): Promise<{ success: boolean; error?: string }>;
  startServer(id: string): Promise<{ success: boolean; error?: string }>;
  stopServer(id: string): Promise<{ success: boolean; error?: string }>;

  // 集合管理
  getCollections(): MCPServerCollection[];
  getCollection(id: string): MCPServerCollection | undefined;
  addCollection(collection: Omit<MCPServerCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; data?: MCPServerCollection; error?: string }>;
  updateCollection(id: string, updates: Partial<MCPServerCollection>): Promise<{ success: boolean; data?: MCPServerCollection; error?: string }>;
  deleteCollection(id: string): Promise<{ success: boolean; error?: string }>;
  exportCollection(id: string, port: number): Promise<{ success: boolean; error?: string }>;

  // 集合服务器管理
  addServerToCollection(collectionId: string, serverId: string): Promise<{ success: boolean; error?: string }>;
  removeServerFromCollection(collectionId: string, serverId: string): Promise<{ success: boolean; error?: string }>;

  // 配置导入导出
  importConfig(): Promise<{ success: boolean; error?: string }>;
  exportConfig(): Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electron: {
      ipcRenderer: IpcRenderer;
    };
    mcpHost: MCPHostAPI;
  }
}

export {};
