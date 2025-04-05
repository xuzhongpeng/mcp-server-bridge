// 模拟 Electron 的 app 模块
const app = {
  getPath: jest.fn((name: string) => {
    if (name === 'userData') {
      return '/mock/user/data/path';
    }
    return '/mock/path';
  }),
  whenReady: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
};

// 模拟 Electron 的 dialog 模块
const dialog = {
  showOpenDialog: jest.fn().mockResolvedValue({ filePaths: ['/mock/file/path.json'] }),
  showSaveDialog: jest.fn().mockResolvedValue({ filePath: '/mock/save/path.json' }),
};

// 模拟 Electron 的 ipcMain 模块
const ipcMain = {
  on: jest.fn(),
  once: jest.fn(),
  handle: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
};

// 模拟 Electron 的 IpcMainEvent
class IpcMainEvent {
  returnValue: any = null;
  reply: jest.Mock;
  
  constructor() {
    this.reply = jest.fn();
  }
}

// 模拟 Electron 的 BrowserWindow 模块
class BrowserWindow {
  webContents: any;
  
  constructor(options: any) {
    this.webContents = {
      session: {
        webRequest: {
          onHeadersReceived: jest.fn(),
        },
      },
      openDevTools: jest.fn(),
    };
  }
  
  loadURL = jest.fn();
  on = jest.fn();
}

// 导出模拟的 Electron 模块
export {
  app,
  dialog,
  ipcMain,
  IpcMainEvent,
  BrowserWindow,
};
