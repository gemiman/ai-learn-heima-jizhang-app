// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import StatisticsView from './StatisticsView.vue';

// 假数据库
const { db } = vi.hoisted(() => ({
  db: { getMonthlyTrend: vi.fn(), getCategoryBreakdown: vi.fn() },
}));
vi.mock('../db', () => db);

// 假图表库：ECharts 在测试环境画不出来，用假对象替代（只关心有没有调用到）
const { echarts } = vi.hoisted(() => ({
  echarts: { init: vi.fn() },
}));
vi.mock('echarts', () => echarts);

function mountStats() {
  return mount(StatisticsView, { global: { plugins: [ElementPlus] } });
}

beforeEach(() => {
  db.getMonthlyTrend.mockReset();
  db.getCategoryBreakdown.mockReset();
  db.getMonthlyTrend.mockResolvedValue([]);
  db.getCategoryBreakdown.mockResolvedValue([]);
  echarts.init.mockReset();
  echarts.init.mockImplementation(() => ({
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
  }));
});

describe('统计分析（StatisticsView）', () => {
  it('挂载后拉取趋势数据 + 支出/收入占比数据', async () => {
    mountStats();
    await flushPromises();

    expect(db.getMonthlyTrend).toHaveBeenCalled();
    // 占比数据要拉两次：支出一次、收入一次
    expect(db.getCategoryBreakdown).toHaveBeenCalledTimes(2);
  });

  it('能正常渲染出三个图表容器', () => {
    const wrapper = mountStats();
    expect(wrapper.findAll('.chart').length).toBe(3);
  });
});
