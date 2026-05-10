<template>
  <div class="w-full h-full flex flex-col">
    <div class="px-3 pt-2 pb-1">
      <div class="chart-summary">
        <span class="summary-item">时间 {{ hoverTimeText }}</span>
        <span class="summary-item">开盘 {{ formatDisplayNumber(hoverBar?.open) }}</span>
        <span class="summary-item">收盘 {{ formatDisplayNumber(hoverBar?.close) }}</span>
        <span class="summary-item">最低 {{ formatDisplayNumber(hoverBar?.low) }}</span>
        <span class="summary-item">最高 {{ formatDisplayNumber(hoverBar?.high) }}</span>
        <span class="summary-item">成交量 {{ formatVolumeNumber(hoverBar?.volume) }}</span>
        <span class="summary-item" :class="profitRatioClass">盈亏比 {{ profitRatioText }}</span>
      </div>
    </div>
    <div class="chart-main-wrap flex-grow">
      <div v-if="showMainMaInfo" class="main-ma-summary">
        <span v-for="item in maHoverItems" :key="item.key" class="ma-item" :style="{ color: item.color }">
          {{ item.label }}: {{ item.value }}
        </span>
      </div>
      <div v-if="showSubIndicatorInfo" class="sub-indicator-summary">
        <span v-for="item in subIndicatorItems" :key="item.key" class="sub-item" :style="{ color: item.color }">
          {{ item.label }}: {{ item.value }}
        </span>
      </div>
      <div ref="chartContainer" class="chart-container"></div>
    </div>
    <div class="chart-tabs px-3 py-2 border-t border-gray-200">
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
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { createChartOption, splitData, maLineColors } from '~/pages/center-panel/ChartUtils.js'

const props = defineProps({
  lineWithMetric: {
    type: Object,
    default: () => ({ line: [] })
  },
  transactions: {
    type: Array,
    default: () => []
  },
  enabledIndicators: {
    type: Array,
    default: () => ['ma', 'macd']
  },
  ma: {
    type: Object,
    default: () => ({ s: 24, m: 60, l: 120, x: 250 })
  },
  markers: {
    type: Object,
    default: () => ({})
  },
  useRealDate: {
    type: Boolean,
    default: false
  },
  initialFocusRange: {
    type: Object,
    default: null
  }
})

const chartContainer = ref(null)
const activeSubChart = ref('macd')
let chartInstance = null
const hasAppliedInitialFocus = ref(false)
const hoverBar = ref(null)
const hoverDataIndex = ref(-1)

const availableTabs = computed(() => {
  const tabs = []
  if (props.enabledIndicators.includes('macd')) tabs.push({ key: 'macd', label: 'MACD' })
  if (props.enabledIndicators.includes('kdj')) tabs.push({ key: 'kdj', label: 'KDJ' })
  if (props.enabledIndicators.includes('bias')) tabs.push({ key: 'bias', label: 'BIAS' })
  return tabs
})

const lineIndexMap = computed(() => {
  const map = new Map()
  const line = props.lineWithMetric?.line || []
  line.forEach((item, index) => {
    map.set(new Date(item.time).getTime(), index + 1)
  })
  return map
})

function formatBlindIndex(value) {
  const index = lineIndexMap.value.get(new Date(value).getTime())
  return index ? String(index) : ''
}

function formatBlindIndexDetail(value) {
  const index = lineIndexMap.value.get(new Date(value).getTime())
  return index ? `第${index}根K线` : ''
}

