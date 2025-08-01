<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  goal: {
    type: Object,
    required: true
  }
})

const chartContainer = ref(null)
const chartInstance = ref(null)
const isFullscreen = ref(false)
const stockData = ref(null)
const loading = ref(false)
const error = ref('')

// 格式化函数
function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function formatDateTime(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatPrice(price) {
  if (price === null || price === undefined) return '-'
  return price.toFixed(2)
}

function formatProfit(profit) {
  if (profit === null || profit === undefined) return '-'
  return `${profit > 0 ? '+' : ''}${profit.toFixed(2)}%`
}

function getProfitClass(profit) {
  if (profit === null || profit === undefined) return ''
  return profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-600' : ''
}

function getTrendCategoryText(category) {
  const categoryMap = {
    'NEW_HIGH': '新高',
    'REBOUND': '反弹',
    'NORMAL': '普通'
  }
  return categoryMap[category] || category
}

function getTrendCategoryClass(category) {
  const classMap = {
    'NEW_HIGH': 'text-red-600 bg-red-50',
    'REBOUND': 'text-green-600 bg-green-50',
    'NORMAL': 'text-gray-600 bg-gray-50'
  }
  return classMap[category] || 'text-gray-600 bg-gray-50'
}

function formatDuration(duration) {
  if (!duration) return '-'
  return `${duration}天`
}

function formatDailyProfit(dailyProfit) {
  if (dailyProfit === null || dailyProfit === undefined) return '-'
  return `${dailyProfit > 0 ? '+' : ''}${dailyProfit.toFixed(2)}%`
}

// 获取股票数据
async function fetchStockData() {
  if (!props.goal?.stockCode) return
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await fetch(`/api/dayLine?code=${props.goal.stockCode}`)
    if (!response.ok) {
      throw new Error('获取股票数据失败')
    }
    const data = await response.json()
    stockData.value = data
    await nextTick()
    renderChart()
  } catch (err) {
    console.error('获取股票数据失败:', err)
    error.value = err.message || '获取股票数据失败'
  } finally {
    loading.value = false
  }
}

// 渲染图表
function renderChart() {
  if (!chartContainer.value || !stockData.value?.data) return
  
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }
  
  chartInstance.value = echarts.init(chartContainer.value)
  
  const data = stockData.value.data
  const dates = data.map(item => item.date)
  const klineData = data.map(item => [item.open, item.close, item.low, item.high])
  
  // 标记目标的开始和结束点
  const markPoints = []
  if (props.goal.startTime) {
    const startDate = new Date(props.goal.startTime).toISOString().split('T')[0]
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
    const endDate = new Date(props.goal.endTime).toISOString().split('T')[0]
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
      text: `${props.goal.stockCode} - 目标趋势`,
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
      max: 'dataMax'
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
  
  chartInstance.value.setOption(option)
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
  setTimeout(() => {
    if (chartInstance.value) {
      chartInstance.value.resize()
    }
  }, 100)
}

// 监听目标变化
watch(() => props.goal, (newGoal) => {
  if (newGoal) {
    fetchStockData()
  }
}, { immediate: true })

// 组件卸载时清理图表
onMounted(() => {
  return () => {
    if (chartInstance.value) {
      chartInstance.value.dispose()
    }
  }
})
</script>

<template>
  <div :class="['goal-detail', { 'fullscreen': isFullscreen }]">
    <div class="detail-header">
      <h2 class="text-xl font-bold">目标详情</h2>
      <button @click="toggleFullscreen" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm" title="全屏切换">
        <i :class="isFullscreen ? 'icon-fullscreen-exit' : 'icon-fullscreen'" aria-hidden="true"></i>
      </button>
    </div>
    
    <div class="detail-content">
      <!-- 基本信息 -->
      <div class="info-section">
        <h3 class="section-title">基本信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">股票代码:</span>
            <span class="value font-medium">{{ goal.stockCode }}</span>
          </div>
          <div class="info-item">
            <span class="label">趋势类型:</span>
            <span class="value" :class="getTrendCategoryClass(goal.trendCategory)">
              {{ getTrendCategoryText(goal.trendCategory) }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">开始时间:</span>
            <span class="value">{{ formatDateTime(goal.startTime) }}</span>
          </div>
          <div class="info-item">
            <span class="label">开始价格:</span>
            <span class="value">{{ formatPrice(goal.startPrice) }}</span>
          </div>
          <div class="info-item">
            <span class="label">结束时间:</span>
            <span class="value">{{ formatDateTime(goal.endTime) }}</span>
          </div>
          <div class="info-item">
            <span class="label">结束价格:</span>
            <span class="value">{{ formatPrice(goal.endPrice) }}</span>
          </div>
        </div>
      </div>
      
      <!-- 收益信息 -->
      <div class="info-section">
        <h3 class="section-title">收益信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">总盈亏:</span>
            <span class="value font-medium" :class="getProfitClass(goal.profit)">
              {{ formatProfit(goal.profit) }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">持续天数:</span>
            <span class="value">{{ formatDuration(goal.duration) }}</span>
          </div>
          <div class="info-item">
            <span class="label">日均利润:</span>
            <span class="value" :class="getProfitClass(goal.dailyProfit)">
              {{ formatDailyProfit(goal.dailyProfit) }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">使用斜率分析:</span>
            <span class="value">{{ goal.usedSlopeAnalysis ? '是' : '否' }}</span>
          </div>
        </div>
      </div>
      
      <!-- 流动性统计 -->
      <div v-if="goal.liquidityStats" class="info-section">
        <h3 class="section-title">流动性统计</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">平均成交量:</span>
            <span class="value">{{ goal.liquidityStats.avgVolume?.toLocaleString() || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">平均成交额:</span>
            <span class="value">{{ goal.liquidityStats.avgAmount?.toLocaleString() || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">换手率:</span>
            <span class="value">{{ goal.liquidityStats.turnoverRate ? `${goal.liquidityStats.turnoverRate.toFixed(2)}%` : '-' }}</span>
          </div>
        </div>
      </div>
      
      <!-- K线图 -->
      <div class="chart-section">
        <h3 class="section-title">K线图</h3>
        <div class="chart-wrapper relative">
          <div v-if="loading" class="chart-loading">
            <USkeleton class="h-full" />
          </div>
          <div v-else-if="error" class="chart-error">
            <div class="text-red-500">{{ error }}</div>
          </div>
          <div v-else ref="chartContainer" class="chart-container"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.goal-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-content {
  flex: 1;
  overflow: auto;
  padding: 1rem;
}

.info-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.25rem;
}

.value {
  font-size: 1rem;
}

.chart-section {
  margin-top: 1.5rem;
}

.chart-wrapper {
  position: relative;
  flex: 1;
  width: 100%;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  z-index: 10;
}

/* 工具类 */
.relative {
  position: relative;
}

.chart-loading,
.chart-error {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-green-600 {
  color: #059669;
}

.text-red-600 {
  color: #dc2626;
}

.bg-red-50 {
  background-color: #fef2f2;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.bg-green-50 {
  background-color: #f0fdf4;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.bg-gray-50 {
  background-color: #f9fafb;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

/* 全屏相关样式 */
.goal-detail.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: white;
  z-index: 1000;
  padding: 10px;
}

.goal-detail.fullscreen .chart-container {
  height: calc(100vh - 150px);
}

/* 全屏图标 */
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
</style>