import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

// 测试专用配置：纯函数用 Node 环境（跑得快），页面组件在测试文件顶部用
// `// @vitest-environment jsdom` 注释单独指定 jsdom（假浏览器）环境。
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'node',
    // 补齐 jsdom 缺少的浏览器 API（ResizeObserver 等）
    setupFiles: ['./test-setup.ts'],
  },
});
