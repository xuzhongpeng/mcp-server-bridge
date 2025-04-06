import { EventEmitter } from 'events';

// 模拟文件系统数据
const mockFiles: Record<string, string> = {};

// 模拟 fs 模块函数
export const existsSync = jest.fn((path: string) => {
  return path in mockFiles;
});

export const readFileSync = jest.fn((path: string, options?: { encoding?: string; flag?: string } | string) => {
  if (path in mockFiles) {
    return mockFiles[path];
  }
  throw new Error(`ENOENT: no such file or directory, open '${path}'`);
});

export const writeFileSync = jest.fn((path: string, data: string, options?: { encoding?: string; mode?: number; flag?: string } | string) => {
  mockFiles[path] = data;
  return undefined;
});

export const unlinkSync = jest.fn((path: string) => {
  if (path in mockFiles) {
    delete mockFiles[path];
    return undefined;
  }
  throw new Error(`ENOENT: no such file or directory, unlink '${path}'`);
});

export const mkdirSync = jest.fn((path: string, options?: { recursive?: boolean; mode?: number } | number) => {
  return undefined;
});

export const readdirSync = jest.fn((path: string) => {
  const result: string[] = [];
  const prefix = path.endsWith('/') ? path : path + '/';
  
  Object.keys(mockFiles).forEach(filePath => {
    if (filePath.startsWith(prefix)) {
      const relativePath = filePath.slice(prefix.length);
      const firstSegment = relativePath.split('/')[0];
      if (firstSegment && !result.includes(firstSegment)) {
        result.push(firstSegment);
      }
    }
  });
  
  return result;
});

export const statSync = jest.fn((path: string) => {
  if (path in mockFiles) {
    return {
      isFile: () => true,
      isDirectory: () => false,
      size: mockFiles[path].length,
      mtime: new Date(),
      ctime: new Date(),
    };
  }
  
  // 检查是否是目录
  const prefix = path.endsWith('/') ? path : path + '/';
  for (const filePath of Object.keys(mockFiles)) {
    if (filePath.startsWith(prefix)) {
      return {
        isFile: () => false,
        isDirectory: () => true,
        size: 0,
        mtime: new Date(),
        ctime: new Date(),
      };
    }
  }
  
  throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
});

export const createReadStream = jest.fn((path: string) => {
  const emitter = new EventEmitter();
  
  process.nextTick(() => {
    if (path in mockFiles) {
      emitter.emit('data', Buffer.from(mockFiles[path]));
      emitter.emit('end');
    } else {
      emitter.emit('error', new Error(`ENOENT: no such file or directory, open '${path}'`));
    }
  });
  
  return emitter;
});

export const createWriteStream = jest.fn((path: string) => {
  // 创建一个扩展 EventEmitter 的写入流
  class MockWriteStream extends EventEmitter {
    data: string = '';
    
    write(chunk: string | Buffer): boolean {
      this.data += chunk.toString();
      return true;
    }
    
    end(callback?: () => void): this {
      mockFiles[path] = this.data;
      if (callback) callback();
      this.emit('finish');
      return this;
    }
  }
  
  return new MockWriteStream();
});

// 用于测试的辅助方法
export const __setMockFiles = (newMockFiles: Record<string, string>) => {
  for (const file in newMockFiles) {
    mockFiles[file] = newMockFiles[file];
  }
};

export const __getMockFiles = () => {
  return { ...mockFiles };
};

export const __clearMockFiles = () => {
  for (const key in mockFiles) {
    delete mockFiles[key];
  }
};

// 为了兼容默认导入
const fs = {
  existsSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  mkdirSync,
  readdirSync,
  statSync,
  createReadStream,
  createWriteStream,
  __setMockFiles,
  __getMockFiles,
  __clearMockFiles
};

export default fs;
