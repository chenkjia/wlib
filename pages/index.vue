<template>
  <div class="w-full h-screen px-0 py-0">
    <div class="flex flex-col md:flex-row gap-6 h-full">
      <!-- 左侧股票列表 -->
      <div class="w-full md:w-1/3 lg:w-1/4 h-full flex flex-col">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col h-full">
          <h2 class="text-xl font-bold mb-4">股票列表</h2>
          
          <!-- 搜索框 -->
          <div class="mb-4 relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索股票代码或名称"
              class="w-full px-3 py-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
            <!-- 搜索图标 -->
            <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <!-- 搜索中指示器 -->
            <div v-if="searchQuery && searchQuery !== debouncedSearchQuery.value" class="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </div>
          
          <!-- 过滤器 -->
          <div class="mb-4 space-y-2">
            <div class="flex gap-2">
              <select
                v-model="focusFilter"
                @change="currentPage = 1; fetchStocks()"
                class="flex-1 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="all">全部关注</option>
                <option value="focused">重点关注</option>
                <option value="unfocused">非重点关注</option>
              </select>
              <select
                v-model="hourFocusFilter"
                @change="currentPage = 1; fetchStocks()"
                class="flex-1 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="all">全部小时线</option>
                <option value="focused">小时线关注</option>
                <option value="unfocused">非小时线关注</option>
              </select>
            </div>
          </div>
          
          <!-- 加载状态 -->
          <div v-if="stocksLoading" class="py-4 text-center">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            <p class="mt-2">加载中...</p>
          </div>
          
          <!-- 错误信息 -->
          <div v-else-if="stocksError" class="py-4 text-center text-red-500">
            <p>{{ stocksError }}</p>
            <button 
              @click="fetchStocks" 
              class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              重试
            </button>
          </div>
          
          <!-- 股票列表 -->
          <div v-else-if="displayedStocks.length > 0" class="flex-grow overflow-y-auto">
            <!-- 表格头部 -->
            <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mb-2">
              <div class="grid grid-cols-6 gap-1 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                <div @click="toggleSort('code')" class="cursor-pointer hover:text-blue-600 flex items-center">
                  代码
                  <span v-if="sortField === 'code'" class="ml-1">
                    {{ sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
                <div @click="toggleSort('name')" class="cursor-pointer hover:text-blue-600 flex items-center">
                  名称
                  <span v-if="sortField === 'name'" class="ml-1">
                    {{ sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
                <div @click="toggleSort('isFocused')" class="cursor-pointer hover:text-blue-600 flex items-center text-center">
                  重点关注
                  <span v-if="sortField === 'isFocused'" class="ml-1">
                    {{ sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
                <div @click="toggleSort('focusedDays')" class="cursor-pointer hover:text-blue-600 flex items-center text-center">
                  关注天数
                  <span v-if="sortField === 'focusedDays'" class="ml-1">
                    {{ sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
                <div @click="toggleSort('isHourFocused')" class="cursor-pointer hover:text-blue-600 flex items-center text-center">
                  小时线关注
                  <span v-if="sortField === 'isHourFocused'" class="ml-1">
                    {{ sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
                <div @click="toggleSort('hourFocusedDays')" class="cursor-pointer hover:text-blue-600 flex items-center text-center">
                  小时关注天数
                  <span v-if="sortField === 'hourFocusedDays'" class="ml-1">
                    {{ sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- 股票列表数据 -->
            <div class="space-y-1">
              <div 
                 v-for="stock in displayedStocks" 
                 :key="stock.code"
                @click="selectStock(stock.code)"
                :class="{
                  'bg-blue-50 dark:bg-blue-900': selectedStockCode === stock.code,
                  'hover:bg-gray-50 dark:hover:bg-gray-700': selectedStockCode !== stock.code
                }"
                class="grid grid-cols-6 gap-1 px-3 py-2 cursor-pointer transition-colors duration-150 rounded-md text-xs"
              >
                <div class="font-medium">{{ stock.code }}</div>
                <div class="truncate">{{ stock.name }}</div>
                <div class="text-center">
                  <span v-if="stock.isFocused" class="inline-block w-2 h-2 bg-green-500 rounded-full" title="重点关注"></span>
                  <span v-else class="inline-block w-2 h-2 bg-gray-300 rounded-full" title="非重点关注"></span>
                </div>
                <div class="text-center text-xs">
                  <span :class="{
                    'text-green-600': stock.focusedDays > 0,
                    'text-red-600': stock.focusedDays < 0,
                    'text-gray-400': stock.focusedDays === 0
                  }" :title="`日线关注天数: ${stock.focusedDays || 0}`">
                    {{ stock.focusedDays || 0 }}
                  </span>
                </div>
                <div class="text-center">
                  <span v-if="stock.isHourFocused" class="inline-block w-2 h-2 bg-blue-500 rounded-full" title="小时线关注"></span>
                  <span v-else class="inline-block w-2 h-2 bg-gray-300 rounded-full" title="非小时线关注"></span>
                </div>
                <div class="text-center text-xs">
                  <span :class="{
                    'text-green-600': stock.hourFocusedDays > 0,
                    'text-red-600': stock.hourFocusedDays < 0,
                    'text-gray-400': stock.hourFocusedDays === 0
                  }" :title="`关注小时数: ${stock.hourFocusedDays || 0}`">
                    {{ stock.hourFocusedDays || 0 }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 分页控件 -->
          <div v-if="totalPages > 1" class="mt-auto pt-3 border-t flex items-center justify-between">
              <div class="text-sm text-gray-500">
                共 {{ totalStocks }} 条，{{ currentPage }}/{{ totalPages }} 页
              </div>
              <div class="flex space-x-2">
                <button 
                  @click="changePage(currentPage - 1)" 
                  :disabled="currentPage <= 1"
                  :class="{
                    'opacity-50 cursor-not-allowed': currentPage <= 1,
                    'hover:bg-blue-600': currentPage > 1
                  }"
                  class="px-3 py-1 bg-blue-500 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  上一页
                </button>
                <button 
                  @click="changePage(currentPage + 1)" 
                  :disabled="currentPage >= totalPages"
                  :class="{
                    'opacity-50 cursor-not-allowed': currentPage >= totalPages,
                    'hover:bg-blue-600': currentPage < totalPages
                  }"
                  class="px-3 py-1 bg-blue-500 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  下一页
                </button>
              </div>
            </div>
          
          <!-- 无结果 -->
          <div v-else class="flex-grow py-4 text-center text-gray-500 dark:text-gray-400">
            <p>没有找到匹配的股票</p>
          </div>
        </div>
      </div>
      
      <!-- 右侧股票详情 -->
      <div class="w-full md:w-2/3 lg:w-3/4 h-full">
        <StockDetail 
          :stock-code="selectedStockCode || 'ETH'" 
          @error="handleStockDetailError"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import StockDetail from '~/pages/stock/components/StockDetail.vue'

// 防抖函数
function useDebounce(value, delay = 300) {
  const debouncedValue = ref(value)
  let timeout
  
  watch(
    () => value,
    (newValue) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        debouncedValue.value = newValue
      }, delay)
    }
  )
  
  return debouncedValue
}

const route = useRoute()

// 状态变量
const stocks = ref([])
const stocksLoading = ref(true)
const stocksError = ref('')
const searchQuery = ref('')
// 使用防抖处理搜索查询，延迟300毫秒
const debouncedSearchQuery = useDebounce(searchQuery, 300)
const selectedStockCode = ref('')

// 分页相关状态
const currentPage = ref(1)
const pageSize = ref(15)
const totalStocks = ref(0)
const totalPages = ref(1)

// 排序相关状态
const sortField = ref('code')
const sortOrder = ref('asc')

// 过滤器状态
const focusFilter = ref('all') // 重点关注过滤器：all, focused, unfocused
const hourFocusFilter = ref('all') // 小时线关注过滤器：all, focused, unfocused

// 当前显示的股票列表
const displayedStocks = computed(() => {
  return stocks.value
})



// 选择股票
function selectStock(code) {
  selectedStockCode.value = code
}

// 切换排序
function toggleSort(field) {
  if (sortField.value === field) {
    // 如果点击的是当前排序字段，切换排序方向
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // 如果点击的是新字段，设置为该字段并默认升序
    sortField.value = field
    sortOrder.value = 'asc'
  }
  // 重新获取数据
  fetchStocks()
}

// 处理股票详情组件的错误
function handleStockDetailError(error) {
  console.error('股票详情组件错误:', error)
  // 可以在这里添加错误处理逻辑，如显示通知等
}

// 切换页码
function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  
  // 从服务器获取新页的数据
  fetchStocks()
}

// 获取股票列表
async function fetchStocks() {
  try {
    stocksLoading.value = true
    stocksError.value = ''
    
    // 构建URL，包含搜索参数、排序参数和过滤参数
    let url = `/api/stocks?page=${currentPage.value}&pageSize=${pageSize.value}`
    if (debouncedSearchQuery.value) {
      url += `&search=${encodeURIComponent(debouncedSearchQuery.value)}`
    }
    url += `&sortField=${sortField.value}&sortOrder=${sortOrder.value}`
    
    // 添加过滤参数
    if (focusFilter.value !== 'all') {
      url += `&focusFilter=${focusFilter.value}`
    }
    if (hourFocusFilter.value !== 'all') {
      url += `&hourFocusFilter=${hourFocusFilter.value}`
    }
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    stocks.value = data.stocks
    totalStocks.value = data.total
    totalPages.value = data.totalPages
    
    // 如果列表不为空且没有选中股票，默认选择第一个
    if (stocks.value.length > 0 && !selectedStockCode.value) {
      selectedStockCode.value = stocks.value[0].code
    } else if (!selectedStockCode.value) {
      // 如果列表为空且没有选中股票，默认选择ETH
      selectedStockCode.value = 'ETH'
    }
    
    stocksLoading.value = false
  } catch (err) {
    console.error('获取股票列表失败:', err)
    stocksError.value = '获取股票列表失败: ' + err.message
    stocksLoading.value = false
  }
}

// 监听防抖后的搜索查询变化，重置分页并重新获取数据
watch(debouncedSearchQuery, () => {
  // 无论是否有搜索内容，都重置到第一页
  currentPage.value = 1
  
  // 重新从服务器获取数据
  fetchStocks()
})

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
  } else if (!selectedStockCode.value) {
    // 如果没有从URL或股票列表中选择股票，默认设置为ETH
    selectedStockCode.value = 'ETH'
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

/* 确保列表区域占满高度 */
.h-full {
  height: 100%;
}

.flex-grow {
  flex-grow: 1;
}

/* 股票列表滚动区域 */
.overflow-y-auto {
  min-height: 200px;
  max-height: calc(100vh - 180px);
}
</style>