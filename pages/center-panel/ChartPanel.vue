<template>
  <div class="w-full flex flex-col h-full">
    <div class="chart-top-row px-3 pt-2 pb-1 border-b" style="border-color: var(--border-light);">
      <div class="chart-summary">
        <span class="summary-item">时间 {{ hoverTimeText }}</span>
        <span class="summary-item">开盘 {{ formatDisplayNumber(hoverBar?.open) }}</span>
        <span class="summary-item">收盘 {{ formatDisplayNumber(hoverBar?.close) }}</span>
        <span class="summary-item">最低 {{ formatDisplayNumber(hoverBar?.low) }}</span>
        <span class="summary-item">最高 {{ formatDisplayNumber(hoverBar?.high) }}</span>
        <span class="summary-item">成交量 {{ formatVolumeNumber(hoverBar?.volume) }}</span>
        <span class="summary-item" :class="profitRatioClass">盈亏比 {{ profitRatioText }}</span>
      </div>
      <div class="chart-tabs chart-tabs-main">
        <UButton
          v-for="t in mainChartTabs"
          :key="t.key"
          :label="t.label"
          :color="activeMainChart === t.key ? 'primary' : 'neutral'"
          :variant="activeMainChart === t.key ? 'solid' : 'soft'"
          size="xs"
          @click="activeMainChart = t.key"
        />
      </div>
    </div>
    
    <!-- 图表容器 -->
    <div class="chart-main-wrap flex-grow">
      <div v-if="showMainMaInfo" class="main-ma-summary">
        <span v-for="item in maHoverItems" :key="item.key" class="ma-item" :style="{ color: item.color }">
          {{ item.label }}: {{ item.value }}
        </span>
      </div>
      <div v-if="showVolumeSubInfo" class="sub-indicator-summary" :style="volumeSubStyle">
        <span v-for="item in volumeSubItems" :key="item.key" class="sub-item" :style="{ color: item.color }">
          {{ item.label }}: {{ item.value }}
        </span>
      </div>
      <div v-if="showSubIndicatorInfo" class="sub-indicator-summary" :style="subIndicatorStyle">
        <span v-for="item in subIndicatorItems" :key="item.key" class="sub-item" :style="{ color: item.color }">
          {{ item.label }}: {{ item.value }}
        </span>
      </div>
      <div class="chart-container" ref="chartContainer"></div>
    </div>
    
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
import { splitData, createChartOption, maLineColors } from './ChartUtils.js'
import { calculateMA, formatLineForChanlun } from '~/utils/chartUtils.js'

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
  simulatedBuyPoints: {
    type: Array,
    default: () => []
  },
  autoCalculateSignals: {
    type: Boolean,
    default: true
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
  },
  useFixedVolumeSubChart: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['error'])

// 响应式状态
const chartContainer = ref(null)
let myChart = null

// 新增：副图切换状态
const activeSubChart = ref(props.useFixedVolumeSubChart ? 'macd' : 'volume') // volume | macd | kdj | bias

// 主图切换状态
const activeMainChart = ref('kline') // kline | chanlun
const displayLine = ref([])
const hoverBar = ref(null)
const hoverDataIndex = ref(-1)

// 主图切换tabs
const mainChartTabs = [
  { key: 'kline', label: 'K线' },
  { key: 'chanlun', label: '缠论' }
]

const availableTabs = computed(() => {
  if (props.useFixedVolumeSubChart) {
    const tabs = []
    if (props.enabledIndicators.includes('macd')) tabs.push({ key: 'macd', label: 'MACD' })
    if (props.enabledIndicators.includes('kdj')) tabs.push({ key: 'kdj', label: 'KDJ' })
    if (props.enabledIndicators.includes('bias')) tabs.push({ key: 'bias', label: 'BIAS' })
    return tabs
  }
  const tabs = [{ key: 'volume', label: '成交量' }]
  if (props.enabledIndicators.includes('macd')) tabs.push({ key: 'macd', label: 'MACD' })
  if (props.enabledIndicators.includes('kdj')) tabs.push({ key: 'kdj', label: 'KDJ' })
  if (props.enabledIndicators.includes('bias')) tabs.push({ key: 'bias', label: 'BIAS' })
  return tabs
})

