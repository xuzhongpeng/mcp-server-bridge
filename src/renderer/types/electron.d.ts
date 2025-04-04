interface IpcRenderer {
  send(channel: string, ...args: any[]): void;
  on(channel: string, func: (...args: any[]) => void): () => void;
  once(channel: string, func: (...args: any[]) => void): void;
  removeAllListeners(channel: string): void;
}

declare global {
  interface Window {
    electron: {
      ipcRenderer: IpcRenderer;
    };
  }
}

export {};
