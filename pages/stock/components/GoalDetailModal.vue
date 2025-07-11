<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-auto">
      <div class="p-4 border-b">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">目标趋势详情</h3>
          <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700">
            <span class="text-xl">&times;</span>
          </button>
        </div>
      </div>
      
      <div class="p-4">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div class="text-sm text-gray-600">开始时间</div>
            <div class="font-medium">{{ formatDate(goal.startTime) }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-600">结束时间</div>
            <div class="font-medium">{{ formatDate(goal.endTime) || '进行中' }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-600">开始价格</div>
            <div class="font-medium">{{ goal.startPrice }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-600">结束价格</div>
            <div class="font-medium">{{ goal.endPrice || '-' }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-600">持续天数</div>
            <div class="font-medium">{{ goal.duration || '-' }} 天</div>
          </div>
          <div>
            <div class="text-sm text-gray-600">总收益</div>
            <div :class="getProfitClass(goal.profit)" class="font-medium">
              {{ goal.profit !== null && goal.profit !== undefined ? `${goal.profit > 0 ? '+' : ''}${goal.profit.toFixed(2)}%` : '-' }}
            </div>
          </div>
          <div>
            <div class="text-sm text-gray-600">日均收益</div>
            <div :class="getProfitClass(goal.dailyProfit)" class="font-medium">
              {{ goal.dailyProfit ? goal.dailyProfit.toFixed(2) + '%' : '-' }}
            </div>
          </div>
          <div>
            <div class="text-sm text-gray-600">趋势类型</div>
            <div class="font-medium">
              {{ goal.goalType === 'buy' ? '买入' : '卖出' }}
            </div>
          </div>
        </div>
        
        <div class="mt-4">
          <div class="text-sm text-gray-600 mb-1">分析方法</div>
          <div class="p-2 bg-gray-100 rounded">
            {{ goal.usedSlopeAnalysis ? '斜率分析法' : '传统极值法' }}
          </div>
        </div>
      </div>
      
      <div class="p-4 border-t flex justify-end">
        <button 
          @click="$emit('close')" 
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  goal: {
    type: Object,
    required: true
  },
  formatDate: {
    type: Function,
    required: true
  },
  getProfitClass: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['close'])
</script>