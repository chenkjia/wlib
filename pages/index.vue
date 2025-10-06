<template>
  <div class="w-full h-screen">
    <div class="flex flex-col md:flex-row h-full">
      <!-- 左侧股票列表 -->
      <div
        v-show="panelState!=='collapsed'"
        class="w-1/4 h-full"
        :class="[{'w-3/4': panelState === 'expanded'}]">
        <LeftPanel
          v-model:selectedStockCode="selectedStockCode"
          v-model:panelState="panelState"
          v-model:selectedDataSource="selectedDataSource"
          @useTaskParams="handleUseTaskParams"
          @changeViewStock="handleChangeViewStock"
          @changePanelState="changePanelState"
        />
      </div>
              <!-- 中间K线图 -->
      <div
        v-show="panelState!=='expanded'"
        class="w-1/2 h-full"
        :class="[{'w-full': panelState === 'collapsed'}]"
      >
        <ChartPanel
          :stockCode="selectedStockCode"
          :dayLineWithMetric="dayLineWithMetric"
          :transactions="transactions"
          :backtestData="backtestData"
          :ma="ma"
          :buyConditions="buyConditions"
          :sellConditions="sellConditions"
          @error="handleError"
        />
      </div>
      
      <!-- 右侧分析面板 -->
      <div
        class="w-1/4 h-full"
      >
        <RightPanel
          v-model:ma="ma"
          v-model:macd="macd"
          v-model:buyConditions="buyConditions"
          v-model:sellConditions="sellConditions"
          :transactions="transactions"
          @calculation="handleCalculation"
          @useTaskParams="handleUseTaskParams"
          @changeViewStock="handleChangeViewStock"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { calculateStock } from '~/utils/chartUtils.js'
import LeftPanel from './left-panel/LeftPanel.vue'
import ChartPanel from './center-panel/ChartPanel.vue'
import RightPanel from './right-panel/RightPanel.vue'

const route = useRoute()

// 状态变量
const selectedStockCode = ref('')
const selectedDataSource = ref({
  value: 'flib',
  label: '加密货币'
}) // 数据源状态
const panelState = ref('normal') // 面板状态：normal, expanded, collapsed
const dayLineWithMetric = ref([]) // 存储带有指标的日线数据

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
    localStorage.setItem(`stock_config_macd`, JSON.stringify(macd.value))
    localStorage.setItem(`stock_config_buyConditions`, JSON.stringify(buyConditions.value))
    localStorage.setItem(`stock_config_sellConditions`, JSON.stringify(sellConditions.value))
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
const dayLine = ref([]) // 存储日线数据

// 错误处理
function handleError(error) {
  console.error('组件错误:', error)
  // 可以在这里添加错误处理逻辑，如显示通知等
}

// 面板状态切换
function changePanelState(state) {
  panelState.value = state
}

// 计算处理函数
function handleCalculation(params) {
  // 保存配置到本地存储
  saveConfigToLocalStorage()
  
  if (params.type === 'page') {
    // 页内计算不需要特殊处理，组件会自动更新
  } else {
    handleRemoteCalculation(params)
  }
}

// 远程计算处理
async function handleRemoteCalculation(params) {
  // 创建计算任务
  const task = {
    name: params.type === 'star' ? '星标计算任务' : '全局计算任务',
    params: {
      type: params.type,
      ma: params.ma,
      macd: params.macd,
      buyConditions: params.buyConditions,
      sellConditions: params.sellConditions
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

// 处理使用任务参数
function handleUseTaskParams(params) {
  // 更新MA参数
  if (params.ma) {
    ma.value = { ...params.ma }
  }
  
  // 更新买入条件
  if (params.buyConditions) {
    buyConditions.value = [...params.buyConditions]
  }
  
  // 更新卖出条件
  if (params.sellConditions) {
    sellConditions.value = [...params.sellConditions]
  }
  
  // 保存到本地存储
  saveConfigToLocalStorage()
}

// 加载股票数据
async function loadStockData() {
  if (!selectedStockCode.value) return
  
  try {
    // 根据数据源选择API端点
    const apiEndpoint = selectedDataSource.value === 'alib' ? '/api/alib/dayLine' : '/api/dayLine'
    
    // 获取日线数据
    const response = await fetch(`${apiEndpoint}?code=${encodeURIComponent(selectedStockCode.value)}`)
    dayLine.value = await response.json()
    
    // 计算交易数据
    calculateTransactions()
  } catch (err) {
    console.error('加载数据失败:', err)
  }
}

// 计算交易数据
function calculateTransactions() {
  if (!dayLine.value.length) return
  
  // 计算交易点（买入卖出点）
  const { dayLineWithMetric: calculatedDayLineWithMetric,
    hourLineWithMetric,
    transactions: calculatedTransactions,
    backtestData: calculatedBacktestData
  } = calculateStock({
    dayLine: dayLine.value,
    hourLine: dayLine.value,
    ma: ma.value,
    macd: macd.value,
    buyConditions: buyConditions.value,
    sellConditions: sellConditions.value
  })
  
  // 更新交易数据和回测数据
  dayLineWithMetric.value = calculatedDayLineWithMetric
  transactions.value = calculatedTransactions
  backtestData.value = calculatedBacktestData
}

// 处理查看股票
function handleChangeViewStock(stockCode) {
  selectedStockCode.value = stockCode
}

// 监听股票代码变化
watch(() => selectedStockCode.value, async (newCode, oldCode) => {
  if (newCode && newCode !== oldCode) {
    await loadStockData()
  }
}, { immediate: true })

// 监听数据源变化，重新加载数据
watch(() => selectedDataSource.value, async (newDataSource, oldDataSource) => {
  if (newDataSource !== oldDataSource && selectedStockCode.value) {
    await loadStockData()
  }
})

// 监听 MA、MACD 和条件变化
watch([() => ma.value, () => macd.value, () => buyConditions.value, () => sellConditions.value], () => {
  calculateTransactions()
}, { deep: true })

onMounted(() => {
  // 检查URL中是否有股票代码参数
  const stockFromQuery = route.query.stock
  if (stockFromQuery && typeof stockFromQuery === 'string') {
    selectedStockCode.value = stockFromQuery
  } else {
    // 如果没有从URL中选择股票，根据数据源默认设置
    selectedStockCode.value = selectedDataSource.value.value === 'flib' ? 'ETH' : 'sh.600000'
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