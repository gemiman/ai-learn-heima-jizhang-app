import { describe, it, expect } from 'vitest';
import {
  yuanToCents,
  centsToYuanNum,
  centsToYuan,
  formatCents,
  currentMonth,
  today,
  shiftMonth,
} from './utils';

describe('金额换算', () => {
  it('元转分', () => {
    expect(yuanToCents(1)).toBe(100);
    expect(yuanToCents(12.5)).toBe(1250);
    expect(yuanToCents(0.1)).toBe(10);
    expect(yuanToCents(0)).toBe(0);
  });

  it('分转元（数字）', () => {
    expect(centsToYuanNum(100)).toBe(1);
    expect(centsToYuanNum(1250)).toBe(12.5);
    expect(centsToYuanNum(0)).toBe(0);
  });

  it('分转元（字符串，保留两位小数）', () => {
    expect(centsToYuan(100)).toBe('1.00');
    expect(centsToYuan(1250)).toBe('12.50');
    expect(centsToYuan(5)).toBe('0.05');
  });

  it('分转带货币符号的字符串', () => {
    expect(formatCents(1250)).toBe('¥12.50');
    expect(formatCents(100)).toBe('¥1.00');
  });
});

describe('日期处理', () => {
  it('当前月份格式为 YYYY-MM', () => {
    expect(currentMonth()).toMatch(/^\d{4}-\d{2}$/);
  });

  it('今天日期格式为 YYYY-MM-DD', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('月份加减', () => {
    expect(shiftMonth('2026-01', 1)).toBe('2026-02');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-03', -3)).toBe('2025-12');
  });
});
