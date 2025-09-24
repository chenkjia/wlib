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
    
    <!-- 任务列表 -->
    <div v-else-if="displayedTasks.length > 0" class="space-y-1">
      <div 
        v-for="task in displayedTasks" 
        :key="task._id"
        class="p-3 text-sm border-b rounded-lg hover:bg-gray-50"
        style="border-color: var(--border-light);"
      >
        <div class="flex justify-between items-center cursor-pointer" @click="toggleTaskExpand(task._id)">
          <div class="font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 transition-transform duration-200" 
              :class="expandedTasks.includes(task._id) ? 'transform rotate-90' : ''" 
              viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
            {{ task.name }}
          </div>
          <div class="text-xs px-2 py-1 rounded-full" 
            :class="{
              'bg-yellow-100 text-yellow-800': task.status === 'pending',
              'bg-blue-100 text-blue-800': task.status === 'processing',
              'bg-green-100 text-green-800': task.status === 'completed',
              'bg-red-100 text-red-800': task.status === 'failed'
            }"
          >
            {{ getStatusText(task.status) }}
          </div>
        </div>
        <div class="text-xs text-gray-500 mt-1">创建时间: {{ formatDate(task.createdAt) }}</div>
        <div v-if="task.completedAt" class="text-xs text-gray-500">完成时间: {{ formatDate(task.completedAt) }}</div>
        
        <!-- 展开的任务详情 -->
        <div v-if="expandedTasks.includes(task._id)" class="mt-3 pt-2 border-t border-gray-100">
          <div v-if="task.params" class="mt-2">
            <div class="font-medium text-gray-700 mb-1">任务参数:</div>
            <div class="bg-gray-50 p-2 rounded text-xs">
              <div v-for="(value, key) in task.params" :key="key" class="mb-1">
                <span class="font-medium">{{ key }}:</span> {{ JSON.stringify(value) }}
              </div>
            </div>
          </div>
          
          <div v-if="task.result" class="mt-3">
            <div class="font-medium text-gray-700 mb-1">任务结果:</div>
            <div class="bg-gray-50 p-2 rounded text-xs">
              <pre>{{ JSON.stringify(task.result, null, 2) }}</pre>
            </div>
          </div>
          
          <div v-if="!task.params && !task.result" class="text-gray-500 text-xs italic mt-2">
            无参数和结果数据
          </div>
        </div>
      </div>
    </div>
    
    <!-- 分页控件 -->
    <div v-if="totalPages > 1" class="mt-4 pt-2 border-t flex items-center justify-between" style="border-color: var(--border-light);">
      <div class="text-sm text-gray-500">
        第 {{ currentPage }} 页，共 {{ totalPages }} 页
      </div>
      <div class="flex gap-3">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage <= 1"
          :class="currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : ''"
          class="px-3 py-1 text-sm rounded-lg transition-all bg-blue-500 text-white hover:bg-blue-600"
        >
          上一页
        </button>
        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage >= totalPages"
          :class="currentPage >= totalPages ? 'opacity-50 cursor-not-allowed' : ''"
          class="px-3 py-1 text-sm rounded-lg transition-all bg-blue-500 text-white hover:bg-blue-600"
        >
          下一页
        </button>
      </div>
    </div>
    
    <!-- 无结果 -->
    <div v-else-if="displayedTasks.length === 0" class="py-4 text-center text-gray-500">
      <p>没有找到匹配的任务</p>
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

// 获取任务状态文本
function getStatusText(status) {
  const statusMap = {
    'pending': '等待中',
    'processing': '进行中',
    'completed': '已完成',
    'failed': '失败'
  }
  return statusMap[status] || status
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