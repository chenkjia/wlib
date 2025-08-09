<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import DayLineChart from './DayLineChart.vue'
import HourLineChart from './HourLineChart.vue'

const props = defineProps({
  goal: {
    type: Object,
    required: true
  },
  maParams: {
    type: Object,
    default: null
  }
})

// 引用图表组件
const dayChart = ref(null)
const hourChart = ref(null)

// 全屏状态
const isFullscreen = ref(false)

// 移除图表类型切换逻辑，改为同时显示两个图表

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
  // 同时对两个图表进行resize
  if (dayChart.value && dayChart.value.resize) {
    dayChart.value.resize()
  }
  if (hourChart.value && hourChart.value.resize) {
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
    <div class="charts-container">
      <!-- 日线图区域 -->
      <div class="chart-section">
        <DayLineChart 
          ref="dayChart" 
          :goal="goal" 
          :ma-params="maParams" 
        />
      </div>
      
      <!-- 小时线图区域 -->
      <div class="chart-section">
        <HourLineChart 
          ref="hourChart" 
          :goal="goal" 
          :ma-params="maParams" 
        />
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
  align-items: center;
  gap: 1rem;
}

.chart-type-tabs {
  display: flex;
  background-color: #f3f4f6;
  border-radius: 0.375rem;
  padding: 0.25rem;
}

.chart-type-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: #6b7280;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.chart-type-btn:hover {
  color: #374151;
  background-color: #e5e7eb;
}

.chart-type-btn.active {
  color: #3b82f6;
  background-color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
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
  height: 50%;
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