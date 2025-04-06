import { EventEmitter } from 'events';
import { MCPActuator, MCPServer, MCPActuatorEvent } from '../main/mcpHost/types';

// 模拟子进程
class MockMCPActuator extends EventEmitter implements MCPActuator {
  server: MCPServer;
  pid: number;
  stdout: EventEmitter | null;
  stderr: EventEmitter | null;
  killed: boolean = false;
  
  constructor(server?: MCPServer) {
    super();
    this.pid = Math.floor(Math.random() * 10000);
    this.stdout = new EventEmitter();
    this.stderr = new EventEmitter();
    
    // 如果没有提供服务器，创建一个默认的
    this.server = server || {
      id: `mock-server-${this.pid}`,
      name: 'Mock Server',
      url: 'http://localhost:3000',
      transportType: 'stdio',
      status: 'offline',
      createdAt: new Date().toISOString()
    };
  }
  
  kill = jest.fn((signal?: string): boolean => {
    this.killed = true;
    process.nextTick(() => {
      this.emit('close', 0);
    });
    return true;
  });
  
  // 实现 MCPActuator 接口的方法
  async startServer(): Promise<MCPActuatorEvent> {
    const event = new MCPActuatorEvent();
    
    // 模拟启动服务器
    this.server.status = 'online';
    this.server.lastConnected = new Date().toISOString();
    
    // 模拟数据输出
    process.nextTick(() => {
      event.handleData('Server started successfully');
    });
    
    return event;
  }
  
  async stop(): Promise<void> {
    // 模拟停止服务器
    this.kill();
    this.server.status = 'offline';
    return Promise.resolve();
  }
}

// 模拟 spawn 函数
const spawn = jest.fn((command: string, args?: string[], options?: any): MockMCPActuator => {
  const server: MCPServer = {
    id: `mock-server-${Math.floor(Math.random() * 10000)}`,
    name: `Mock Server (${command})`,
    url: 'http://localhost:3000',
    transportType: 'stdio',
    status: 'offline',
    command: command,
    args: args || [],
    createdAt: new Date().toISOString()
  };
  
  const childProcess = new MockMCPActuator(server);
  
  // 模拟进程输出
  process.nextTick(() => {
    if (childProcess.stdout) {
      childProcess.stdout.emit('data', Buffer.from(`Mock stdout output for command: ${command}`));
    }
    
    if (childProcess.stderr) {
      childProcess.stderr.emit('data', Buffer.from(`Mock stderr output for command: ${command}`));
    }
  });
  
  return childProcess;
});

// 导出模拟的 child_process 模块
export {
  spawn,
  MockMCPActuator,
};
