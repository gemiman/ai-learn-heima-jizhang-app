<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { listTransactions, deleteTransaction } from "../db";
import { centsToYuan } from "../utils";
import type { TransactionView, TxType } from "../types";

const rows = ref<TransactionView[]>([]);
const type = ref<TxType | "">("");
const month = ref("");
const keyword = ref("");

// 按当前筛选条件（类型/月份/关键词）重新查询账单列表；空值转 undefined 表示「不筛选这一项」
async function load() {
  rows.value = await listTransactions({
    type: type.value || undefined,
    month: month.value || undefined,
    keyword: keyword.value || undefined,
  });
}

onMounted(load);

async function remove(row: TransactionView) {
  try {
    await ElMessageBox.confirm("确定删除这笔账吗？", "提示", { type: "warning" });
  } catch {
    return;
  }
  await deleteTransaction(row.id);
  ElMessage.success("已删除");
  await load();
}

function amountText(row: TransactionView): string {
  const s = centsToYuan(row.amount_cents);
  return row.type === "expense" ? `-${s}` : `+${s}`;
}
</script>

<template>
  <div>
    <h2 class="page-title">账单明细</h2>

    <div class="filters">
      <el-radio-group v-model="type" @change="load">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="expense">支出</el-radio-button>
        <el-radio-button value="income">收入</el-radio-button>
      </el-radio-group>

      <el-date-picker
        v-model="month"
        type="month"
        value-format="YYYY-MM"
        placeholder="按月份筛选"
        clearable
        @change="load"
      />

      <el-input
        v-model="keyword"
        placeholder="搜索备注关键词"
        clearable
        style="width: 200px"
        @keyup.enter="load"
        @clear="load"
      />

      <el-button type="primary" @click="load">查询</el-button>
    </div>

    <el-table :data="rows" style="width: 100%">
      <el-table-column prop="date" label="日期" width="120" />
      <el-table-column label="分类" min-width="190">
        <template #default="{ row }">
          <span>{{ row.category_icon ?? "" }} {{ row.parent_name }} / {{ row.category_name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="160">
        <template #default="{ row }">{{ row.note || "—" }}</template>
      </el-table-column>
      <el-table-column label="金额" width="140" align="right">
        <template #default="{ row }">
          <span class="amount" :class="row.type">{{ amountText(row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" align="center">
        <template #default="{ row }">
          <el-button type="danger" link @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="rows.length === 0" description="暂无账单" />
  </div>
</template>

<style scoped>
.page-title {
  margin: 0 0 16px;
  font-size: 20px;
}

.filters {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.amount {
  font-weight: 600;
}

.amount.expense {
  color: #f56c6c;
}

.amount.income {
  color: #67c23a;
}
</style>
