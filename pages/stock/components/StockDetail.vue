<template>
  <div class="stock-detail">
    <div class="flex flex-col md:flex-row h-full">
      <!-- 中间K线图 -->
      <div class="chart-wrapper w-full md:w-2/3 relative">
        <!-- 图表顶部控制面板 -->
        <ChartControlPanel 
          v-model:trendInterval="trendInterval"
          v-model:profitFilter="profitFilter"
          v-model:dailyProfitFilter="dailyProfitFilter"
          v-model:durationFilter="durationFilter"
          v-model:liquidityFilter="liquidityFilter"
          :isFullScreen="isFullScreen"
          @refresh="refreshChart"
          @toggleFullScreen="toggleFullScreen"
        />
        <div class="chart-container" ref="chartContainer"></div>
      </div>
      
      <!-- 右侧目标趋势 -->
      <div class="w-full md:w-1/3 p-4 bg-white rounded-lg shadow">
        <div class="mb-4">
          <h2 class="text-lg font-semibold">{{ stockCode }} 目标趋势 <span class="text-sm text-gray-500">(总数: {{ goals.length }})</span></h2>
        </div>
        <LoadingState v-if="loading" />
        <ErrorState v-else-if="error" :message="error" />
        <EmptyState v-else-if="goals.length === 0" message="暂无目标趋势数据" />
        
        <GoalsList 
          v-else 
          :goals="goals" 
          v-model:selectedGoal="selectedGoal"
          @highlightGoal="highlightGoalPoints"
          @resetHighlight="resetHighlight"
          :formatDate="formatDate"
          :getProfitClass="getProfitClass"
        />
      </div>
    </div>
 
    <!-- 目标趋势详情弹窗 -->
    <GoalDetailModal 
      v-if="selectedGoal" 
      :goal="selectedGoal" 
      @close="selectedGoal = null"
      :formatDate="formatDate"
      :getProfitClass="getProfitClass"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

// 从共享工具模块导入函数
import { dayLineFormat, calculateGoals as calculateGoalsUtil } from '~/utils/stockUtils'

// 导入图表工具函数
import { 
  calculateMA, 
  splitData, 
  processTrendPoints, 
  createChartOption 
} from './ChartUtils.js'

// 导入拆分的组件
import ChartControlPanel from './ChartControlPanel.vue'
import GoalsList from './GoalsList.vue'
import GoalDetailModal from './GoalDetailModal.vue'
import LoadingState from './LoadingState.vue'
import ErrorState from './ErrorState.vue'
import EmptyState from './EmptyState.vue'

const props = defineProps({
  stockCode: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['error'])

// 响应式状态
const chartContainer = ref(null)
const isFullScreen = ref(false)
const goals = ref([])
const loading = ref(true)
const error = ref('')
const selectedGoal = ref(null)
const trendInterval = ref(40) 
const profitFilter = ref(50) 
const dailyProfitFilter = ref(2) 
const durationFilter = ref(7) 
const liquidityFilter = ref(100) // 流动性过滤器，默认100万
const currentHighlightIndex = ref(null)
let myChart = null

// 切换全屏显示
function toggleFullScreen() {
  isFullScreen.value = !isFullScreen.value
  
  const chartWrapper = document.querySelector('.chart-wrapper')
  if (isFullScreen.value) {
    chartWrapper.classList.add('fullscreen-mode')
    document.body.style.overflow = 'hidden'
  } else {
    chartWrapper.classList.remove('fullscreen-mode')
    document.body.style.overflow = ''
  }
  
  // 调整图表大小
  setTimeout(() => {
    if (myChart) {
      try {
        myChart.resize()
      } catch (err) {
        console.error('调整图表大小失败:', err)
      }
    }
  }, 100)
}

// 日期格式化函数
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function formatDateYYYYMMDD(value) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDateMMDD(value) {
  const date = new Date(value)
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 获取盈亏样式类
function getProfitClass(profit) {
  if (!profit && profit !== 0) return ''
  if (profit > 0) return 'text-green-600'
  if (profit < 0) return 'text-red-600'
  return 'text-orange-500'
}

// 使用工具函数并应用过滤器
function calculateGoals(dayLine) {
  return calculateGoalsUtil(dayLine, profitFilter.value, dailyProfitFilter.value, 0.5, trendInterval.value, durationFilter.value, liquidityFilter.value * 10000); // 将流动性单位从万转为实际值
}

// 颜色配置
const upColor = '#00da3c'
const downColor = '#ec0000'

// 刷新图表
async function refreshChart() {
  try {
    loading.value = true
    error.value = ''
    
    // 获取日线数据并计算目标趋势
    const response = await fetch(`/api/dayLine?code=${props.stockCode}`)
    let rawData = await response.json()
    rawData = dayLineFormat(rawData, trendInterval.value, 0.5)

    // 计算目标趋势
    goals.value = calculateGoals(rawData)
    
    // 初始化图表
    await initChart(rawData, goals.value)
    
    loading.value = false
  } catch (err) {
    handleError('更新数据失败', err)
  }
}

// 高亮显示目标点
function highlightGoalPoints(goal, index) {
  try {
    if (!myChart) return
    
    currentHighlightIndex.value = index
    
    myChart.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      dataIndex: []
    })
    
    myChart.setOption({
      series: [{
        name: 'K线',
        markPoint: {
          data: myChart.getOption().series[0].markPoint.data.map(point => {
            if (point.goalIndex === currentHighlightIndex.value) {
              return { ...point, symbolSize: 50 }
            }
            return point
          })
        }
      }]
    })
  } catch (err) {
    console.error('高亮目标点失败:', err)
  }
}

