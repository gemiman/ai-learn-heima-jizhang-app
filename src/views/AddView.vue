<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { ElMessage } from "element-plus";
import { addTransaction, listCategories } from "../db";
import { yuanToCents, today } from "../utils";
import type { CategoryTree, TxType } from "../types";

const emit = defineEmits<{ saved: [] }>();

const type = ref<TxType>("expense");
const amount = ref<number>();
const parentId = ref<number | null>(null);
const categoryId = ref<number | null>(null);
const date = ref(today());
const note = ref("");

const categories = ref<CategoryTree[]>([]);
const children = computed(() => {
  const p = categories.value.find((c) => c.id === parentId.value);
  return p ? p.children : [];
});

async function load() {
  categories.value = await listCategories(type.value);
}

// 切换收支类型时，重新加载分类并清空已选分类
watch(type, () => {
  parentId.value = null;
  categoryId.value = null;
  load();
});

// 切换一级大类时，清空二级小类
watch(parentId, () => {
  categoryId.value = null;
});

onMounted(load);

async function submit() {
  if (amount.value == null || amount.value <= 0) {
    ElMessage.warning("请输入金额");
    return;
  }
  if (categoryId.value == null) {
    ElMessage.warning("请选择分类");
    return;
  }
  await addTransaction({
    type: type.value,
    amount_cents: yuanToCents(amount.value),
    category_id: categoryId.value,
    date: date.value,
    note: note.value.trim(),
  });
  ElMessage.success("记账成功！");
  amount.value = undefined;
  note.value = "";
  emit("saved");
}

function reset() {
  amount.value = undefined;
  parentId.value = null;
  categoryId.value = null;
  date.value = today();
  note.value = "";
}
</script>

<template>
  <div>
    <h2 class="page-title">记一笔账</h2>

    <el-form label-width="70px" class="form">
      <el-form-item label="类型">
        <el-radio-group v-model="type">
          <el-radio-button value="expense">支出</el-radio-button>
          <el-radio-button value="income">收入</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="金额">
        <el-input-number
          v-model="amount"
          :precision="2"
          :min="0"
          :step="1"
          controls-position="right"
          placeholder="0.00"
        />
        <span class="unit">元</span>
      </el-form-item>

      <el-form-item label="分类">
        <el-select v-model="parentId" placeholder="一级大类" style="width: 170px">
          <el-option
            v-for="c in categories"
            :key="c.id"
            :label="`${c.icon ?? ''} ${c.name}`"
            :value="c.id"
          />
        </el-select>
        <el-select
          v-model="categoryId"
          placeholder="二级小类"
          style="width: 170px; margin-left: 12px"
          :disabled="parentId == null"
        >
          <el-option v-for="c in children" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="日期">
        <el-date-picker v-model="date" type="date" value-format="YYYY-MM-DD" />
      </el-form-item>

      <el-form-item label="备注">
        <el-input v-model="note" placeholder="选填，如：和朋友聚餐" maxlength="50" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="submit">保存</el-button>
        <el-button @click="reset">清空</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.page-title {
  margin: 0 0 20px;
  font-size: 20px;
}

.form {
  max-width: 520px;
}

.unit {
  margin-left: 8px;
  color: #606266;
}
</style>
