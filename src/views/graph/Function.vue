<template>
  <el-card class="chart-card">
    <div class="form-row">
      <!-- 动态渲染每一行输入框 -->
      <div v-for="(item, index) in functionsList" :key="item.id" class="function-item">
        <div class="color-dot" :style="{ backgroundColor: item.color }"></div>
        <el-input 
          v-model="item.expr" 
          placeholder="输入函数，如 x^2、sin(x)" 
          style="width: 220px;" 
          @keyup.enter="draw"
        />
        <!-- 原生感叉号：直接使用 el-icon 渲染，不使用 el-button 的边框 -->
        <el-icon 
          v-if="functionsList.length > 1" 
          class="delete-icon" 
          @click="removeFunction(index)"
        >
          <Close />
        </el-icon>
      </div>

      <div style="margin-left: 10px; display: flex; gap: 10px;">
        <el-button type="success" @click="addFunction" :icon="Plus">添加函数</el-button>
        <el-button type="primary" @click="draw">绘制图像</el-button>
      </div>
    </div>

    <!-- 画布容器 -->
    <div ref="wrapRef" class="canvas-wrap">
      <canvas ref="chartRef"></canvas>
    </div>
    
    <el-alert 
      v-if="clickPoint" 
      style="margin-top:12px" 
      :title="`选中坐标：x = ${clickPoint.x.toFixed(2)}，y = ${clickPoint.y.toFixed(2)}`" 
      type="info" 
    />
  </el-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { compile } from 'mathjs'
import { Chart, registerables } from 'chart.js'
import { ElMessage } from 'element-plus'
// 引入需要的图标组件
import { Plus, Close } from '@element-plus/icons-vue' 

Chart.register(...registerables)

const chartRef = ref(null)
const wrapRef = ref(null)
let chartInstance = null
const clickPoint = ref(null)

// 预设颜色池
const colorPool = ['#409eff', '#f56c6c', '#67c23a', '#e6a23c', '#9c27b0', '#ff9800', '#00bcd4']
let colorIndex = 1

// 多函数列表状态
const functionsList = ref([
  { id: Date.now(), expr: 'x + 1', color: colorPool[0] }
])

// 添加函数
const addFunction = () => {
  if (functionsList.value.length >= 5) {
    ElMessage.warning('最多同时绘制 5 个函数')
    return
  }
  functionsList.value.push({
    id: Date.now(),
    expr: 'x^2',
    color: colorPool[colorIndex % colorPool.length]
  })
  colorIndex++
}

// 删除函数
const removeFunction = (index) => {
  functionsList.value.splice(index, 1)
  draw() // 删除后自动重绘
}

const getIntegerTicks = () => {
  const arr = []
  for (let i = -10; i <= 10; i++) arr.push(i)
  return arr
}

function draw() {
  const xMin = -10, xMax = 10, yMin = -10, yMax = 10
  const step = (xMax - xMin) / 600
  const datasets = []
  const allXs = [] 

  for (let x = xMin; x <= xMax; x += step) {
    allXs.push(x)
  }

  functionsList.value.forEach((item) => {
    if (!item.expr.trim()) return 
    
    try {
      const fn = compile(item.expr)
      const ys = []
      for (let x = xMin; x <= xMax; x += step) {
        const y = fn.evaluate({ x })
        ys.push(isFinite(y) ? y : null)
      }
      
      datasets.push({
        label: `y = ${item.expr}`,
        data: ys,
        borderColor: item.color,
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.1 
      })
    } catch (err) {
      ElMessage.error(`函数 [${item.expr}] 表达式错误：${err.message}`)
    }
  })

  const ctx = chartRef.value.getContext('2d')
  if (chartInstance) chartInstance.destroy()
  clickPoint.value = null

  const wrapW = wrapRef.value.clientWidth
  const wrapH = wrapRef.value.clientHeight
  const size = Math.min(wrapW, wrapH) - 20 

  chartRef.value.width = size
  chartRef.value.height = size
  chartRef.value.style.width = size + 'px'
  chartRef.value.style.height = size + 'px'

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: allXs,
      datasets: datasets
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      layout: { padding: 10 },
      scales: {
        x: {
          type: 'linear',
          min: xMin,
          max: xMax,
          title: { display: true, text: 'x', font: { size: 16 } },
          ticks: { values: getIntegerTicks(), stepSize: 1 },
          grid: {
            color: (context) => context.tick.value === 0 ? '#333' : '#e5e7eb',
            lineWidth: (context) => context.tick.value === 0 ? 2 : 1
          }
        },
        y: {
          type: 'linear',
          min: yMin,
          max: yMax,
          title: { display: true, text: 'y', font: { size: 16 } },
          ticks: { values: getIntegerTicks(), stepSize: 1 },
          grid: {
            color: (context) => context.tick.value === 0 ? '#333' : '#e5e7eb',
            lineWidth: (context) => context.tick.value === 0 ? 2 : 1
          }
        }
      },
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: { enabled: true, mode: 'index', intersect: false }
      },
      onClick: (e, elements) => {
        if (!elements.length) {
          clickPoint.value = null
          return
        }
        const idx = elements[0].index
        const datasetIndex = elements[0].datasetIndex
        const yValue = datasets[datasetIndex].data[idx]

        clickPoint.value = {
          x: allXs[idx],
          y: yValue
        }
      }
    }
  })
}

onMounted(() => {
  setTimeout(() => {
    draw()
  }, 50)
  window.addEventListener('resize', draw)
})

onUnmounted(() => {
  window.removeEventListener('resize', draw)
  if (chartInstance) chartInstance.destroy()
})
</script>

<style scoped>
.chart-card {
  height: calc(100vh - 120px); 
  display: flex;
  flex-direction: column;
}

:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.form-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap; 
  gap: 10px;
  flex-shrink: 0;
  padding-bottom: 10px;
}

.function-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f7fa;
  padding: 4px 8px 4px 10px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  position: relative; /* 用于定位小叉号 */
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 原生感叉号样式 */
.delete-icon {
  cursor: pointer;
  font-size: 16px;
  color: #a8abb2;
  transition: color 0.2s;
  margin-left: 4px;
  margin-right: 4px;
}

.delete-icon:hover {
  color: #f56c6c;
}

.canvas-wrap {
  flex: 1;
  width: 100%;
  margin-top: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px; 
}
</style>