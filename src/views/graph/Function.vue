<template>
  <el-card class="chart-card">
    <div class="form-row">
      <div v-for="(item, index) in functionsList" :key="item.id" class="function-item">
        <div class="color-dot" :style="{ backgroundColor: item.color }"></div>
        
        <el-input 
          v-model="item.expr" 
          placeholder="如 x^2, x^(1/2)" 
          style="width: 160px;" 
          @keyup.enter="draw"
        />

        <div class="domain-inputs">
          <span class="domain-bracket" @click="toggleBracket(item, 'left')">
            {{ item.leftOpen ? '(' : '[' }}
          </span>
          <el-input-number v-model="item.xMin" :controls="false" style="width: 50px" size="small" />
          <span class="domain-label">,</span>
          <el-input-number v-model="item.xMax" :controls="false" style="width: 50px" size="small" />
          <span class="domain-bracket" @click="toggleBracket(item, 'right')">
            {{ item.rightOpen ? ')' : ']' }}
          </span>
        </div>

        <el-icon v-if="functionsList.length > 1" class="delete-icon" @click="removeFunction(index)">
          <Close />
        </el-icon>
      </div>

      <div style="margin-left: 10px; display: flex; gap: 10px;">
        <el-button type="success" @click="addFunction" :icon="Plus">添加函数</el-button>
        <el-button type="primary" @click="draw">绘制图像</el-button>
        <el-button type="warning" @click="resetZoom">重置视图</el-button>
      </div>
    </div>

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
import zoomPlugin from 'chartjs-plugin-zoom'
import { ElMessage } from 'element-plus'
import { Plus, Close } from '@element-plus/icons-vue' 
import katex from 'katex'
import 'katex/dist/katex.min.css'

Chart.register(...registerables, zoomPlugin)

const chartRef = ref(null)
const wrapRef = ref(null)
let chartInstance = null
const clickPoint = ref(null)

const colorPool = ['#409eff', '#f56c6c', '#67c23a', '#e6a23c', '#9c27b0', '#ff9800', '#00bcd4']
let colorIndex = 1

const functionsList = ref([
  { id: Date.now(), expr: 'x^(1/2)', color: colorPool[0], xMin: -12, xMax: 12, leftOpen: false, rightOpen: false }
])

const toggleBracket = (item, side) => {
  if (side === 'left') item.leftOpen = !item.leftOpen
  else item.rightOpen = !item.rightOpen
  draw()
}

const addFunction = () => {
  if (functionsList.value.length >= 5) {
    ElMessage.warning('最多同时绘制 5 个函数')
    return
  }
  functionsList.value.push({
    id: Date.now(),
    expr: 'x^2', 
    color: colorPool[colorIndex % colorPool.length],
    xMin: -12, xMax: 12, leftOpen: false, rightOpen: false
  })
  colorIndex++
}

const removeFunction = (index) => {
  functionsList.value.splice(index, 1)
  draw() 
}

const resetZoom = () => {
  if (chartInstance) chartInstance.resetZoom()
}

const getIntegerTicks = () => {
  const arr = []
  for (let i = -12; i <= 12; i++) arr.push(i)
  return arr
}

// 将数学表达式转化为 LaTeX 格式
const toLatex = (expr) => {
  let latex = expr
    .replace(/\*/g, ' \\cdot ')
    .replace(/\^\(?1\s*\/\s*2\)?/g, '^{\\frac{1}{2}}')
    .replace(/\^\(?0\.5\)?/g, '^{\\frac{1}{2}}')
    .replace(/\^\(?(\d+)\s*\/\s*(\d+)\)?/g, '^{\\frac{$1}{$2}}')
    .replace(/\^([0-9a-zA-Z.]+)/g, '^{$1}')
  return latex
}

// 生成图例用的 SVG 图片
const getLegendImage = (expr) => {
  try {
    const latexStr = `y = ${toLatex(expr)}`
    const svgStr = katex.renderToString(latexStr, { throwOnError: false, output: 'svg' })
    const base64 = btoa(unescape(encodeURIComponent(svgStr)))
    return `data:image/svg+xml;base64,${base64}`
  } catch (e) {
    return null
  }
}

// 用于 Tooltip 的纯文本回退显示
const formatTextExpr = (expr) => {
  return expr
    .replace(/\^\(?1\s*\/\s*2\)?/g, '¹ᐟ²')
    .replace(/\^\(?0\.5\)?/g, '⁰·⁵')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
}

