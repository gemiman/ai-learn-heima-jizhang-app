// 数据模型类型定义（界面和数据库共用的「说明书」）

// 收支类型：支出 / 收入
export type TxType = 'expense' | 'income';

// 分类（两级：parent_id 为 null 表示一级大类，否则是它下面的二级小类）
export interface Category {
  id: number;
  type: TxType;
  name: string;
  parent_id: number | null;
  sort_order: number;
  is_default: number; // 1 = 系统预置，0 = 用户自定义
  icon: string | null;
}

// 带「子分类」的一级大类（用于界面展示）
export interface CategoryTree extends Category {
  children: Category[];
}

// 账单流水（数据库原始行）
export interface TransactionRow {
  id: number;
  type: TxType;
  amount_cents: number; // 金额，单位「分」，避免浮点误差
  category_id: number; // 指向二级小类的 id
  date: string; // 格式 YYYY-MM-DD
  note: string | null;
  created_at: string;
}

// 账单流水（带分类信息，用于列表展示）
export interface TransactionView extends TransactionRow {
  category_name: string; // 二级小类名
  parent_name: string; // 一级大类名
  category_icon: string | null; // 分类图标
}

// 记账时提交的数据
export interface NewTransaction {
  type: TxType;
  amount_cents: number;
  category_id: number;
  date: string;
  note: string;
}

// 账单列表的筛选条件
export interface TransactionFilter {
  type?: TxType;
  keyword?: string; // 备注关键词
  categoryId?: number; // 二级分类 id
  month?: string; // 格式 YYYY-MM
}

// 首页结余统计结果（单位都是「分」）
export interface Summary {
  monthExpense: number;
  monthIncome: number;
  monthBalance: number; // 本月结余 = 收入 - 支出
  totalExpense: number;
  totalIncome: number;
  totalBalance: number; // 累计结余
}

// 月度收支趋势（用于趋势图）
export interface MonthlyTrend {
  month: string; // 格式 YYYY-MM
  expense: number;
  income: number;
  balance: number; // 收入 - 支出
}

// 某月某类型下，各一级大类的金额汇总（用于占比饼图）
export interface CategoryBreakdown {
  parent_id: number;
  parent_name: string;
  icon: string | null;
  total: number; // 单位「分」
}
