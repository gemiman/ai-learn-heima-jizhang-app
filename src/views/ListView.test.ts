// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import ListView from './ListView.vue';

// 假数据库
const { db } = vi.hoisted(() => ({
  db: { listTransactions: vi.fn(), deleteTransaction: vi.fn() },
}));
vi.mock('../db', () => db);

// 替换 element-plus 里的「弹提示 / 弹确认框」函数，其余组件保留真实版
const { el } = vi.hoisted(() => ({
  el: { warning: vi.fn(), success: vi.fn(), error: vi.fn(), confirm: vi.fn() },
}));
vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return {
    ...actual,
    ElMessage: { warning: el.warning, success: el.success, error: el.error },
    ElMessageBox: { confirm: el.confirm },
  };
});

function makeRow(id: number, type: 'expense' | 'income', amount_cents: number) {
  return {
    id,
    type,
    amount_cents,
    category_id: 1,
    date: '2026-08-01',
    note: null,
    created_at: '',
    category_name: '午餐',
    parent_name: '餐饮饮食',
    category_icon: null,
  };
}

function mountList() {
  return mount(ListView, { global: { plugins: [ElementPlus] } });
}

beforeEach(() => {
  db.listTransactions.mockReset();
  db.deleteTransaction.mockReset();
  db.listTransactions.mockResolvedValue([]);
  db.deleteTransaction.mockResolvedValue(undefined);
  el.confirm.mockReset();
});

describe('账单明细（ListView）', () => {
  it('支出显示负号、收入显示正号', async () => {
    db.listTransactions.mockResolvedValue([
      makeRow(1, 'expense', 500),
      makeRow(2, 'income', 800),
    ]);

    const wrapper = mountList();
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain('-5.00');
    expect(text).toContain('+8.00');
  });

  it('删除前先弹确认框，点「确定」后才真正删除', async () => {
    el.confirm.mockResolvedValue(undefined); // 模拟用户点了「确定」
    db.listTransactions.mockResolvedValue([makeRow(9, 'expense', 100)]);

    const wrapper = mountList();
    await flushPromises();

    const delBtn = wrapper.findAll('button').find((b) => b.text().includes('删除'))!;
    await delBtn.trigger('click');
    await flushPromises();

    expect(el.confirm).toHaveBeenCalled();
    expect(db.deleteTransaction).toHaveBeenCalledWith(9);
  });
});
