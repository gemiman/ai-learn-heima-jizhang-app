<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";

// ===== 游戏参数 =====
const GRID = 20; // 棋盘 20×20 格
const CELL = 24; // 每格像素
const CANVAS = GRID * CELL; // 画布 480×480
const SPEED = 150; // 每步间隔（毫秒），越小越快

// 四个方向的移动向量
const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
} as const;

type Dir = keyof typeof DIRS;

interface Point {
  x: number;
  y: number;
}

// 反向表：用于禁止 180° 掉头（比如正向右时，不能立刻向左）
const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const canvasRef = ref<HTMLCanvasElement | null>(null);

// ===== 游戏状态 =====
const score = ref(0);
const running = ref(false);
const gameOver = ref(false);
const won = ref(false); // 是否通关（蛇占满整个棋盘）

let snake: Point[] = [];
let direction: Dir = "right";
let nextDirection: Dir = "right";
let food: Point = { x: 0, y: 0 };
let timer: number | null = null;

// 生成食物：先收集所有空位，再从中随机挑一个（避免蛇快占满棋盘时随机重试卡死）
// 返回 false 表示没有空位了（蛇占满棋盘，触发通关）
function spawnFood(): boolean {
  const free: Point[] = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!snake.some((s) => s.x === x && s.y === y)) {
        free.push({ x, y });
      }
    }
  }
  if (free.length === 0) {
    winGame();
    return false;
  }
  food = free[Math.floor(Math.random() * free.length)];
  return true;
}

// 重置到初始状态（不自动开始，等用户点按钮）
function reset() {
  // 初始蛇：长 3 格，放在棋盘中间，朝右
  snake = [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
  ];
  direction = "right";
  nextDirection = "right";
  score.value = 0;
  gameOver.value = false;
  won.value = false;
  spawnFood();
  draw();
}

// 画圆角矩形（Canvas 原生 roundRect 的兼容封装，避免依赖浏览器版本）
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 画布绘制（每次状态变化后重画一帧）
function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 背景
  ctx.fillStyle = "#1f2d3a";
  ctx.fillRect(0, 0, CANVAS, CANVAS);

  // 网格线
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID; i++) {
    const pos = i * CELL;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, CANVAS);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(CANVAS, pos);
    ctx.stroke();
  }

  // 食物
  ctx.fillStyle = "#f56c6c";
  ctx.beginPath();
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
  ctx.fill();

  // 蛇身（蛇头圆润 + 眼睛，身体浅绿圆角）
  snake.forEach((seg, i) => {
    const x = seg.x * CELL;
    const y = seg.y * CELL;
    if (i === 0) {
      // 蛇头：圆角方块 + 两只朝向前进方向的眼睛
      ctx.fillStyle = "#67c23a";
      roundRect(ctx, x + 1, y + 1, CELL - 2, CELL - 2, 8);
      ctx.fill();

      const d = DIRS[direction];
      const cx = x + CELL / 2;
      const cy = y + CELL / 2;
      const fwd = CELL * 0.16; // 眼睛沿前进方向前移
      const spread = CELL * 0.2; // 两只眼睛的间距
      const ex1 = cx + d.x * fwd - d.y * spread;
      const ey1 = cy + d.y * fwd + d.x * spread;
      const ex2 = cx + d.x * fwd + d.y * spread;
      const ey2 = cy + d.y * fwd - d.x * spread;

      // 眼白
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(ex1, ey1, CELL * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex2, ey2, CELL * 0.13, 0, Math.PI * 2);
      ctx.fill();

      // 瞳孔
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.arc(ex1, ey1, CELL * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex2, ey2, CELL * 0.06, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 身体：浅绿圆角方块
      ctx.fillStyle = "#95d475";
      roundRect(ctx, x + 1, y + 1, CELL - 2, CELL - 2, 5);
      ctx.fill();
    }
  });

  // 游戏结束遮罩
  if (gameOver.value) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, CANVAS, CANVAS);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(won.value ? "🎉 通关！" : "游戏结束", CANVAS / 2, CANVAS / 2 - 12);
    ctx.font = "16px sans-serif";
    ctx.fillText(`得分：${score.value}`, CANVAS / 2, CANVAS / 2 + 22);
  }
}

