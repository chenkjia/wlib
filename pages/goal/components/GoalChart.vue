<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  goal: {
    type: Object,
    required: true
  }
})

// 图表容器和实例引用
const dayChartContainer = ref(null)
const hourChartContainer = ref(null)
const dayChartInstance = ref(null)
const hourChartInstance = ref(null)
const isFullscreen = ref(false)

// 数据状态
const dayLineData = ref(null)
const hourLineData = ref(null)
const dayLoading = ref(false)
const hourLoading = ref(false)
const dayError = ref('')
const hourError = ref('')

// 获取日线数据
async function fetchDayLineData() {
  if (!props.goal?.stockCode) return
  
  dayLoading.value = true
  dayError.value = ''
  
  try {
    const response = await fetch(`/api/dayLine?code=${props.goal.stockCode}`)
    if (!response.ok) {
      throw new Error('获取日线数据失败')
    }
    const data = await response.json()
    dayLineData.value = data
    await nextTick()
    renderDayChart()
  } catch (err) {
    console.error('获取日线数据失败:', err)
    dayError.value = err.message || '获取日线数据失败'
  } finally {
    dayLoading.value = false
  }
}

// 获取小时线数据
async function fetchHourLineData() {
  if (!props.goal?.stockCode) return
  
  hourLoading.value = true
  hourError.value = ''
  
  try {
    const response = await fetch(`/api/hourLine?code=${props.goal.stockCode}`)
    if (!response.ok) {
      throw new Error('获取小时线数据失败')
    }
    const data = await response.json()
    hourLineData.value = data
    await nextTick()
    renderHourChart()
  } catch (err) {
    console.error('获取小时线数据失败:', err)
    hourError.value = err.message || '获取小时线数据失败'
  } finally {
    hourLoading.value = false
  }
}

// 渲染日线图表
function renderDayChart() {
  if (!dayChartContainer.value || !dayLineData.value?.data) return
  
  if (dayChartInstance.value) {
    dayChartInstance.value.dispose()
  }
  
  dayChartInstance.value = echarts.init(dayChartContainer.value)
  
  const data = dayLineData.value.data
  
  // 格式化日期
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }
  
  // 确保数据有效
  if (!data || data.length === 0) {
    dayError.value = '无日线数据'
    return
  }
  
  const dates = data.map(item => formatDate(item.date))
  const klineData = data.map(item => [item.open, item.close, item.low, item.high])
  
  // 标记目标的开始和结束点
  const markPoints = []
  if (props.goal.startTime) {
    const startDate = formatDate(props.goal.startTime)
    const startIndex = dates.findIndex(date => date === startDate)
    if (startIndex !== -1) {
      markPoints.push({
        name: '开始',
        coord: [startIndex, props.goal.startPrice],
        value: '开始',
        itemStyle: {
          color: '#10b981'
        }
      })
    }
  }
  
  if (props.goal.endTime && props.goal.endPrice) {
    const endDate = formatDate(props.goal.endTime)
    const endIndex = dates.findIndex(date => date === endDate)
    if (endIndex !== -1) {
      markPoints.push({
        name: '结束',
        coord: [endIndex, props.goal.endPrice],
        value: '结束',
        itemStyle: {
          color: '#ef4444'
        }
      })
    }
  }
  
  const option = {
    title: {
      text: `${props.goal.stockCode} - 日线图`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: function(params) {
        const param = params[0]
        const data = param.data
        const date = dates[param.dataIndex]
        return `日期: ${date}<br/>
                开盘: ${data[0]}<br/>
                收盘: ${data[1]}<br/>
                最低: ${data[2]}<br/>
                最高: ${data[3]}`
      }
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: dates,
      scale: true,
      boundaryGap: false,
      axisLine: { onZero: false },
      splitLine: { show: false },
      min: 'dataMin',
      max: 'dataMax',
      axisLabel: {
        rotate: 30,
        formatter: function(value) {
          return value
        }
      }
    },
    yAxis: {
      scale: true,
      splitArea: {
        show: true
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        show: true,
        type: 'slider',
        top: '90%',
        start: 0,
        end: 100
      }
    ],
    series: [
      {
        name: 'K线',
        type: 'candlestick',
        data: klineData,
        itemStyle: {
          color: '#ef4444',
          color0: '#10b981',
          borderColor: '#ef4444',
          borderColor0: '#10b981'
        },
        markPoint: {
          data: markPoints
        }
      }
    ]
  }
  
  dayChartInstance.value.setOption(option)
}

