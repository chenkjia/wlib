<template>
  <div class="h-full flex flex-col">
    <!-- 操作按钮 -->
    <div class="relative mb-3">
      <div class="flex gap-2 p-3">
        <!-- 刷新按钮 -->
        <button
          @click="fetchStarredStocks"
          class="finance-btn-primary px-4 py-2 text-sm"
          :disabled="loading"
        >
          刷新
        </button>
        <!-- 拉取数据按钮 -->
        <button
          @click="fetchStockData"
          class="finance-btn-secondary px-4 py-2 text-sm"
          :disabled="loading || fetchingData"
        >
          {{ fetchingData ? '拉取中...' : '拉取数据' }}
        </button>
        <!-- 计算按钮 -->
        <button
          @click="calculateBacktest"
          class="finance-btn-secondary px-4 py-2 text-sm"
          :disabled="loading || calculating || !hasStockData"
        >
          {{ calculating ? '计算中...' : '计算' }}
        </button>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="py-4 text-center">
      <div class="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      <p class="mt-2">加载中...</p>
    </div>
    
    <!-- 错误信息 -->
    <div v-else-if="error" class="py-4 text-center text-red-500">
      <p>{{ error }}</p>
      <button @click="fetchStarredStocks" class="mt-2 finance-btn-secondary px-4 py-2 text-sm">
        重试
      </button>
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="starredStocks.length === 0" class="py-8 text-center text-gray-500">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
      <p>暂无星标股票</p>
      <p class="text-sm mt-2">在股票列表中点击星标图标来添加星标股票</p>
    </div>
    
    <!-- 股票表格 -->
    <div v-else class="flex-1 overflow-y-auto">
      <StockResultTable 
        :stocks-result="formattedStocksResult"
        :panel-state="'normal'"
        @change-view-stock="selectStock"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import StockResultTable from './StockResultTable.vue'
import { calculateStock } from '~/utils/chartUtils.js'

// 定义 props 和 emits
const props = defineProps({
  selectedDataSource: {
    type: Object,
    default: () => ({
      value: 'alib',
      label: 'A股'
    })
  },
  // 算法参数
  ma: {
    type: Object,
    default: () => ({
      s: 5,
      m: 10,
      l: 20,
      x: 60
    })
  },
  macd: {
    type: Object,
    default: () => ({
      s: 12,
      l: 26,
      d: 9
    })
  },
  buyConditions: {
    type: Array,
    default: () => [['PRICE_GT_MAS']]
  },
  sellConditions: {
    type: Array,
    default: () => [['PRICE_LT_MAS']]
  }
})

const selectedStockCode = defineModel('selectedStockCode', { type: String, default: '' })

// 状态变量
const starredStocks = ref([])
const loading = ref(false)
const error = ref('')
const fetchingData = ref(false)
const calculating = ref(false)
const stockDataCache = ref({}) // 缓存股票日线数据
const backtestResults = ref({}) // 缓存回测结果

// 计算属性：是否有股票数据
const hasStockData = computed(() => {
  return Object.keys(stockDataCache.value).length > 0
})

// 计算属性：格式化为 StockResultTable 需要的数据结构
const formattedStocksResult = computed(() => {
  return starredStocks.value.map(stock => {
    const backtestResult = backtestResults.value[stock.code]
    
    if (backtestResult) {
      // 如果有回测结果，使用计算出的数据
      return {
        stock: stock.code,
        winRate: backtestResult.winRate || 0,
        dailyChange: backtestResult.dailyChange || 0,
        dailyChangeDiff: backtestResult.dailyChangeDiff || 0,
        dayLineDailyChange: backtestResult.dayLineDailyChange || 0,
        totalTrades: backtestResult.totalTrades || 0,
        profitTrades: backtestResult.profitTrades || 0,
        lossTrades: backtestResult.lossTrades || 0,
        daysDuration: backtestResult.daysDuration || 0,
        priceChange: backtestResult.priceChange || 0,
        maxDrawdown: backtestResult.maxDrawdown || 0,
        dayLineCount: backtestResult.dayLineCount || (stock.dayLine ? stock.dayLine.length : 0),
        dayLinePriceChange: backtestResult.dayLinePriceChange || 0,
        priceChangeDiff: backtestResult.priceChangeDiff || 0
      }
    } else {
      // 如果没有回测结果，使用默认值
      return {
        stock: stock.code,
        winRate: 0,
        dailyChange: 0,
        dailyChangeDiff: 0,
        dayLineDailyChange: 0,
        totalTrades: 0,
        profitTrades: 0,
        lossTrades: 0,
        daysDuration: 0,
        priceChange: 0,
        maxDrawdown: 0,
        dayLineCount: stock.dayLine ? stock.dayLine.length : 0,
        dayLinePriceChange: 0,
        priceChangeDiff: 0
      }
    }
  })
})

