import { describe, it, expect } from 'vitest';
import { sumByType, buildTransactionWhere, buildMonthlyTrend } from './db-logic';

describe('sumByType（收支汇总拆分）', () => {
  it('空数据 → 支出收入都是 0', () => {
    expect(sumByType([])).toEqual({ expense: 0, income: 0 });
  });

  it('只有支出', () => {
    expect(sumByType([{ type: 'expense', total: 500 }])).toEqual({ expense: 500, income: 0 });
  });

  it('只有收入', () => {
    expect(sumByType([{ type: 'income', total: 800 }])).toEqual({ expense: 0, income: 800 });
  });

  it('支出收入都有', () => {
    expect(
      sumByType([
        { type: 'expense', total: 500 },
        { type: 'income', total: 800 },
      ])
    ).toEqual({ expense: 500, income: 800 });
  });
});

describe('buildTransactionWhere（筛选条件拼接）', () => {
  it('没有筛选条件 → 空 WHERE、空参数', () => {
    expect(buildTransactionWhere({})).toEqual({ where: '', params: [] });
  });

  it('只按类型筛选', () => {
    const { where, params } = buildTransactionWhere({ type: 'expense' });
    expect(where).toBe('WHERE t.type = $1');
    expect(params).toEqual(['expense']);
  });

  it('类型 + 月份，参数顺序和占位符正确', () => {
    const { where, params } = buildTransactionWhere({ type: 'expense', month: '2026-08' });
    expect(where).toBe('WHERE t.type = $1 AND t.date LIKE $2');
    expect(params).toEqual(['expense', '2026-08-%']);
  });

  it('关键词会自动加上模糊匹配的 %', () => {
    const { where, params } = buildTransactionWhere({ keyword: '聚餐' });
    expect(where).toBe('WHERE t.note LIKE $1');
    expect(params).toEqual(['%聚餐%']);
  });

  it('四个条件全上，顺序固定为 类型→分类→关键词→月份', () => {
    const { where, params } = buildTransactionWhere({
      type: 'expense',
      categoryId: 3,
      keyword: '餐',
      month: '2026-08',
    });
    expect(where).toBe(
      'WHERE t.type = $1 AND t.category_id = $2 AND t.note LIKE $3 AND t.date LIKE $4'
    );
    expect(params).toEqual(['expense', 3, '%餐%', '2026-08-%']);
  });
});

describe('buildMonthlyTrend（月份序列补齐）', () => {
  it('没有任何数据 → 6 个月全为 0，月份连续', () => {
    const result = buildMonthlyTrend('2026-01', 6, []);
    expect(result).toEqual([
      { month: '2026-01', expense: 0, income: 0, balance: 0 },
      { month: '2026-02', expense: 0, income: 0, balance: 0 },
      { month: '2026-03', expense: 0, income: 0, balance: 0 },
      { month: '2026-04', expense: 0, income: 0, balance: 0 },
      { month: '2026-05', expense: 0, income: 0, balance: 0 },
      { month: '2026-06', expense: 0, income: 0, balance: 0 },
    ]);
  });

  it('部分月份有数据，缺失月份补 0', () => {
    const result = buildMonthlyTrend('2026-01', 3, [
      { month: '2026-01', type: 'expense', total: 500 },
      { month: '2026-03', type: 'income', total: 900 },
    ]);
    expect(result).toEqual([
      { month: '2026-01', expense: 500, income: 0, balance: -500 },
      { month: '2026-02', expense: 0, income: 0, balance: 0 },
      { month: '2026-03', expense: 0, income: 900, balance: 900 },
    ]);
  });

  it('跨年时月份也能正确衔接', () => {
    const result = buildMonthlyTrend('2026-11', 4, [
      { month: '2026-12', type: 'expense', total: 100 },
      { month: '2027-01', type: 'income', total: 200 },
    ]);
    expect(result.map((r) => r.month)).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
    expect(result[1]).toEqual({ month: '2026-12', expense: 100, income: 0, balance: -100 });
    expect(result[2]).toEqual({ month: '2027-01', expense: 0, income: 200, balance: 200 });
  });
});
