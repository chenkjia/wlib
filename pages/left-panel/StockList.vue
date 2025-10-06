<template>
  <div class="h-full flex flex-col">
    <!-- 搜索框 -->
    <div class="relative mb-3">
      <div class="flex gap-2 p-3">
        <div class="relative flex-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索股票代码或名称"
            class="finance-input w-full"
            style="padding-left: 2.5rem;"
            @keyup.enter="handleSearch"
          />
          <!-- 搜索图标 -->
          <div class="absolute left-3 top-1/2 transform -translate-y-1/2" style="color: var(--text-muted);">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <select
          v-model="starFilter"
          @change="currentPage = 1; fetchStocks()"
          class="finance-input flex-1 text-sm w-1/4"
        >
          <option value="all">全部</option>
          <option value="starred">已星标</option>
          <option value="unstarred">未星标</option>
        </select>
        <!-- 搜索按钮 -->
        <button
          @click="handleSearch"
          class="finance-btn-primary px-4 py-2 text-sm"
          :disabled="loading"
        >
          搜索
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
      <button 
        @click="fetchStocks" 
        class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        重试
      </button>
    </div>
    
    <!-- 股票列表 UTable -->
    <div v-else class="flex-grow flex flex-col min-h-0">
      <div class="flex-grow overflow-auto">
        <UTable 
          :data="displayedStocks" 
          :columns="columns"
          class="w-full"
          :ui="{
            wrapper: 'border border-gray-200 rounded-lg overflow-hidden',
            td: {
              base: 'p-2 border-b border-gray-100 text-sm',
              padding: 'px-3 py-2'
            },
            th: {
              base: 'text-left p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200',
              padding: 'px-3 py-2'
            }
          }"
        >
        <!-- 股票代码列 -->
        <template #code-cell="{ row }">
          <div 
            class="font-medium cursor-pointer hover:text-blue-600"
            :class="{ 'text-blue-600 font-bold': selectedStockCode === row.original.code }"
            @click="selectStock(row.original.code)"
          >
            {{ row.original.code }}
          </div>
        </template>
        
        <!-- 股票名称列 -->
        <template #name-cell="{ row }">
          <div 
            class="truncate cursor-pointer hover:text-blue-600"
            :class="{ 'text-blue-600 font-bold': selectedStockCode === row.original.code }"
            @click="selectStock(row.original.code)"
          >
            {{ row.original.name }}
          </div>
        </template>
        
        <!-- 星标列 -->
        <template #star-cell="{ row }">
          <div class="text-center" @click.stop="toggleStarStock(row.original.code)">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto transition-colors cursor-pointer hover:scale-110" 
              :fill="starredStocks.includes(row.original.code) ? 'currentColor' : 'none'" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              :stroke-width="starredStocks.includes(row.original.code) ? 0 : 1.5"
              :class="starredStocks.includes(row.original.code) ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        </template>
        
        <!-- 表头排序 -->
        <template #code-header>
          <div @click="toggleSort('code')" class="flex items-center">
            代码
            <span v-if="sortField === 'code'" class="ml-1 text-blue-500">
              {{ sortOrder === 'asc' ? '▲' : '▼' }}
            </span>
          </div>
        </template>
        
        <template #name-header>
          <div @click="toggleSort('name')" class="flex items-center">
            名称
            <span v-if="sortField === 'name'" class="ml-1 text-blue-500">
              {{ sortOrder === 'asc' ? '▲' : '▼' }}
            </span>
          </div>
        </template>
        
        
        <template #star-header>
          <div class="text-center">星标</div>
        </template>
        
        <!-- 空状态 -->
        <template #empty-state>
          <div class="py-4 text-center text-gray-500">
            <p>没有找到匹配的股票</p>
          </div>
        </template>
      </UTable>
      </div>
      
      <!-- 分页控件 -->
      <div v-if="totalPages > 1" class="mt-4 pt-4 border-t flex items-center justify-between flex-shrink-0" style="border-color: var(--border-light);">
        <div class="text-sm" style="color: var(--text-muted);">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页 ({{ totalStocks }} 条记录)
        </div>
        <div class="flex gap-3">
          <button 
            @click="changePage(currentPage - 1)" 
            :disabled="currentPage <= 1"
            :class="currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : 'finance-btn-primary'"
            class="px-4 py-2 text-sm rounded-lg transition-all"
          >
            上一页
          </button>
          <button 
            @click="changePage(currentPage + 1)" 
            :disabled="currentPage >= totalPages"
            :class="currentPage >= totalPages ? 'opacity-50 cursor-not-allowed' : 'finance-btn-primary'"
            class="px-4 py-2 text-sm rounded-lg transition-all"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

// 定义 props 和 emits
const props = defineProps({
  selectedDataSource: {
    type: Object,
    default: () => ({
      value: 'flib',
      label: '加密货币'
    })
  }
})

