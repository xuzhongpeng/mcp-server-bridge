import { MCPServerCollectionManager } from '../mcpServerCollection';
import { MCPServerManager } from '../mcpServerManager';
import * as fs from 'fs';
import { app } from 'electron';
import * as http from 'http';

// 模拟模块
jest.mock('fs');
jest.mock('electron');
jest.mock('http');
jest.mock('../mcpServerManager');

describe('MCPServerCollectionManager', () => {
  let collectionManager: MCPServerCollectionManager;
  let serverManager: MCPServerManager;
  const mockConfigPath = '/mock/user/data/path/mcp_collections.json';
  
  beforeEach(() => {
    // 清除所有模拟的调用记录
    jest.clearAllMocks();
    
    // 重置模拟文件系统
    (fs as any).__clearMockFiles();
    
    // 创建模拟的 MCPServerManager
    serverManager = new MCPServerManager();
    
    // 模拟 getServerById 方法
    (serverManager.getServerById as jest.Mock).mockImplementation((id: string) => {
      if (id === 'server-1') {
        return {
          id: 'server-1',
          name: 'Test Server 1',
          url: 'http://localhost:3000',
          mode: 'stdio',
          status: 'online',
          command: 'node',
          args: ['server.js'],
          createdAt: '2023-01-01T00:00:00Z',
        };
      } else if (id === 'server-2') {
        return {
          id: 'server-2',
          name: 'Test Server 2',
          url: 'http://localhost:3001',
          mode: 'sse',
          status: 'offline',
          command: 'python',
          args: ['server.py'],
          createdAt: '2023-01-02T00:00:00Z',
        };
      }
      return undefined;
    });
    
    // 创建 MCPServerCollectionManager 实例
    collectionManager = new MCPServerCollectionManager(serverManager);
  });
  
  describe('构造函数', () => {
    it('应该设置正确的配置文件路径', () => {
      expect(app.getPath).toHaveBeenCalledWith('userData');
      expect((collectionManager as any).configPath).toBe(mockConfigPath);
    });
    
    it('应该尝试加载配置', () => {
      expect(fs.existsSync).toHaveBeenCalledWith(mockConfigPath);
    });
  });
  
  describe('getCollections', () => {
    it('应该返回空数组当没有集合时', () => {
      const collections = collectionManager.getCollections();
      expect(collections).toEqual([]);
    });
    
    it('应该返回所有集合', () => {
      // 添加一些集合
      const collection1 = collectionManager.addCollection({
        name: 'Test Collection 1',
        description: 'Test Description 1',
        servers: ['server-1'],
      });
      
      const collection2 = collectionManager.addCollection({
        name: 'Test Collection 2',
        description: 'Test Description 2',
        servers: ['server-2'],
      });
      
      const collections = collectionManager.getCollections();
      expect(collections).toHaveLength(2);
      expect(collections).toContainEqual(collection1);
      expect(collections).toContainEqual(collection2);
    });
  });
  
  describe('getCollectionById', () => {
    it('应该返回undefined当集合不存在时', () => {
      const collection = collectionManager.getCollectionById('non-existent-id');
      expect(collection).toBeUndefined();
    });
    
    it('应该返回指定ID的集合', () => {
      const collection = collectionManager.addCollection({
        name: 'Test Collection',
        description: 'Test Description',
        servers: ['server-1'],
      });
      
      const retrievedCollection = collectionManager.getCollectionById(collection.id);
      expect(retrievedCollection).toEqual(collection);
    });
  });
  
  describe('addCollection', () => {
    it('应该添加新集合并返回它', () => {
      const collectionData = {
        name: 'Test Collection',
        description: 'Test Description',
        servers: ['server-1', 'server-2'],
      };
      
      const collection = collectionManager.addCollection(collectionData);
      
      expect(collection).toMatchObject({
        ...collectionData,
      });
      expect(collection.id).toBeDefined();
      expect(collection.createdAt).toBeDefined();
      expect(collection.updatedAt).toBeDefined();
      
      // 验证配置已保存
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
  
  describe('updateCollection', () => {
    it('应该返回undefined当集合不存在时', () => {
      const result = collectionManager.updateCollection('non-existent-id', { name: 'New Name' });
      expect(result).toBeUndefined();
    });
    
    it('应该更新集合并返回更新后的集合', () => {
      const collection = collectionManager.addCollection({
        name: 'Test Collection',
        description: 'Test Description',
        servers: ['server-1'],
      });
      
      const updates = {
        name: 'Updated Collection',
        description: 'Updated Description',
      };
      
      const updatedCollection = collectionManager.updateCollection(collection.id, updates);
      
      expect(updatedCollection).toMatchObject({
        ...collection,
        ...updates,
      });
      
      // 验证配置已保存
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
  
  describe('deleteCollection', () => {
    it('应该返回false当集合不存在时', () => {
      const result = collectionManager.deleteCollection('non-existent-id');
      expect(result).toBeFalsy();
    });
    
    it('应该删除集合并返回true', () => {
      const collection = collectionManager.addCollection({
        name: 'Test Collection',
        description: 'Test Description',
        servers: ['server-1'],
      });
      
      const result = collectionManager.deleteCollection(collection.id);
      expect(result).toBeTruthy();
      
      // 验证集合已被删除
      expect(collectionManager.getCollectionById(collection.id)).toBeUndefined();
      
      // 验证配置已保存
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
    
    it('应该停止导出中的集合然后删除它', () => {
      const collection = collectionManager.addCollection({
        name: 'Test Collection',
        description: 'Test Description',
        servers: ['server-1'],
      });
      
      // 导出集合
      collectionManager.exportCollection(collection.id, 3000);
      
      // 模拟服务器正在运行
      (collectionManager as any).sseServers.set(collection.id, {
        close: jest.fn(),
      });
      
      // 删除集合
      const result = collectionManager.deleteCollection(collection.id);
      expect(result).toBeTruthy();
      
      // 验证集合已被删除
      expect(collectionManager.getCollectionById(collection.id)).toBeUndefined();
      
      // 验证服务器已关闭
      expect((collectionManager as any).sseServers.get(collection.id)).toBeUndefined();
      
      // 验证配置已保存
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
  
  describe('exportCollection', () => {
    it('应该返回false当集合不存在时', () => {
      const result = collectionManager.exportCollection('non-existent-id', 3000);
      expect(result).toBeFalsy();
    });
    
    it('应该导出集合并返回true', () => {
      const collection = collectionManager.addCollection({
        name: 'Test Collection',
        description: 'Test Description',
        servers: ['server-1', 'server-2'],
      });
      
      // 模拟 http.createServer
      interface MockServer {
        listen: jest.Mock<MockServer, [number, () => void]>;
      }
      
      const mockServer: MockServer = {
        listen: jest.fn((port, callback) => {
          callback();
          return mockServer;
        }),
      };
      (http.createServer as jest.Mock).mockReturnValue(mockServer);
      
      const result = collectionManager.exportCollection(collection.id, 3000);
      expect(result).toBeTruthy();
      
      // 验证 http.createServer 被调用
      expect(http.createServer).toHaveBeenCalled();
      
      // 验证 server.listen 被调用
      expect(mockServer.listen).toHaveBeenCalledWith(3000, expect.any(Function));
      
      // 验证服务器被保存
      expect((collectionManager as any).sseServers.has(collection.id)).toBeTruthy();
    });
  });
  
  describe('stopExport', () => {
    it('应该返回false当集合不在导出时', () => {
      const result = collectionManager.stopExport('non-existent-id');
      expect(result).toBeFalsy();
    });
    
    it('应该停止导出并返回true', () => {
      const collection = collectionManager.addCollection({
        name: 'Test Collection',
        description: 'Test Description',
        servers: ['server-1'],
      });
      
      // 模拟服务器正在运行
      const mockServer = {
        close: jest.fn(),
      };
      (collectionManager as any).sseServers.set(collection.id, mockServer);
      
      const result = collectionManager.stopExport(collection.id);
      expect(result).toBeTruthy();
      
      // 验证 server.close 被调用
      expect(mockServer.close).toHaveBeenCalled();
      
      // 验证服务器被删除
      expect((collectionManager as any).sseServers.has(collection.id)).toBeFalsy();
    });
  });
  
  describe('getServersInCollection', () => {
    it('应该返回空数组当集合不存在时', () => {
      const servers = collectionManager.getServersInCollection('non-existent-id');
      expect(servers).toEqual([]);
    });
    
    it('应该返回集合中的所有服务器', () => {
      const collection = collectionManager.addCollection({
        name: 'Test Collection',
        description: 'Test Description',
        servers: ['server-1', 'server-2'],
      });
      
      const servers = collectionManager.getServersInCollection(collection.id);
      expect(servers).toHaveLength(2);
      expect(servers[0].id).toBe('server-1');
      expect(servers[1].id).toBe('server-2');
    });
  });
  
  describe('addServerToCollection', () => {
    it('应该返回false当集合不存在时', () => {
      const result = collectionManager.addServerToCollection('non-existent-id', 'server-1');
      expect(result).toBeFalsy();
    });
    
    it('应该返回false当服务器不存在时', () => {
      const collection = collectionManager.addCollection({
        name: 'Test Collection',
        description: 'Test Description',
        servers: [],
      });
      
      const result = collectionManager.addServerToCollection(collection.id, 'non-existent-server');
      expect(result).toBeFalsy();
    });
    
    it('应该添加服务器到集合并返回true', () => {
      const collection = collectionManager.addCollection({
        name: 'Test Collection',
        description: 'Test Description',
        servers: [],
      });
      
      const result = collectionManager.addServerToCollection(collection.id, 'server-1');
      expect(result).toBeTruthy();
      
      // 验证服务器已添加到集合
      const updatedCollection = collectionManager.getCollectionById(collection.id);
      expect(updatedCollection?.servers).toContain('server-1');
      
      // 验证配置已保存
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
    
    it('应该不重复添加已存在的服务器', () => {
      const collection = collectionManager.addCollection({
        name: 'Test Collection',
        description: 'Test Description',
        servers: ['server-1'],
      });
      
      const result = collectionManager.addServerToCollection(collection.id, 'server-1');
      expect(result).toBeTruthy();
      
      // 验证服务器没有被重复添加
      const updatedCollection = collectionManager.getCollectionById(collection.id);
      expect(updatedCollection?.servers).toEqual(['server-1']);
    });
  });
  
  describe('removeServerFromCollection', () => {
    it('应该返回false当集合不存在时', () => {
      const result = collectionManager.removeServerFromCollection('non-existent-id', 'server-1');
      expect(result).toBeFalsy();
    });
    
    it('应该返回false当服务器不在集合中时', () => {
      const collection = collectionManager.addCollection({
        name: 'Test Collection',
        description: 'Test Description',
        servers: ['server-1'],
      });
      
      const result = collectionManager.removeServerFromCollection(collection.id, 'server-2');
      expect(result).toBeFalsy();
    });
    
    it('应该从集合中移除服务器并返回true', () => {
      const collection = collectionManager.addCollection({
        name: 'Test Collection',
        description: 'Test Description',
        servers: ['server-1', 'server-2'],
      });
      
      const result = collectionManager.removeServerFromCollection(collection.id, 'server-1');
      expect(result).toBeTruthy();
      
      // 验证服务器已从集合中移除
      const updatedCollection = collectionManager.getCollectionById(collection.id);
      expect(updatedCollection?.servers).not.toContain('server-1');
      expect(updatedCollection?.servers).toEqual(['server-2']);
      
      // 验证配置已保存
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
});
