<script setup>
import { ref, onMounted, watch } from 'vue'
import { h } from 'vue'
import GoalDetail from './components/GoalDetail.vue'
const UButton = resolveComponent('UButton')

function getHeader(column, label) {
  const isSorted = column.getIsSorted()

  return h(UButton, {
    color: 'neutral',
    variant: 'ghost',
    label,
    icon: isSorted
      ? isSorted === 'asc'
        ? 'i-lucide-arrow-up-narrow-wide'
        : 'i-lucide-arrow-down-wide-narrow'
      : 'i-lucide-arrow-up-down',
    class: '-mx-2.5',
    'aria-label': `排序 ${isSorted === 'asc' ? '降序' : '升序'}`,
    onClick: () => {
      if (isSorted === 'asc') {
        column.toggleSorting(true)
      } else if (isSorted === 'desc') {
        column.clearSorting()
      } else {
        column.toggleSorting(false)
      }
    }
  })
}

const goals = ref([])
const error = ref('')
const loading = ref(true)
const total = ref(0)
const page = ref(1)
const pageSize = ref(18)
const stockCode = ref('')
const selectedGoal = ref(null)
const trendCategoryFilter = ref('all') // 添加趋势类型过滤器

const sorting = ref([{
  id: 'startTime',
  desc: true
}])

const columns = [
  { 
    accessorKey: 'stockCode', 
    header: ({ column }) => getHeader(column, '股票')
  },
  { 
    accessorKey: 'startTime', 
    header: ({ column }) => getHeader(column, '开始时间'),
    cell: ({ row }) => new Date(row.getValue('startTime')).toLocaleDateString()
  },
  { 
    accessorKey: 'startPrice', 
    header: ({ column }) => getHeader(column, '开始价格')
  },
  { 
    accessorKey: 'endTime', 
    header: ({ column }) => getHeader(column, '结束时间'),
    cell: ({ row }) => row.getValue('endTime') ? new Date(row.getValue('endTime')).toLocaleDateString() : '进行中'
  },
  { 
    accessorKey: 'endPrice', 
    header: ({ column }) => getHeader(column, '结束价格')
  },
  { 
    accessorKey: 'profit', 
    header: ({ column }) => getHeader(column, '盈亏'),
    cell: ({ row }) => {
      const profit = row.getValue('profit')
      return profit !== null && profit !== undefined 
        ? `${profit > 0 ? '+' : ''}${profit.toFixed(2)}%` 
        : '-'
    }
  },
  { 
    accessorKey: 'duration', 
    header: ({ column }) => getHeader(column, '持续天数'),
    cell: ({ row }) => {
      const duration = row.getValue('duration')
      return duration ? `${duration}天` : '-'
    }
  },
  { 
    accessorKey: 'trendCategory', 
    header: ({ column }) => getHeader(column, '趋势类型'),
    cell: ({ row }) => {
      const category = row.getValue('trendCategory')
      const categoryMap = {
        'NEW_HIGH': '新高',
        'REBOUND': '反弹',
        'NORMAL': '普通'
      }
      return categoryMap[category] || category
    }
  }
]

async function fetchGoals() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: page.value.toString(),
      pageSize: pageSize.value.toString()
    })
    if (stockCode.value) {
      params.append('stockCode', stockCode.value)
    }
    if (sorting.value.length > 0) {
      const sort = sorting.value[0]
      params.append('sortBy', sort.id)
      params.append('sortOrder', sort.desc ? 'desc' : 'asc')
    }
    // 添加趋势类型过滤
    if (trendCategoryFilter.value !== 'all') {
      params.append('trendCategory', trendCategoryFilter.value)
    }
    const response = await fetch(`/api/goals?${params}`)
    const data = await response.json()
    goals.value = data.data
    total.value = data.total
  } catch (err) {
    console.error('获取目标列表失败:', err)
    error.value = err.message || '获取目标列表失败'
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  fetchGoals()
}

function toggleSort(id) {
  if (sorting.value[0]?.id === id) {
    if (sorting.value[0].desc) {
      // 降序→升序
      sorting.value = [{ id, desc: false }]
    } else {
      // 升序→无排序
      sorting.value = []
    }
  } else {
    // 新列，降序（目标默认按时间降序）
    sorting.value = [{ id, desc: true }]
  }
}

function getTrendCategoryText(category) {
  const categoryMap = {
    'NEW_HIGH': '新高',
    'REBOUND': '反弹', 
    'NORMAL': '普通'
  }
  return categoryMap[category] || category
}

function getProfitClass(profit) {
  if (!profit && profit !== 0) return ''
  return profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-600' : ''
}

onMounted(() => {
  fetchGoals()
})