const selectedStockCode = defineModel('selectedStockCode', { type: String, default: '' })

// 股票相关状态
const stocks = ref([])
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const starredStocks = ref([])

// 分页相关状态
const currentPage = ref(1)
const pageSize = ref(15)
const totalStocks = ref(0)
const totalPages = ref(1)

// 排序相关状态
const sortField = ref('code')
const sortOrder = ref('asc')

// 过滤器状态
const focusFilter = ref('all')
const hourFocusFilter = ref('all')
const starFilter = ref('all')

// UTable 列配置
const columns = ref([
  {
    accessorKey: 'code',
    header: '代码',
    id: 'code'
  },
  {
    accessorKey: 'name',
    header: '名称',
    id: 'name',
    size: 100
  },
  {
    accessorKey: 'star',
    header: '星标',
    id: 'star'
  }
])

// 当前显示的股票列表
const displayedStocks = computed(() => {
  return stocks.value
})

// 选择股票
function selectStock(code) {
  selectedStockCode.value = code
}

// 切换股票星标状态
async function toggleStarStock(code) {
  try {
    const response = await fetch('/api/stocks/star', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        isStar: !starredStocks.value.includes(code)
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      const index = starredStocks.value.indexOf(code)
      if (index === -1) {
        starredStocks.value.push(code)
      } else {
        starredStocks.value.splice(index, 1)
      }
      localStorage.setItem('starredStocks', JSON.stringify(starredStocks.value))
    } else {
      console.error('更新星标状态失败:', result.message);
    }
  } catch (error) {
    console.error('更新星标状态出错:', error);
  }
}

// 切换排序
function toggleSort(field) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
  fetchStocks()
}

// 切换页码
function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchStocks()
}

// 获取股票列表
async function fetchStocks() {
  try {
    loading.value = true
    error.value = ''
    
    // 根据数据源选择不同的API端点
    const baseUrl = '/api/stocks'
    let url = `${baseUrl}?page=${currentPage.value}&pageSize=${pageSize.value}`
    if (searchQuery.value) {
      url += `&search=${encodeURIComponent(searchQuery.value)}`
    }
    url += `&sortField=${sortField.value}&sortOrder=${sortOrder.value}`
    
    if (focusFilter.value !== 'all') {
      url += `&focusFilter=${focusFilter.value}`
    }
    if (hourFocusFilter.value !== 'all') {
      url += `&hourFocusFilter=${hourFocusFilter.value}`
    }
    if (starFilter.value !== 'all') {
      url += `&starFilter=${starFilter.value}`
    }
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    stocks.value = data.stocks
    totalStocks.value = data.total
    totalPages.value = data.totalPages
    
    if (stocks.value.length > 0 && !selectedStockCode.value) {
      selectedStockCode.value = stocks.value[0].code
    } else if (!selectedStockCode.value) {
      selectedStockCode.value = props.selectedDataSource.value === 'flib' ? 'ETH' : 'sh.600000'
    }
    
    loading.value = false
  } catch (err) {
    console.error('获取股票列表失败:', err)
    error.value = '获取股票列表失败: ' + err.message
    loading.value = false
  }
}

// 手动搜索函数
function handleSearch() {
  currentPage.value = 1
  fetchStocks()
}

// 监听数据源变化
watch(() => props.selectedDataSource, (newDataSource) => {
  if (newDataSource) {
    currentPage.value = 1
    searchQuery.value = ''
    if (newDataSource.value === 'flib') {
      selectedStockCode.value = 'ETH'
    } else {
      selectedStockCode.value = 'sh.600000'
    }
    fetchStocks()
  }
}, { deep: true })

onMounted(async () => {
  fetchStocks()
  
  try {
    const response = await fetch('/api/stocks/starred');
    const result = await response.json();
    
    if (result.success && Array.isArray(result.data)) {
      starredStocks.value = result.data;
      localStorage.setItem('starredStocks', JSON.stringify(starredStocks.value));
    } else {
      const savedStarredStocks = localStorage.getItem('starredStocks');
      if (savedStarredStocks) {
        try {
          starredStocks.value = JSON.parse(savedStarredStocks);
        } catch (e) {
          console.error('解析星标股票数据失败:', e);
          starredStocks.value = [];
        }
      }
    }
  } catch (error) {
    console.error('获取星标股票列表失败:', error);
    const savedStarredStocks = localStorage.getItem('starredStocks');
    if (savedStarredStocks) {
      try {
        starredStocks.value = JSON.parse(savedStarredStocks);
      } catch (e) {
        console.error('解析星标股票数据失败:', e);
        starredStocks.value = [];
      }
    }
  }
})
</script>

<style scoped>
/* 移除不必要的样式，使用 UTable 的默认样式 */
</style>