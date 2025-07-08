<template>
  <div class="flex flex-col md:flex-row h-screen">
    <!-- 左侧股票列表 -->
    <div class="w-full md:w-1/4 p-4 bg-gray-50 border-r overflow-auto">
      <div class="mb-4">
        <h2 class="text-xl font-bold mb-4">股票列表</h2>
        <div class="relative">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索股票代码或名称" 
            class="w-full p-2 border rounded-md pl-8"
          />
          <div class="absolute left-2 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="stocksLoading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="stocksError" class="text-red-500 p-4 text-center">
        {{ stocksError }}
        <button @click="fetchStocks" class="mt-2 text-blue-500 underline">重试</button>
      </div>
      
      <!-- 无结果状态 -->
      <div v-else-if="filteredStocks.length === 0" class="text-gray-500 p-4 text-center">
        未找到匹配的股票
      </div>
      
      <!-- 股票列表 -->
      <div v-else class="divide-y">
        <div 
          v-for="stock in filteredStocks" 
          :key="stock.code"
          @click="selectStock(stock.code)"
          class="p-3 hover:bg-blue-50 cursor-pointer transition-colors duration-200 flex justify-between items-center"
          :class="{'bg-blue-100': selectedStockCode === stock.code}"
        >
          <div>
            <div class="font-medium">{{ stock.code }}</div>
            <div class="text-sm text-gray-600">{{ stock.name }}</div>
          </div>
          <div class="text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 右侧股票详情 -->
    <div v-if="selectedStockCode" class="w-full md:w-3/4 overflow-hidden">
      <StockDetail 
        :stock-code="selectedStockCode" 
        @error="handleStockDetailError"
      />
    </div>
    
    <!-- 未选择股票时的提示 -->
    <div v-else class="w-full md:w-3/4 flex items-center justify-center bg-gray-100">
      <div class="text-center p-8">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <h3 class="text-xl font-medium text-gray-700 mb-2">请选择股票</h3>
        <p class="text-gray-500">从左侧列表中选择一个股票以查看详细信息</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import StockDetail from '~/pages/stock/components/StockDetail.vue'

const route = useRoute()

// 状态变量
const stocks = ref([])
const stocksLoading = ref(true)
const stocksError = ref('')
const searchQuery = ref('')
const selectedStockCode = ref('')

// 过滤后的股票列表
const filteredStocks = computed(() => {
  if (!searchQuery.value) return stocks.value
  
  const query = searchQuery.value.toLowerCase()
  return stocks.value.filter(stock => 
    stock.code.toLowerCase().includes(query) || 
    stock.name.toLowerCase().includes(query)
  )
})

// 选择股票
function selectStock(code) {
  selectedStockCode.value = code
}

// 处理股票详情组件的错误
function handleStockDetailError(error) {
  console.error('股票详情组件错误:', error)
  // 可以在这里添加错误处理逻辑，如显示通知等
}

// 获取股票列表
async function fetchStocks() {
  try {
    stocksLoading.value = true
    stocksError.value = ''
    
    const response = await fetch('/api/stocks')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    stocks.value = data
    
    // 如果列表不为空且没有选中股票，默认选择第一个
    if (stocks.value.length > 0 && !selectedStockCode.value) {
      selectedStockCode.value = stocks.value[0].code
    }
    
    stocksLoading.value = false
  } catch (err) {
    console.error('获取股票列表失败:', err)
    stocksError.value = '获取股票列表失败: ' + err.message
    stocksLoading.value = false
  }
}

// 监听路由查询参数变化
watch(() => route.query.stock, (newStock) => {
  if (newStock && typeof newStock === 'string') {
    selectedStockCode.value = newStock
  }
})

onMounted(() => {
  fetchStocks()
  
  // 检查URL中是否有股票代码参数
  const stockFromQuery = route.query.stock
  if (stockFromQuery && typeof stockFromQuery === 'string') {
    selectedStockCode.value = stockFromQuery
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
}

/* 列表分隔线 */
.divide-y > * + * {
  border-top-width: 1px;
  border-top-style: solid;
  border-top-color: #e5e7eb;
}

/* 选中状态高亮 */
.bg-blue-100 {
  background-color: #dbeafe;
}
</style>