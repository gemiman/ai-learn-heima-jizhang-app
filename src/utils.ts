// 金额换算工具（人民币元 <-> 分）

// 元 -> 分（存进数据库用「分」，避免 0.1 + 0.2 = 0.30000000004 这种浮点误差）
export function yuanToCents(yuan: number): number {
  return Math.round(yuan * 100);
}

// 分 -> 元（数字）：直接除以 100，得到的是「数字」。
// 注意：数字可能带很长的小数尾数（就是 0.1 + 0.2 那种问题），所以只用于内部计算；
// 要显示给用户看时，用下面的 centsToYuan（会保留两位小数）。
export function centsToYuanNum(cents: number): number {
  return cents / 100;
}

// 分 -> 元（字符串，保留两位小数，如 "12.50"）
export function centsToYuan(cents: number): string {
  return (cents / 100).toFixed(2);
}

// 分 -> 带货币符号的展示字符串，如 "¥12.50"
export function formatCents(cents: number): string {
  return `¥${centsToYuan(cents)}`;
}

// 获取当前月份，格式 YYYY-MM（比如 2026-09）。
// 说明：getMonth() 返回的月份是从 0 开始数的（0 = 1 月），所以要 +1；
// padStart(2, '0') 是「不足两位就在前面补 0」，让 9 月显示成 09。
export function currentMonth(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${m}`;
}

// 获取今天日期，格式 YYYY-MM-DD
export function today(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// 月份加减（delta 可为负，比如 -1 = 上个月），返回 YYYY-MM。
// 关键点：JS 的 Date 里「月份」是从 0 开始数的（0 = 1 月），所以要 m - 1 才对得上；
// 再把「日」固定成 1，避免「1 月 31 日」这种月末日期在跨月时跳错。
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
