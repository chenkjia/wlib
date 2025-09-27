<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center mb-2">
      <h4 class="font-medium text-gray-700">买卖清单</h4>
      <div class="text-sm text-gray-500">
        共 {{ transactions.length }} 笔交易
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="py-4 text-center">
      <div class="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      <p class="mt-2">计算中...</p>
    </div>
    
    <!-- Nuxt UI Table 交易列表 -->
    <div v-else>
      <UTable 
        :data="transactions" 
        :columns="columns"
        :loading="loading"
        class="w-full"
        :ui="{
          wrapper: 'border border-gray-200 rounded-lg overflow-hidden',
          td: {
            base: 'p-2 border-b border-gray-100 text-sm',
            padding: 'px-3 py-2'
          },
          th: {
            base: 'text-left p-2 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider',
            padding: 'px-3 py-2'
          }
        }"
      >
        
        <template #buyTime-cell="{ row }">
          {{ formatDate(row.original.buyTime) }}
        </template>
        
        <template #buyPrice-cell="{ row }">
          {{ row.original.buyPrice }}
        </template>
        
        <template #sellTime-cell="{ row }">
          {{ formatDate(row.original.sellTime) }}
        </template>
        
        <template #sellPrice-cell="{ row }">
          {{ row.original.sellPrice || '-' }}
        </template>
        
        <template #duration-cell="{ row }">
          {{ row.original.duration || '-' }}
        </template>
        
        <template #profit-cell="{ row }">
          <span 
            v-if="row.original.profit !== undefined && row.original.profit !== null" 
            :class="getColorClass(row.original.profit)"
          >
            {{ formatProfit(row.original.profit) }}
          </span>
          <span v-else class="text-gray-400">-</span>
        </template>
        
        <template #empty-state>
          <div class="py-8 text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>暂无交易记录</p>
            <p class="text-sm mt-1">请先进行页内计算生成交易数据</p>
          </div>
        </template>
      </UTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  transactions: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// 表格列定义
const columns = ref([
  {
    accessorKey: 'duration',
    header: '持续天数',
    id: 'duration'
  },
  {
    accessorKey: 'profit',
    header: '收益率',
    id: 'profit'
  },
  {
    accessorKey: 'buyTime',
    header: '买入日期',
    id: 'buyTime'
  },
  {
    accessorKey: 'buyPrice',
    header: '买入价格',
    id: 'buyPrice'
  },
  {
    accessorKey: 'sellTime',
    header: '卖出日期',
    id: 'sellTime'
  },
  {
    accessorKey: 'sellPrice',
    header: '卖出价格',
    id: 'sellPrice'
  }
])

// 日期格式化函数
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 收益率格式化函数
function formatProfit(profit) {
  if (profit === undefined || profit === null) return '-'
  return `${profit.toFixed(2)}%`
}

// 获取收益率颜色类
function getColorClass(profit) {
  if (profit === undefined || profit === null) return 'text-gray-400'
  return profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-600' : 'text-gray-600'
}
</script>

<style scoped>
/* 自定义样式 */
</style>