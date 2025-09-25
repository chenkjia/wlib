<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center mb-2">
      <h4 class="font-medium text-gray-700">任务列表</h4>
      <button 
        @click="refresh" 
        class="px-2 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
        :disabled="loading"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" :class="{'animate-spin': loading}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        刷新
      </button>
    </div>
    
    <!-- 搜索和过滤 -->
    <div class="mb-3">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索任务名称"
          class="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <!-- 搜索图标 -->
        <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>
    
    <!-- 状态过滤 -->
    <div class="mb-3">
      <select
        v-model="statusFilter"
        @change="fetchTasks()"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">全部状态</option>
        <option value="pending">等待中</option>
        <option value="processing">进行中</option>
        <option value="completed">已完成</option>
        <option value="failed">失败</option>
      </select>
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
        @click="fetchTasks" 
        class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        重试
      </button>
    </div>
    
    <!-- Nuxt UI Table 任务列表 -->
    <div v-else>
      <UTable 
        :data="tasks" 
        :columns="columns"
        :loading="loading"
        class="w-full"
        :ui="{
          wrapper: 'border border-gray-200 rounded-lg overflow-hidden',
          td: {
            base: 'p-3 border-b border-gray-100',
            padding: 'px-4 py-3'
          },
          th: {
            base: 'text-left p-3 border-b border-gray-200 bg-gray-50',
            padding: 'px-4 py-3',
            color: 'text-gray-700 font-medium'
          }
        }"
      >
        <template #empty-state>
          <div class="py-4 text-center text-gray-500">
            <p>没有找到匹配的任务</p>
          </div>
        </template>
        
        <!-- 状态列自定义渲染 -->
        <template #status-cell="{ row }">
          <UBadge
            :color="getStatusColor(row.original.status)"
            :text="getStatusText(row.original.status)"
            size="sm"
          >
            {{ getStatusText(row.original.status) }}
          </UBadge>
        </template>
      </UTable>
      
      <!-- 分页控件 -->
      <div v-if="totalPages > 1" class="mt-4 pt-2 border-t flex items-center justify-between" style="border-color: var(--border-light);">
        <div class="text-sm text-gray-500">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页
        </div>
        <UPagination
          v-model="currentPage"
          :total="totalCount"
          :page-count="totalPages"
          :per-page="pageSize"
          :ui="{ wrapper: 'flex gap-1' }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useDebounce } from '@vueuse/core'

// 状态变量
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const error = ref(null)
const tasks = ref([])
const totalCount = ref(0)
const expandedTasks = ref([]) // 存储已展开的任务ID

// 计算属性
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))
const displayedTasks = computed(() => tasks.value)

// 表格列定义
const columns = ref([
  {
    accessorKey: 'name',
    header: '任务名称',
    id: 'name'
  },
  {
    accessorKey: 'status',
    header: '状态',
    id: 'status'
  }
])

// 防抖搜索
const debouncedSearch = useDebounce(searchQuery, 500)

// 监听搜索和页码变化
watch([debouncedSearch, currentPage], () => {
  fetchTasks()
})

// 获取任务列表
async function fetchTasks() {
  loading.value = true
  error.value = null
  
  try {
    const params = new URLSearchParams()
    params.append('page', currentPage.value.toString())
    params.append('pageSize', pageSize.value.toString())
    
    if (searchQuery.value) {
      params.append('name', searchQuery.value)
    }
    
    if (statusFilter.value) {
      params.append('status', statusFilter.value)
    }
    
    console.log('Fetching tasks with params:', params.toString())
    const response = await fetch(`/api/task?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error(`获取任务列表失败: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('Task data received:', data)
    
    // API返回的是data字段
    tasks.value = data.data || []
    totalCount.value = data.total || 0
  } catch (error) {
    console.error('获取任务列表错误:', error)
    error.value = error.message
  } finally {
    loading.value = false
  }
}

// 刷新任务列表 - 供外部调用
function refresh() {
  fetchTasks()
}

// 暴露方法给父组件
defineExpose({
  refresh
})

// 切换任务展开状态
function toggleTaskExpand(taskId) {
  const index = expandedTasks.value.indexOf(taskId)
  if (index === -1) {
    expandedTasks.value.push(taskId)
  } else {
    expandedTasks.value.splice(index, 1)
  }
}

// 切换任务页码
function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const statusMap = {
  'pending': {
    color: 'primary',
    text: '等待中'
  },
  'processing': {
    color: 'info',
    text: '进行中'
  },
  'completed': {
    color: 'success',
    text: '已完成'
  },
  'failed': {
    color: 'error',
    text: '失败'
  }
}
function getStatusColor(status) {
  return statusMap[status]?.color || 'neutral'
}
function getStatusText(status) {
  return statusMap[status]?.text || status
}

// 日期格式化函数
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 初始加载任务列表
onMounted(() => {
  fetchTasks()
})
</script>