// 日期格式化函数
function formatDateYYYYMMDD(value) {
  const date = new Date(value)
  const hasHour = date.getHours() !== 0 || date.getMinutes() !== 0
  const dayPart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  if (!hasHour) return dayPart
  return `${dayPart} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function formatDateMMDD(value) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDisplayNumber(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '--'
  return n.toFixed(2)
}

function formatVolumeNumber(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '--'
  if (n >= 100000000) return `${(n / 100000000).toFixed(2)}亿`
  if (n >= 10000) return `${(n / 10000).toFixed(2)}万`
  return n.toFixed(0)
}

const hoverTimeText = computed(() => {
  const value = hoverBar.value?.time
  if (!value) return '--'
  return formatDateYYYYMMDD(value)
})

const profitRatio = computed(() => {
  const bar = hoverBar.value
  if (!bar) return null
  const open = Number(bar.open)
  const close = Number(bar.close)
  if (!Number.isFinite(open) || !Number.isFinite(close) || open === 0) return null
  return ((close - open) / open) * 100
})

const profitRatioText = computed(() => {
  const value = profitRatio.value
  if (!Number.isFinite(value)) return '--'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
})

const profitRatioClass = computed(() => {
  const value = profitRatio.value
  if (!Number.isFinite(value)) return 'text-gray-500'
  if (value > 0) return 'text-red-600'
  if (value < 0) return 'text-green-600'
  return 'text-gray-500'
})

const maHoverItems = computed(() => {
  const index = hoverDataIndex.value
  if (!Number.isFinite(index) || index < 0) return []
  const maConfig = props.ma || {}
  const metric = props.dayLineWithMetric || {}
  const mapping = [
    { key: 'maS', period: Number(maConfig.s), series: metric.maS || [] },
    { key: 'maM', period: Number(maConfig.m), series: metric.maM || [] },
    { key: 'maL', period: Number(maConfig.l), series: metric.maL || [] },
    { key: 'maX', period: Number(maConfig.x), series: metric.maX || [] }
  ]
  return mapping
    .filter(item => Number.isFinite(item.period) && item.period > 0)
    .map(item => {
      const value = Number(item.series[index])
      return {
        key: item.key,
        label: `${item.key}(${item.period})`,
        value: Number.isFinite(value) ? value.toFixed(2) : '--',
        color: maLineColors[item.key] || '#374151'
      }
    })
})

const showMainMaInfo = computed(() => {
  return activeMainChart.value === 'kline'
    && props.enabledIndicators.includes('ma')
    && maHoverItems.value.length > 0
})

const volumeSubItems = computed(() => {
  const index = hoverDataIndex.value
  if (!Number.isFinite(index) || index < 0) return []
  const metric = props.dayLineWithMetric || {}
  const getVal = (arr) => {
    const value = Number(Array.isArray(arr) ? arr[index] : undefined)
    return Number.isFinite(value) ? value : null
  }
  return [
    { key: 'vol', label: 'VOL', value: formatVolumeNumber(displayLine.value?.[index]?.volume), color: '#6b7280' },
    { key: 'volMaS', label: 'VOL-MA-S', value: formatVolumeNumber(getVal(metric.volumeMaS || [])), color: '#f59e0b' },
    { key: 'volMaL', label: 'VOL-MA-L', value: formatVolumeNumber(getVal(metric.volumeMaL || [])), color: '#3b82f6' }
  ]
})

const subIndicatorItems = computed(() => {
  const index = hoverDataIndex.value
  if (!Number.isFinite(index) || index < 0) return []
  const metric = props.dayLineWithMetric || {}
  const getVal = (arr) => {
    const value = Number(Array.isArray(arr) ? arr[index] : undefined)
    return Number.isFinite(value) ? value : null
  }
  if (activeSubChart.value === 'volume') {
    return [
      { key: 'vol', label: 'VOL', value: formatVolumeNumber(displayLine.value?.[index]?.volume), color: '#6b7280' },
      { key: 'volMaS', label: 'VOL-MA-S', value: formatDisplayNumber(getVal(metric.volumeMaS || [])), color: '#f59e0b' },
      { key: 'volMaL', label: 'VOL-MA-L', value: formatDisplayNumber(getVal(metric.volumeMaL || [])), color: '#3b82f6' }
    ]
  }
  if (activeSubChart.value === 'macd') {
    return [
      { key: 'dif', label: 'DIF', value: formatDisplayNumber(getVal(metric.dif || [])), color: '#da6ee8' },
      { key: 'dea', label: 'DEA', value: formatDisplayNumber(getVal(metric.dea || [])), color: '#39afe6' },
      { key: 'bar', label: 'BAR', value: formatDisplayNumber(getVal(metric.bar || [])), color: '#6b7280' }
    ]
  }
  if (activeSubChart.value === 'kdj') {
    return [
      { key: 'k', label: 'K', value: formatDisplayNumber(getVal(metric.kdjK || metric.k || [])), color: '#ffd166' },
      { key: 'd', label: 'D', value: formatDisplayNumber(getVal(metric.kdjD || metric.d || [])), color: '#06d6a0' },
      { key: 'j', label: 'J', value: formatDisplayNumber(getVal(metric.kdjJ || metric.j || [])), color: '#ef476f' }
    ]
  }
  if (activeSubChart.value === 'bias') {
    return [
      { key: 'biasS', label: 'BIAS-S', value: formatDisplayNumber(getVal(metric.biasS || [])), color: '#f59e0b' },
      { key: 'biasM', label: 'BIAS-M', value: formatDisplayNumber(getVal(metric.biasM || [])), color: '#3b82f6' },
      { key: 'biasL', label: 'BIAS-L', value: formatDisplayNumber(getVal(metric.biasL || [])), color: '#8b5cf6' }
    ]
  }
  return []
})

const showSubIndicatorInfo = computed(() => subIndicatorItems.value.length > 0)
const showVolumeSubInfo = computed(() => props.useFixedVolumeSubChart && volumeSubItems.value.length > 0)

const subIndicatorStyle = computed(() => ({
  left: '100px',
  top: props.useFixedVolumeSubChart ? '76%' : '74%'
}))

const volumeSubStyle = computed(() => ({
  left: '100px',
  top: '58%'
}))

function updateHoverBarByIndex(index) {
  const line = displayLine.value || []
  if (!Array.isArray(line) || line.length === 0) {
    hoverBar.value = null
    hoverDataIndex.value = -1
    return
  }
  if (!Number.isFinite(index)) {
    const fallbackIndex = line.length - 1
    hoverDataIndex.value = fallbackIndex
    hoverBar.value = line[fallbackIndex] || null
    return
  }
  const safeIndex = Math.max(0, Math.min(line.length - 1, Math.floor(index)))
  hoverDataIndex.value = safeIndex
  hoverBar.value = line[safeIndex] || null
}

function handleAxisPointerUpdate(event) {
  const axesInfo = Array.isArray(event?.axesInfo) ? event.axesInfo : []
  const info = axesInfo[0]
  if (!info) return
  const pointerDataIndex = Number(info.dataIndex)
  const line = displayLine.value || []
  if (!Array.isArray(line) || line.length === 0) return

  if (Number.isFinite(pointerDataIndex)) {
    updateHoverBarByIndex(pointerDataIndex)
    return
  }
  const pointerValue = info.value
  if (typeof pointerValue === 'number') {
    updateHoverBarByIndex(pointerValue)
    return
  }
  const index = line.findIndex(item => item?.time === pointerValue)
  if (index >= 0) updateHoverBarByIndex(index)
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
    myChart = echarts.init(chartContainer.value)
    
    const sourceLine = activeMainChart.value === 'chanlun'
      ? formatLineForChanlun(props.dayLineWithMetric.line || [])
      : (props.dayLineWithMetric.line || [])
    displayLine.value = sourceLine
    updateHoverBarByIndex(Number.POSITIVE_INFINITY)
    const chartMetric = {
      ...props.dayLineWithMetric,
      line: sourceLine
    }
    const data = splitData(sourceLine, props.transactions)
    renderChart(
      data, 
      chartMetric
    )
    myChart.on('updateAxisPointer', handleAxisPointerUpdate)
    myChart.getZr()?.on('globalout', () => updateHoverBarByIndex(Number.POSITIVE_INFINITY))
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
    props.ma,
    activeSubChart.value,
    props.simulatedBuyPoints,
    props.useFixedVolumeSubChart,
    activeMainChart.value
  )
  myChart.setOption(option)
}

function updateMaSeriesOnly() {
  if (!myChart || !props.enabledIndicators.includes('ma')) return
  const line = props.dayLineWithMetric?.line || []
  const close = line.map(item => item?.close)
  const showMaS = Number(props.ma?.s) > 0
  const showMaM = Number(props.ma?.m) > 0
  const showMaL = Number(props.ma?.l) > 0
  const showMaX = Number(props.ma?.x) > 0
  const maS = showMaS ? calculateMA(close, Number(props.ma?.s)) : []
  const maM = showMaM ? calculateMA(close, Number(props.ma?.m)) : []
  const maL = showMaL ? calculateMA(close, Number(props.ma?.l)) : []
  const maX = showMaX ? calculateMA(close, Number(props.ma?.x)) : []
  myChart.setOption({
    series: [
      { id: 'series-maS', data: maS },
      { id: 'series-maM', data: maM },
      { id: 'series-maL', data: maL },
      { id: 'series-maX', data: maX }
    ]
  })
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
    
    const zoomAxisIndex = props.useFixedVolumeSubChart ? [0, 1, 2] : [0, 1]

    // 更新图表的dataZoom
    myChart.setOption({
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: zoomAxisIndex,
          start: startPercent,
          end: endPercent
        },
        {
          type: 'slider',
          xAxisIndex: zoomAxisIndex,
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

// 监听数据变化，重新渲染图表（不包含 ma 参数，避免整图刷新）
watch([() => props.dayLineWithMetric, () => props.transactions, () => props.simulatedBuyPoints], async () => {
  await refreshChart()
})

// 仅在 MA 参数调整时更新 MA 系列，保留当前图表缩放和时间位置
watch(() => props.ma, () => {
  updateMaSeriesOnly()
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

// 监听主图切换
watch(() => activeMainChart.value, async () => {
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
  background-color: #ffffff;
}

.chart-main-wrap {
  position: relative;
}

.main-ma-summary {
  position: absolute;
  top: 38px;
  left: 100px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 12px;
  pointer-events: none;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.9);
}

.ma-item {
  white-space: nowrap;
}

.sub-indicator-summary {
  position: absolute;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 12px;
  pointer-events: none;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.9);
}

.sub-item {
  white-space: nowrap;
}

.chart-tabs {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.chart-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
  flex-wrap: wrap;
}

.chart-tabs-main {
  margin-left: auto;
  flex-shrink: 0;
}

.chart-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  color: #374151;
  font-size: 12px;
}

.summary-item {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
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
