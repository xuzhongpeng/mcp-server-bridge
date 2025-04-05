import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { MCPServerCollection, MCPServer } from './types';
import { MCPServerManager } from './mcpServerManager';

/**
 * MCP服务器集合管理器类
 * 负责管理MCP服务器集合的添加、修改、删除、导出等操作
 */
export class MCPServerCollectionManager {
  private collections: Map<string, MCPServerCollection> = new Map();
  private configPath: string;
  private serverManager: MCPServerManager;
  private sseServers: Map<string, http.Server> = new Map();

  constructor(serverManager: MCPServerManager) {
    // 配置文件路径
    this.configPath = path.join(
      app.getPath('userData'),
      'mcp_collections.json'
    );
    
    this.serverManager = serverManager;
    
    // 加载配置
    this.loadConfig();
  }

  /**
   * 加载MCP服务器集合配置
   */
  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf-8');
        const collections: MCPServerCollection[] = JSON.parse(configData);
        
        collections.forEach(collection => {
          this.collections.set(collection.id, collection);
        });
      }
    } catch (error) {
      console.error('加载MCP服务器集合配置失败:', error);
    }
  }

  /**
   * 保存MCP服务器集合配置
   */
  private saveConfig(): void {
    try {
      const collections = Array.from(this.collections.values());
      fs.writeFileSync(this.configPath, JSON.stringify(collections, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存MCP服务器集合配置失败:', error);
    }
  }

  /**
   * 获取所有MCP服务器集合
   */
  getCollections(): MCPServerCollection[] {
    return Array.from(this.collections.values());
  }

  /**
   * 根据ID获取MCP服务器集合
   */
  getCollectionById(id: string): MCPServerCollection | undefined {
    return this.collections.get(id);
  }

  /**
   * 添加MCP服务器集合
   */
  addCollection(collection: Omit<MCPServerCollection, 'id' | 'createdAt' | 'updatedAt'>): MCPServerCollection {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    
    const newCollection: MCPServerCollection = {
      ...collection,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.collections.set(id, newCollection);
    this.saveConfig();
    
    return newCollection;
  }

  /**
   * 更新MCP服务器集合
   */
  updateCollection(id: string, updates: Partial<MCPServerCollection>): MCPServerCollection | undefined {
    const collection = this.collections.get(id);
    if (!collection) return undefined;
    
    const updatedCollection = { 
      ...collection, 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.collections.set(id, updatedCollection);
    this.saveConfig();
    
    return updatedCollection;
  }

  /**
   * 删除MCP服务器集合
   */
  deleteCollection(id: string): boolean {
    // 如果集合正在导出，先停止它
    if (this.sseServers.has(id)) {
      this.stopExport(id);
    }
    
    const result = this.collections.delete(id);
    if (result) {
      this.saveConfig();
    }
    
    return result;
  }

  /**
   * 导出MCP服务器集合为SSE模式
   * @param id 集合ID
   * @param port 导出端口
   */
  exportCollection(id: string, port: number): boolean {
    const collection = this.collections.get(id);
    if (!collection) return false;
    
    // 如果已经在导出，先停止
    if (this.sseServers.has(id)) {
      this.stopExport(id);
    }
    
    try {
      // 创建HTTP服务器
      const server = http.createServer((req, res) => {
        // 只处理SSE请求
        if (req.url === '/sse') {
          // 设置SSE响应头
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          });
          
          // 发送初始连接成功消息
          res.write('event: connected\ndata: {"status":"connected"}\n\n');
          
          // 定期发送心跳
          const heartbeatInterval = setInterval(() => {
            res.write('event: heartbeat\ndata: {"timestamp":"' + Date.now() + '"}\n\n');
          }, 30000);
          
          // 处理客户端断开连接
          req.on('close', () => {
            clearInterval(heartbeatInterval);
          });
        } else {
          // 其他请求返回404
          res.writeHead(404);
          res.end();
        }
      });
      
      // 启动服务器
      server.listen(port, () => {
        console.log(`MCP服务器集合 ${id} 已导出为SSE模式，端口: ${port}`);
      });
      
      // 保存服务器引用
      this.sseServers.set(id, server);
      
      return true;
    } catch (error) {
      console.error(`导出MCP服务器集合 ${id} 失败:`, error);
      return false;
    }
  }

  /**
   * 停止导出MCP服务器集合
   */
  stopExport(id: string): boolean {
    const server = this.sseServers.get(id);
    if (!server) return false;
    
    try {
      server.close();
      this.sseServers.delete(id);
      return true;
    } catch (error) {
      console.error(`停止导出MCP服务器集合 ${id} 失败:`, error);
      return false;
    }
  }

  /**
   * 获取集合中的服务器
   */
  getServersInCollection(id: string): MCPServer[] {
    const collection = this.collections.get(id);
    if (!collection) return [];
    
    return collection.servers
      .map(serverId => this.serverManager.getServerById(serverId))
      .filter((server): server is MCPServer => server !== undefined);
  }

  /**
   * 添加服务器到集合
   */
  addServerToCollection(collectionId: string, serverId: string): boolean {
    const collection = this.collections.get(collectionId);
    if (!collection) return false;
    
    const server = this.serverManager.getServerById(serverId);
    if (!server) return false;
    
    // 如果服务器已经在集合中，不重复添加
    if (collection.servers.includes(serverId)) return true;
    
    collection.servers.push(serverId);
    collection.updatedAt = new Date().toISOString();
    
    this.saveConfig();
    return true;
  }

  /**
   * 从集合中移除服务器
   */
  removeServerFromCollection(collectionId: string, serverId: string): boolean {
    const collection = this.collections.get(collectionId);
    if (!collection) return false;
    
    const index = collection.servers.indexOf(serverId);
    if (index === -1) return false;
    
    collection.servers.splice(index, 1);
    collection.updatedAt = new Date().toISOString();
    
    this.saveConfig();
    return true;
  }
}