// 渲染小时线图表
function renderHourChart() {
  if (!hourChartContainer.value || !hourLineData.value?.data) return
  
  if (hourChartInstance.value) {
    hourChartInstance.value.dispose()
  }
  
  hourChartInstance.value = echarts.init(hourChartContainer.value)
  
  const data = hourLineData.value.data
  
  // 格式化时间
  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // 确保数据有效
  if (!data || data.length === 0) {
    hourError.value = '无小时线数据'
    return
  }
  
  const times = data.map(item => formatTime(item.time))
  const klineData = data.map(item => [item.open, item.close, item.low, item.high])
  
  const option = {
    title: {
      text: `${props.goal.stockCode} - 小时线图`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: function(params) {
        const param = params[0]
        const data = param.data
        const time = times[param.dataIndex]
        return `时间: ${time}<br/>
                开盘: ${data[0]}<br/>
                收盘: ${data[1]}<br/>
                最低: ${data[2]}<br/>
                最高: ${data[3]}`
      }
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: times,
      scale: true,
      boundaryGap: false,
      axisLine: { onZero: false },
      splitLine: { show: false },
      min: 'dataMin',
      max: 'dataMax',
      axisLabel: {
        rotate: 45,
        formatter: function(value) {
          return value
        }
      }
    },
    yAxis: {
      scale: true,
      splitArea: {
        show: true
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        show: true,
        type: 'slider',
        top: '90%',
        start: 0,
        end: 100
      }
    ],
    series: [
      {
        name: 'K线',
        type: 'candlestick',
        data: klineData,
        itemStyle: {
          color: '#ef4444',
          color0: '#10b981',
          borderColor: '#ef4444',
          borderColor0: '#10b981'
        }
      }
    ]
  }
  
  hourChartInstance.value.setOption(option)
}

// 全屏切换
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  
  if (isFullscreen.value) {
    // 进入全屏模式
    document.body.style.overflow = 'hidden'
  } else {
    // 退出全屏模式
    document.body.style.overflow = ''
  }
  
  // 调整图表大小
  resizeCharts()
}

// 调整图表大小
function resizeCharts() {
  setTimeout(() => {
    if (dayChartInstance.value) {
      dayChartInstance.value.resize()
    }
    if (hourChartInstance.value) {
      hourChartInstance.value.resize()
    }
  }, 100)
}

// 监听目标变化
watch(() => props.goal, (newGoal) => {
  if (newGoal) {
    fetchDayLineData()
    fetchHourLineData()
  }
}, { immediate: true })

// 组件挂载和卸载处理
onMounted(() => {
  // 添加窗口大小变化监听
  window.addEventListener('resize', resizeCharts)
  
  // 组件卸载时清理资源
  return () => {
    // 移除事件监听
    window.removeEventListener('resize', resizeCharts)
    
    // 清理图表实例
    if (dayChartInstance.value) {
      dayChartInstance.value.dispose()
    }
    if (hourChartInstance.value) {
      hourChartInstance.value.dispose()
    }
  }
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
        <div class="chart-wrapper relative">
          <div v-if="dayLoading" class="chart-loading">
            <USkeleton class="h-full" />
          </div>
          <div v-else-if="dayError" class="chart-error">
            <div class="text-red-500">{{ dayError }}</div>
          </div>
          <div v-else ref="dayChartContainer" class="chart-container"></div>
        </div>
      </div>
      
      <!-- 小时线图 -->
      <div class="chart-section">
        <div class="chart-wrapper relative">
          <div v-if="hourLoading" class="chart-loading">
            <USkeleton class="h-full" />
          </div>
          <div v-else-if="hourError" class="chart-error">
            <div class="text-red-500">{{ hourError }}</div>
          </div>
          <div v-else ref="hourChartContainer" class="chart-container"></div>
        </div>
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

.chart-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.chart-loading,
.chart-error {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-red-500 {
  color: #ef4444;
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

.goal-chart.fullscreen .chart-container {
  min-height: 300px;
}
</style>