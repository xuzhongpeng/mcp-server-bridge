import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { MCPHostEvents } from './mcpHost';

// 将Electron API暴露给渲染进程
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel: string, ...args: any[]): void => {
      ipcRenderer.send(channel, ...args);
    },
    on: (channel: string, func: (...args: any[]) => void): (() => void) => {
      // 包装函数以避免事件监听器泄漏
      const subscription = (_event: IpcRendererEvent, ...args: any[]): void => func(...args);
      ipcRenderer.on(channel, subscription);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once: (channel: string, func: (...args: any[]) => void): void => {
      ipcRenderer.once(channel, (_event: IpcRendererEvent, ...args: any[]): void => func(...args));
    },
    removeAllListeners: (channel: string): void => {
      ipcRenderer.removeAllListeners(channel);
    },
    invoke: (channel: string, ...args: any[]): Promise<any> => {
      return ipcRenderer.invoke(channel, ...args);
    }
  }
});

// 将MCP Host API暴露给渲染进程
contextBridge.exposeInMainWorld('mcpHost', {
  // 服务器管理
  getServers: (): any => ipcRenderer.sendSync(MCPHostEvents.GET_SERVERS),
  getServer: (id: string): any => ipcRenderer.sendSync(MCPHostEvents.GET_SERVER, id),
  addServer: (server: any): Promise<any> => {
    return new Promise((resolve) => {
      ipcRenderer.send(MCPHostEvents.ADD_SERVER, server);
      ipcRenderer.once(`${MCPHostEvents.ADD_SERVER}-reply`, (_event: IpcRendererEvent, result: any) => {
        resolve(result);
      });
    });
  },
  updateServer: (id: string, updates: any): Promise<any> => {
    return new Promise((resolve) => {
      ipcRenderer.send(MCPHostEvents.UPDATE_SERVER, id, updates);
      ipcRenderer.once(`${MCPHostEvents.UPDATE_SERVER}-reply`, (_event: IpcRendererEvent, result: any) => {
        resolve(result);
      });
    });
  },
  deleteServer: (id: string): Promise<any> => {
    return new Promise((resolve) => {
      ipcRenderer.send(MCPHostEvents.DELETE_SERVER, id);
      ipcRenderer.once(`${MCPHostEvents.DELETE_SERVER}-reply`, (_event: IpcRendererEvent, result: any) => {
        resolve(result);
      });
    });
  },
  startServer: (id: string): Promise<any> => {
    return new Promise((resolve) => {
      ipcRenderer.send(MCPHostEvents.START_SERVER, id);
      ipcRenderer.once(`${MCPHostEvents.START_SERVER}-reply`, (_event: IpcRendererEvent, result: any) => {
        resolve(result);
      });
    });
  },
  stopServer: (id: string): Promise<any> => {
    return new Promise((resolve) => {
      ipcRenderer.send(MCPHostEvents.STOP_SERVER, id);
      ipcRenderer.once(`${MCPHostEvents.STOP_SERVER}-reply`, (_event: IpcRendererEvent, result: any) => {
        resolve(result);
      });
    });
  },

  // 集合管理
  getCollections: (): any => ipcRenderer.sendSync(MCPHostEvents.GET_COLLECTIONS),
  getCollection: (id: string): any => ipcRenderer.sendSync(MCPHostEvents.GET_COLLECTION, id),
  addCollection: (collection: any): Promise<any> => {
    return new Promise((resolve) => {
      ipcRenderer.send(MCPHostEvents.ADD_COLLECTION, collection);
      ipcRenderer.once(`${MCPHostEvents.ADD_COLLECTION}-reply`, (_event: IpcRendererEvent, result: any) => {
        resolve(result);
      });
    });
  },
  updateCollection: (id: string, updates: any): Promise<any> => {
    return new Promise((resolve) => {
      ipcRenderer.send(MCPHostEvents.UPDATE_COLLECTION, id, updates);
      ipcRenderer.once(`${MCPHostEvents.UPDATE_COLLECTION}-reply`, (_event: IpcRendererEvent, result: any) => {
        resolve(result);
      });
    });
  },
  deleteCollection: (id: string): Promise<any> => {
    return new Promise((resolve) => {
      ipcRenderer.send(MCPHostEvents.DELETE_COLLECTION, id);
      ipcRenderer.once(`${MCPHostEvents.DELETE_COLLECTION}-reply`, (_event: IpcRendererEvent, result: any) => {
        resolve(result);
      });
    });
  },
  exportCollection: (id: string, port: number): Promise<any> => {
    return new Promise((resolve) => {
      ipcRenderer.send(MCPHostEvents.EXPORT_COLLECTION, id, port);
      ipcRenderer.once(`${MCPHostEvents.EXPORT_COLLECTION}-reply`, (_event: IpcRendererEvent, result: any) => {
        resolve(result);
      });
    });
  },

  // 集合服务器管理
  addServerToCollection: (collectionId: string, serverId: string): Promise<any> => {
    return new Promise((resolve) => {
      ipcRenderer.send('mcp-host:add-server-to-collection', collectionId, serverId);
      ipcRenderer.once('mcp-host:add-server-to-collection-reply', (_event: IpcRendererEvent, result: any) => {
        resolve(result);
      });
    });
  },
  removeServerFromCollection: (collectionId: string, serverId: string): Promise<any> => {
    return new Promise((resolve) => {
      ipcRenderer.send('mcp-host:remove-server-from-collection', collectionId, serverId);
      ipcRenderer.once('mcp-host:remove-server-from-collection-reply', (_event: IpcRendererEvent, result: any) => {
        resolve(result);
      });
    });
  },

  // 配置导入导出
  importConfig: (): Promise<any> => {
    return new Promise((resolve) => {
      ipcRenderer.send('mcp-host:import-config');
      ipcRenderer.once('mcp-host:import-config-reply', (_event: IpcRendererEvent, result: any) => {
        resolve(result);
      });
    });
  },
  exportConfig: (): Promise<any> => {
    return new Promise((resolve) => {
      ipcRenderer.send('mcp-host:export-config');
      ipcRenderer.once('mcp-host:export-config-reply', (_event: IpcRendererEvent, result: any) => {
        resolve(result);
      });
    });
  }
});
