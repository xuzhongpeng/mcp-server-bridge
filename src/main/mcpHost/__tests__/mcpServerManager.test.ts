import { MCPServerManager } from '../mcpServerManager';
import fs from 'fs';
import { app } from 'electron';
import { spawn } from 'child_process';
import { MockChildProcess } from '../../../__mocks__/child_process';

// 模拟模块
jest.mock('fs');
jest.mock('electron');
jest.mock('child_process');

describe('MCPServerManager', () => {
  let manager: MCPServerManager;
  const mockConfigPath = '/mock/user/data/path/mcp_servers.json';
  
  beforeEach(() => {
    // 清除所有模拟的调用记录
    jest.clearAllMocks();
    
    // 重置模拟文件系统
    (fs as any).__clearMockFiles();
    
    // 创建 MCPServerManager 实例
    manager = new MCPServerManager();
  });
  
  describe('构造函数', () => {
    it('应该设置正确的配置文件路径', () => {
      expect(app.getPath).toHaveBeenCalledWith('userData');
      expect((manager as any).configPath).toBe(mockConfigPath);
    });
    
    it('应该尝试加载配置', () => {
      expect(fs.existsSync).toHaveBeenCalledWith(mockConfigPath);
    });
  });
  
  describe('getServers', () => {
    it('应该返回空数组当没有服务器时', () => {
      const servers = manager.getServers();
      expect(servers).toEqual([]);
    });
    
    it('应该返回所有服务器', () => {
      // 添加一些服务器
      const server1 = manager.addServer({
        name: 'Test Server 1',
        url: 'http://localhost:3000',
        mode: 'stdio',
        command: 'node',
        args: ['server.js'],
      });
      
      const server2 = manager.addServer({
        name: 'Test Server 2',
        url: 'http://localhost:3001',
        mode: 'sse',
        command: 'python',
        args: ['server.py'],
      });
      
      const servers = manager.getServers();
      expect(servers).toHaveLength(2);
      expect(servers).toContainEqual(server1);
      expect(servers).toContainEqual(server2);
    });
  });
  
  describe('getServerById', () => {
    it('应该返回undefined当服务器不存在时', () => {
      const server = manager.getServerById('non-existent-id');
      expect(server).toBeUndefined();
    });
    
    it('应该返回指定ID的服务器', () => {
      const server = manager.addServer({
        name: 'Test Server',
        url: 'http://localhost:3000',
        mode: 'stdio',
        command: 'node',
        args: ['server.js'],
      });
      
      const retrievedServer = manager.getServerById(server.id);
      expect(retrievedServer).toEqual(server);
    });
  });
  
  describe('addServer', () => {
    it('应该添加新服务器并返回它', () => {
      const serverData = {
        name: 'Test Server',
        url: 'http://localhost:3000',
        mode: 'stdio' as const,
        command: 'node',
        args: ['server.js'],
      };
      
      const server = manager.addServer(serverData);
      
      expect(server).toMatchObject({
        ...serverData,
        status: 'offline',
      });
      expect(server.id).toBeDefined();
      expect(server.createdAt).toBeDefined();
      
      // 验证配置已保存
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
  
  describe('updateServer', () => {
    it('应该返回undefined当服务器不存在时', () => {
      const result = manager.updateServer('non-existent-id', { name: 'New Name' });
      expect(result).toBeUndefined();
    });
    
    it('应该更新服务器并返回更新后的服务器', () => {
      const server = manager.addServer({
        name: 'Test Server',
        url: 'http://localhost:3000',
        mode: 'stdio',
        command: 'node',
        args: ['server.js'],
      });
      
      const updates = {
        name: 'Updated Server',
        url: 'http://localhost:3001',
      };
      
      const updatedServer = manager.updateServer(server.id, updates);
      
      expect(updatedServer).toMatchObject({
        ...server,
        ...updates,
      });
      
      // 验证配置已保存
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
  
  describe('deleteServer', () => {
    it('应该返回false当服务器不存在时', () => {
      const result = manager.deleteServer('non-existent-id');
      expect(result).toBeFalsy();
    });
    
    it('应该删除服务器并返回true', () => {
      const server = manager.addServer({
        name: 'Test Server',
        url: 'http://localhost:3000',
        mode: 'stdio',
        command: 'node',
        args: ['server.js'],
      });
      
      const result = manager.deleteServer(server.id);
      expect(result).toBeTruthy();
      
      // 验证服务器已被删除
      expect(manager.getServerById(server.id)).toBeUndefined();
      
      // 验证配置已保存
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
    
    it('应该停止运行中的服务器然后删除它', () => {
      const server = manager.addServer({
        name: 'Test Server',
        url: 'http://localhost:3000',
        mode: 'stdio',
        command: 'node',
        args: ['server.js'],
      });
      
      // 启动服务器
      manager.startServer(server.id);
      
      // 模拟服务器正在运行
      (manager as any).runningServers.set(server.id, new MockChildProcess());
      
      // 删除服务器
      const result = manager.deleteServer(server.id);
      expect(result).toBeTruthy();
      
      // 验证服务器已被删除
      expect(manager.getServerById(server.id)).toBeUndefined();
      
      // 验证配置已保存
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
  
  describe('startServer', () => {
    it('应该返回false当服务器不存在时', () => {
      const result = manager.startServer('non-existent-id');
      expect(result).toBeFalsy();
    });
    
    it('应该返回false当服务器没有命令时', () => {
      const server = manager.addServer({
        name: 'Test Server',
        url: 'http://localhost:3000',
        mode: 'stdio',
      });
      
      const result = manager.startServer(server.id);
      expect(result).toBeFalsy();
    });
    
    it('应该返回false当服务器已经在运行时', () => {
      const server = manager.addServer({
        name: 'Test Server',
        url: 'http://localhost:3000',
        mode: 'stdio',
        command: 'node',
        args: ['server.js'],
      });
      
      // 模拟服务器正在运行
      (manager as any).runningServers.set(server.id, new MockChildProcess());
      
      const result = manager.startServer(server.id);
      expect(result).toBeFalsy();
    });
    
    it('应该启动服务器并返回true', () => {
      const server = manager.addServer({
        name: 'Test Server',
        url: 'http://localhost:3000',
        mode: 'stdio',
        command: 'node',
        args: ['server.js'],
      });
      
      const result = manager.startServer(server.id);
      expect(result).toBeTruthy();
      
      // 验证spawn被调用
      expect(spawn).toHaveBeenCalledWith(
        server.command,
        server.args,
        expect.objectContaining({ shell: true })
      );
      
      // 验证服务器状态已更新
      const updatedServer = manager.getServerById(server.id);
      expect(updatedServer?.status).toBe('online');
      expect(updatedServer?.lastConnected).toBeDefined();
    });
  });
  
  describe('stopServer', () => {
    it('应该返回false当服务器不在运行时', () => {
      const result = manager.stopServer('non-existent-id');
      expect(result).toBeFalsy();
    });
    
    it('应该停止服务器并返回true', () => {
      const server = manager.addServer({
        name: 'Test Server',
        url: 'http://localhost:3000',
        mode: 'stdio',
        command: 'node',
        args: ['server.js'],
      });
      
      // 启动服务器
      manager.startServer(server.id);
      
      // 获取模拟的子进程
      const mockProcess = (spawn as jest.Mock).mock.results[0].value;
      
      // 停止服务器
      const result = manager.stopServer(server.id);
      expect(result).toBeTruthy();
      
      // 验证kill被调用
      expect(mockProcess.kill).toHaveBeenCalled();
      
      // 验证服务器状态已更新
      const updatedServer = manager.getServerById(server.id);
      expect(updatedServer?.status).toBe('offline');
    });
  });
  
  describe('importConfig', () => {
    it('应该导入配置并返回true', () => {
      const configPath = '/mock/file/path.json';
      const configData = {
        mcpServers: {
          'server-1': {
            command: 'node',
            args: ['server.js'],
            env: { PORT: '3000' },
          },
          'server-2': {
            command: 'python',
            args: ['server.py'],
            env: { PORT: '3001' },
          },
        },
      };
      
      // 设置模拟文件内容
      (fs as any).__setMockFiles({
        [configPath]: JSON.stringify(configData),
      });
      
      const result = manager.importConfig(configPath);
      expect(result).toBeTruthy();
      
      // 验证服务器已导入
      const servers = manager.getServers();
      expect(servers).toHaveLength(2);
      expect(servers[0].id).toBe('server-1');
      expect(servers[0].command).toBe('node');
      expect(servers[1].id).toBe('server-2');
      expect(servers[1].command).toBe('python');
      
      // 验证配置已保存
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
  
  describe('exportConfig', () => {
    it('应该导出配置并返回true', () => {
      const configPath = '/mock/save/path.json';
      
      // 添加一些服务器
      manager.addServer({
        name: 'Test Server 1',
        url: 'http://localhost:3000',
        mode: 'stdio',
        command: 'node',
        args: ['server.js'],
      });
      
      manager.addServer({
        name: 'Test Server 2',
        url: 'http://localhost:3001',
        mode: 'sse',
        command: 'python',
        args: ['server.py'],
      });
      
      const result = manager.exportConfig(configPath);
      expect(result).toBeTruthy();
      
      // 验证文件已写入
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        configPath,
        expect.any(String),
        'utf-8'
      );
      
      // 验证导出的配置包含所有服务器
      const exportedConfig = JSON.parse((fs.writeFileSync as jest.Mock).mock.calls[2][1]);
      expect(Object.keys(exportedConfig.mcpServers)).toHaveLength(2);
    });
  });
});
