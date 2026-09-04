<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getSummary, listTransactions } from "../db";
import { centsToYuan, currentMonth } from "../utils";
import type { Summary, TransactionView } from "../types";

const month = currentMonth();
const summary = ref<Summary | null>(null);
const recent = ref<TransactionView[]>([]);

// 加载首页数据：本月/累计的结余统计 + 最近 5 笔账单
async function load() {
  summary.value = await getSummary(month);
  recent.value = (await listTransactions({})).slice(0, 5);
}

onMounted(load);

function amountText(t: TransactionView): string {
  const s = centsToYuan(t.amount_cents);
  return t.type === "expense" ? `-${s}` : `+${s}`;
}
</script>

<template>
  <div>
    <h2 class="page-title">结余总览</h2>
    <p class="month-label">{{ month }}</p>

    <div v-if="summary" class="cards">
      <div class="card">
        <div class="card-label">本月支出</div>
        <div class="card-value expense">¥{{ centsToYuan(summary.monthExpense) }}</div>
      </div>
      <div class="card">
        <div class="card-label">本月收入</div>
        <div class="card-value income">¥{{ centsToYuan(summary.monthIncome) }}</div>
      </div>
      <div class="card">
        <div class="card-label">本月结余</div>
        <div class="card-value">¥{{ centsToYuan(summary.monthBalance) }}</div>
      </div>
      <div class="card">
        <div class="card-label">累计支出</div>
        <div class="card-value expense">¥{{ centsToYuan(summary.totalExpense) }}</div>
      </div>
      <div class="card">
        <div class="card-label">累计收入</div>
        <div class="card-value income">¥{{ centsToYuan(summary.totalIncome) }}</div>
      </div>
      <div class="card">
        <div class="card-label">累计结余</div>
        <div class="card-value">¥{{ centsToYuan(summary.totalBalance) }}</div>
      </div>
    </div>

    <h3 class="recent-title">最近 5 笔</h3>
    <el-empty v-if="recent.length === 0" description="还没有记账，去记一笔吧" />
    <ul v-else class="recent-list">
      <li v-for="t in recent" :key="t.id" class="recent-item">
        <span class="recent-icon">{{ t.category_icon ?? "💰" }}</span>
        <div class="recent-info">
          <div class="recent-cat">{{ t.parent_name }} / {{ t.category_name }}</div>
          <div class="recent-note">{{ t.note || "无备注" }}</div>
        </div>
        <span class="recent-amount" :class="t.type">{{ amountText(t) }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.page-title {
  margin: 0 0 4px;
  font-size: 20px;
}

.month-label {
  margin: 0 0 16px;
  color: #909399;
  font-size: 14px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.card-label {
  color: #909399;
  font-size: 13px;
  margin-bottom: 8px;
}

.card-value {
  font-size: 24px;
  font-weight: 600;
}

.card-value.expense {
  color: #f56c6c;
}

.card-value.income {
  color: #67c23a;
}

.recent-title {
  margin: 24px 0 12px;
  font-size: 16px;
}

.recent-list {
  list-style: none;
  margin: 0;
  padding: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-icon {
  font-size: 22px;
}

.recent-info {
  flex: 1;
}

.recent-cat {
  font-size: 14px;
}

.recent-note {
  font-size: 12px;
  color: #909399;
}

.recent-amount {
  font-size: 15px;
  font-weight: 600;
}

.recent-amount.expense {
  color: #f56c6c;
}

.recent-amount.income {
  color: #67c23a;
}
</style>
