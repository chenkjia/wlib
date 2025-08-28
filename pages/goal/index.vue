<script setup>
import { ref, onMounted, watch } from 'vue'
import { h } from 'vue'
import GoalList from './components/GoalList.vue'
import GoalChart from './components/GoalChart.vue'
import GoalInfo from './components/GoalInfo.vue'
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
const maParams = ref(null) // 移动平均线参数

// 控制各栏的显示状态
const leftPanelVisible = ref(true)
const rightPanelVisible = ref(true)

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
    if (process.client) {
      console.log('=== fetchGoals 开始 ===')
    }
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
    
    if (process.client) {
      console.log('获取到的goals:', goals.value)
      console.log('当前selectedGoal:', selectedGoal.value)
    }
    
    // 自动选择第一个goal来测试HourLineChart组件
    if (data.data && data.data.length > 0 && !selectedGoal.value) {
      if (process.client) {
        console.log('Goal页面: 自动选择第一个goal进行测试:', data.data[0])
      }
      selectedGoal.value = data.data[0]
      if (process.client) {
        console.log('selectedGoal设置后的值:', selectedGoal.value)
        // 在页面上显示调试信息
        if (typeof window !== 'undefined') {
          window.goalPageDebug = {
            fetchGoalsCalled: true,
            goalsCount: goals.value.length,
            selectedGoal: selectedGoal.value,
            selectedGoalStockCode: selectedGoal.value?.stockCode
          }
        }
      }
    }
    if (process.client) {
      console.log('=== fetchGoals 结束 ===')
    }
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

// 这个函数已经移到 GoalList 组件中
// 保留这个空的实现以防其他地方还在调用
function toggleSort(id) {
  console.log('toggleSort should be called from GoalList component')
}

// 这些函数已经移到 GoalList 和 GoalInfo 组件中
// 保留这些空的实现以防其他地方还在调用
function getTrendCategoryText(category) {
  console.log('getTrendCategoryText should be called from components')
  const categoryMap = {
    'NEW_HIGH': '新高',
    'REBOUND': '反弹', 
    'NORMAL': '普通'
  }
  return categoryMap[category] || category
}

function getProfitClass(profit) {
  console.log('getProfitClass should be called from components')
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
      <!-- 左侧列表面板 -->
      <div :class="['left-panel', { 'collapsed': !leftPanelVisible }]">
        <GoalList
          :goals="goals"
          :loading="loading"
          :error="error"
          :total="total"
          :page="page"
          :page-size="pageSize"
          :sorting="sorting"
          :selected-goal="selectedGoal"
          :stock-code="stockCode"
          :trend-category-filter="trendCategoryFilter"
          :visible="leftPanelVisible"
          @update:page="page = $event"
          @update:stock-code="stockCode = $event"
          @update:trend-category-filter="trendCategoryFilter = $event"
          @update:selected-goal="selectedGoal = $event"
          @update:sorting="sorting = $event"
          @update:visible="leftPanelVisible = $event"
          @search="handleSearch"
        />
      </div>

      <!-- 中间图表面板 -->
      <div :class="['middle-panel', { 'expanded': !leftPanelVisible || !rightPanelVisible, 'fully-expanded': !leftPanelVisible && !rightPanelVisible }]">
        <template v-if="selectedGoal">
          <GoalChart
            :goal="selectedGoal"
            :ma-params="maParams"
            :visible="true"
          />
        </template>
        <div v-else class="h-full flex items-center justify-center text-gray-500 bg-gray-50">
          <div class="text-center space-y-4">
            <div class="text-5xl mb-2 animate-bounce">👈</div>
            <div class="text-xl">点击左侧列表查看详情</div>
          </div>
        </div>
      </div>

      <!-- 右侧信息面板 -->
      <div :class="['right-panel', { 'collapsed': !rightPanelVisible }]">
        <template v-if="selectedGoal">
          <GoalInfo
            :goal="selectedGoal"
            :visible="rightPanelVisible"
            @update:visible="rightPanelVisible = $event"
            @update:ma-params="maParams = $event"
          />
        </template>
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
/* 面板布局样式 */
.left-panel {
  width: 30%;
  transition: width 0.3s ease;
  overflow: hidden;
}

.middle-panel {
  width: 40%;
  transition: width 0.3s ease;
  overflow: hidden;
}

.right-panel {
  width: 30%;
  transition: width 0.3s ease;
  overflow: hidden;
}

/* 面板折叠状态 */
.left-panel.collapsed {
  width: 40px;
}

.right-panel.collapsed {
  width: 40px;
}

/* 当左侧或右侧面板折叠时，中间面板扩展 */
.middle-panel.expanded {
  width: calc(100% - 40px - 30%);
}

/* 当左侧和右侧面板都折叠时，中间面板占据大部分空间 */
.middle-panel.fully-expanded {
  width: calc(100% - 80px);
}
</style>