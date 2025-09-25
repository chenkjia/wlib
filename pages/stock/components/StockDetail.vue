<template>
  <div class="stock-detail flex flex-col md:flex-row h-full">
    <div class="flex flex-row w-full h-full">
      <!-- 中间K线图 -->
      <div
        v-show="panelState!=='expanded'"
        class="w-2/3 flex flex-col transition-all duration-300 h-full"
        :class="[{'w-full': panelState === 'collapsed'}]">
        <!-- 图表顶部交易统计组件 -->
        <TradeStats :backtestData="backtestData" />
        
        <div class="chart-container" ref="chartContainer"></div>
        
      </div>
      <!-- 右侧面板 -->
      <div 
        v-show="panelState!=='collapsed'"
        class="w-1/3 flex flex-col transition-all duration-300 h-full"
        :class="[{'w-full': panelState === 'expanded'}]">
        <RightPanel
          v-model:ma="ma"
          v-model:buyConditions="buyConditions"
          v-model:sellConditions="sellConditions"
          :transactions="transactions"
          @calculation="handleCalculation"
        />
      </div>
        <!-- 右侧面板收缩按钮 -->
        <button 
          @click="toggleRightPanel"
          class="absolute top-5 right-2 transform -translate-y-1/2 z-30 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-all duration-200"
        >
          <svg class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': panelState === 'collapsed' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

import { calculateStock, calculateBacktestData } from '~/utils/chartUtils.js'
import TradeStats from '~/components/TradeStats.vue'

// 导入图表工具函数
import { 
  splitData,
  createChartOption 
} from './ChartUtils.js'

import RightPanel from './RightPanel.vue'

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
const loading = ref(true)
const error = ref('')
const dayLine = ref([]) // 存储日线数据

// 从本地存储读取配置或使用默认值
const getLocalConfig = (key, defaultValue) => {
  if (process.client) {
    const stored = localStorage.getItem(`stock_config_${key}`)
    return stored ? JSON.parse(stored) : defaultValue
  }
  return defaultValue
}
// 保存配置到本地存储
const saveConfigToLocalStorage = () => {
  if (process.client) {
    localStorage.setItem(`stock_config_ma`, JSON.stringify(ma.value))
    localStorage.setItem(`stock_config_buyConditions`, JSON.stringify(buyConditions.value))
localStorage.setItem(`stock_config_sellConditions`, JSON.stringify(sellConditions.value))
  }
}

// MA配置参数（对象格式）
const ma = ref(getLocalConfig('ma', {
  s: 7, // 短期MA
  m: 50, // 中期MA
  l: 100, // 长期MA
  x: 200  // 超长期MA
}))

// 买入和卖出条件配置
const buyConditions = ref(getLocalConfig('buyConditions', [
  // 默认买入条件示例
  ['MAM_CROSS_UP_MAL']
]))

const sellConditions = ref(getLocalConfig('sellConditions', [
  // 默认卖出条件示例
  ['MAM_CROSS_DOWN_MAL']
]))


// 交易记录
const transactions = ref([])
// 回测数据
const backtestData = ref({})
const panelState = ref('normal') // 右侧面板收缩状态，默认展开
const activeTab = ref('params') // 当前激活的标签页，默认为参数设置
let myChart = null

// 性能监控指标
const perfMetrics = {
  renderTime: 0,
  dataProcessTime: 0
}

