<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  goals: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  total: {
    type: Number,
    default: 0
  },
  page: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 18
  },
  sorting: {
    type: Array,
    default: () => []
  },
  selectedGoal: {
    type: Object,
    default: null
  },
  stockCode: {
    type: String,
    default: ''
  },
  trendCategoryFilter: {
    type: String,
    default: 'all'
  },
  visible: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'update:page', 
  'update:stockCode', 
  'update:trendCategoryFilter', 
  'update:selectedGoal',
  'update:sorting',
  'update:visible',
  'search'
])

const localStockCode = ref(props.stockCode)
const localTrendCategoryFilter = ref(props.trendCategoryFilter)
const localPage = ref(props.page)

watch(() => props.stockCode, (newVal) => {
  localStockCode.value = newVal
})

watch(() => props.trendCategoryFilter, (newVal) => {
  localTrendCategoryFilter.value = newVal
})

watch(() => props.page, (newVal) => {
  localPage.value = newVal
})

watch(localPage, (newVal) => {
  emit('update:page', newVal)
})

function handleSearch() {
  emit('update:stockCode', localStockCode.value)
  emit('update:trendCategoryFilter', localTrendCategoryFilter.value)
  emit('search')
}

function toggleSort(id) {
  if (props.sorting[0]?.id === id) {
    if (props.sorting[0].desc) {
      // 降序→升序
      emit('update:sorting', [{ id, desc: false }])
    } else {
      // 升序→无排序
      emit('update:sorting', [])
    }
  } else {
    // 新列，降序（目标默认按时间降序）
    emit('update:sorting', [{ id, desc: true }])
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

function toggleVisibility() {
  emit('update:visible', !props.visible)
}
</script>

<template>
  <div class="goal-list" :class="{ 'collapsed': !visible }">
    <div class="list-header" :class="{ 'collapsed-header': !visible }">
      <h2 v-if="visible" class="text-xl font-bold">目标列表</h2>
      <button @click="toggleVisibility" class="toggle-btn" title="切换显示/隐藏">
        <i :class="visible ? 'icon-collapse' : 'icon-expand'" aria-hidden="true"></i>
      </button>
    </div>
    
    <div v-if="visible" class="list-content">
      <div v-if="!error" class="h-full">
        <USkeleton v-if="loading" class="h-full" />
        <template v-else>
          <!-- 过滤器区域 -->
          <div class="filter-area">
            <UInput
              v-model="localStockCode"
              placeholder="输入股票代码筛选"
              class="stock-input"
            />
            <div class="filter-controls">
              <select
                v-model="localTrendCategoryFilter"
                class="trend-select"
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
          <table class="goals-table">
            <thead>
              <tr>
                <th>
                  <span @click="toggleSort('stockCode')" class="sort-header">
                    股票
                    <span v-if="sorting[0]?.id === 'stockCode'">
                      <span v-if="!sorting[0].desc">▲</span>
                      <span v-else>▼</span>
                    </span>
                  </span>
                </th>
                <th>
                  <span @click="toggleSort('startTime')" class="sort-header">
                    开始时间
                    <span v-if="sorting[0]?.id === 'startTime'">
                      <span v-if="!sorting[0].desc">▲</span>
                      <span v-else>▼</span>
                    </span>
                  </span>
                </th>
                <th>
                  <span @click="toggleSort('startPrice')" class="sort-header">
                    开始价格
                    <span v-if="sorting[0]?.id === 'startPrice'">
                      <span v-if="!sorting[0].desc">▲</span>
                      <span v-else>▼</span>
                    </span>
                  </span>
                </th>
                <th>
                  <span @click="toggleSort('trendCategory')" class="sort-header">
                    趋势类型
                    <span v-if="sorting[0]?.id === 'trendCategory'">
                      <span v-if="!sorting[0].desc">▲</span>
                      <span v-else>▼</span>
                    </span>
                  </span>
                </th>
                <th>
                  <span @click="toggleSort('profit')" class="sort-header">
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
              <tr 
                v-for="row in goals" 
                :key="row._id" 
                :class="[selectedGoal && selectedGoal._id === row._id ? 'selected-row' : '', 'goal-row']" 
                @click="emit('update:selectedGoal', row)"
              >
                <td>{{ row.stockCode }}</td>
                <td>{{ new Date(row.startTime).toLocaleDateString() }}</td>
                <td>{{ row.startPrice }}</td>
                <td :class="{
                  'text-red-600': row.trendCategory === 'NEW_HIGH',
                  'text-green-600': row.trendCategory === 'REBOUND',
                  'text-gray-600': row.trendCategory === 'NORMAL'
                }">
                  {{ getTrendCategoryText(row.trendCategory) }}
                </td>
                <td :class="getProfitClass(row.profit)">
                  {{ row.profit !== null && row.profit !== undefined ? `${row.profit > 0 ? '+' : ''}${row.profit.toFixed(2)}%` : '-' }}
                </td>
              </tr>
            </tbody>
          </table>
          <div class="pagination-area">
            <div class="total-count">
              共 <span class="count-number">{{ total }}</span> 条记录
            </div>
            <UPagination
              v-model="localPage"
              :total="total"
              :page-size="pageSize"
              :page-count="Math.ceil(total / pageSize)"
            />
          </div>
        </template>
      </div>
      <div v-else class="error-message">
        <div class="text-red-500">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.goal-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: width 0.3s ease;
  width: 100%;
  border-right: 1px solid #e5e7eb;
  background-color: white;
}

.goal-list.collapsed {
  width: 40px;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.collapsed-header {
  justify-content: center;
  padding: 0.5rem;
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  color: #4b5563;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-btn:hover {
  color: #1f2937;
}

.icon-collapse::before {
  content: '◀';
  font-style: normal;
}

.icon-expand::before {
  content: '▶';
  font-style: normal;
}

.list-content {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.filter-area {
  padding: 0.75rem 1rem;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
}

.stock-input {
  width: 12rem;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.trend-select {
  width: 8rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
  font-size: 0.875rem;
}

.trend-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.goals-table {
  width: 100%;
  text-align: left;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.goals-table th,
.goals-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.sort-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.sort-header:hover {
  color: #3b82f6;
}

.goal-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.goal-row:hover {
  background-color: #f3f4f6;
}

.selected-row {
  background-color: #dbeafe !important;
}

.pagination-area {
  margin-top: auto;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #e5e7eb;
  background-color: white;
}

.total-count {
  font-size: 0.875rem;
  color: #4b5563;
}

.count-number {
  font-weight: 500;
  margin: 0 0.25rem;
}

.error-message {
  padding: 1rem;
  background-color: #fef2f2;
}

.text-green-600 {
  color: #059669;
}

.text-red-600 {
  color: #dc2626;
}
</style>