// 拉取股票数据
const fetchStockData = async () => {
  if (starredStocks.value.length === 0) {
    alert('请先添加星标股票')
    return
  }
  
  fetchingData.value = true
  error.value = ''
  
  try {
    const promises = starredStocks.value.map(async (stock) => {
      try {
        const response = await $fetch(`/api/dayLine?code=${stock.code}`)
        return { code: stock.code, data: response }
      } catch (err) {
        console.error(`获取股票 ${stock.code} 数据失败:`, err)
        return { code: stock.code, data: null, error: err.message }
      }
    })
    
    const results = await Promise.all(promises)
    
    // 更新缓存
    const newCache = {}
    let successCount = 0
    let errorCount = 0
    
    results.forEach(result => {
      if (result.data && result.data.length > 0) {
        newCache[result.code] = result.data
        successCount++
      } else {
        errorCount++
      }
    })
    
    stockDataCache.value = newCache
    
    if (successCount > 0) {
      alert(`成功拉取 ${successCount} 个股票的数据${errorCount > 0 ? `，${errorCount} 个失败` : ''}`)
    } else {
      alert('所有股票数据拉取失败')
    }
  } catch (err) {
    console.error('拉取股票数据失败:', err)
    error.value = '拉取股票数据失败'
    alert('拉取股票数据失败: ' + err.message)
  } finally {
    fetchingData.value = false
  }
}

// 计算回测数据
const calculateBacktest = async () => {
  if (Object.keys(stockDataCache.value).length === 0) {
    alert('请先拉取股票数据')
    return
  }
  
  calculating.value = true
  error.value = ''
  
  try {
    
    // 获取算法参数 - 使用从props传入的参数
    const algorithmParams = {
      ma: props.ma,
      macd: props.macd,
      buyConditions: props.buyConditions,
      sellConditions: props.sellConditions
    }
    
    const newResults = {}
    let successCount = 0
    
    // 对每个有数据的股票进行回测计算
    for (const [stockCode, dayLineData] of Object.entries(stockDataCache.value)) {
      try {
        if (!dayLineData || dayLineData.length === 0) {
          continue
        }
        
        // 执行回测计算
        const result = calculateStock({
          dayLine: dayLineData,
          hourLine: [], // 暂时不使用小时线数据
          enabledIndicators: algorithmParams.enabledIndicators || ['ma', 'macd'], // 添加enabledIndicators参数
          ...algorithmParams
        })
        
        newResults[stockCode] = result.backtestData
        successCount++
      } catch (err) {
        console.error(`计算股票 ${stockCode} 回测失败:`, err)
      }
    }
    
    backtestResults.value = newResults
    
    if (successCount > 0) {
      alert(`成功计算 ${successCount} 个股票的回测数据`)
    } else {
      alert('所有股票回测计算失败')
    }
  } catch (err) {
    console.error('计算回测数据失败:', err)
    error.value = '计算回测数据失败'
    alert('计算回测数据失败: ' + err.message)
  } finally {
    calculating.value = false
  }
}

// 选择股票
const selectStock = (code) => {
  selectedStockCode.value = code
}

// 切换星标状态
const toggleStarStock = async (code) => {
  try {
    const response = await fetch('/api/stocks/star', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code,
        isStar: false // 星标列表中只能取消星标
      })
    })
    
    const result = await response.json()
    
    if (!result.success) {
      alert(result.message || '操作失败')
      return
    }
    
    // 从列表中移除该股票
    const index = starredStocks.value.findIndex(stock => stock.code === code)
    if (index !== -1) {
      starredStocks.value.splice(index, 1)
    }

  } catch (error) {
    console.error('切换星标状态失败:', error)
  }
}

// 获取星标股票列表
const fetchStarredStocks = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await fetch('/api/stocks/starred')
    
    if (!response.ok) {
      throw new Error(`获取星标股票失败: ${response.status}`)
    }
    
    const result = await response.json()
    starredStocks.value = result.data || []
    
  } catch (err) {
    console.error('获取星标股票失败:', err)
    error.value = err.message || '获取星标股票失败'
  } finally {
    loading.value = false
  }
}

// 监听数据源变化
watch(() => props.selectedDataSource, () => {
  fetchStarredStocks()
}, { immediate: false })

// 组件挂载时获取数据
onMounted(() => {
  fetchStarredStocks()
})
</script>

<style scoped>
/* 继承全局样式 */
</style>