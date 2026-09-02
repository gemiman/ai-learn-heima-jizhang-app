<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { listCategories, addCategory, updateCategory, deleteCategory } from "../db";
import type { Category, CategoryTree, TxType } from "../types";

const type = ref<TxType>("expense");
const categories = ref<CategoryTree[]>([]);

// 新增分类对话框
const dialogVisible = ref(false);
const newName = ref("");
const newParentId = ref<number>(-1); // -1 表示新建一级大类
const newIcon = ref("");

// 修改分类对话框
const renameVisible = ref(false);
const renameId = ref(0);
const renameName = ref("");
const renameIcon = ref("");

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

function openRename(c: Category) {
  renameId.value = c.id;
  renameName.value = c.name;
  renameIcon.value = c.icon ?? "";
  renameVisible.value = true;
}

async function submitRename() {
  const name = renameName.value.trim();
  if (!name) {
    ElMessage.warning("请输入分类名称");
    return;
  }
  try {
    await updateCategory(renameId.value, name, renameIcon.value.trim() || null);
    ElMessage.success("修改成功");
    renameVisible.value = false;
    await load();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}

async function confirmDelete(c: Category) {
  try {
    await ElMessageBox.confirm(`确定删除分类「${c.name}」吗？删除后无法恢复。`, "删除分类", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return; // 用户点了取消
  }
  try {
    await deleteCategory(c.id);
    ElMessage.success("删除成功");
    await load();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
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
          <span v-if="c.is_default === 1" class="sys-badge">系统</span>
          <template v-if="c.is_default === 0">
            <el-button link type="primary" size="small" @click="openRename(c)">改名</el-button>
            <el-button link type="danger" size="small" @click="confirmDelete(c)">删除</el-button>
          </template>
        </div>
        <div class="children">
          <span v-for="child in c.children" :key="child.id" class="child-tag">
            {{ child.name }}
            <template v-if="child.is_default === 0">
              <span class="tag-op" title="改名" @click="openRename(child)">改</span>
              <span class="tag-op danger" title="删除" @click="confirmDelete(child)">删</span>
            </template>
          </span>
        </div>
      </div>
    </div>

    <!-- 新增分类对话框 -->
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

    <!-- 修改分类对话框 -->
    <el-dialog v-model="renameVisible" title="修改分类" width="360px">
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="renameName" placeholder="请输入新名称" maxlength="10" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="renameIcon" placeholder="选填，如：🐱" maxlength="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renameVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRename">确定</el-button>
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

.sys-badge {
  font-size: 12px;
  color: #909399;
  background: #f0f2f5;
  border-radius: 4px;
  padding: 1px 6px;
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

.tag-op {
  cursor: pointer;
  color: #409eff;
  font-size: 12px;
  margin-left: 6px;
}

.tag-op.danger {
  color: #f56c6c;
}

.tag-op:hover {
  text-decoration: underline;
}
</style>
