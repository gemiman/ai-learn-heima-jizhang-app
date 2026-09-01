// 数据访问层：负责和本地 SQLite 数据库打交道（建表、预置分类、增删查）
import Database from '@tauri-apps/plugin-sql';
import { shiftMonth } from './utils';
import type {
  Category,
  CategoryBreakdown,
  CategoryTree,
  MonthlyTrend,
  NewTransaction,
  Summary,
  TransactionFilter,
  TransactionView,
  TxType,
} from './types';

// 数据库文件路径（相对于应用数据目录，只存在用户自己电脑上）
const DB_PATH = 'sqlite:heima-jizhang.db';

// 预置的两级分类（一级大类 + 图标 + 二级小类列表）
const DEFAULT_CATEGORIES: { type: TxType; name: string; icon: string; children: string[] }[] = [
  { type: 'expense', name: '餐饮饮食', icon: '🍜', children: ['早餐', '午餐', '晚餐', '外卖', '零食饮料', '聚餐请客'] },
  { type: 'expense', name: '交通出行', icon: '🚗', children: ['公交地铁', '打车', '加油', '停车费', '高铁火车', '飞机'] },
  { type: 'expense', name: '购物消费', icon: '🛒', children: ['服饰鞋包', '日用品', '数码电子', '美妆护肤', '母婴用品'] },
  { type: 'expense', name: '居住住房', icon: '🏠', children: ['房租', '水电燃气', '物业费', '维修', '家居用品'] },
  { type: 'expense', name: '娱乐休闲', icon: '🎮', children: ['电影', '游戏', '旅行', '运动健身', 'KTV', '宠物'] },
  { type: 'expense', name: '医疗健康', icon: '💊', children: ['药品', '门诊', '体检', '住院'] },
  { type: 'expense', name: '学习教育', icon: '📚', children: ['书籍', '培训课程', '学费', '文具'] },
  { type: 'expense', name: '人情往来', icon: '🎁', children: ['红包', '礼物', '请客', '礼金'] },
  { type: 'expense', name: '通讯网络', icon: '📱', children: ['话费', '网费', '流量'] },
  { type: 'expense', name: '其他支出', icon: '📦', children: ['其他'] },
  { type: 'income', name: '工资收入', icon: '💰', children: ['基本工资', '奖金', '补贴', '加班费'] },
  { type: 'income', name: '理财收入', icon: '📈', children: ['利息', '基金', '股票', '房租收入'] },
  { type: 'income', name: '兼职收入', icon: '💼', children: ['副业', '稿费', '劳务'] },
  { type: 'income', name: '人情收入', icon: '🧧', children: ['红包', '礼金'] },
  { type: 'income', name: '其他收入', icon: '💵', children: ['其他'] },
];

let dbPromise: Promise<Database> | null = null;

// 获取数据库连接（单例），首次调用时会自动建表并预置分类
async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await Database.load(DB_PATH);
      await initSchema(db);
      await seedCategories(db);
      return db;
    })();
  }
  return dbPromise;
}

// 建表（IF NOT EXISTS 保证重复执行安全）
async function initSchema(db: Database): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      parent_id INTEGER,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 1,
      icon TEXT
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);
}

// 首次运行时预置默认分类（已有数据则跳过）
async function seedCategories(db: Database): Promise<void> {
  const rows = await db.select<{ c: number }[]>('SELECT COUNT(*) AS c FROM categories');
  if (rows.length > 0 && rows[0].c > 0) return;

  for (const [i, cat] of DEFAULT_CATEGORIES.entries()) {
    const parent = await db.execute(
      'INSERT INTO categories (type, name, parent_id, sort_order, is_default, icon) VALUES ($1, $2, NULL, $3, 1, $4)',
      [cat.type, cat.name, i, cat.icon]
    );
    const parentId = parent.lastInsertId ?? 0;
    for (const [j, child] of cat.children.entries()) {
      await db.execute(
        'INSERT INTO categories (type, name, parent_id, sort_order, is_default, icon) VALUES ($1, $2, $3, $4, 1, NULL)',
        [cat.type, child, parentId, j]
      );
    }
  }
}

// ===== 分类 =====

// 获取某类型的分类（一级大类，含嵌套的二级小类）
export async function listCategories(type: TxType): Promise<CategoryTree[]> {
  const db = await getDb();
  const all = await db.select<Category[]>(
    'SELECT * FROM categories WHERE type = $1 ORDER BY sort_order, id',
    [type]
  );
  const roots = all.filter((c) => c.parent_id === null);
  return roots.map((root) => ({
    ...root,
    children: all.filter((c) => c.parent_id === root.id),
  }));
}

