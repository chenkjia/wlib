<template>
  <div class="w-full h-full flex flex-col">
    <div ref="chartContainer" class="chart-container flex-grow"></div>
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
import { createChartOption, splitData } from '~/pages/center-panel/ChartUtils.js'

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
  }
})

const chartContainer = ref(null)
const activeSubChart = ref('macd')
let chartInstance = null

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

function buildOption() {
  const line = props.lineWithMetric?.line || []
  const data = splitData(line, props.transactions)
  return createChartOption(
    data,
    props.lineWithMetric || { line: [] },
    formatBlindIndexDetail,
    formatBlindIndex,
    props.enabledIndicators,
    props.ma,
    activeSubChart.value,
    [],
    true
  )
}

function fullRenderChart() {
  if (!chartContainer.value || !chartInstance) return
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
  if (props.markers?.startTime) {
    lineData.push({
      name: '开始',
      xAxis: props.markers.startTime,
      lineStyle: { color: '#f59e0b', type: 'dashed', width: 1.2 },
      label: { show: true, formatter: '开始', color: '#f59e0b', backgroundColor: '#fff', padding: [1, 3], borderRadius: 2 }
    })
  }
  if (props.markers?.endTime) {
    lineData.push({
      name: '结束',
      xAxis: props.markers.endTime,
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

function handleResize() {
  if (chartInstance) chartInstance.resize()
}

watch(() => activeSubChart.value, () => {
  fullRenderChart()
  updateGuideLinesOnly()
})

watch(() => props.enabledIndicators, () => {
  if (!availableTabs.value.find(t => t.key === activeSubChart.value)) {
    activeSubChart.value = availableTabs.value[0]?.key || 'volume'
  }
  fullRenderChart()
  updateGuideLinesOnly()
}, { deep: true })

watch(
  [() => props.lineWithMetric, () => props.transactions, () => props.ma],
  () => {
    updateChartIncrementally()
  },
  { deep: true }
)

watch(() => props.markers, () => {
  updateGuideLinesOnly()
}, { deep: true })

onMounted(async () => {
  await nextTick()
  chartInstance = echarts.init(chartContainer.value)
  window.addEventListener('resize', handleResize)
  fullRenderChart()
  updateGuideLinesOnly()
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
  min-height: 460px;
  background: #fff;
}

.chart-tabs {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