function formatRealDate(value) {
  const date = new Date(value)
  if (isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatRealDateDetail(value) {
  const date = new Date(value)
  if (isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
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
  return props.useRealDate ? formatRealDateDetail(value) : formatBlindIndexDetail(value)
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
  const metric = props.lineWithMetric || {}
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
  return props.enabledIndicators.includes('ma') && maHoverItems.value.length > 0
})

const subIndicatorItems = computed(() => {
  const index = hoverDataIndex.value
  if (!Number.isFinite(index) || index < 0) return []
  const metric = props.lineWithMetric || {}
  const getVal = (arr) => {
    const value = Number(Array.isArray(arr) ? arr[index] : undefined)
    return Number.isFinite(value) ? value : null
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

function updateHoverBarByIndex(index) {
  const line = props.lineWithMetric?.line || []
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
  if (Number.isFinite(pointerDataIndex)) {
    updateHoverBarByIndex(pointerDataIndex)
    return
  }
  const pointerValue = info.value
  if (typeof pointerValue === 'number') {
    updateHoverBarByIndex(pointerValue)
    return
  }
  const line = props.lineWithMetric?.line || []
  const index = line.findIndex(item => item?.time === pointerValue)
  if (index >= 0) updateHoverBarByIndex(index)
}

function buildOption() {
  const line = props.lineWithMetric?.line || []
  const data = splitData(line, props.transactions)
  const labelFormatter = props.useRealDate ? formatRealDateDetail : formatBlindIndexDetail
  const axisLabelFormatter = props.useRealDate ? formatRealDate : formatBlindIndex
  return createChartOption(
    data,
    props.lineWithMetric || { line: [] },
    labelFormatter,
    axisLabelFormatter,
    props.enabledIndicators,
    props.ma,
    activeSubChart.value,
    [],
    true
  )
}

function getCurrentZoomWindow() {
  if (!chartInstance) return null
  const currentOption = chartInstance.getOption?.()
  const zoom = Array.isArray(currentOption?.dataZoom) ? currentOption.dataZoom[0] : null
  const start = Number(zoom?.start)
  const end = Number(zoom?.end)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  return { start, end }
}

function fullRenderChart() {
  if (!chartContainer.value || !chartInstance) return
  const zoomWindow = getCurrentZoomWindow()
  const option = buildOption()
  if (Array.isArray(option?.xAxis)) {
    for (let i = 1; i < option.xAxis.length; i++) {
      option.xAxis[i] = {
        ...option.xAxis[i],
        axisLabel: {
          ...(option.xAxis[i]?.axisLabel || {}),
          show: false
        }
      }
    }
  }
  if (zoomWindow && Array.isArray(option?.dataZoom)) {
    option.dataZoom = option.dataZoom.map((item) => ({
      ...item,
      start: zoomWindow.start,
      end: zoomWindow.end
    }))
  }
  chartInstance.setOption(option, { notMerge: true, lazyUpdate: true })
}

function updateIndicatorSeriesOnly() {
  if (!chartInstance) return
  const metric = props.lineWithMetric || {}
  const categoryLength = Array.isArray(metric.line) ? metric.line.length : 0
  chartInstance.setOption({
    series: [
      { id: 'series-maS', data: metric.maS || [] },
      { id: 'series-maM', data: metric.maM || [] },
      { id: 'series-maL', data: metric.maL || [] },
      { id: 'series-maX', data: metric.maX || [] },
      { id: 'series-vol-ma-s', data: metric.volumeMaS || [] },
      { id: 'series-vol-ma-l', data: metric.volumeMaL || [] },
      { id: 'series-macd-dif', data: metric.dif || [] },
      { id: 'series-macd-dea', data: metric.dea || [] },
      { id: 'series-macd-bar', data: metric.bar || [] },
      { id: 'series-macd-bottom-dev', data: metric.macdDeviations?.bottomPoints || [] },
      { id: 'series-macd-top-dev', data: metric.macdDeviations?.topPoints || [] },
      { id: 'series-kdj-k', data: metric.k || [] },
      { id: 'series-kdj-d', data: metric.d || [] },
      { id: 'series-kdj-j', data: metric.j || [] },
      { id: 'series-bias-s', data: metric.biasS || [] },
      { id: 'series-bias-m', data: metric.biasM || [] },
      { id: 'series-bias-l', data: metric.biasL || [] },
      { id: 'series-bias-zero', data: Array.from({ length: categoryLength }).map(() => 0) }
    ]
  })
}

function updateGuideLinesOnly() {
  if (!chartInstance) return
  const lineData = []
  const line = props.lineWithMetric?.line || []
  const lineByTime = new Map(line.map(item => [item.time, item]))

  // 交易点引导线：蓝色虚线，买在下方，卖在上方
  for (const tx of (props.transactions || [])) {
    const buyLine = lineByTime.get(tx.buyTime)
    const sellLine = lineByTime.get(tx.sellTime)
    const buyPrice = Number(tx.buyPrice)
    const sellPrice = Number(tx.sellPrice)
    if (buyLine && Number.isFinite(buyPrice)) {
      const buyLow = Number(buyLine.low)
      const buyLineTopY = Number.isFinite(buyLow) ? buyLow * 0.995 : buyPrice * 0.995
      const buyLabelY = Number.isFinite(buyLow) ? buyLow * 0.97 : buyPrice * 0.97
      lineData.push([
        {
          coord: [tx.buyTime, buyLineTopY],
          lineStyle: { color: '#2563eb', type: 'dashed', width: 1.2 }
        },
        {
          coord: [tx.buyTime, buyLabelY],
          label: { show: true, formatter: '买', color: '#ffffff', backgroundColor: '#2563eb', padding: [1, 4], borderRadius: 2 }
        }
      ])
    }
    if (sellLine && Number.isFinite(sellPrice)) {
      const sellHigh = Number(sellLine.high)
      const sellLineBottomY = Number.isFinite(sellHigh) ? sellHigh * 1.005 : sellPrice * 1.005
      const sellLabelY = Number.isFinite(sellHigh) ? sellHigh * 1.03 : sellPrice * 1.03
      lineData.push([
        {
          coord: [tx.sellTime, sellLineBottomY],
          lineStyle: { color: '#2563eb', type: 'dashed', width: 1.2 }
        },
        {
          coord: [tx.sellTime, sellLabelY],
          label: { show: true, formatter: '卖', color: '#ffffff', backgroundColor: '#2563eb', padding: [1, 4], borderRadius: 2 }
        }
      ])
    }
  }

  if (typeof props.markers?.startIndex === 'number' && Number.isFinite(props.markers.startIndex)) {
    lineData.push({
      name: '开始',
      xAxis: props.markers.startIndex,
      lineStyle: { color: '#f59e0b', type: 'dashed', width: 1.2 },
      label: { show: true, formatter: '开始', color: '#f59e0b', backgroundColor: '#fff', padding: [1, 3], borderRadius: 2 }
    })
  }
  if (typeof props.markers?.endIndex === 'number' && Number.isFinite(props.markers.endIndex)) {
    lineData.push({
      name: '结束',
      xAxis: props.markers.endIndex,
      lineStyle: { color: '#f59e0b', type: 'dashed', width: 1.2 },
      label: { show: true, formatter: '结束', color: '#f59e0b', backgroundColor: '#fff', padding: [1, 3], borderRadius: 2 }
    })
  }
  if (typeof props.markers?.currentPrice === 'number' && Number.isFinite(props.markers.currentPrice)) {
    lineData.push({
      name: '当前价',
      yAxis: props.markers.currentPrice,
      lineStyle: { color: '#ef4444', type: 'dashed', width: 1.2 },
      label: {
        show: true,
        formatter: `当前 ${props.markers.currentPrice.toFixed(2)}`,
        color: '#ef4444',
        backgroundColor: '#fff',
        padding: [1, 3],
        borderRadius: 2
      }
    })
  }
  if (typeof props.markers?.positionPrice === 'number' && Number.isFinite(props.markers.positionPrice)) {
    lineData.push({
      name: '持仓价',
      yAxis: props.markers.positionPrice,
      lineStyle: { color: '#f59e0b', type: 'dashed', width: 1.2 },
      label: {
        show: true,
        formatter: `持仓 ${props.markers.positionPrice.toFixed(2)}`,
        color: '#f59e0b',
        backgroundColor: '#fff',
        padding: [1, 3],
        borderRadius: 2
      }
    })
  }
  chartInstance.setOption({
    series: [
      {
        id: 'series-kline',
        markLine: {
          symbol: 'none',
          silent: true,
          animation: false,
          data: lineData
        }
      }
    ]
  })
}

function updateChartIncrementally() {
  if (!chartInstance) return
  const option = buildOption()
  if (Array.isArray(option?.xAxis)) {
    for (let i = 1; i < option.xAxis.length; i++) {
      option.xAxis[i] = {
        ...option.xAxis[i],
        axisLabel: {
          ...(option.xAxis[i]?.axisLabel || {}),
          show: false
        }
      }
    }
  }
  chartInstance.setOption(
    {
      xAxis: option.xAxis,
      series: option.series
    },
    {
      notMerge: false,
      replaceMerge: ['series', 'xAxis'],
      lazyUpdate: true
    }
  )
  updateGuideLinesOnly()
}

function applyInitialFocusIfNeeded(force = false) {
  if (!chartInstance) return
  if (!props.initialFocusRange) return
  if (hasAppliedInitialFocus.value && !force) return
  const line = props.lineWithMetric?.line || []
  const length = line.length
  if (length <= 1) return

  const rawStart = Number(props.initialFocusRange.startIndex)
  const rawEnd = Number(props.initialFocusRange.endIndex)
  if (!Number.isFinite(rawStart) || !Number.isFinite(rawEnd)) return

  const maxIndex = length - 1
  const startIndex = Math.max(0, Math.min(maxIndex, Math.floor(rawStart)))
  const endIndex = Math.max(startIndex + 1, Math.min(maxIndex, Math.floor(rawEnd)))
  const start = (startIndex / maxIndex) * 100
  const end = (endIndex / maxIndex) * 100

  chartInstance.setOption({
    dataZoom: [
      { start, end },
      { start, end }
    ]
  })
  hasAppliedInitialFocus.value = true
}

function handleResize() {
  if (chartInstance) chartInstance.resize()
}

watch(() => activeSubChart.value, () => {
  fullRenderChart()
  updateGuideLinesOnly()
  applyInitialFocusIfNeeded()
})

watch(() => props.enabledIndicators, () => {
  if (!availableTabs.value.find(t => t.key === activeSubChart.value)) {
    activeSubChart.value = availableTabs.value[0]?.key || 'volume'
  }
  fullRenderChart()
  updateGuideLinesOnly()
  applyInitialFocusIfNeeded()
}, { deep: true })

watch(
  [() => props.lineWithMetric, () => props.transactions, () => props.ma],
  () => {
    updateChartIncrementally()
    updateHoverBarByIndex(Number.POSITIVE_INFINITY)
  },
  { deep: true }
)

watch(() => props.markers, () => {
  updateGuideLinesOnly()
}, { deep: true })

watch(() => props.initialFocusRange, () => {
  hasAppliedInitialFocus.value = false
  applyInitialFocusIfNeeded(true)
}, { deep: true })

onMounted(async () => {
  await nextTick()
  chartInstance = echarts.init(chartContainer.value)
  window.addEventListener('resize', handleResize)
  fullRenderChart()
  updateHoverBarByIndex(Number.POSITIVE_INFINITY)
  chartInstance.on('updateAxisPointer', handleAxisPointerUpdate)
  chartInstance.getZr()?.on('globalout', () => updateHoverBarByIndex(Number.POSITIVE_INFINITY))
  updateGuideLinesOnly()
  applyInitialFocusIfNeeded(true)
})

onUnmounted(() => {
  if (chartInstance) chartInstance.dispose()
  chartInstance = null
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  min-height: 460px;
  background: #fff;
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
  top: 76%;
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

.sub-item {
  white-space: nowrap;
}

.chart-tabs {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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
</style>
