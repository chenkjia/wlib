<template>
  <div class="stock-detail">
    <div class="flex flex-col md:flex-row h-full">
      <!-- 中间K线图 -->
      <div :class="['chart-wrapper relative transition-all duration-300', isRightPanelCollapsed ? 'w-full' : 'w-full md:w-2/3']">
        <!-- 图表顶部控制面板已移除 -->
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
        class="w-full md:w-1/3 flex flex-col transition-all duration-300 bg-white shadow-md rounded-md overflow-hidden h-full"
      >
        <!-- 上半部分 - 使用独立组件 -->
        <div class="h-1/2">
          <RightPanelTop
            v-model:ma="ma"
            v-model:buyAlgorithm="buyAlgorithm"
            v-model:sellAlgorithm="sellAlgorithm"
            @pageCalculation="handlePageCalculation"
            @globalCalculation="handleGlobalCalculation"
          />
        </div>
        
        <!-- 下半部分 -->
        <div class="h-1/2 p-4">
          <div class="bg-white rounded-md p-2 h-full">
            <!-- 下半部分保持为空 -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

import { calculateStock } from '~/utils/chartUtils.js'

// 导入图表工具函数
import { 
  splitData,
  createChartOption 
} from './ChartUtils.js'

import RightPanelTop from './RightPanelTop.vue'

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
// MA配置参数（对象格式）
const ma = ref({
  s: 5, // 短期MA
  m: 10, // 中期MA
  l: 20, // 长期MA
  x: 60  // 超长期MA
})

// 买入和卖出算法配置
const buyAlgorithm = ref([
  // 默认买入算法示例
  []
])

const sellAlgorithm = ref([
  // 默认卖出算法示例
  []
])
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
  console.log({
    ma: ma.value,
    buyAlgorithm: buyAlgorithm.value,
    sellAlgorithm: sellAlgorithm.value
  })
}

// 全局计算处理函数
function handleGlobalCalculation() {
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

// 获取盈亏样式类
function getProfitClass(profit) {
  if (!profit && profit !== 0) return ''
  if (profit > 0) return 'text-green-600'
  if (profit < 0) return 'text-red-600'
  return 'text-orange-500'
}


// 颜色配置
const upColor = '#00da3c'
const downColor = '#ec0000'

// 刷新图表
async function refreshChart() {
  try {
    loading.value = true
    error.value = ''
    
    const startTime = performance.now()
    
    // 获取日线数据并计算目标趋势
    const response = await fetch(`/api/dayLine?code=${props.stockCode}`)
    let rawData = await response.json()
    
    perfMetrics.dataProcessTime = performance.now() - startTime
    const renderStart = performance.now()
    
    // 初始化图表
    await initChart(rawData)
    
    perfMetrics.renderTime = performance.now() - renderStart
    console.log('Performance metrics:', perfMetrics)
    
    loading.value = false
  } catch (err) {
    handleError('更新数据失败', err)
  }
}

// 初始化图表
async function initChart(rawData) {
  try {
    if (!myChart) {
      console.error('图表未初始化')
      return
    }
    
    // 分割数据
    let data = splitData(rawData)
    
    // 计算交易点（买入卖出点）
    const { dayLineWithMetric,
      hourLineWithMetric,
      transactions
    } = calculateStock({
      dayLine: rawData,
      hourLine: rawData,
      buyConditions: buyAlgorithm.value,
      sellConditions: sellAlgorithm.value
    })
    console.log('计算出的交易点:', transactions)
    console.log('交易点数量:', transactions.length)
    // 添加交易点到图表标记中
    if (transactions.length > 0) {
      transactions.forEach((transaction, index) => {
        // 找到买入点在数据中的索引
        const buyIndex = rawData.findIndex(item => item.time === transaction.buyTime)
        if (buyIndex !== -1) {
          data.trendStartPoints.push({
            name: `买入${index + 1}`,
            coord: [buyIndex, transaction.buyPrice],
            value: `买入\n${transaction.buyPrice}`,
            itemStyle: { color: '#00da3c' },
            symbol: 'triangle',
            symbolSize: 15
          })
        }
        
        // 找到卖出点在数据中的索引
        if (transaction.sellTime) {
          const sellIndex = rawData.findIndex(item => item.time === transaction.sellTime)
          if (sellIndex !== -1) {
            data.trendEndPoints.push({
              name: `卖出${index + 1}`,
              coord: [sellIndex, transaction.sellPrice],
              value: `卖出\n${transaction.sellPrice}\n收益: ${transaction.profit?.toFixed(2)}%`,
              itemStyle: { color: transaction.profit > 0 ? '#00da3c' : '#ec0000' },
              symbol: 'triangle',
              symbolRotate: 180,
              symbolSize: 15
            })
          }
        }
      })
    }
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

// 添加恢复机制
async function recoverFromError() {
  try {
    error.value = ''
    loading.value = true
    
    // 清理资源
    if (myChart) {
      myChart.dispose()
      myChart = null
    }
    
    // 等待一段时间
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 重新加载
    await loadStockData()
  } catch (err) {
    handleError('恢复失败', err)
  }
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
    
    // 增强检查逻辑
    let retryCount = 0
    const maxRetries = 3
    
    while (!chartContainer.value && retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 100))
      retryCount++
    }
    
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

// 趋势间隔监听已移除

// 监听股票代码变化
watch(() => props.stockCode, async (newCode, oldCode) => {
  if (newCode && newCode !== oldCode) {
    try {
      // 清理旧图表资源
      if (myChart) {
        myChart.dispose()
        myChart = null
      }
      
      await nextTick()
      
      // 更可靠的容器检查
      let attempts = 0
      while (!chartContainer.value && attempts < 5) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
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