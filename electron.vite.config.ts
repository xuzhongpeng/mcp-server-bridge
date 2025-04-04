import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  main: {
    // 主进程配置
    build: {
      outDir: 'dist/main',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/main.ts'),
        },
      },
    },
  },
  preload: {
    // 预加载脚本配置
    build: {
      outDir: 'dist/preload',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/preload.ts'),
        },
      },
    },
  },
  renderer: {
    // 渲染进程配置
    root: resolve(__dirname, 'src/renderer'),
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer'),
      },
    },
    plugins: [react()],
  },
});
