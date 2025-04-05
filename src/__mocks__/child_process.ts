import { EventEmitter } from 'events';

// 模拟子进程
class MockChildProcess extends EventEmitter {
  pid: number;
  stdout: EventEmitter | null;
  stderr: EventEmitter | null;
  killed: boolean = false;
  
  constructor() {
    super();
    this.pid = Math.floor(Math.random() * 10000);
    this.stdout = new EventEmitter();
    this.stderr = new EventEmitter();
  }
  
  kill = jest.fn((signal?: string): boolean => {
    this.killed = true;
    process.nextTick(() => {
      this.emit('close', 0);
    });
    return true;
  });
}

// 模拟 spawn 函数
const spawn = jest.fn((command: string, args?: string[], options?: any): MockChildProcess => {
  const childProcess = new MockChildProcess();
  
  // 模拟进程输出
  process.nextTick(() => {
    if (childProcess.stdout) {
      childProcess.stdout.emit('data', Buffer.from(`Mock stdout output for command: ${command}`));
    }
    
    if (childProcess.stderr) {
      childProcess.stderr.emit('data', Buffer.from(`Mock stderr output for command: ${command}`));
    }
  });
  
  return childProcess;
});

// 导出模拟的 child_process 模块
export {
  spawn,
  MockChildProcess,
};
