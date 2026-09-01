<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { listCategories, addCategory } from "../db";
import type { CategoryTree, TxType } from "../types";

const type = ref<TxType>("expense");
const categories = ref<CategoryTree[]>([]);

const dialogVisible = ref(false);
const newName = ref("");
const newParentId = ref<number>(-1); // -1 表示新建一级大类
const newIcon = ref("");

async function load() {
  categories.value = await listCategories(type.value);
}

onMounted(load);

function switchType(t: TxType) {
  type.value = t;
  newParentId.value = -1;
  load();
}

async function submitAdd() {
  const name = newName.value.trim();
  if (!name) {
    ElMessage.warning("请输入分类名称");
    return;
  }
  const parentId = newParentId.value === -1 ? null : newParentId.value;
  await addCategory(type.value, name, parentId, newIcon.value.trim() || null);
  ElMessage.success("添加成功");
  dialogVisible.value = false;
  newName.value = "";
  newParentId.value = -1;
  newIcon.value = "";
  await load();
}
</script>

<template>
  <div>
    <div class="header">
      <h2 class="page-title">分类管理</h2>
      <el-button type="primary" @click="dialogVisible = true">新增分类</el-button>
    </div>

    <el-radio-group v-model="type" class="type-switch" @change="switchType">
      <el-radio-button value="expense">支出分类</el-radio-button>
      <el-radio-button value="income">收入分类</el-radio-button>
    </el-radio-group>

    <div class="category-groups">
      <div v-for="c in categories" :key="c.id" class="group">
        <div class="group-header">
          <span class="group-icon">{{ c.icon ?? "📁" }}</span>
          <span class="group-name">{{ c.name }}</span>
        </div>
        <div class="children">
          <span v-for="child in c.children" :key="child.id" class="child-tag">{{ child.name }}</span>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="新增分类" width="440px">
      <el-form label-width="80px">
        <el-form-item label="所属位置">
          <el-radio-group v-model="newParentId">
            <el-radio :value="-1">新建一级大类</el-radio>
            <el-radio v-for="c in categories" :key="c.id" :value="c.id">
              挂在「{{ c.name }}」下
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="newName" placeholder="如：宠物" maxlength="10" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="newIcon" placeholder="选填，如：🐱" maxlength="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 20px;
}

.type-switch {
  margin-bottom: 20px;
}

.category-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.group-icon {
  font-size: 18px;
}

.group-name {
  font-size: 15px;
  font-weight: 600;
}

.children {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.child-tag {
  background: #f0f2f5;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 13px;
  color: #606266;
}
</style>
