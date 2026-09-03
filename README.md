# 记账APP

> 一款简单易用的个人记账桌面软件，记录每一笔支出与收入，看清自己的钱花在哪、剩多少。

数据只存在你自己的电脑上，**无需注册账号、无需联网**。

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 📝 记一笔账 | 录入金额，选择两级分类，选日期、填备注，区分「支出 / 收入」 |
| 🗂 分类管理 | 预置两级分类（一级大类 → 二级小类）；可自定义新增 / 改名 / 改图标 / 删除 |
| 📋 账单列表 | 按时间倒序查看流水，支持按类型 / 分类 / 关键词 / 月份筛选 |
| 📊 统计分析 | 月度收支趋势图 + 各大类金额占比饼图 |
| 💰 结余展示 | 首页醒目显示当月 / 累计的支出、收入与结余 |
| 🎮 小游戏 | 内置贪吃蛇，方向键 / WASD 控制，吃食物变长，撞墙或撞自己结束，占满棋盘通关 |

> 规划中：数据导入导出（导出为 CSV / Excel 做备份迁移）。

---

## 🛠 技术栈

| 部分 | 用的技术 |
|------|---------|
| 桌面框架 | Tauri 2.x（外壳用 Rust，界面用网页技术） |
| 前端框架 | Vue 3 + TypeScript + Vite |
| UI 组件库 | Element Plus |
| 图表库 | ECharts |
| 数据存储 | 本地 SQLite（tauri-plugin-sql） |
| 单元测试 | Vitest + @vue/test-utils + jsdom（纯函数 + 数据库逻辑 + 页面组件） |
| 打包发布 | 生成 Windows / macOS 安装包 |

---

## 🚀 本地开发

### 环境要求

- [Node.js](https://nodejs.org/)（含 npm）
- [Rust](https://www.rust-lang.org/)（含 Cargo，Windows 下需 MSVC 编译器）
- Windows 11 自带 WebView2，无需额外安装

### 首次运行

```bash
# 1. 安装前端依赖
npm install

# 2. 启动开发模式（会自动打开 APP 窗口，改代码实时刷新）
npm run tauri dev
```

### 常用命令

```bash
npm run tauri dev     # 开发模式运行
npm run tauri build   # 打包成安装包（Windows 生成 .exe）
npm test              # 运行全部单元测试（工具函数 + 数据库逻辑 + 页面组件）
npm run test:watch    # 边改代码边自动重跑测试
```

### 测试覆盖范围

测试分三层，共覆盖 35 个用例：

| 层级 | 覆盖内容 | 测试文件 |
|------|---------|---------|
| 工具函数 | 金额换算、日期加减 | `src/utils.test.ts` |
| 数据库逻辑 | 收支汇总、筛选条件拼接、月份补齐 | `src/db-logic.test.ts` |
| 页面组件 | 记账校验、账单显示、删除确认、分类新增、菜单切换等 | `src/**/*.test.ts`（views 下） |

> 页面组件的图表和贪吃蛇画面在测试环境用「假对象」替代，只测行为逻辑，不测视觉渲染。

---

## 📦 打包发布

打包后会生成安装包，位置在：

```
src-tauri/target/release/bundle/nsis/记账APP_0.1.0_x64-setup.exe
```

> macOS 安装包需在 Mac 电脑上打包（当前阶段先做 Windows 版）。

---

## 💾 数据存储

所有账目数据保存在一个本地 SQLite 数据库文件里，跟着系统的「应用数据目录」走：

- **Windows**：`C:\Users\<你的用户名>\AppData\Roaming\com.heima.jizhang\heima-jizhang.db`
- **macOS**：`~/Library/Application Support/com.heima.jizhang/heima-jizhang.db`

想备份 / 迁移数据，直接把这个 `.db` 文件复制走即可。

---

## 📁 目录结构

```
├── src/                      # 前端界面（Vue 3 + TypeScript）
│   ├── views/                # 各页面：首页 / 记账 / 账单 / 统计 / 分类 / 小游戏
│   ├── db.ts                 # 数据层：建表、预置分类、增删改查、统计
│   ├── types.ts              # 数据模型类型定义
│   └── utils.ts              # 金额换算、日期等工具函数
├── src-tauri/                # 桌面外壳（Rust）
│   └── tauri.conf.json       # 应用配置（名称、图标、打包等）
├── icon-source.svg           # APP 图标源文件
├── CLAUDE.md                 # 产品文档 & 项目总纲
└── README.md                 # 本文件
```

---

## 🗺 开发路线图

| 阶段 | 目标 | 状态 |
|------|------|------|
| ① 文档定稿 | 完善产品文档 | ✅ 已完成 |
| ② 搭建环境 | 安装 Node.js、Rust 等开发工具 | ✅ 已完成 |
| ③ 核心记账 | 记一笔账 + 账单列表 + 分类 | ✅ 已完成 |
| ④ 统计报表 | 月度统计、结余、占比图 | ✅ 已完成 |
| ⑤ 打包发布 | 生成 Windows / macOS 安装包 | 🔄 进行中（先做 Windows） |
| ⑥ 数据导入导出 | 导出为 CSV / Excel | ⏳ 规划中 |
