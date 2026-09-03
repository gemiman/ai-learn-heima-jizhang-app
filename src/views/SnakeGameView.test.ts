// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import SnakeGameView from './SnakeGameView.vue';

// 替换 element-plus 里的「弹提示」函数（游戏结束 / 通关会用到）
const { el } = vi.hoisted(() => ({
  el: { warning: vi.fn(), success: vi.fn(), error: vi.fn() },
}));
vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return { ...actual, ElMessage: { warning: el.warning, success: el.success, error: el.error } };
});

function mountSnake() {
  return mount(SnakeGameView, { global: { plugins: [ElementPlus] } });
}

beforeEach(() => {
  el.error.mockReset();
  el.success.mockReset();
  // jsdom 不支持 canvas，用一个「万能假画笔」替代：任何方法调用都安全、任何属性赋值都接受
  const noop = () => {};
  HTMLCanvasElement.prototype.getContext = (() =>
    new Proxy({}, {
      get: () => noop,
      set: () => true,
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

// 测试结束后清掉残留的计时器
afterEach(() => {
  vi.useRealTimers();
});

describe('贪吃蛇（SnakeGameView）', () => {
  it('初始状态显示「开始游戏」，分数为 0', () => {
    const wrapper = mountSnake();
    const text = wrapper.text();
    expect(text).toContain('▶ 开始游戏');
    expect(text).toContain('得分：0');
  });

  it('点开始按钮后，按钮变成「暂停」', async () => {
    const wrapper = mountSnake();
    const startBtn = wrapper.findAll('button').find((b) => b.text().includes('开始游戏'))!;
    await startBtn.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('⏸ 暂停');
    wrapper.unmount();
  });
});
