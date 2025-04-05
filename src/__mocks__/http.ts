import { EventEmitter } from 'events';

// 模拟 HTTP 请求
class MockIncomingMessage extends EventEmitter {
  url: string;
  method: string;
  headers: Record<string, string>;
  
  constructor(url: string = '/', method: string = 'GET', headers: Record<string, string> = {}) {
    super();
    this.url = url;
    this.method = method;
    this.headers = headers;
  }
}

// 模拟 HTTP 响应
class MockServerResponse extends EventEmitter {
  statusCode: number = 200;
  headers: Record<string, string | string[]> = {};
  
  setHeader(name: string, value: string | string[]): void {
    this.headers[name] = value;
  }
  
  getHeader(name: string): string | string[] | undefined {
    return this.headers[name];
  }
  
  writeHead(statusCode: number, headers?: Record<string, string | string[]>): this {
    this.statusCode = statusCode;
    if (headers) {
      this.headers = { ...this.headers, ...headers };
    }
    return this;
  }
  
  write(chunk: string | Buffer): boolean {
    this.emit('data', chunk);
    return true;
  }
  
  end(chunk?: string | Buffer): void {
    if (chunk) {
      this.write(chunk);
    }
    this.emit('end');
  }
}

// 模拟 HTTP 服务器
class MockServer extends EventEmitter {
  listening: boolean = false;
  
  listen(port: number, callback?: () => void): this {
    this.listening = true;
    if (callback) {
      callback();
    }
    return this;
  }
  
  close(callback?: (err?: Error) => void): this {
    this.listening = false;
    if (callback) {
      callback();
    }
    return this;
  }
}

// 模拟 createServer 函数
const createServer = jest.fn((requestListener?: (req: MockIncomingMessage, res: MockServerResponse) => void): MockServer => {
  const server = new MockServer();
  
  if (requestListener) {
    server.on('request', requestListener);
  }
  
  return server;
});

// 导出模拟的 http 模块
export {
  createServer,
  MockServer,
  MockIncomingMessage,
  MockServerResponse,
};

export default {
  createServer,
};