// 防抖函数
function debounce(fn, delay) {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 页内计算处理函数
function handleCalculation(params) {
  // 保存配置到本地存储
  saveConfigToLocalStorage()
  if (params.type === 'page') {
    refreshChart()
  } else {
    handleRemoteCalculation(params)
  }
}

// 全局计算处理函数
async function handleRemoteCalculation(params) {
  // 创建计算任务
  const task = {
    name: params.type === 'star' ? '星标计算任务' : '全局计算任务',
    params: {
      type: params.type,
      ma: params.ma,
      buyConditions: params.buyConditions,
      sellConditions: params.sellConditions
    }
  }
  
  try {
    // 使用简化的任务创建API
    const { data, error } = await useFetch('/api/task/create', {
      method: 'POST',
      body: task
    })
    
    if (data.value && data.value.task) {
      // 任务创建成功，不需要额外提示，RightPanel已经有提示
    } else if (error.value) {
      throw new Error(error.value.message || '创建任务失败')
    }
  } catch (error) {
    console.error('创建计算任务失败:', error)
    
  }
}

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

// 切换右侧面板显示状态
function toggleRightPanel() {
  if (panelState.value === 'expanded')  {
    panelState.value = 'normal'
  } else if (panelState.value === 'normal') {
    // 收缩
    panelState.value = 'collapsed'
  } else {
    // 展开
    panelState.value = 'expanded'
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
  }, 300) // 等待CSS动画完成
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


// 颜色配置
const upColor = '#00da3c'
const downColor = '#ec0000'

// 刷新图表
async function refreshChart() {
  try {
    // 确保图表容器存在
    if (!chartContainer.value) {
      console.error('图表容器不存在')
      return
    }
    
    // 如果图表已存在，先销毁它
    if (myChart) {
      myChart.dispose()
      myChart = null
    }
    
    // 重新初始化图表
    myChart = echarts.init(chartContainer.value, 'dark')
    
    
    // 处理数据
    const { data, dayLineWithMetric } = processStockData()
    
    // 渲染图表
    renderChart(data, dayLineWithMetric)
  } catch (err) {
    handleError('刷新图表失败', err)
  }
}

// 处理股票数据计算
function processStockData() {
  // 分割数据
  let data = splitData(dayLine.value)
  
  // 计算交易点（买入卖出点）
  const { dayLineWithMetric,
    hourLineWithMetric,
    transactions: calculatedTransactions,
    backtestData: calculatedBacktestData
  } = calculateStock({
    dayLine: dayLine.value,
    hourLine: dayLine.value,
    ma: ma.value,
    buyConditions: buyConditions.value,
    sellConditions: sellConditions.value
  })
  console.log('计算出的交易点:', calculatedTransactions)
  console.log('交易点数量:', calculatedTransactions.length)
  
  // 更新交易数据，用于右侧栏显示
  transactions.value = calculatedTransactions
  // 更新回测数据，用于顶部统计栏显示
  backtestData.value = calculatedBacktestData
  
  // 添加交易点到图表标记中
  if (calculatedTransactions.length > 0) {
    calculatedTransactions.forEach((transaction, index) => {
      // 找到买入点在数据中的索引
      const buyIndex = dayLine.value.findIndex(item => item.time === transaction.buyTime)
      if (buyIndex !== -1) {
        data.trendStartPoints.push({
          name: `买入${index + 1}`,
          coord: [buyIndex, transaction.buyPrice],
          value: `买入: ${transaction.buyPrice}`,
          itemStyle: { color: '#00da3c' },
          symbol: 'pin',
          symbolSize: 30,
          label: {
            show: true,
            position: 'top',
            distance: 10,
            formatter: '买',
            fontSize: 12,
            color: '#fff',
            backgroundColor: '#00da3c',
            padding: 3,
            borderRadius: 3
          }
        })
      }
      // 找到卖出点在数据中的索引
      if (transaction.sellTime) {
        const sellIndex = dayLine.value.findIndex(item => item.time === transaction.sellTime)
        if (sellIndex !== -1) {
          const profitColor = transaction.profit > 0 ? '#00da3c' : '#ec0000'
          data.trendEndPoints.push({
            name: `卖出${index + 1}`,
            coord: [sellIndex, transaction.sellPrice],
            value: `卖出: ${transaction.sellPrice} 收益: ${transaction.profit?.toFixed(2)}%`,
            itemStyle: { color: '#ec0000' },
            symbol: 'pin',
            symbolSize: 30,
            label: {
              show: true,
              position: 'bottom',
              distance: 10,
              formatter: '卖',
              fontSize: 12,
              color: '#fff',
              backgroundColor: '#ec0000',
              padding: 3,
              borderRadius: 3
            }
          })
        }
      }
    })
  }
  
  return { data, dayLineWithMetric }
}

// 渲染图表
function renderChart(data, dayLineWithMetric) {
  // 设置图表选项
  const option = createChartOption(
    data, 
    dayLineWithMetric.maS, 
    dayLineWithMetric.maM, 
    dayLineWithMetric.maL, 
    dayLineWithMetric.maX, 
    formatDateYYYYMMDD, 
    formatDateMMDD
  )
  myChart.setOption(option)
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
    // 获取日线数据并计算目标趋势
    const response = await fetch(`/api/dayLine?code=${encodeURIComponent(props.stockCode)}`)
    dayLine.value = await response.json()
    loading.value = false
  } catch (err) {
    handleError('加载数据失败', err)
  }
}

// 趋势间隔监听已移除

// 监听股票代码变化
watch(() => props.stockCode, async (newCode, oldCode) => {
  if (newCode && newCode !== oldCode) {
    await loadStockData()
    await refreshChart()
  }
}, { immediate: true })

onMounted(async () => {
  try {
    await nextTick()
    window.addEventListener('resize', handleResize)
    
    // 给DOM足够的时间挂载
    setTimeout(() => {
      loadStockData()
    }, 300)
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