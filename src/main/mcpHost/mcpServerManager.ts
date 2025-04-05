import { app } from "electron";
import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
import {
  MCPActuator,
  MCPServer,
  MCPServerConfig,
  MCPServerConfigItem,
} from "./types";
import { StdioActuator } from "./stdio";

/**
 * MCP服务器管理器类
 * 负责管理MCP服务器的添加、修改、删除、启动、停止等操作
 */
export class MCPServerManager {
  private servers: Map<string, MCPServer> = new Map();
  private runningServers: Map<string, MCPActuator> = new Map();
  private configPath: string;

  constructor() {
    // 配置文件路径
    this.configPath = path.join(app.getPath("userData"), "mcp_servers.json");

    // 加载配置
    this.loadConfig();
  }

  /**
   * 加载MCP服务器配置
   */
  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, "utf-8");
        const config: MCPServerConfig = JSON.parse(configData);

        // 将配置转换为服务器对象
        Object.entries(config.mcpServers).forEach(([id, serverConfig]) => {
          const server: MCPServer = {
            id,
            name: id, // 使用ID作为默认名称
            url: "", // 根据实际情况设置URL
            mode: serverConfig.transportType, // 根据环境变量设置模式
            status: "offline",
            command: serverConfig.command,
            args: serverConfig.args,
            env: serverConfig.env,
            createdAt: new Date().toISOString(),
          };

          this.servers.set(id, server);
        });
      }
    } catch (error) {
      console.error("加载MCP服务器配置失败:", error);
    }
  }

  /**
   * 保存MCP服务器配置
   */
  private saveConfig(): void {
    try {
      const config: MCPServerConfig = {
        mcpServers: {},
      };

      // 将服务器对象转换为配置
      this.servers.forEach((server, id) => {
        if (server.command) {
          const env = server.env || {};

          config.mcpServers[id] = {
            command: server.command,
            args: server.args || [],
            env: env,
            disabled: server.status === "offline",
            transportType: server.mode,
            autoApprove: [],
          };
        }
      });

      fs.writeFileSync(
        this.configPath,
        JSON.stringify(config, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error("保存MCP服务器配置失败:", error);
    }
  }

  /**
   * 获取所有MCP服务器
   */
  getServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  /**
   * 根据ID获取MCP服务器
   */
  getServerById(id: string): MCPServer | undefined {
    return this.servers.get(id);
  }

  /**
   * 添加MCP服务器
   */
  addServer(server: Omit<MCPServer, "id" | "createdAt" | "status">): MCPServer {
    const id = Date.now().toString();
    const newServer: MCPServer = {
      ...server,
      id,
      status: "offline",
      createdAt: new Date().toISOString(),
    };

    this.servers.set(id, newServer);
    this.saveConfig();

    return newServer;
  }

  /**
   * 更新MCP服务器
   */
  updateServer(id: string, updates: Partial<MCPServer>): MCPServer | undefined {
    const server = this.servers.get(id);
    if (!server) return undefined;

    const updatedServer = { ...server, ...updates };
    this.servers.set(id, updatedServer);
    this.saveConfig();

    return updatedServer;
  }

  /**
   * 删除MCP服务器
   */
  deleteServer(id: string): boolean {
    // 如果服务器正在运行，先停止它
    if (this.runningServers.has(id)) {
      this.stopServer(id);
    }

    const result = this.servers.delete(id);
    if (result) {
      this.saveConfig();
    }

    return result;
  }

  /**
   * 启动MCP服务器
   */
  async startServer(id: string) {
    const server = this.servers.get(id);
    if (!server || !server.command || this.runningServers.has(id)) {
      return false;
    }

    try {
      // 对于sse模式，可能需要特殊处理
      let actuator: MCPActuator;
      if (server.mode === "sse") {
        console.log(`[MCP Server ${id}] 以SSE模式启动`);
        actuator = new StdioActuator(server);
      } else {
        console.log(`[MCP Server ${id}] 以STDIO模式启动`);
        actuator = new StdioActuator(server);
      }

      const event = await actuator.startServer();

      // 处理进程输出
      event.onData((data: string) => {
        console.log(`[MCP Server ${id}] stdout: ${data}`);
      });

      event.onError((data: string) => {
        console.error(`[MCP Server ${id}] stderr: ${data}`);
      });

      // 处理进程退出
      event.onClose(() => {
        console.log(`[MCP Server ${id}] 进程退出`);
        this.runningServers.delete(id);
        this.updateServer(id, { status: "offline" });
      });

      // 保存进程引用
      this.runningServers.set(id, actuator);

      // 更新服务器状态
      this.updateServer(id, {
        status: "online",
        lastConnected: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error(`启动MCP服务器 ${id} 失败:`, error);
      return false;
    }
  }

  /**
   * 停止MCP服务器
   */
  async stopServer(id: string): Promise<boolean> {
    const actuator = this.runningServers.get(id);
    if (!actuator) {
      return false;
    }

    try {
      await actuator.stop();
      // 更新服务器状态
      this.updateServer(id, { status: "offline" });

      return true;
    } catch (error) {
      console.error(`停止MCP服务器 ${id} 失败:`, error);
      return false;
    }
  }

  /**
   * 导入MCP服务器配置
   */
  importConfig(configPath: string): boolean {
    try {
      const configData = fs.readFileSync(configPath, "utf-8");
      const config: MCPServerConfig = JSON.parse(configData);

      // 清除现有服务器
      this.servers.clear();

      // 导入新服务器
      Object.entries(config.mcpServers).forEach(([id, serverConfig]) => {
        // 检查环境变量中是否有指定的传输模式
        let mode: "stdio" | "sse" = "stdio"; // 默认为stdio模式

        const server: MCPServer = {
          id,
          name: id,
          url: "",
          mode: mode,
          status: "offline",
          command: serverConfig.command,
          args: serverConfig.args,
          env: serverConfig.env,
          createdAt: new Date().toISOString(),
        };

        this.servers.set(id, server);
      });

      this.saveConfig();
      return true;
    } catch (error) {
      console.error("导入MCP服务器配置失败:", error);
      return false;
    }
  }

  /**
   * 导出MCP服务器配置
   */
  exportConfig(configPath: string): boolean {
    try {
      const config = this.generateConfig();
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
      return true;
    } catch (error) {
      console.error("导出MCP服务器配置失败:", error);
      return false;
    }
  }

  /**
   * 生成MCP服务器配置
   */
  generateConfig(): MCPServerConfig {
    const config: MCPServerConfig = {
      mcpServers: {},
    };

    this.servers.forEach((server, id) => {
      if (server.command) {
        config.mcpServers[id] = {
          command: server.command,
          args: server.args || [],
          env: server.env,
          transportType: server.mode,
          disabled: server.status === "offline",
          autoApprove: [],
        };
      }
    });

    return config;
  }
}
