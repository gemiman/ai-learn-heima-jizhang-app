// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import CategoryView from './CategoryView.vue';

// 假数据库
const { db } = vi.hoisted(() => ({
  db: {
    listCategories: vi.fn(),
    addCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));
vi.mock('../db', () => db);

// 替换弹提示 / 弹确认框
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

function mountCategory() {
  return mount(CategoryView, { global: { plugins: [ElementPlus] } });
}

beforeEach(() => {
  db.listCategories.mockReset();
  db.addCategory.mockReset();
  db.updateCategory.mockReset();
  db.deleteCategory.mockReset();
  db.listCategories.mockResolvedValue([]);
  db.addCategory.mockResolvedValue(1);
  el.warning.mockReset();
  el.success.mockReset();
});

describe('分类管理（CategoryView）', () => {
  it('新增分类名称为空 → 弹「请输入分类名称」，且不新增', async () => {
    const wrapper = mountCategory();
    await flushPromises();

    wrapper.vm.newName = '';
    await wrapper.vm.submitAdd();

    expect(el.warning).toHaveBeenCalledWith('请输入分类名称');
    expect(db.addCategory).not.toHaveBeenCalled();
  });

  it('新增一级大类（名称合法）→ 正确调用新增', async () => {
    const wrapper = mountCategory();
    await flushPromises();

    wrapper.vm.newName = '宠物';
    wrapper.vm.newParentId = -1; // -1 表示新建一级大类
    wrapper.vm.newIcon = '🐱';
    await wrapper.vm.submitAdd();

    expect(db.addCategory).toHaveBeenCalledWith('expense', '宠物', null, '🐱');
    expect(el.success).toHaveBeenCalledWith('添加成功');
  });
});
