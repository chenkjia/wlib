<template>
  <div class="w-full flex flex-col h-full">
    <!-- 图表顶部交易统计组件 -->
    <TradeStats :backtestData="backtestData" />
    
    <!-- 图表容器 -->
    <div class="chart-container flex-grow" ref="chartContainer"></div>
    
    <!-- 底部副图切换标签（使用 Nuxt UI 的 UButton） -->
    <div class="chart-tabs px-3 py-2 border-t" style="border-color: var(--border-light);">
      <UButton
        v-for="t in availableTabs"
        :key="t.key"
        :label="t.label"
        :color="activeSubChart === t.key ? 'primary' : 'neutral'"
        :variant="activeSubChart === t.key ? 'solid' : 'soft'"
        size="xs"
        @click="activeSubChart = t.key"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import TradeStats from '~/components/TradeStats.vue'
import { splitData, createChartOption } from './ChartUtils.js'

const props = defineProps({
  stockCode: {
    type: String,
    required: true
  },
  dayLineWithMetric: {
    type: Object,
    required: true
  },
  transactions: {
    type: Array,
    required: true
  },
  backtestData: {
    type: Object,
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
  },
  focusData: {
    type: Object,
    default: null
  },
  enabledIndicators: {
    type: Array,
    default: () => ['ma', 'macd']
  }
})

const emit = defineEmits(['error'])

// 响应式状态
const chartContainer = ref(null)
let myChart = null

// 新增：副图切换状态
const activeSubChart = ref('volume') // volume | macd | kdj
const availableTabs = computed(() => {
  const tabs = [{ key: 'volume', label: '成交量' }]
  if (props.enabledIndicators.includes('macd')) tabs.push({ key: 'macd', label: 'MACD' })
  if (props.enabledIndicators.includes('kdj')) tabs.push({ key: 'kdj', label: 'KDJ' })
  return tabs
})

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
    
    const data = splitData(props.dayLineWithMetric.line, props.transactions)
    renderChart(
      data, 
      props.dayLineWithMetric
    )
  } catch (err) {
    handleError('刷新图表失败', err)
  }
}
// 处理股票数据计算


// 渲染图表
function renderChart(data, dayLineWithMetric) {
  // 设置图表选项
  const option = createChartOption(
    data, 
    dayLineWithMetric,
    formatDateYYYYMMDD, 
    formatDateMMDD,
    props.enabledIndicators,
    activeSubChart.value
  )
  myChart.setOption(option)
}

// 统一错误处理
function handleError(message, err) {
  console.error(`${message}:`, err)
  emit('error', err.message)
}

// 聚焦图表到指定范围
function focusChartToRange(focusData) {
  try {
    if (!myChart || !props.dayLineWithMetric?.data) return
    
    const { buyIndex, sellIndex } = focusData
    const dataLength = props.dayLineWithMetric.data.length
    
    // 计算显示范围，前后各200条数据
    const bufferSize = 100
    const startIndex = Math.max(0, buyIndex - bufferSize)
    const endIndex = Math.min(dataLength - 1, sellIndex + bufferSize)
    
    // 计算百分比
    const startPercent = (startIndex / dataLength) * 100
    const endPercent = ((endIndex + 1) / dataLength) * 100
    
    // 更新图表的dataZoom
    myChart.setOption({
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          start: startPercent,
          end: endPercent
        },
        {
          type: 'slider',
          xAxisIndex: [0, 1],
          start: startPercent,
          end: endPercent
        }
      ]
    })
    
    console.log(`聚焦图表: 买入索引${buyIndex}, 卖出索引${sellIndex}, 显示范围${startIndex}-${endIndex} (${startPercent.toFixed(1)}%-${endPercent.toFixed(1)}%)`)
  } catch (err) {
    handleError('聚焦图表失败', err)
  }
}

// 监听数据变化，重新渲染图表
watch([() => props.dayLineWithMetric, () => props.transactions, () => props.ma], async () => {
  await refreshChart()
}, { deep: true })

// 监听聚焦数据变化，调整图表显示范围
watch(() => props.focusData, (newFocusData) => {
  if (newFocusData && myChart) {
    focusChartToRange(newFocusData)
  }
}, { deep: true })

// 监听副图切换
watch(() => activeSubChart.value, async () => {
  await refreshChart()
})

// 监听指标开关变化，校准可用标签与当前选择
watch(() => props.enabledIndicators, async () => {
  const tabs = availableTabs.value
  if (!tabs.find(t => t.key === activeSubChart.value)) {
    activeSubChart.value = tabs[0]?.key || 'volume'
  }
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
    
    setTimeout(() => {
      refreshChart()
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
watch(
  () => props.enabledIndicators,
  async () => {
    await refreshChart()
  },
  { deep: true }
)
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  z-index: 10;
  position: relative;
}

.chart-tabs {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.tab-btn {
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  background-color: var(--primary-900);
  color: var(--primary-50);
  border: 1px solid var(--border-light);
}

.tab-btn.active {
  background-color: var(--primary-600);
  color: #fff;
  border-color: var(--primary-500);
}

@media (max-width: 768px) {
  .chart-container {
    height: 50vh;
  }
}
</style>