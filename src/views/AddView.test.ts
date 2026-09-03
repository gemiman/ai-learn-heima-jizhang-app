// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import AddView from './AddView.vue';

// 用「假数据库」替换真实的 db 模块，避免测试时真的去读写 SQLite
const { db } = vi.hoisted(() => ({
  db: {
    addTransaction: vi.fn(),
    listCategories: vi.fn(),
  },
}));
vi.mock('../db', () => db);

// 只替换 element-plus 里的「弹提示」函数，其余组件（按钮、表单等）保留真实版
const { el } = vi.hoisted(() => ({
  el: { warning: vi.fn(), success: vi.fn(), error: vi.fn() },
}));
vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return { ...actual, ElMessage: el };
});

function mountAdd() {
  return mount(AddView, { global: { plugins: [ElementPlus] } });
}

beforeEach(() => {
  db.addTransaction.mockReset();
  db.listCategories.mockReset();
  db.listCategories.mockResolvedValue([]);
  db.addTransaction.mockResolvedValue(undefined);
  el.warning.mockReset();
  el.success.mockReset();
});

describe('记一笔账（AddView）', () => {
  it('金额没填就点保存 → 弹「请输入金额」，且不记账', async () => {
    const wrapper = mountAdd();
    await flushPromises();

    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('保存'))!;
    await saveBtn.trigger('click');
    await flushPromises();

    expect(el.warning).toHaveBeenCalledWith('请输入金额');
    expect(db.addTransaction).not.toHaveBeenCalled();
  });

  it('填了金额但没选分类 → 弹「请选择分类」，且不记账', async () => {
    const wrapper = mountAdd();
    await flushPromises();

    // 直接给组件内部的金额填个值（等价于在输入框里输入 100）
    wrapper.vm.amount = 100;
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('保存'))!;
    await saveBtn.trigger('click');
    await flushPromises();

    expect(el.warning).toHaveBeenCalledWith('请选择分类');
    expect(db.addTransaction).not.toHaveBeenCalled();
  });

  it('金额和分类都填对 → 正确记账，成功后清空金额和备注', async () => {
    const wrapper = mountAdd();
    await flushPromises();

    wrapper.vm.amount = 12.5;
    wrapper.vm.categoryId = 5;
    wrapper.vm.note = '午饭';
    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('保存'))!;
    await saveBtn.trigger('click');
    await flushPromises();

    // 记账时：12.5 元要换算成 1250 分
    expect(db.addTransaction).toHaveBeenCalledWith({
      type: 'expense',
      amount_cents: 1250,
      category_id: 5,
      date: expect.any(String),
      note: '午饭',
    });
    expect(el.success).toHaveBeenCalledWith('记账成功！');
    // 成功后清空金额和备注
    expect(wrapper.vm.amount).toBeUndefined();
    expect(wrapper.vm.note).toBe('');
    // 通知父组件「记完了」
    expect(wrapper.emitted('saved')).toBeTruthy();
  });
});
