import { ipcMain, IpcMainEvent, dialog } from 'electron';
import { MCPServerManager } from './mcpServerManager';
import { MCPServerCollectionManager } from './mcpServerCollection';
import { MCPHostEvents, MCPServer, MCPServerCollection } from './types';

/**
 * MCP Host 类
 * 负责将MCP服务器管理和集合管理的功能通过IPC接口暴露给渲染进程
 */
export class MCPHost {
  private serverManager: MCPServerManager;
  private collectionManager: MCPServerCollectionManager;

  constructor() {
    this.serverManager = new MCPServerManager();
    this.collectionManager = new MCPServerCollectionManager(this.serverManager);
    
    this.registerIpcHandlers();
  }

  /**
   * 注册IPC处理程序
   */
  private registerIpcHandlers(): void {
    // 服务器管理
    ipcMain.on(MCPHostEvents.GET_SERVERS, (event: IpcMainEvent) => {
      event.returnValue = this.serverManager.getServers();
    });

    ipcMain.on(MCPHostEvents.GET_SERVER, (event: IpcMainEvent, id: string) => {
      event.returnValue = this.serverManager.getServerById(id);
    });

    ipcMain.on(MCPHostEvents.ADD_SERVER, (event: IpcMainEvent, server: Omit<MCPServer, 'id' | 'createdAt' | 'status'>) => {
      try {
        const newServer = this.serverManager.addServer(server);
        event.reply(`${MCPHostEvents.ADD_SERVER}-reply`, { success: true, data: newServer });
      } catch (error) {
        event.reply(`${MCPHostEvents.ADD_SERVER}-reply`, { success: false, error: (error as Error).message });
      }
    });

    ipcMain.on(MCPHostEvents.UPDATE_SERVER, (event: IpcMainEvent, id: string, updates: Partial<MCPServer>) => {
      try {
        const updatedServer = this.serverManager.updateServer(id, updates);
        event.reply(`${MCPHostEvents.UPDATE_SERVER}-reply`, { 
          success: !!updatedServer, 
          data: updatedServer 
        });
      } catch (error) {
        event.reply(`${MCPHostEvents.UPDATE_SERVER}-reply`, { 
          success: false, 
          error: (error as Error).message 
        });
      }
    });

    ipcMain.on(MCPHostEvents.DELETE_SERVER, (event: IpcMainEvent, id: string) => {
      try {
        const success = this.serverManager.deleteServer(id);
        event.reply(`${MCPHostEvents.DELETE_SERVER}-reply`, { success });
      } catch (error) {
        event.reply(`${MCPHostEvents.DELETE_SERVER}-reply`, { 
          success: false, 
          error: (error as Error).message 
        });
      }
    });

    ipcMain.on(MCPHostEvents.START_SERVER, (event: IpcMainEvent, id: string) => {
      try {
        const success = this.serverManager.startServer(id);
        event.reply(`${MCPHostEvents.START_SERVER}-reply`, { success });
      } catch (error) {
        event.reply(`${MCPHostEvents.START_SERVER}-reply`, { 
          success: false, 
          error: (error as Error).message 
        });
      }
    });

    ipcMain.on(MCPHostEvents.STOP_SERVER, (event: IpcMainEvent, id: string) => {
      try {
        const success = this.serverManager.stopServer(id);
        event.reply(`${MCPHostEvents.STOP_SERVER}-reply`, { success });
      } catch (error) {
        event.reply(`${MCPHostEvents.STOP_SERVER}-reply`, { 
          success: false, 
          error: (error as Error).message 
        });
      }
    });

    // 集合管理
    ipcMain.on(MCPHostEvents.GET_COLLECTIONS, (event: IpcMainEvent) => {
      event.returnValue = this.collectionManager.getCollections();
    });

    ipcMain.on(MCPHostEvents.GET_COLLECTION, (event: IpcMainEvent, id: string) => {
      event.returnValue = this.collectionManager.getCollectionById(id);
    });

    ipcMain.on(MCPHostEvents.ADD_COLLECTION, (event: IpcMainEvent, collection: Omit<MCPServerCollection, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newCollection = this.collectionManager.addCollection(collection);
        event.reply(`${MCPHostEvents.ADD_COLLECTION}-reply`, { success: true, data: newCollection });
      } catch (error) {
        event.reply(`${MCPHostEvents.ADD_COLLECTION}-reply`, { 
          success: false, 
          error: (error as Error).message 
        });
      }
    });

