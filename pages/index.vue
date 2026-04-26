<template>
  <div class="w-full h-screen">
    <div class="flex flex-col md:flex-row h-full">
      <!-- 左侧股票列表 -->
      <div
        v-show="panelState!=='collapsed'"
        class="w-1/4 h-full"
        :class="[{ 'w-3/4': panelState === 'leftExpanded' }]"
      >
        <LeftPanel
          v-model:selectedStockCode="selectedStockCode"
          v-model:panelState="panelState"
          v-model:selectedDataSource="selectedDataSource"
          :ma="ma"
          :macd="macd"
          :kdj="kdj"
          :volumeMa="volumeMa"
          :bias="bias"
          :buyConditions="buyConditions"
          :sellConditions="sellConditions"
          :enabledIndicators="enabledIndicators"
          @useTaskParams="handleUseTaskParams"
          @changeViewStock="handleChangeViewStock"
          @changePanelState="changePanelState"
        />
      </div>
              <!-- 中间K线图 -->
      <div
        v-show="panelState!=='leftExpanded' && panelState!=='rightExpanded'"
        class="w-1/2 h-full"
        :class="[{ 'w-full': panelState === 'collapsed' }]"
      >
        <ChartPanel
          :stockCode="selectedStockCode"
          :dayLineWithMetric="dayLineWithMetric"
          :transactions="transactions"
          :simulatedBuyPoints="simulatedBuyPoints"
          :autoCalculateSignals="autoCalculateSignals"
          :backtestData="backtestData"
          :ma="ma"
          :buyConditions="buyConditions"
          :sellConditions="sellConditions"
          :focusData="chartFocusData"
          :enabledIndicators="enabledIndicators"
          @error="handleError"
        />
      </div>
      
      <!-- 右侧分析面板 -->
      <div
        class="w-1/4 h-full"
        :class="[{ 'w-3/4': panelState === 'rightExpanded' }]"
      >
        <RightPanel
          :panelState="panelState"
          :selectedStockCode="selectedStockCode"
          :dayLineWithMetric="dayLineWithMetric"
          v-model:ma="ma"
          v-model:macd="macd"
          v-model:kdj="kdj"
          v-model:volumeMa="volumeMa"
          v-model:bias="bias"
          v-model:buyConditions="buyConditions"
          v-model:sellConditions="sellConditions"
          v-model:enabledIndicators="enabledIndicators"
          v-model:autoCalculateSignals="autoCalculateSignals"
          :transactions="transactions"
          :simulatedBuyPoints="simulatedBuyPoints"
          @changePanelState="changePanelState"
          @calculation="handleCalculation"
          @useTaskParams="handleUseTaskParams"
          @changeViewStock="handleChangeViewStock"
          @focusChart="handleFocusChart"
          @updateSimulatedBuyPoints="handleUpdateSimulatedBuyPoints"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { calculateStock, calculateMetric } from '~/utils/chartUtils.js'
import LeftPanel from './left-panel/LeftPanel.vue'
import ChartPanel from './center-panel/ChartPanel.vue'
import RightPanel from './right-panel/RightPanel.vue'

const route = useRoute()

// 状态变量
const selectedStockCode = ref('')
const selectedDataSource = ref({
  value: 'alib',
  label: 'A股'
}) // 数据源状态
const panelState = ref('normal') // 面板状态：normal, leftExpanded, rightExpanded, collapsed
const dayLineWithMetric = ref([]) // 存储带有指标的日线数据
const chartFocusData = ref(null) // 图表聚焦数据
const simulatedBuyPoints = ref([]) // 买点模拟器命中点

// 从本地存储读取配置或使用默认值
const getLocalConfig = (key, defaultValue) => {
  if (process.client) {
    const stored = localStorage.getItem(`stock_config_${key}`)
    return stored ? JSON.parse(stored) : defaultValue
  }
  return defaultValue
}

const autoCalculateSignals = ref(getLocalConfig('autoCalculateSignals', true)) // 是否自动计算买卖点

const normalizeEnabledIndicators = (value) => {
  const indicators = Array.isArray(value) ? [...new Set(value)] : ['ma', 'macd']
  if (!indicators.includes('bias')) indicators.push('bias')
  return indicators
}