watch([page, sorting, trendCategoryFilter], () => {
  fetchGoals()
})
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <div class="flex items-center justify-between px-6 py-3 border-b bg-white">
      <h1 class="text-2xl font-bold">目标趋势列表</h1>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <div class="w-1/3 border-r overflow-visible">
        <div v-if="!error" class="h-full">
          <USkeleton v-if="loading" class="h-full" />
          <template v-else>
            <!-- 过滤器区域 -->
            <div class="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
              <UInput
                v-model="stockCode"
                placeholder="输入股票代码筛选"
                class="w-48 mr-2"
              />
              <div class="flex items-center gap-2">
                <select
                  v-model="trendCategoryFilter"
                  class="w-32 px-2 py-1 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部类型</option>
                  <option value="NEW_HIGH">新高</option>
                  <option value="REBOUND">反弹</option>
                  <option value="NORMAL">普通</option>
                </select>
                <UButton
                  color="primary"
                  size="sm"
                  @click="handleSearch"
                >
                  搜索
                </UButton>
              </div>
            </div>
            <table class="w-full text-sm">
              <thead>
                <tr>
                  <th class="px-4 py-2">
                    <span @click="toggleSort('stockCode')" class="cursor-pointer select-none flex items-center">
                      股票
                      <span v-if="sorting[0]?.id === 'stockCode'">
                        <span v-if="!sorting[0].desc">▲</span>
                        <span v-else>▼</span>
                      </span>
                    </span>
                  </th>
                  <th class="px-4 py-2">
                    <span @click="toggleSort('startTime')" class="cursor-pointer select-none flex items-center">
                      开始时间
                      <span v-if="sorting[0]?.id === 'startTime'">
                        <span v-if="!sorting[0].desc">▲</span>
                        <span v-else>▼</span>
                      </span>
                    </span>
                  </th>
                  <th class="px-4 py-2">
                    <span @click="toggleSort('startPrice')" class="cursor-pointer select-none flex items-center">
                      开始价格
                      <span v-if="sorting[0]?.id === 'startPrice'">
                        <span v-if="!sorting[0].desc">▲</span>
                        <span v-else>▼</span>
                      </span>
                    </span>
                  </th>
                  <th class="px-4 py-2">
                    <span @click="toggleSort('trendCategory')" class="cursor-pointer select-none flex items-center">
                      趋势类型
                      <span v-if="sorting[0]?.id === 'trendCategory'">
                        <span v-if="!sorting[0].desc">▲</span>
                        <span v-else>▼</span>
                      </span>
                    </span>
                  </th>
                  <th class="px-4 py-2">
                    <span @click="toggleSort('profit')" class="cursor-pointer select-none flex items-center">
                      盈亏
                      <span v-if="sorting[0]?.id === 'profit'">
                        <span v-if="!sorting[0].desc">▲</span>
                        <span v-else>▼</span>
                      </span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in goals" :key="row._id" :class="[selectedGoal && selectedGoal._id === row._id ? 'bg-blue-100' : 'cursor-pointer', 'transition']" @click="selectedGoal = row">
                  <td class="px-4 py-2">{{ row.stockCode }}</td>
                  <td class="px-4 py-2">{{ new Date(row.startTime).toLocaleDateString() }}</td>
                  <td class="px-4 py-2">{{ row.startPrice }}</td>
                  <td class="px-4 py-2" :class="{
                    'text-red-600': row.trendCategory === 'NEW_HIGH',
                    'text-green-600': row.trendCategory === 'REBOUND',
                    'text-gray-600': row.trendCategory === 'NORMAL'
                  }">
                    {{ getTrendCategoryText(row.trendCategory) }}
                  </td>
                  <td class="px-4 py-2" :class="getProfitClass(row.profit)">
                    {{ row.profit !== null && row.profit !== undefined ? `${row.profit > 0 ? '+' : ''}${row.profit.toFixed(2)}%` : '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="sticky bottom-0 py-2 flex justify-between border-t px-4 bg-white">
              <div class="flex items-center text-sm text-gray-600">
                共 <span class="font-medium mx-1">{{ total }}</span> 条记录
              </div>
              <UPagination
                v-model:page="page"
                :total="total"
                :page-size="pageSize"
                :page-count="Math.ceil(total / pageSize)"
              />
            </div>
          </template>
        </div>
        <div v-else class="p-4 bg-red-50">
          <div class="text-red-500">{{ error }}</div>
        </div>
      </div>

      <div class="w-2/3 overflow-auto">
        <GoalDetail 
          v-if="selectedGoal" 
          :goal="selectedGoal"
          class="h-full"
        />
        <div v-else class="h-full flex items-center justify-center text-gray-500 bg-gray-50">
          <div class="text-center space-y-4">
            <div class="text-5xl mb-2 animate-bounce">👈</div>
            <div class="text-xl">点击左侧列表查看详情</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-blue-100 {
  background-color: #dbeafe !important;
}
</style>