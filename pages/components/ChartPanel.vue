<template>
  <div class="w-full flex flex-col h-full">
    <!-- 图表顶部交易统计组件 -->
    <TradeStats :backtestData="backtestData" />
    
    <!-- 图表容器 -->
    <div class="chart-container flex-grow" ref="chartContainer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { calculateStock } from '~/utils/chartUtils.js'
import TradeStats from '~/components/TradeStats.vue'
import { splitData, createChartOption } from './ChartUtils.js'

const props = defineProps({
  stockCode: {
    type: String,
    required: true
  },
  ma: {
    type: Object,
    required: true
  },
  buyConditions: {
    type: Array,
    required: true
  },
  sellConditions: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['error'])

// 响应式状态
const chartContainer = ref(null)
const loading = ref(true)
const error = ref('')
const dayLine = ref([]) // 存储日线数据

// 交易记录和回测数据
const transactions = ref([])
const backtestData = ref({})
let myChart = null

// 日期格式化函数
function formatDateYYYYMMDD(value) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDateMMDD(value) {
  const date = new Date(value)
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

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
    ma: props.ma,
    buyConditions: props.buyConditions,
    sellConditions: props.sellConditions
  })
  
  // 更新交易数据和回测数据
  transactions.value = calculatedTransactions
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

// 监听股票代码变化
watch(() => props.stockCode, async (newCode, oldCode) => {
  if (newCode && newCode !== oldCode) {
    await loadStockData()
    await refreshChart()
  }
}, { immediate: true })

// 监听 MA 和条件变化
watch([() => props.ma, () => props.buyConditions, () => props.sellConditions], async () => {
  await refreshChart()
}, { deep: true })

// 窗口大小调整处理
const handleResize = () => {
  try {
    if (myChart) {
      myChart.resize()
    }
  } catch (err) {
    console.error('调整图表大小失败:', err)
  }
}

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
.chart-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  z-index: 10;
  position: relative;
}

@media (max-width: 768px) {
  .chart-container {
    height: 50vh;
  }
}
</style>