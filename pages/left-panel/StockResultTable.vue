<template>
  <div class="bg-gray-50 rounded">
    <UTable
      ref="table"
      :data="stocksResult" 
      :columns="columns"
      :column-visibility="columnVisibility"
      class="w-full"
    >
      
      <template #stock-cell="{ row }">
        <UButton
          variant="ghost"
          color="neutral"
          class="mr-2"
          size="xs"
          @click="$emit('changeViewStock', row.original.stock)"
        >
          {{ row.original.stock }}
        </UButton>
      </template>
      
        <!-- 数据开始 -->
        <template #dailyChangeDiff-cell="{ row }">
          <span v-if="row.original.dailyChangeDiff !== undefined" 
                :class="row.original.dailyChangeDiff > 0 ? 'text-green-600' : 'text-red-600'">
            {{ row.original.dailyChangeDiff.toFixed(2) }}%
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
        
        <template #totalTrades-cell="{ row }">
          {{ row.original.totalTrades !== undefined ? row.original.totalTrades.toFixed(2) : '-' }}
        </template>
        <template #profitTrades-cell="{ row }">
          <span class='text-green-600'>{{ row.original.profitTrades !== undefined ? row.original.profitTrades : '-' }}</span>
          /
          <span class='text-red-600'>{{ row.original.lossTrades !== undefined ? row.original.lossTrades : '-' }}</span>
        </template>
        <template #winRate-cell="{ row }">
          <span v-if="row.original.winRate !== undefined" 
                :class="row.original.winRate >= 50 ? 'text-green-600' : 'text-red-600'">
            {{ (row.original.winRate).toFixed(2) }}%
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
        
        <template #priceChangeDiff-cell="{ row }">
          <span v-if="row.original.priceChangeDiff !== undefined" 
                :class="row.original.priceChangeDiff > 0 ? 'text-green-600' : 'text-red-600'">
            {{ row.original.priceChangeDiff.toFixed(2) }}%
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
import { ref, computed } from 'vue'

const props = defineProps({
  stocksResult: {
    type: Array,
    default: () => []
  },
  panelState: {
    type: String,
    default: 'normal'
  }
})

const emit = defineEmits(['changeViewStock'])

// 根据胜率和交易日均设置行背景色
const getRowClass = (row) => {
  console.log(row)
  const winRate = row.winRate || 0
  const dailyChange = row.dailyChange || 0
  
  if (winRate > 0.5 && dailyChange > 0.001) { // 胜率大于50%且交易日均大于0.1%
    return 'bg-green-50'
  } else {
    return 'bg-red-50'
  }
}

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
    header: '盈/亏',
    id: 'profitTrades'
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

// 根据panelState计算列的可见性
const columnVisibility = computed(() => {
  if (props.panelState === 'leftExpanded') {
    // 左侧展开状态显示所有列
    return {
      stock: true,
      winRate: true,
      dailyChange: true,
      dailyChangeDiff: true,
      dayLineDailyChange: true,
      totalTrades: true,
      profitTrades: true,
      daysDuration: true,
      priceChange: true,
      maxDrawdown: true,
      dayLineCount: true,
      dayLinePriceChange: true,
      priceChangeDiff: true
    }
  } else {
    // 默认状态只显示关键列
    return {
      stock: true,
      winRate: true,
      dailyChange: true,
      dailyChangeDiff: false,
      dayLineDailyChange: false,
      totalTrades: false,
      profitTrades: false,
      daysDuration: false,
      priceChange: false,
      maxDrawdown: false,
      dayLineCount: false,
      dayLinePriceChange: false,
      priceChangeDiff: false
    }
  }
})
</script>

<style scoped>
/* 自定义样式 */
</style>