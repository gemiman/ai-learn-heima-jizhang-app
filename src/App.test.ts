// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ElementPlus from 'element-plus';
import App from './App.vue';
import HomeView from './views/HomeView.vue';
import AddView from './views/AddView.vue';
import ListView from './views/ListView.vue';

// 只把 6 个页面子组件「占位」（避免它们 onMounted 去碰数据库），
// 容器（el-container 等）保留真实渲染，这样才能测到菜单切换的显示效果。
function mountApp() {
  return mount(App, {
    global: {
      plugins: [ElementPlus],
      stubs: {
        HomeView: true,
        AddView: true,
        ListView: true,
        CategoryView: true,
        StatisticsView: true,
        SnakeGameView: true,
      },
    },
  });
}

describe('应用外壳（App）', () => {
  it('默认显示首页', () => {
    const wrapper = mountApp();
    expect(wrapper.findComponent(HomeView).exists()).toBe(true);
  });

  it('切换到「记一笔账」→ 显示记账页，首页消失', async () => {
    const wrapper = mountApp();
    wrapper.vm.onSelect('add');
    await nextTick();

    expect(wrapper.vm.current).toBe('add');
    expect(wrapper.findComponent(AddView).exists()).toBe(true);
    expect(wrapper.findComponent(HomeView).exists()).toBe(false);
  });

  it('切换到「账单明细」→ 显示账单页', async () => {
    const wrapper = mountApp();
    wrapper.vm.onSelect('list');
    await nextTick();

    expect(wrapper.vm.current).toBe('list');
    expect(wrapper.findComponent(ListView).exists()).toBe(true);
  });
});