// 新增分类：parentId 传 null 表示新增一级大类，传数字表示在某大类下新增二级小类
export async function addCategory(
  type: TxType,
  name: string,
  parentId: number | null,
  icon: string | null = null
): Promise<number> {
  const db = await getDb();

  if (parentId === null) {
    const rows = await db.select<{ m: number }[]>(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 AS m FROM categories WHERE type = $1 AND parent_id IS NULL',
      [type]
    );
    const sortOrder = rows[0].m;
    const r = await db.execute(
      'INSERT INTO categories (type, name, parent_id, sort_order, is_default, icon) VALUES ($1, $2, NULL, $3, 0, $4)',
      [type, name, sortOrder, icon]
    );
    return r.lastInsertId ?? 0;
  }

  const rows = await db.select<{ m: number }[]>(
    'SELECT COALESCE(MAX(sort_order), 0) + 1 AS m FROM categories WHERE parent_id = $1',
    [parentId]
  );
  const sortOrder = rows[0].m;
  const r = await db.execute(
    'INSERT INTO categories (type, name, parent_id, sort_order, is_default, icon) VALUES ($1, $2, $3, $4, 0, $5)',
    [type, name, parentId, sortOrder, icon]
  );
  return r.lastInsertId ?? 0;
}

// ===== 账单流水 =====

// 记一笔账
export async function addTransaction(t: NewTransaction): Promise<void> {
  const db = await getDb();
  await db.execute(
    'INSERT INTO transactions (type, amount_cents, category_id, date, note) VALUES ($1, $2, $3, $4, $5)',
    [t.type, t.amount_cents, t.category_id, t.date, t.note || null]
  );
}

// 查询账单列表（按时间倒序），支持按类型/关键词/分类/月份筛选
export async function listTransactions(filter: TransactionFilter = {}): Promise<TransactionView[]> {
  const db = await getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  // 依次添加筛选条件，并生成 $1、$2… 占位符
  const add = (cond: string, val: unknown) => {
    params.push(val);
    conditions.push(cond.replace('?', `$${params.length}`));
  };

  if (filter.type) add('t.type = ?', filter.type);
  if (filter.categoryId) add('t.category_id = ?', filter.categoryId);
  if (filter.keyword) add('t.note LIKE ?', `%${filter.keyword}%`);
  if (filter.month) add('t.date LIKE ?', `${filter.month}-%`);

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT t.*, c.name AS category_name, c.icon AS category_icon, p.name AS parent_name
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN categories p ON p.id = c.parent_id
    ${where}
    ORDER BY t.date DESC, t.id DESC
  `;
  return db.select<TransactionView[]>(sql, params);
}

// 删除一笔账
export async function deleteTransaction(id: number): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM transactions WHERE id = $1', [id]);
}

// ===== 统计 =====

function sumByType(rows: { type: TxType; total: number }[]): { expense: number; income: number } {
  let expense = 0;
  let income = 0;
  for (const r of rows) {
    if (r.type === 'expense') expense = r.total;
    else income = r.total;
  }
  return { expense, income };
}

// 首页结余：某月的支出/收入/结余 + 累计的支出/收入/结余
export async function getSummary(month: string): Promise<Summary> {
  const db = await getDb();
  const monthRows = await db.select<{ type: TxType; total: number }[]>(
    'SELECT type, COALESCE(SUM(amount_cents), 0) AS total FROM transactions WHERE date LIKE $1 GROUP BY type',
    [`${month}-%`]
  );
  const totalRows = await db.select<{ type: TxType; total: number }[]>(
    'SELECT type, COALESCE(SUM(amount_cents), 0) AS total FROM transactions GROUP BY type'
  );
  const m = sumByType(monthRows);
  const t = sumByType(totalRows);
  return {
    monthExpense: m.expense,
    monthIncome: m.income,
    monthBalance: m.income - m.expense,
    totalExpense: t.expense,
    totalIncome: t.income,
    totalBalance: t.income - t.expense,
  };
}

// 最近 N 个月（含指定月份）的收支趋势，返回完整月份序列（缺失月份补 0）
export async function getMonthlyTrend(endMonth: string, months = 6): Promise<MonthlyTrend[]> {
  const db = await getDb();
  const startMonth = shiftMonth(endMonth, -(months - 1));
  const rows = await db.select<{ month: string; type: TxType; total: number }[]>(
    `SELECT substr(date, 1, 7) AS month, type, COALESCE(SUM(amount_cents), 0) AS total
     FROM transactions
     WHERE substr(date, 1, 7) >= $1 AND substr(date, 1, 7) <= $2
     GROUP BY month, type`,
    [startMonth, endMonth]
  );
  const result: MonthlyTrend[] = [];
  for (let i = 0; i < months; i++) {
    const m = shiftMonth(startMonth, i);
    const expense = rows.find((r) => r.month === m && r.type === 'expense')?.total ?? 0;
    const income = rows.find((r) => r.month === m && r.type === 'income')?.total ?? 0;
    result.push({ month: m, expense, income, balance: income - expense });
  }
  return result;
}

// 某月某类型下，各一级大类的金额汇总（用于占比饼图）
export async function getCategoryBreakdown(month: string, type: TxType): Promise<CategoryBreakdown[]> {
  const db = await getDb();
  return db.select<CategoryBreakdown[]>(
    `SELECT p.id AS parent_id, p.name AS parent_name, p.icon AS icon,
            COALESCE(SUM(t.amount_cents), 0) AS total
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     LEFT JOIN categories p ON p.id = c.parent_id
     WHERE t.type = $1 AND t.date LIKE $2
     GROUP BY p.id, p.name, p.icon
     ORDER BY total DESC`,
    [type, `${month}-%`]
  );
}