    ipcMain.on(MCPHostEvents.UPDATE_COLLECTION, (event: IpcMainEvent, id: string, updates: Partial<MCPServerCollection>) => {
      try {
        const updatedCollection = this.collectionManager.updateCollection(id, updates);
        event.reply(`${MCPHostEvents.UPDATE_COLLECTION}-reply`, { 
          success: !!updatedCollection, 
          data: updatedCollection 
        });
      } catch (error) {
        event.reply(`${MCPHostEvents.UPDATE_COLLECTION}-reply`, { 
          success: false, 
          error: (error as Error).message 
        });
      }
    });

    ipcMain.on(MCPHostEvents.DELETE_COLLECTION, (event: IpcMainEvent, id: string) => {
      try {
        const success = this.collectionManager.deleteCollection(id);
        event.reply(`${MCPHostEvents.DELETE_COLLECTION}-reply`, { success });
      } catch (error) {
        event.reply(`${MCPHostEvents.DELETE_COLLECTION}-reply`, { 
          success: false, 
          error: (error as Error).message 
        });
      }
    });

    ipcMain.on(MCPHostEvents.EXPORT_COLLECTION, async (event: IpcMainEvent, id: string, port: number) => {
      try {
        const success = this.collectionManager.exportCollection(id, port);
        event.reply(`${MCPHostEvents.EXPORT_COLLECTION}-reply`, { success });
      } catch (error) {
        event.reply(`${MCPHostEvents.EXPORT_COLLECTION}-reply`, { 
          success: false, 
          error: (error as Error).message 
        });
      }
    });

    // 添加服务器到集合
    ipcMain.on('mcp-host:add-server-to-collection', (event: IpcMainEvent, collectionId: string, serverId: string) => {
      try {
        const success = this.collectionManager.addServerToCollection(collectionId, serverId);
        event.reply('mcp-host:add-server-to-collection-reply', { success });
      } catch (error) {
        event.reply('mcp-host:add-server-to-collection-reply', { 
          success: false, 
          error: (error as Error).message 
        });
      }
    });

    // 从集合中移除服务器
    ipcMain.on('mcp-host:remove-server-from-collection', (event: IpcMainEvent, collectionId: string, serverId: string) => {
      try {
        const success = this.collectionManager.removeServerFromCollection(collectionId, serverId);
        event.reply('mcp-host:remove-server-from-collection-reply', { success });
      } catch (error) {
        event.reply('mcp-host:remove-server-from-collection-reply', { 
          success: false, 
          error: (error as Error).message 
        });
      }
    });

    // 导入MCP服务器配置
    ipcMain.on('mcp-host:import-config', async (event: IpcMainEvent) => {
      try {
        const { filePaths } = await dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [
            { name: 'JSON Files', extensions: ['json'] }
          ]
        });

        if (filePaths.length > 0) {
          const success = this.serverManager.importConfig(filePaths[0]);
          event.reply('mcp-host:import-config-reply', { success });
        } else {
          event.reply('mcp-host:import-config-reply', { success: false, error: '未选择文件' });
        }
      } catch (error) {
        event.reply('mcp-host:import-config-reply', { 
          success: false, 
          error: (error as Error).message 
        });
      }
    });

    // 导出MCP服务器配置
    ipcMain.on('mcp-host:export-config', async (event: IpcMainEvent) => {
      try {
        const { filePath } = await dialog.showSaveDialog({
          filters: [
            { name: 'JSON Files', extensions: ['json'] }
          ]
        });

        if (filePath) {
          const success = this.serverManager.exportConfig(filePath);
          event.reply('mcp-host:export-config-reply', { success });
        } else {
          event.reply('mcp-host:export-config-reply', { success: false, error: '未选择保存路径' });
        }
      } catch (error) {
        event.reply('mcp-host:export-config-reply', { 
          success: false, 
          error: (error as Error).message 
        });
      }
    });
  }
}

// 导出单例实例
export const mcpHost = new MCPHost();

// 导出类型
export * from './types';