const normalizeVolumeMa = (value) => {
  const rawS = Number(value?.s)
  const rawL = Number(value?.l)
  const s = Math.max(2, Number.isFinite(rawS) ? rawS : 5)
  const l = Math.max(s, Number.isFinite(rawL) ? rawL : 10)
  return { s, l }
}

const enabledIndicators = ref(normalizeEnabledIndicators(getLocalConfig('enabledIndicators', ['ma', 'macd']))) // 启用的指标

// 保存配置到本地存储
const saveConfigToLocalStorage = () => {
  if (process.client) {
    localStorage.setItem(`stock_config_ma`, JSON.stringify(ma.value))
    localStorage.setItem(`stock_config_macd`, JSON.stringify(macd.value))
    localStorage.setItem(`stock_config_kdj`, JSON.stringify(kdj.value))
    localStorage.setItem(`stock_config_volumeMa`, JSON.stringify(volumeMa.value))
    localStorage.setItem(`stock_config_bias`, JSON.stringify(bias.value))
    localStorage.setItem(`stock_config_buyConditions`, JSON.stringify(buyConditions.value))
    localStorage.setItem(`stock_config_sellConditions`, JSON.stringify(sellConditions.value))
    localStorage.setItem(`stock_config_enabledIndicators`, JSON.stringify(enabledIndicators.value))
    localStorage.setItem(`stock_config_autoCalculateSignals`, JSON.stringify(autoCalculateSignals.value))
  }
}

// MA配置参数
const ma = ref(getLocalConfig('ma', {
  s: 7,  // 短期MA
  m: 50, // 中期MA
  l: 100, // 长期MA
  x: 200  // 超长期MA
}))

// MACD配置参数
const macd = ref(getLocalConfig('macd', {
  s: 12, // 快线
  l: 26, // 慢线
  d: 9 // 信号线
}))

// KDJ配置参数
const kdj = ref(getLocalConfig('kdj', { n: 9, k: 3, d: 3 }))
const volumeMa = ref(normalizeVolumeMa(getLocalConfig('volumeMa', { s: 5, l: 10 })))
const bias = ref(getLocalConfig('bias', { s: 6, m: 12, l: 24 }))

// 买入和卖出条件配置
const buyConditions = ref(getLocalConfig('buyConditions', [
  ['MAM_CROSS_UP_MAL']
]))

const sellConditions = ref(getLocalConfig('sellConditions', [
  ['MAM_CROSS_DOWN_MAL']
]))

// 交易数据和回测数据
const transactions = ref([])
const backtestData = ref({})
const chartLine = ref([]) // 存储图表数据

// 错误处理
function handleError(error) {
  console.error('组件错误:', error)
  // 可以在这里添加错误处理逻辑，如显示通知等
}

// 面板状态切换
function changePanelState(state) {
  panelState.value = state
}

// 处理计算事件
function handleCalculation(params) {
  // 保存配置到本地存储
  saveConfigToLocalStorage()
  
  if (params.type === 'page') {
    // 页内计算：手动触发重新计算交易数据
    calculateTransactions()
  } else {
    handleRemoteCalculation(params)
  }
}

// 远程计算处理
async function handleRemoteCalculation(params) {
  // 创建计算任务
  const task = {
    name: `回测_${selectedStockCode.value || ''}_${Date.now()}`,
    params: {
      type: params.type,
      ma: params.ma,
      macd: params.macd,
      kdj: params.kdj,
      volumeMa: params.volumeMa,
      bias: params.bias,
      buyConditions: params.buyConditions,
      sellConditions: params.sellConditions,
      enabledIndicators: params.enabledIndicators
    }
  }
  
  try {
    const { data, error } = await useFetch('/api/task/create', {
      method: 'POST',
      body: task
    })
    
    if (error.value) {
      throw new Error(error.value.message || '创建任务失败')
    }
  } catch (error) {
    console.error('创建计算任务失败:', error)
  }
}

// 处理聚焦图表事件
function handleFocusChart(focusData) {
  // 将聚焦数据传递给图表组件
  chartFocusData.value = focusData
}

function handleUpdateSimulatedBuyPoints(points) {
  simulatedBuyPoints.value = Array.isArray(points) ? points : []
}

