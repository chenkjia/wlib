<template>
  <div class="w-full h-full flex flex-col">
    <!-- 标签页头部 -->
    <div class="flex border-b" style="border-color: var(--border-light);">
      <button
        @click="activeTab = 'stocks'"
        :class="[
          'flex-1 px-4 py-3 text-sm font-medium transition-colors',
          activeTab === 'stocks' 
            ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        ]"
      >
        股票列表
      </button>
      <button
        @click="activeTab = 'tasks'"
        :class="[
          'flex-1 px-4 py-3 text-sm font-medium transition-colors',
          activeTab === 'tasks' 
            ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        ]"
      >
        任务列表
      </button>
    </div>

    <!-- 标签页内容 -->
    <div class="flex-1 overflow-hidden">
      <!-- 股票列表标签页 -->
      <div v-show="activeTab === 'stocks'" class="h-full flex flex-col p-3">
        <div class="flex flex-col h-full">
          <!-- 搜索框 -->
          <div class="relative mb-3">
            <div class="flex gap-2">
              <div class="relative flex-1">
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
          
          <!-- 过滤器 -->
          <div class="mb-3">
            <div class="flex gap-2 mb-2">
              <select
                v-model="focusFilter"
                @change="currentPage = 1; fetchStocks()"
                class="finance-input flex-1 text-sm"
              >
                <option value="all">全部关注</option>
                <option value="focused">重点关注</option>
                <option value="unfocused">非重点关注</option>
              </select>
              <select
                v-model="hourFocusFilter"
                @change="currentPage = 1; fetchStocks()"
                class="finance-input flex-1 text-sm"
              >
                <option value="all">全部小时线</option>
                <option value="focused">小时线关注</option>
                <option value="unfocused">非小时线关注</option>
              </select>
              <select
                v-model="starFilter"
                @change="currentPage = 1; fetchStocks()"
                class="finance-input flex-1 text-sm"
              >
                <option value="all">全部</option>
                <option value="starred">已星标</option>
                <option value="unstarred">未星标</option>
              </select>
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
          
          <!-- 股票列表 -->
          <div v-else-if="displayedStocks.length > 0" class="flex-grow overflow-y-auto">
            <!-- 表格头部 -->
            <div class="sticky top-0 border-b mb-3" style="background-color: var(--bg-card); border-color: var(--border-light);">
              <div class="grid grid-cols-4 gap-2 p-3 text-sm font-semibold" style="color: var(--text-secondary);">
                <div @click="toggleSort('code')" class="cursor-pointer flex items-center transition-colors" style="color: var(--text-secondary);" @mouseover="$event.target.style.color = 'var(--accent-500)'" @mouseout="$event.target.style.color = 'var(--text-secondary)'">
                  代码
                  <span v-if="sortField === 'code'" class="ml-1" style="color: var(--accent-500);">
                    {{ sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
                <div @click="toggleSort('name')" class="cursor-pointer flex items-center transition-colors" style="color: var(--text-secondary);" @mouseover="$event.target.style.color = 'var(--accent-500)'" @mouseout="$event.target.style.color = 'var(--text-secondary)'">
                  名称
                  <span v-if="sortField === 'name'" class="ml-1" style="color: var(--accent-500);">
                    {{ sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
                <div @click="toggleSort('focusedDays')" class="cursor-pointer flex items-center text-center transition-colors" style="color: var(--text-secondary);" @mouseover="$event.target.style.color = 'var(--accent-500)'" @mouseout="$event.target.style.color = 'var(--text-secondary)'">
                  关注天数
                  <span v-if="sortField === 'focusedDays'" class="ml-1" style="color: var(--accent-500);">
                    {{ sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
                <div @click="toggleSort('hourFocusedDays')" class="cursor-pointer flex items-center text-center transition-colors" style="color: var(--text-secondary);" @mouseover="$event.target.style.color = 'var(--accent-500)'" @mouseout="$event.target.style.color = 'var(--text-secondary)'">
                  小时关注天数
                  <span v-if="sortField === 'hourFocusedDays'" class="ml-1" style="color: var(--accent-500);">
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
                class="grid grid-cols-5 gap-2 p-3 text-sm cursor-pointer transition-all duration-200 border-b rounded-lg"
                :style="{
                  backgroundColor: selectedStockCode === stock.code ? 'var(--accent-400)' : 'transparent',
                  borderColor: 'var(--border-light)',
                  color: selectedStockCode === stock.code ? 'white' : 'var(--text-primary)'
                }"
              >
                <div class="font-medium" @click="selectStock(stock.code)">{{ stock.code }}</div>
                <div class="truncate" @click="selectStock(stock.code)">{{ stock.name }}</div>
                <div class="text-center font-medium" @click="selectStock(stock.code)">
                  <span :class="{
                    'finance-profit-positive': stock.focusedDays > 0,
                    'finance-profit-negative': stock.focusedDays < 0,
                    'finance-profit-neutral': stock.focusedDays === 0
                  }" :title="`日线关注天数: ${stock.focusedDays || 0}`">
                    {{ stock.focusedDays || 0 }}
                  </span>
                </div>
                <div class="text-center font-medium" @click="selectStock(stock.code)">
                  <span :class="{
                    'finance-profit-positive': stock.hourFocusedDays > 0,
                    'finance-profit-negative': stock.hourFocusedDays < 0,
                    'finance-profit-neutral': stock.hourFocusedDays === 0
                  }" :title="`小时线关注天数: ${stock.hourFocusedDays || 0}`">
                    {{ stock.hourFocusedDays || 0 }}
                  </span>
                </div>
                <div class="text-center" @click.stop="toggleStarStock(stock.code)">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto transition-colors" 
                    :fill="starredStocks.includes(stock.code) ? 'currentColor' : 'none'" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    :stroke-width="starredStocks.includes(stock.code) ? 0 : 1.5"
                    :style="{ color: selectedStockCode === stock.code ? 'white' : 'var(--accent-500)' }">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 分页控件 -->
          <div v-if="totalPages > 1" class="mt-auto pt-4 border-t flex items-center justify-between" style="border-color: var(--border-light);">
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
          
          <!-- 无结果 -->
          <div v-else class="flex-grow py-4 text-center text-gray-500 dark:text-gray-400">
            <p>没有找到匹配的股票</p>
          </div>
        </div>
      </div>

      <!-- 任务列表标签页 -->
      <div v-show="activeTab === 'tasks'" class="h-full">
        <TaskList
          :panelState="panelState"
          @useTaskParams="emit('useTaskParams', $event)"
          @changeViewStock="emit('changeViewStock',$event)"
          @changePanelState="emit('changePanelState', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import TaskList from './TaskList.vue'

// 定义 props 和 emits
const selectedStockCode = defineModel('selectedStockCode', { type: String, default: '' })
const panelState = defineModel('panelState', { type: String, default: 'normal' })

const emit = defineEmits(['useTaskParams', 'changeViewStock', 'changePanelState'])

// 标签页状态
const activeTab = ref('stocks')

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
    
    let url = `/api/stocks?page=${currentPage.value}&pageSize=${pageSize.value}`
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
      selectedStockCode.value = 'ETH'
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
/* 确保页面铺满屏幕 */
:deep(body), :deep(html) {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

/* 股票列表滚动区域 */
.overflow-y-auto {
  min-height: 200px;
  max-height: calc(100vh - 180px);
}
</style>