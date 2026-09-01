<script setup lang="ts">
import { ref } from "vue";
import HomeView from "./views/HomeView.vue";
import AddView from "./views/AddView.vue";
import ListView from "./views/ListView.vue";
import CategoryView from "./views/CategoryView.vue";
import StatisticsView from "./views/StatisticsView.vue";

const current = ref("home");

function onSelect(index: string) {
  current.value = index;
}
</script>

<template>
  <el-container class="app-shell">
    <el-aside width="200px" class="sidebar">
      <div class="logo">🐴 黑马记账</div>
      <el-menu :default-active="current" class="menu" @select="onSelect">
        <el-menu-item index="home">🏠 首页</el-menu-item>
        <el-menu-item index="add">✏️ 记一笔账</el-menu-item>
        <el-menu-item index="list">📋 账单明细</el-menu-item>
        <el-menu-item index="stat">📊 统计分析</el-menu-item>
        <el-menu-item index="category">🗂 分类管理</el-menu-item>
      </el-menu>
    </el-aside>

    <el-main class="content">
      <HomeView v-if="current === 'home'" />
      <AddView v-else-if="current === 'add'" @saved="current = 'list'" />
      <ListView v-else-if="current === 'list'" />
      <StatisticsView v-else-if="current === 'stat'" />
      <CategoryView v-else-if="current === 'category'" />
    </el-main>
  </el-container>
</template>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
.app-shell {
  height: 100%;
}

.sidebar {
  background: #2c3e50;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.menu {
  border-right: none;
  background: #2c3e50;
}

.menu :deep(.el-menu-item) {
  color: #cfd8dc;
}

.menu :deep(.el-menu-item.is-active) {
  background: #1f2d3a;
  color: #ffd04b;
}

.menu :deep(.el-menu-item:hover) {
  background: #1f2d3a;
}

.content {
  padding: 24px;
  background: #f5f7fa;
}
</style>