// 前进一格（每个计时周期调用一次）
function step() {
  direction = nextDirection;
  const head = snake[0];
  const newHead: Point = {
    x: head.x + DIRS[direction].x,
    y: head.y + DIRS[direction].y,
  };

  // 撞墙
  if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
    endGame();
    return;
  }

  const willEat = newHead.x === food.x && newHead.y === food.y;

  // 新蛇身：头插到最前；没吃到食物就砍掉尾巴
  const newSnake = [newHead, ...snake];
  if (!willEat) newSnake.pop();

  // 撞自己：蛇头碰到除自己以外的身体部分
  const body = newSnake.slice(1);
  if (body.some((s) => s.x === newHead.x && s.y === newHead.y)) {
    endGame();
    return;
  }

  snake = newSnake;

  if (willEat) {
    score.value += 1;
    if (!spawnFood()) return; // 没有空位了，已触发通关胜利
  }

  draw();
}

// 开始游戏
function start() {
  if (running.value) return;
  running.value = true;
  timer = window.setInterval(step, SPEED);
}

// 暂停游戏
function pause() {
  if (!running.value) return;
  running.value = false;
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

// 重新开始
function restart() {
  pause();
  reset();
  start();
}

// 游戏结束（撞墙 / 撞自己）
function endGame() {
  pause();
  won.value = false;
  gameOver.value = true;
  draw();
  ElMessage.error(`游戏结束，得分：${score.value}`);
}

// 通关胜利（蛇占满整个棋盘）
function winGame() {
  pause();
  won.value = true;
  gameOver.value = true;
  draw();
  ElMessage.success(`🎉 恭喜通关！得分：${score.value}`);
}

// 主按钮文案：按状态切换
const mainButtonText = computed(() => {
  if (running.value) return "⏸ 暂停";
  if (gameOver.value) return "🔄 再来一局";
  return "▶ 开始游戏";
});

// 主按钮：开始 / 暂停 / 重新开始
function onMainButton() {
  if (running.value) {
    pause();
  } else if (gameOver.value) {
    restart();
  } else {
    start();
  }
}

// 键盘方向控制（方向键 + WASD）
function onKeydown(e: KeyboardEvent) {
  const k = e.key;
  let dir: Dir | null = null;
  if (k === "ArrowUp" || k === "w" || k === "W") dir = "up";
  else if (k === "ArrowDown" || k === "s" || k === "S") dir = "down";
  else if (k === "ArrowLeft" || k === "a" || k === "A") dir = "left";
  else if (k === "ArrowRight" || k === "d" || k === "D") dir = "right";
  else return;

  // 防止方向键滚动页面
  e.preventDefault();

  // 禁止 180° 掉头
  if (OPPOSITE[direction] === dir) return;

  nextDirection = dir;
}

onMounted(() => {
  reset();
  window.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  pause();
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <div class="snake-page">
    <div class="header">
      <h2 class="page-title">🐍 贪吃蛇</h2>
      <div class="score">得分：{{ score }}</div>
    </div>

    <div class="game-area">
      <canvas ref="canvasRef" :width="CANVAS" :height="CANVAS" class="board"></canvas>
    </div>

    <div class="controls">
      <el-button type="primary" @click="onMainButton">{{ mainButtonText }}</el-button>
      <el-button @click="restart">🔄 重新开始</el-button>
    </div>

    <p class="tip">用键盘「方向键」或「WASD」控制方向</p>
  </div>
</template>

<style scoped>
.snake-page {
  max-width: 520px;
  margin: 0 auto;
}

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

.score {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.game-area {
  display: flex;
  justify-content: center;
}

.board {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.controls {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.tip {
  text-align: center;
  color: #909399;
  font-size: 13px;
  margin-top: 12px;
}
</style>
