// MCP服务器类型
export interface MCPServer {
  id: string;
  name: string;
  url: string;
  mode: "stdio" | "sse";
  status: "online" | "offline";
  description?: string;
  createdAt: string;
  lastConnected?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

// MCP服务器集合类型
export interface MCPServerCollection {
  id: string;
  name: string;
  description?: string;
  servers: string[]; // 包含的MCP服务器ID列表
  exposedEndpoints?: string[]; // 暴露的接口列表
  createdAt: string;
  updatedAt: string;
}

// MCP服务器配置类型（用于保存到文件）
export interface MCPServerConfig {
  mcpServers: Record<string, MCPServerConfigItem>;
}

// MCP服务器配置项类型
export interface MCPServerConfigItem {
  command: string;
  args: string[];
  env?: Record<string, string>;
  transportType: "stdio" | "sse";
  disabled?: boolean;
  autoApprove?: string[];
}

// IPC通信事件名称
export enum MCPHostEvents {
  // 服务器管理
  GET_SERVERS = "mcp-host:get-servers",
  GET_SERVER = "mcp-host:get-server",
  ADD_SERVER = "mcp-host:add-server",
  UPDATE_SERVER = "mcp-host:update-server",
  DELETE_SERVER = "mcp-host:delete-server",
  START_SERVER = "mcp-host:start-server",
  STOP_SERVER = "mcp-host:stop-server",

  // 集合管理
  GET_COLLECTIONS = "mcp-host:get-collections",
  GET_COLLECTION = "mcp-host:get-collection",
  ADD_COLLECTION = "mcp-host:add-collection",
  UPDATE_COLLECTION = "mcp-host:update-collection",
  DELETE_COLLECTION = "mcp-host:delete-collection",
  EXPORT_COLLECTION = "mcp-host:export-collection",
}
export class MCPActuatorEvent {
  private dataCaller?: (data: string) => void;
  private errorCaller?: (error: string) => void;
  private closeCaller?: () => void;
  
  handleData(data: string) {
    this.dataCaller?.call(null, data);
  }
  
  onData(callback: (data: string) => void) {
    this.dataCaller = callback;
  }
  
  handleError(error: string) {
    this.errorCaller?.call(null, error);
  }
  
  onError(callback: (error: string) => void) {
    this.errorCaller = callback;
  }
  
  handleClose() {
    this.closeCaller?.call(null);
  }
  
  onClose(callback: () => void) {
    this.closeCaller = callback;
  }
}
export interface MCPActuator {
  server: MCPServer;
  startServer(): Promise<MCPActuatorEvent>;
  stop(): Promise<void>;
}
