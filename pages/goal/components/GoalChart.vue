<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import DayLineChart from './DayLineChart.vue'
import HourLineChart from './HourLineChart.vue'

const props = defineProps({
  goal: {
    type: Object,
    required: true
  }
})

// 引用图表组件
const dayChart = ref(null)
const hourChart = ref(null)

// 全屏状态
const isFullscreen = ref(false)

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  // 延迟执行resize，确保DOM已更新
  setTimeout(() => {
    handleResize()
  }, 100)
}

// 处理窗口大小变化
const handleResize = () => {
  if (dayChart.value) {
    dayChart.value.resize()
  }
  if (hourChart.value) {
    hourChart.value.resize()
  }
}

// 组件挂载处理
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

// 组件卸载处理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="goal-chart" :class="{ 'fullscreen': isFullscreen }">
    <div class="chart-header">
      <h2 class="text-xl font-bold">K线图</h2>
      <div class="chart-controls">
        <button @click="toggleFullscreen" class="fullscreen-btn" title="全屏切换">
          <i :class="isFullscreen ? 'icon-fullscreen-exit' : 'icon-fullscreen'" aria-hidden="true"></i>
        </button>
      </div>
    </div>
    
    <div class="charts-container">
      <!-- 日线图 -->
      <div class="chart-section">
        <DayLineChart ref="dayChart" :goal="goal" />
      </div>
      
      <!-- 小时线图 -->
      <div class="chart-section">
        <HourLineChart ref="hourChart" :goal="goal" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.goal-chart {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  border-right: 1px solid #e5e7eb;
  background-color: white;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.chart-controls {
  display: flex;
  gap: 0.5rem;
}

.fullscreen-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  color: #4b5563;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fullscreen-btn:hover {
  color: #1f2937;
}

.icon-fullscreen::before {
  content: '\2922';
  font-style: normal;
  font-size: 16px;
}

.icon-fullscreen-exit::before {
  content: '\2923';
  font-style: normal;
  font-size: 16px;
}

.charts-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chart-section {
  flex: 1;
  position: relative;
  min-height: 0;
  border-bottom: 1px solid #e5e7eb;
}

.chart-section:last-child {
  border-bottom: none;
}

/* 全屏相关样式 */
.goal-chart.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw !important;
  height: 100vh;
  background-color: white;
  z-index: 1000;
  padding: 10px;
}

.goal-chart.fullscreen .charts-container {
  height: calc(100vh - 80px);
}
</style>