<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import * as echarts from "echarts";
import type { ECharts } from "echarts";
import { getMonthlyTrend, getCategoryBreakdown } from "../db";
import { centsToYuanNum, currentMonth } from "../utils";
import type { CategoryBreakdown, MonthlyTrend, TxType } from "../types";

const month = ref(currentMonth());

const trendEl = ref<HTMLDivElement>();
const expenseEl = ref<HTMLDivElement>();
const incomeEl = ref<HTMLDivElement>();

let trendChart: ECharts | null = null;
let expenseChart: ECharts | null = null;
let incomeChart: ECharts | null = null;

// 近 6 个月趋势图：支出、收入为柱状，结余为折线
function renderTrend(trend: MonthlyTrend[]) {
  if (!trendChart) return;
  trendChart.setOption(
    {
      tooltip: { trigger: "axis" },
      legend: { data: ["支出", "收入", "结余"] },
      grid: { left: 60, right: 24, top: 48, bottom: 32 },
      xAxis: { type: "category", data: trend.map((t) => t.month) },
      yAxis: { type: "value", name: "元" },
      series: [
        {
          name: "支出",
          type: "bar",
          data: trend.map((t) => centsToYuanNum(t.expense)),
          itemStyle: { color: "#f56c6c" },
        },
        {
          name: "收入",
          type: "bar",
          data: trend.map((t) => centsToYuanNum(t.income)),
          itemStyle: { color: "#67c23a" },
        },
        {
          name: "结余",
          type: "line",
          data: trend.map((t) => centsToYuanNum(t.balance)),
          itemStyle: { color: "#409eff" },
        },
      ],
    },
    true
  );
}

// 占比饼图：某类型下各一级大类的金额占比
function renderPie(chart: ECharts | null, data: CategoryBreakdown[], type: TxType) {
  if (!chart) return;
  const isExpense = type === "expense";
  if (data.length === 0) {
    chart.setOption(
      {
        title: {
          text: "本月暂无数据",
          left: "center",
          top: "middle",
          textStyle: { color: "#c0c4cc", fontSize: 14, fontWeight: "normal" },
        },
      },
      true
    );
    return;
  }
  chart.setOption(
    {
      color: isExpense
        ? ["#f56c6c", "#e6a23c", "#909399", "#409eff", "#67c23a", "#b882c1", "#5ab2c6", "#f7a8b8", "#8d98b3", "#d1a054"]
        : ["#67c23a", "#409eff", "#e6a23c", "#f56c6c", "#b882c1", "#5ab2c6", "#909399", "#f7a8b8", "#8d98b3", "#d1a054"],
      tooltip: { trigger: "item", formatter: "{b}：¥{c}（{d}%）" },
      legend: { orient: "vertical", left: 0, top: "middle" },
      series: [
        {
          name: isExpense ? "支出占比" : "收入占比",
          type: "pie",
          radius: ["40%", "65%"],
          center: ["60%", "50%"],
          avoidLabelOverlap: true,
          label: { formatter: "{b}\n{d}%" },
          data: data.map((d) => ({ name: d.parent_name, value: centsToYuanNum(d.total) })),
        },
      ],
    },
    true
  );
}

async function load() {
  const trend = await getMonthlyTrend(month.value, 6);
  const expense = await getCategoryBreakdown(month.value, "expense");
  const income = await getCategoryBreakdown(month.value, "income");
  renderTrend(trend);
  renderPie(expenseChart, expense, "expense");
  renderPie(incomeChart, income, "income");
}

function handleResize() {
  trendChart?.resize();
  expenseChart?.resize();
  incomeChart?.resize();
}

onMounted(() => {
  trendChart = echarts.init(trendEl.value!);
  expenseChart = echarts.init(expenseEl.value!);
  incomeChart = echarts.init(incomeEl.value!);
  window.addEventListener("resize", handleResize);
  load();
});

watch(month, () => load());

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  trendChart?.dispose();
  expenseChart?.dispose();
  incomeChart?.dispose();
});
</script>

<template>
  <div>
    <div class="stat-header">
      <h2 class="page-title">统计分析</h2>
      <el-date-picker
        v-model="month"
        type="month"
        value-format="YYYY-MM"
        :clearable="false"
        placeholder="选择月份"
      />
    </div>

    <div class="panel">
      <div class="panel-title">近 6 个月收支趋势</div>
      <div ref="trendEl" class="chart trend"></div>
    </div>

    <div class="pie-row">
      <div class="panel">
        <div class="panel-title">本月支出占比</div>
        <div ref="expenseEl" class="chart pie"></div>
      </div>
      <div class="panel">
        <div class="panel-title">本月收入占比</div>
        <div ref="incomeEl" class="chart pie"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-title {
  margin: 0;
  font-size: 20px;
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.panel {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
}

.chart {
  width: 100%;
}

.chart.trend {
  height: 320px;
}

.chart.pie {
  height: 320px;
}

.pie-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.pie-row .panel {
  margin-bottom: 0;
}
</style>
