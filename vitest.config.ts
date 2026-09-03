import { defineConfig } from 'vitest/config';

// 单元测试专用配置：只测纯函数，用 Node 环境，不加载 vite 的 vue / tauri 配置
export default defineConfig({
  test: {
    environment: 'node',
  },
});
