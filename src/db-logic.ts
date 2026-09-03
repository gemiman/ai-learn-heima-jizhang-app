// 数据库的「纯计算逻辑」：从 db.ts 里抽出来的规则，只做计算、不碰数据库。
// 抽出来是为了能单独测试（不需要真的 SQLite 环境）。
import { shiftMonth } from './utils';
import type { MonthlyTrend, TransactionFilter, TxType } from './types';

// 把「按类型分组的汇总行」拆成支出、收入两个数字。
// 例如数据库查回来 [ {type:'expense', total:500}, {type:'income', total:800} ]，
// 变成 { expense: 500, income: 800 }。
export function sumByType(
  rows: { type: TxType; total: number }[]
): { expense: number; income: number } {
  let expense = 0;
  let income = 0;
  for (const r of rows) {
    if (r.type === 'expense') expense = r.total;
    else income = r.total;
  }
  return { expense, income };
}

// 根据筛选条件，拼出查询账单的 WHERE 子句和对应的参数。
// 例如传 { type:'expense', month:'2026-08' }，得到
// where = "WHERE t.type = $1 AND t.date LIKE $2"、params = ["expense", "2026-08-%"]。
export function buildTransactionWhere(
  filter: TransactionFilter = {}
): { where: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  const add = (cond: string, val: unknown) => {
    params.push(val);
    conditions.push(cond.replace('?', `$${params.length}`));
  };

  if (filter.type) add('t.type = ?', filter.type);
  if (filter.categoryId) add('t.category_id = ?', filter.categoryId);
  if (filter.keyword) add('t.note LIKE ?', `%${filter.keyword}%`);
  if (filter.month) add('t.date LIKE ?', `${filter.month}-%`);

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

// 把数据库查回来的「稀疏月份数据」补齐成连续、完整的月份序列（缺失的月份补 0）。
// 例如查回来只有 3 个月有数据，但要求 6 个月，这里会按顺序补出 6 个月。
export function buildMonthlyTrend(
  startMonth: string,
  months: number,
  rows: { month: string; type: TxType; total: number }[]
): MonthlyTrend[] {
  const result: MonthlyTrend[] = [];
  for (let i = 0; i < months; i++) {
    const m = shiftMonth(startMonth, i);
    const expense = rows.find((r) => r.month === m && r.type === 'expense')?.total ?? 0;
    const income = rows.find((r) => r.month === m && r.type === 'income')?.total ?? 0;
    result.push({ month: m, expense, income, balance: income - expense });
  }
  return result;
}