// 处理使用任务参数
function handleUseTaskParams(params) {
  // 更新MA参数
  if (params.ma) {
    ma.value = { ...params.ma }
  }
  
  // 更新MACD参数
  if (params.macd) {
    macd.value = { ...params.macd }
  }
  
  // 更新KDJ参数
  if (params.kdj) {
    kdj.value = { ...params.kdj }
  }
  if (params.bias) {
    bias.value = { ...params.bias }
  }
  if (params.volumeMa) {
    volumeMa.value = normalizeVolumeMa(params.volumeMa)
  }
  
  // 更新买入条件
  if (params.buyConditions) {
    buyConditions.value = [...params.buyConditions]
  }
  
  // 更新卖出条件
  if (params.sellConditions) {
    sellConditions.value = [...params.sellConditions]
  }
  
  // 更新启用的指标
  if (params.enabledIndicators) {
    enabledIndicators.value = normalizeEnabledIndicators(params.enabledIndicators)
  }
  
  // 保存到本地存储
  saveConfigToLocalStorage()
}

// 加载股票数据
async function loadStockData() {
  if (!selectedStockCode.value) return
  
  try {
    const code = encodeURIComponent(selectedStockCode.value)
    const hourLineResponse = await fetch(`/api/hourLine?code=${code}`)
    const hourLine = await hourLineResponse.json()
    if (Array.isArray(hourLine) && hourLine.length > 0) {
      chartLine.value = hourLine
    } else {
      const dayLineResponse = await fetch(`/api/dayLine?code=${code}`)
      chartLine.value = await dayLineResponse.json()
    }
    
    // 自动计算开关关闭时，仅刷新指标，不计算买卖点
    if (autoCalculateSignals.value) {
      calculateTransactions()
    } else {
      calculateMetricsOnly()
    }
  } catch (err) {
    console.error('加载数据失败:', err)
  }
}

function calculateMetricsOnly() {
  const dayLine = chartLine.value
  dayLineWithMetric.value = calculateMetric(dayLine, {
    ma: ma.value,
    macd: macd.value,
    kdj: kdj.value,
    bias: bias.value,
    volumeMa: volumeMa.value,
    enabledIndicators: enabledIndicators.value
  })
  // 关闭自动计算时清空交易结果，避免沿用上一只股票的买卖点
  transactions.value = []
  backtestData.value = {}
}

// 计算交易数据
function calculateTransactions(type = 'page') {
  const {
    dayLineWithMetric: dlwm,
    transactions: calcedTransactions,
    backtestData: backtestDataResult
  } = calculateStock({
    dayLine: chartLine.value,
    hourLine: chartLine.value,
    ma: ma.value,
    macd: macd.value,
    kdj: kdj.value,
    volumeMa: volumeMa.value,
    bias: bias.value,
    buyConditions: buyConditions.value,
    sellConditions: sellConditions.value,
    enabledIndicators: enabledIndicators.value
  })
  
  // 更新交易数据和回测数据
  dayLineWithMetric.value = dlwm
  transactions.value = calcedTransactions
  backtestData.value = backtestDataResult
}

// 处理查看股票
function handleChangeViewStock(stockCode) {
  selectedStockCode.value = stockCode
}

// 监听股票代码变化
watch(() => selectedStockCode.value, async (newCode, oldCode) => {
  if (newCode && newCode !== oldCode) {
    simulatedBuyPoints.value = []
    await loadStockData()
  }
}, { immediate: true })

watch(() => autoCalculateSignals.value, (value) => {
  if (process.client) {
    localStorage.setItem(`stock_config_autoCalculateSignals`, JSON.stringify(Boolean(value)))
  }
})

// 监听数据源变化，重新加载数据


// 注释掉自动监听配置参数变化，改为手动触发计算
// watch([() => ma.value, () => macd.value, () => buyConditions.value, () => sellConditions.value], () => {
//   calculateTransactions()
// }, { deep: true })

onMounted(() => {
  // 检查URL中是否有股票代码参数
  const stockFromQuery = route.query.stock
  if (stockFromQuery && typeof stockFromQuery === 'string') {
    selectedStockCode.value = stockFromQuery
  } else {
    // 如果没有从URL中选择股票，根据数据源默认设置
    selectedStockCode.value = selectedDataSource.value.value === 'alib' ? 'sz.300454' : 'ETH'
  }
})
</script>

<style scoped>
/* 响应式布局样式 */
@media (max-width: 768px) {
  .h-screen {
    height: auto;
    min-height: 100vh;
  }
  
  .flex-col {
    height: auto !important;
  }
}

/* 确保页面铺满屏幕 */
:deep(body), :deep(html) {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}
</style>
