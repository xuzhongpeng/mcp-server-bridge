import { ChildProcess, spawn } from "child_process";
import { MCPActuator, MCPActuatorEvent, MCPServer } from "./types";

export class StdioActuator implements MCPActuator {
  private childProcess: ChildProcess | null = null;
  server: MCPServer;
  constructor(server: MCPServer) {
    this.server = server;
  }
  async stop(): Promise<void> {
    if (this.childProcess == null) {
      return;
    }
    // 在Windows上使用taskkill强制终止进程树
    if (process.platform === "win32" && this.childProcess?.pid) {
      spawn("taskkill", ["/pid", this.childProcess.pid.toString(), "/f", "/t"]);
    } else {
      // 在Unix系统上发送SIGTERM信号
      this.childProcess!.kill("SIGTERM");
    }
  }
  async startServer(): Promise<MCPActuatorEvent> {
    try {
      const event: MCPActuatorEvent = new MCPActuatorEvent();
      const server = this.server;
      if (!server || !server.command) {
        throw new Error("无效的MCP服务器配置");
      }
      const spawnOptions: any = {
        env: { ...process.env, ...server.env },
        shell: true,
      };
      // 启动服务器进程
      const serverProcess = spawn(
        server.command!,
        server.args || [],
        spawnOptions
      );
      this.childProcess = serverProcess;

      // 处理进程输出
      serverProcess.stdout?.on("data", (data: Buffer) => {
        console.log(`[MCP Server ${server.id}] stdout: ${data}`);
        const dataStr = data.toString();
        console.log(`[MCP Server ${server.id}] 处理数据: ${data}`);
        event.handleData(data.toString());
      });

      serverProcess.stderr?.on("data", (data: Buffer) => {
        console.error(`[MCP Server ${server.id}] stderr: ${data}`);
        event.handleError(data.toString());
      });

      // 处理进程退出
      serverProcess.on("close", (code: number | null) => {
        console.log(`[MCP Server ${server.id}] 进程退出，退出码: ${code}`);
        event.handleClose();
      });
      return event;
    } catch (error) {
      console.error(`启动MCP服务器 ${this.server.id} 失败:`, error);
      throw error;
    }
  }
}
