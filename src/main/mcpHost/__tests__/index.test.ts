import { MCPHost } from '../index';
import { ipcMain, dialog } from 'electron';
import { MCPServerManager } from '../mcpServerManager';
import { MCPServerCollectionManager } from '../mcpServerCollection';
import { MCPHostEvents } from '../types';

// 模拟模块
jest.mock('electron');
jest.mock('../mcpServerManager');
jest.mock('../mcpServerCollection');

describe('MCPHost', () => {
  let mcpHost: MCPHost;
  
  beforeEach(() => {
    // 清除所有模拟的调用记录
    jest.clearAllMocks();
    
    // 创建 MCPHost 实例
    mcpHost = new MCPHost();
  });
  
  describe('构造函数', () => {
    it('应该创建 MCPServerManager 和 MCPServerCollectionManager 实例', () => {
      expect(MCPServerManager).toHaveBeenCalled();
      expect(MCPServerCollectionManager).toHaveBeenCalled();
    });
    
    it('应该注册 IPC 处理程序', () => {
      // 验证所有 IPC 事件处理程序都已注册
      Object.values(MCPHostEvents).forEach(event => {
        expect(ipcMain.on).toHaveBeenCalledWith(event, expect.any(Function));
      });
    });
  });
  
  describe('服务器管理 IPC 处理程序', () => {
    let mockEvent: any;
    let mockServerManager: any;
    
    beforeEach(() => {
      // 创建模拟的 IPC 事件
      mockEvent = {
        returnValue: null,
        reply: jest.fn(),
      };
      
      // 获取模拟的 MCPServerManager 实例
      mockServerManager = (MCPServerManager as jest.Mock).mock.instances[0];
    });
    
    it('应该处理 GET_SERVERS 事件', () => {
      // 模拟 getServers 方法
      const mockServers = [{ id: '1', name: 'Server 1' }, { id: '2', name: 'Server 2' }];
      mockServerManager.getServers.mockReturnValue(mockServers);
      
      // 获取 GET_SERVERS 事件处理程序
      const handler = (ipcMain.on as jest.Mock).mock.calls.find(
        call => call[0] === MCPHostEvents.GET_SERVERS
      )[1];
      
      // 调用处理程序
      handler(mockEvent);
      
      // 验证 getServers 被调用
      expect(mockServerManager.getServers).toHaveBeenCalled();
      
      // 验证返回值
      expect(mockEvent.returnValue).toEqual(mockServers);
    });
    
    it('应该处理 GET_SERVER 事件', () => {
      // 模拟 getServerById 方法
      const mockServer = { id: '1', name: 'Server 1' };
      mockServerManager.getServerById.mockReturnValue(mockServer);
      
      // 获取 GET_SERVER 事件处理程序
      const handler = (ipcMain.on as jest.Mock).mock.calls.find(
        call => call[0] === MCPHostEvents.GET_SERVER
      )[1];
      
      // 调用处理程序
      handler(mockEvent, '1');
      
      // 验证 getServerById 被调用
      expect(mockServerManager.getServerById).toHaveBeenCalledWith('1');
      
      // 验证返回值
      expect(mockEvent.returnValue).toEqual(mockServer);
    });
    
    it('应该处理 ADD_SERVER 事件', () => {
      // 模拟 addServer 方法
      const mockServer = { id: '1', name: 'Server 1' };
      mockServerManager.addServer.mockReturnValue(mockServer);
      
      // 获取 ADD_SERVER 事件处理程序
      const handler = (ipcMain.on as jest.Mock).mock.calls.find(
        call => call[0] === MCPHostEvents.ADD_SERVER
      )[1];
      
      // 调用处理程序
      const serverData = { name: 'Server 1', url: 'http://localhost:3000', mode: 'stdio' };
      handler(mockEvent, serverData);
      
      // 验证 addServer 被调用
      expect(mockServerManager.addServer).toHaveBeenCalledWith(serverData);
      
      // 验证 reply 被调用
      expect(mockEvent.reply).toHaveBeenCalledWith(
        `${MCPHostEvents.ADD_SERVER}-reply`,
        { success: true, data: mockServer }
      );
    });
    
    it('应该处理 ADD_SERVER 事件的错误情况', () => {
      // 模拟 addServer 方法抛出错误
      const error = new Error('添加服务器失败');
      mockServerManager.addServer.mockImplementation(() => {
        throw error;
      });
      
      // 获取 ADD_SERVER 事件处理程序
      const handler = (ipcMain.on as jest.Mock).mock.calls.find(
        call => call[0] === MCPHostEvents.ADD_SERVER
      )[1];
      
      // 调用处理程序
      const serverData = { name: 'Server 1', url: 'http://localhost:3000', mode: 'stdio' };
      handler(mockEvent, serverData);
      
      // 验证 addServer 被调用
      expect(mockServerManager.addServer).toHaveBeenCalledWith(serverData);
      
      // 验证 reply 被调用
      expect(mockEvent.reply).toHaveBeenCalledWith(
        `${MCPHostEvents.ADD_SERVER}-reply`,
        { success: false, error: error.message }
      );
    });
  });
  
  describe('集合管理 IPC 处理程序', () => {
    let mockEvent: any;
    let mockCollectionManager: any;
    
    beforeEach(() => {
      // 创建模拟的 IPC 事件
      mockEvent = {
        returnValue: null,
        reply: jest.fn(),
      };
      
      // 获取模拟的 MCPServerCollectionManager 实例
      mockCollectionManager = (MCPServerCollectionManager as jest.Mock).mock.instances[0];
    });
    
    it('应该处理 GET_COLLECTIONS 事件', () => {
      // 模拟 getCollections 方法
      const mockCollections = [{ id: '1', name: 'Collection 1' }, { id: '2', name: 'Collection 2' }];
      mockCollectionManager.getCollections.mockReturnValue(mockCollections);
      
      // 获取 GET_COLLECTIONS 事件处理程序
      const handler = (ipcMain.on as jest.Mock).mock.calls.find(
        call => call[0] === MCPHostEvents.GET_COLLECTIONS
      )[1];
      
      // 调用处理程序
      handler(mockEvent);
      
      // 验证 getCollections 被调用
      expect(mockCollectionManager.getCollections).toHaveBeenCalled();
      
      // 验证返回值
      expect(mockEvent.returnValue).toEqual(mockCollections);
    });
    
    it('应该处理 EXPORT_COLLECTION 事件', () => {
      // 模拟 exportCollection 方法
      mockCollectionManager.exportCollection.mockReturnValue(true);
      
      // 获取 EXPORT_COLLECTION 事件处理程序
      const handler = (ipcMain.on as jest.Mock).mock.calls.find(
        call => call[0] === MCPHostEvents.EXPORT_COLLECTION
      )[1];
      
      // 调用处理程序
      handler(mockEvent, '1', 3000);
      
      // 验证 exportCollection 被调用
      expect(mockCollectionManager.exportCollection).toHaveBeenCalledWith('1', 3000);
      
      // 验证 reply 被调用
      expect(mockEvent.reply).toHaveBeenCalledWith(
        `${MCPHostEvents.EXPORT_COLLECTION}-reply`,
        { success: true }
      );
    });
    
    it('应该处理 EXPORT_COLLECTION 事件的错误情况', () => {
      // 模拟 exportCollection 方法抛出错误
      const error = new Error('导出集合失败');
      mockCollectionManager.exportCollection.mockImplementation(() => {
        throw error;
      });
      
      // 获取 EXPORT_COLLECTION 事件处理程序
      const handler = (ipcMain.on as jest.Mock).mock.calls.find(
        call => call[0] === MCPHostEvents.EXPORT_COLLECTION
      )[1];
      
      // 调用处理程序
      handler(mockEvent, '1', 3000);
      
      // 验证 exportCollection 被调用
      expect(mockCollectionManager.exportCollection).toHaveBeenCalledWith('1', 3000);
      
      // 验证 reply 被调用
      expect(mockEvent.reply).toHaveBeenCalledWith(
        `${MCPHostEvents.EXPORT_COLLECTION}-reply`,
        { success: false, error: error.message }
      );
    });
  });
  
  describe('配置导入导出 IPC 处理程序', () => {
    let mockEvent: any;
    let mockServerManager: any;
    
    beforeEach(() => {
      // 创建模拟的 IPC 事件
      mockEvent = {
        reply: jest.fn(),
      };
      
      // 获取模拟的 MCPServerManager 实例
      mockServerManager = (MCPServerManager as jest.Mock).mock.instances[0];
    });
    
    it('应该处理导入配置事件', async () => {
      // 模拟 dialog.showOpenDialog
      (dialog.showOpenDialog as jest.Mock).mockResolvedValue({
        filePaths: ['/path/to/config.json'],
      });
      
      // 模拟 importConfig 方法
      mockServerManager.importConfig.mockReturnValue(true);
      
      // 获取导入配置事件处理程序
      const handler = (ipcMain.on as jest.Mock).mock.calls.find(
        call => call[0] === 'mcp-host:import-config'
      )[1];
      
      // 调用处理程序
      await handler(mockEvent);
      
      // 验证 dialog.showOpenDialog 被调用
      expect(dialog.showOpenDialog).toHaveBeenCalled();
      
      // 验证 importConfig 被调用
      expect(mockServerManager.importConfig).toHaveBeenCalledWith('/path/to/config.json');
      
      // 验证 reply 被调用
      expect(mockEvent.reply).toHaveBeenCalledWith(
        'mcp-host:import-config-reply',
        { success: true }
      );
    });
    
    it('应该处理导出配置事件', async () => {
      // 模拟 dialog.showSaveDialog
      (dialog.showSaveDialog as jest.Mock).mockResolvedValue({
        filePath: '/path/to/save/config.json',
      });
      
      // 模拟 exportConfig 方法
      mockServerManager.exportConfig.mockReturnValue(true);
      
      // 获取导出配置事件处理程序
      const handler = (ipcMain.on as jest.Mock).mock.calls.find(
        call => call[0] === 'mcp-host:export-config'
      )[1];
      
      // 调用处理程序
      await handler(mockEvent);
      
      // 验证 dialog.showSaveDialog 被调用
      expect(dialog.showSaveDialog).toHaveBeenCalled();
      
      // 验证 exportConfig 被调用
      expect(mockServerManager.exportConfig).toHaveBeenCalledWith('/path/to/save/config.json');
      
      // 验证 reply 被调用
      expect(mockEvent.reply).toHaveBeenCalledWith(
        'mcp-host:export-config-reply',
        { success: true }
      );
    });
  });
});
