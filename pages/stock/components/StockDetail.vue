<template>
  <div class="stock-detail">
    <div class="flex flex-col md:flex-row h-full">
      <!-- 中间K线图 -->
      <div :class="['chart-wrapper relative transition-all duration-300', isRightPanelCollapsed ? 'w-full' : 'w-full md:w-2/3']">
        <!-- 图表顶部交易统计组件 -->
        <TradeStats :transactions="transactions" />
        
        <div class="chart-container" ref="chartContainer"></div>
        
        <!-- 右侧面板收缩按钮 -->
        <button 
          @click="toggleRightPanel"
          class="absolute top-1/2 right-2 transform -translate-y-1/2 z-30 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-all duration-200"
          :title="isRightPanelCollapsed ? '展开右侧面板' : '收起右侧面板'"
        >
          <svg class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': isRightPanelCollapsed }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
      
      <!-- 右侧面板 -->
      <div 
        v-show="!isRightPanelCollapsed"
        class="w-full md:w-1/3 flex flex-col transition-all duration-300 h-full"
      >
        <RightPanel
          v-model:ma="ma"
          v-model:buyAlgorithm="buyAlgorithm"
          v-model:sellAlgorithm="sellAlgorithm"
          :transactions="transactions"
          @pageCalculation="handlePageCalculation"
          @globalCalculation="handleGlobalCalculation"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

import { calculateStock } from '~/utils/chartUtils.js'
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
    localStorage.setItem(`stock_config_buyAlgorithm`, JSON.stringify(buyAlgorithm.value))
    localStorage.setItem(`stock_config_sellAlgorithm`, JSON.stringify(sellAlgorithm.value))
  }
}

// MA配置参数（对象格式）
const ma = ref(getLocalConfig('ma', {
  s: 7, // 短期MA
  m: 50, // 中期MA
  l: 100, // 长期MA
  x: 200  // 超长期MA
}))

// 买入和卖出算法配置
const buyAlgorithm = ref(getLocalConfig('buyAlgorithm', [
  // 默认买入算法示例
  ['MAM_CROSS_UP_MAL']
]))

const sellAlgorithm = ref(getLocalConfig('sellAlgorithm', [
  // 默认卖出算法示例
  ['MAM_CROSS_DOWN_MAL']
]))


// 交易记录
const transactions = ref([])
const isRightPanelCollapsed = ref(false) // 右侧面板收缩状态，默认展开
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
function handlePageCalculation() {
  // 保存配置到本地存储
  saveConfigToLocalStorage()
  refreshChart()
}

// 全局计算处理函数
function handleGlobalCalculation() {
  // 保存配置到本地存储
  saveConfigToLocalStorage()
  console.log('执行全局计算')
  console.log({
    ma: ma.value,
    buyAlgorithm: buyAlgorithm.value,
    sellAlgorithm: sellAlgorithm.value
  })
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
  isRightPanelCollapsed.value = !isRightPanelCollapsed.value
  
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
    transactions: calculatedTransactions
  } = calculateStock({
    dayLine: dayLine.value,
    hourLine: dayLine.value,
    ma: ma.value,
    buyConditions: buyAlgorithm.value,
    sellConditions: sellAlgorithm.value
  })
  console.log('计算出的交易点:', calculatedTransactions)
  console.log('交易点数量:', calculatedTransactions.length)
  
  // 更新交易数据，用于右侧栏显示
  transactions.value = calculatedTransactions
  
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
    const response = await fetch(`/api/dayLine?code=${props.stockCode}`)
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