function draw() {
  const chartXMin = -12, chartXMax = 12, chartYMin = -12, chartYMax = 12
  const datasets = []

  functionsList.value.forEach((item) => {
    if (!item.expr.trim()) return 
    
    try {
      const fn = compile(item.expr)
      const legendImg = getLegendImage(item.expr) 
      const displayLabel = `y = ${formatTextExpr(item.expr)}`
      
      const points = []
      let startX = item.xMin
      let endX = item.xMax
      if (startX >= endX) return 

      const step = (endX - startX) / 500 
      const openPoints = []   
      const closedPoints = [] 
      
      for (let x = startX; x <= endX + step / 2; x += step) {
        if (item.leftOpen && x === startX) continue
        if (item.rightOpen && x >= endX) continue

        const y = fn.evaluate({ x })
        let cleanY = Math.abs(y) < 1e-8 ? 0 : y
        
        if (isFinite(cleanY) && !isNaN(cleanY)) {
          points.push({ x: x, y: cleanY })
        }
      }

      try {
        if (item.leftOpen) {
          const yL = fn.evaluate({ x: startX })
          if (isFinite(yL) && !isNaN(yL)) openPoints.push({ x: startX, y: Math.abs(yL) < 1e-8 ? 0 : yL })
        } else {
          const yL = fn.evaluate({ x: startX })
          if (isFinite(yL) && !isNaN(yL)) closedPoints.push({ x: startX, y: Math.abs(yL) < 1e-8 ? 0 : yL })
        }
        if (item.rightOpen) {
          const yR = fn.evaluate({ x: endX })
          if (isFinite(yR) && !isNaN(yR)) openPoints.push({ x: endX, y: Math.abs(yR) < 1e-8 ? 0 : yR })
        } else {
          const yR = fn.evaluate({ x: endX })
          if (isFinite(yR) && !isNaN(yR)) closedPoints.push({ x: endX, y: Math.abs(yR) < 1e-8 ? 0 : yR })
        }
      } catch (e) {}

      // 1. 主线条
      datasets.push({
        label: displayLabel,
        data: points,
        borderColor: item.color,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: false,
        showLine: true,
        legendImage: legendImg 
      })

      // 2. 实心端点
      if (closedPoints.length > 0) {
        datasets.push({
          label: `${displayLabel} 端点`,
          data: closedPoints,
          backgroundColor: item.color,
          borderColor: item.color,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
          showLine: false
        })
      }

      // 3. 空心端点
      if (openPoints.length > 0) {
        datasets.push({
          label: `${displayLabel} 端点`,
          data: openPoints,
          backgroundColor: '#ffffff',
          borderColor: item.color,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
          showLine: false
        })
      }
    } catch (err) {
      ElMessage.error(`函数 [${item.expr}] 表达式错误：${err.message}`)
    }
  })

  const ctx = chartRef.value.getContext('2d')
  if (chartInstance) chartInstance.destroy()
  clickPoint.value = null

  const size = Math.min(wrapRef.value.clientWidth, wrapRef.value.clientHeight) - 20 
  chartRef.value.width = size
  chartRef.value.height = size
  chartRef.value.style.width = size + 'px'
  chartRef.value.style.height = size + 'px'

  chartInstance = new Chart(ctx, {
    type: 'scatter', 
    data: { datasets: datasets },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      layout: { padding: 10 },
      scales: {
        x: {
          type: 'linear', min: chartXMin, max: chartXMax,
          title: { display: true, text: 'x', font: { size: 16 } },
          ticks: { values: getIntegerTicks(), stepSize: 1 },
          grid: {
            color: (context) => context.tick.value === 0 ? '#333' : '#e5e7eb',
            lineWidth: (context) => context.tick.value === 0 ? 2 : 1
          }
        },
        y: {
          type: 'linear', min: chartYMin, max: chartYMax,
          title: { display: true, text: 'y', font: { size: 16 } },
          ticks: { values: getIntegerTicks(), stepSize: 1 },
          grid: {
            color: (context) => context.tick.value === 0 ? '#333' : '#e5e7eb',
            lineWidth: (context) => context.tick.value === 0 ? 2 : 1
          }
        }
      },
      plugins: {
        legend: { 
          display: true, 
          position: 'top',
          labels: {
            filter: (item) => !item.text.includes('端点'),
            generateLabels: (chart) => {
              const original = Chart.defaults.plugins.legend.labels.generateLabels(chart);
              original.forEach(label => {
                const dataset = chart.data.datasets[label.datasetIndex];
                if (dataset.legendImage) {
                  label.pointStyle = dataset.legendImage;
                }
              });
              return original;
            }
          }
        },
        // 【修改处】：放大 Tooltip 的字体并去掉颜色方块
        tooltip: { 
          enabled: true, 
          mode: 'index', 
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', // 加深背景色
          titleFont: {
            size: 16, // 标题文字放大
            weight: 'bold'
          },
          bodyFont: {
            size: 16  // 内容文字放大
          },
          padding: 12, // 增加内边距
          caretSize: 8, // 指针变大
          displayColors: false, // 隐藏前面的小方块
          filter: (item) => !item.dataset.label.includes('端点'),
          callbacks: {
            title: (context) => `x = ${context[0].parsed.x.toFixed(2)}`,
            label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`
          }
        },
        zoom: {
          pan: { enabled: true, mode: 'xy' },
          zoom: { wheel: { enabled: true, speed: 0.1 }, pinch: { enabled: true }, mode: 'xy' }
        }
      },
      onClick: (e, elements) => {
        if (!elements.length) { clickPoint.value = null; return }
        const idx = elements[0].index
        const datasetIndex = elements[0].datasetIndex
        if (datasets[datasetIndex].label.includes('端点')) return;
        const point = datasets[datasetIndex].data[idx]
        clickPoint.value = { x: point.x, y: point.y }
      }
    }
  })
}

onMounted(() => {
  setTimeout(() => { draw() }, 50)
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
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.domain-inputs {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  padding: 0 8px;
  height: 32px;
}

.domain-bracket {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
  cursor: pointer;
  margin: 0 4px;
  user-select: none;
  transition: color 0.2s;
}
.domain-bracket:hover {
  color: #66b1ff;
}

.domain-label {
  font-size: 14px;
  color: #606266;
  margin: 0 2px;
}

:deep(.domain-inputs .el-input__wrapper) {
  box-shadow: none !important;
  background: transparent;
  padding: 0;
}
:deep(.domain-inputs .el-input__inner) {
  text-align: center;
}

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