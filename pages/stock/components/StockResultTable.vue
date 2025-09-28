<template>
  <div class="p-2 bg-gray-50 rounded">
    <UTable 
      :data="stocksResult" 
      :columns="columns"
      class="w-full"
      :ui="{
        wrapper: 'border border-gray-200 rounded-lg overflow-hidden',
        td: {
          base: 'p-2 border-b border-gray-100 text-sm',
          padding: 'px-3 py-2'
        },
        th: {
          base: 'text-left p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider',
          padding: 'px-3 py-2'
        }
      }"
    >
      <template #code-cell="{ row }">
        {{ row.original.code }}
      </template>
      
      <template #name-cell="{ row }">
        {{ row.original.name }}
      </template>
      
        <!-- 数据开始 -->
        <template #totalTrades-cell="{ row }">
          {{ row.original.totalTrades !== undefined ? row.original.totalTrades.toFixed(2) : '-' }}
        </template>
        <template #profitTrades-cell="{ row }">
          {{ row.original.profitTrades !== undefined ? row.original.profitTrades.toFixed(2) : '-' }}
        </template>
        <template #lossTrades-cell="{ row }">
          {{ row.original.lossTrades !== undefined ? row.original.lossTrades.toFixed(2) : '-' }}
        </template>
        <template #winRate-cell="{ row }">
          <span v-if="row.original.winRate !== undefined" 
                :class="row.original.winRate >= 0.5 ? 'text-green-600' : 'text-red-600'">
            {{ (row.original.winRate * 100).toFixed(2) }}%
          </span>
          <span v-else>-</span>
        </template>
        <template #daysDuration-cell="{ row }">
          {{ row.original.daysDuration !== undefined ? row.original.daysDuration.toFixed(2) : '-' }}
        </template>
        
        <template #priceChange-cell="{ row }">
          <span v-if="row.original.priceChange !== undefined" 
                :class="row.original.priceChange > 0 ? 'text-green-600' : 'text-red-600'">
            {{ row.original.priceChange.toFixed(2) }}%
          </span>
          <span v-else>-</span>
        </template>
        
        <template #dailyChange-cell="{ row }">
          <span v-if="row.original.dailyChange !== undefined" 
                :class="row.original.dailyChange > 0 ? 'text-green-600' : 'text-red-600'">
            {{ row.original.dailyChange.toFixed(2) }}%
          </span>
          <span v-else>-</span>
        </template>
        
        <template #maxDrawdown-cell="{ row }">
          <span v-if="row.original.maxDrawdown !== undefined" class="text-red-600">
            {{ row.original.maxDrawdown.toFixed(2) }}%
          </span>
          <span v-else>-</span>
        </template>
        
        <template #dayLineCount-cell="{ row }">
          {{ row.original.dayLineCount !== undefined ? row.original.dayLineCount.toFixed(2) : '-' }}
        </template>
        
        <template #dayLinePriceChange-cell="{ row }">
          <span v-if="row.original.dayLinePriceChange !== undefined" 
                :class="row.original.dayLinePriceChange > 0 ? 'text-green-600' : 'text-red-600'">
            {{ row.original.dayLinePriceChange.toFixed(2) }}%
          </span>
          <span v-else>-</span>
        </template>
        
        <template #dayLineDailyChange-cell="{ row }">
          <span v-if="row.original.dayLineDailyChange !== undefined" 
                :class="row.original.dayLineDailyChange > 0 ? 'text-green-600' : 'text-red-600'">
            {{ row.original.dayLineDailyChange.toFixed(2) }}%
          </span>
          <span v-else>-</span>
        </template>
        
        <template #priceChangeDiff-cell="{ row }">
          <span v-if="row.original.priceChangeDiff !== undefined" 
                :class="row.original.priceChangeDiff > 0 ? 'text-green-600' : 'text-red-600'">
            {{ row.original.priceChangeDiff.toFixed(2) }}%
          </span>
          <span v-else>-</span>
        </template>
        
        <template #dailyChangeDiff-cell="{ row }">
          <span v-if="row.original.dailyChangeDiff !== undefined" 
                :class="row.original.dailyChangeDiff > 0 ? 'text-green-600' : 'text-red-600'">
            {{ row.original.dailyChangeDiff.toFixed(2) }}%
          </span>
          <span v-else>-</span>
        </template>
        <!-- 数据结束 -->
      
      <template #empty-state>
        <div class="py-4 text-center text-gray-500">
          <p>暂无股票结果数据</p>
        </div>
      </template>
    </UTable>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  stocksResult: {
    type: Array,
    default: () => []
  }
})

// 表格列定义
const columns = ref([
  {
    accessorKey: 'stock',
    header: '股票代码',
    id: 'stock'
  },
  {
    accessorKey: 'winRate',
    header: '胜率',
    id: 'winRate'
  },
  {
    accessorKey: 'dailyChange',
    header: '交易日均',
    id: 'dailyChange'
  },
  {
    accessorKey: 'dailyChangeDiff',
    header: '日均差值',
    id: 'dailyChangeDiff'
  },
  {
    accessorKey: 'dayLineDailyChange',
    header: '日线日均',
    id: 'dayLineDailyChange'
  },
  {
    accessorKey: 'totalTrades',
    header: '交易笔数',
    id: 'totalTrades'
  },
  {
    accessorKey: 'profitTrades',
    header: '盈利笔数',
    id: 'profitTrades'
  },
  {
    accessorKey: 'lossTrades',
    header: '亏损笔数',
    id: 'lossTrades'
  },
  {
    accessorKey: 'daysDuration',
    header: '交易总天数',
    id: 'daysDuration'
  },
  {
    accessorKey: 'priceChange',
    header: '交易总涨跌幅',
    id: 'priceChange'
  },
  {
    accessorKey: 'maxDrawdown',
    header: '最大回撤',
    id: 'maxDrawdown'
  },
  {
    accessorKey: 'dayLineCount',
    header: '日线总天数',
    id: 'dayLineCount'
  },
  {
    accessorKey: 'dayLinePriceChange',
    header: '日线总涨跌幅',
    id: 'dayLinePriceChange'
  },
  {
    accessorKey: 'priceChangeDiff',
    header: '涨跌幅差值',
    id: 'priceChangeDiff'
  }
])
</script>

<style scoped>
/* 自定义样式 */
</style>