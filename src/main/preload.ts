import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

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
    }
  }
});