// 重置高亮效果
function resetHighlight() {
  try {
    if (!myChart) return
    
    currentHighlightIndex.value = null
    
    myChart.dispatchAction({
      type: 'downplay',
      seriesIndex: 0
    })
    
    myChart.setOption({
      series: [{
        name: 'K线',
        markPoint: {
          data: myChart.getOption().series[0].markPoint.data.map(point => {
            return { ...point, symbolSize: 30 }
          })
        }
      }]
    })
  } catch (err) {
    console.error('重置高亮效果失败:', err)
  }
}

// 初始化图表
async function initChart(rawData, goals) {
  try {
    if (!myChart) {
      console.error('图表未初始化')
      return
    }
    
    // 分割数据
    let data = splitData(rawData)
    
    // 处理趋势点标记
    data = processTrendPoints(rawData, goals, data)
    
    // 计算均线数据
    const ma7 = calculateMA(7, data.values)
    const ma50 = calculateMA(50, data.values)
    const ma100 = calculateMA(100, data.values)
    
    // 设置图表选项
    const option = createChartOption(
      data, 
      ma7, 
      ma50, 
      ma100, 
      formatDateYYYYMMDD, 
      formatDateMMDD
    )
    myChart.setOption(option)
  } catch (error) {
    handleError('初始化图表失败', error)
  }
}




// 统一错误处理
function handleError(message, err) {
  console.error(`${message}:`, err)
  error.value = `${message}: ${err.message}`
  loading.value = false
  emit('error', err.message)
}

// 加载股票数据
async function loadStockData() {
  try {
    loading.value = true
    error.value = ''
    
    // 如果图表已存在，先销毁它
    if (myChart) {
      myChart.dispose()
      myChart = null
    }
    
    // 确保 DOM 元素已经挂载
    await nextTick()
    
    if (!chartContainer.value) {
      throw new Error('图表容器不存在')
    }
    
    try {
      myChart = echarts.init(chartContainer.value, 'dark')
    } catch (chartError) {
      throw new Error('初始化图表失败: ' + chartError.message)
    }
    
    // 调用刷新图表函数获取数据并初始化图表
    await refreshChart()
  } catch (err) {
    handleError('加载数据失败', err)
  }
}

// 监听趋势间隔变化，仅进行范围限制
watch(trendInterval, (newValue) => {
  if (newValue < 1) trendInterval.value = 1
  if (newValue > 60) trendInterval.value = 60
})

// 监听股票代码变化
watch(() => props.stockCode, async (newCode, oldCode) => {
  if (newCode && newCode !== oldCode) {
    try {
      await nextTick()
      
      if (!chartContainer.value) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      loadStockData()
    } catch (err) {
      handleError('监听股票代码变化时出错', err)
    }
  }
}, { immediate: true })

onMounted(async () => {
  try {
    await nextTick()
    window.addEventListener('resize', handleResize)
  } catch (err) {
    console.error('组件挂载时出错:', err)
  }
})

const handleResize = () => {
  try {
    if (myChart) {
      myChart.resize()
    }
  } catch (err) {
    console.error('调整图表大小失败:', err)
  }
}

onUnmounted(() => {
  try {
    if (myChart) {
      myChart.dispose()
      myChart = null
    }
    window.removeEventListener('resize', handleResize)
  } catch (err) {
    console.error('组件卸载时出错:', err)
  }
})
</script>

<style scoped>
.stock-detail {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.chart-wrapper {
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  z-index: 10;
  position: relative;
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

/* 全屏模式样式 */
.fullscreen-mode {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  background-color: #121212;
}

.fullscreen-mode .chart-container {
  height: 100%;
}

@media (max-width: 768px) {
  .stock-detail {
    height: auto;
  }
  
  .chart-wrapper {
    height: 50vh;
    width: 100% !important;
  }
}
</style>

/* 交易记录样式 */
.bg-blue-50 {
  background-color: #eff6ff !important;
}

.text-green-600 {
  color: #059669;
}

.text-red-600 {
  color: #dc2626;
}

.text-orange-500 {
  color: #f97316;
}

.divide-y > * + * {
  border-top-width: 1px;
  border-top-style: solid;
  border-top-color: #e5e7eb;
}