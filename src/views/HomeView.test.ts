// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import HomeView from './HomeView.vue';

// 假数据库：避免测试时真的去读 SQLite
const { db } = vi.hoisted(() => ({
  db: { getSummary: vi.fn(), listTransactions: vi.fn() },
}));
vi.mock('../db', () => db);

function mountHome() {
  return mount(HomeView, { global: { plugins: [ElementPlus] } });
}

beforeEach(() => {
  db.getSummary.mockReset();
  db.listTransactions.mockReset();
});

describe('结余总览（HomeView）', () => {
  it('加载后正确显示本月和累计的金额（分 → 元）', async () => {
    db.getSummary.mockResolvedValue({
      monthExpense: 1250, // 1250 分 = 12.50 元
      monthIncome: 800, // 800 分 = 8.00 元
      monthBalance: -450,
      totalExpense: 5000, // 5000 分 = 50.00 元
      totalIncome: 3000,
      totalBalance: -2000,
    });
    db.listTransactions.mockResolvedValue([]);

    const wrapper = mountHome();
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain('本月支出');
    expect(text).toContain('¥12.50');
    expect(text).toContain('¥8.00');
    expect(text).toContain('¥50.00');
  });

  it('最近几笔：支出显示负号、收入显示正号', async () => {
    db.getSummary.mockResolvedValue({
      monthExpense: 0,
      monthIncome: 0,
      monthBalance: 0,
      totalExpense: 0,
      totalIncome: 0,
      totalBalance: 0,
    });
    db.listTransactions.mockResolvedValue([
      {
        id: 1,
        type: 'expense',
        amount_cents: 500,
        category_id: 1,
        date: '2026-08-01',
        note: null,
        created_at: '',
        category_name: '午餐',
        parent_name: '餐饮饮食',
        category_icon: null,
      },
      {
        id: 2,
        type: 'income',
        amount_cents: 800,
        category_id: 2,
        date: '2026-08-02',
        note: '工资',
        created_at: '',
        category_name: '基本工资',
        parent_name: '工资收入',
        category_icon: null,
      },
    ]);

    const wrapper = mountHome();
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain('-5.00'); // 支出 500 分
    expect(text).toContain('+8.00'); // 收入 800 分
  });
});
