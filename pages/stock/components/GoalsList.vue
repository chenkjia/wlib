<template>
  <div class="divide-y overflow-auto max-h-[calc(100vh-60px)]">
    <div 
      v-for="(goal, index) in goals" 
      :key="index"
      class="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
      @click="$emit('update:selectedGoal', goal)"
      @mouseover="$emit('highlightGoal', goal, index)"
      @mouseout="$emit('resetHighlight')"
      :class="{'bg-blue-50': selectedGoal && goals.indexOf(selectedGoal) === index}"
    >
      <div class="flex justify-between items-center mb-2">
        <div class="font-medium flex items-center space-x-2">
          <span>{{ formatDate(goal.startTime) }}</span>
          <span class="text-gray-400">→</span>
          <span>{{ formatDate(goal.endTime) || '进行中' }}</span>
        </div>
        <div :class="getProfitClass(goal.profit)" class="text-lg font-bold">
          {{ goal.profit !== null && goal.profit !== undefined ? `${goal.profit > 0 ? '+' : ''}${goal.profit.toFixed(2)}%` : '-' }}
        </div>
      </div>
      <div class="grid grid-cols-4 gap-2 text-sm text-gray-600">
        <div class="flex items-center">
          <span class="mr-1">起始:</span>
          <span class="font-medium">{{ goal.startPrice }}</span>
        </div>
        <div class="flex items-center">
          <span class="mr-1">目标:</span>
          <span class="font-medium">{{ goal.endPrice || '-' }}</span>
        </div>
        <div class="flex items-center">
          <span class="mr-1">持续:</span>
          <span class="font-medium">{{ goal.duration || '-' }}天</span>
        </div>
        <div class="flex items-center">
          <span class="mr-1">日均:</span>
          <span :class="getProfitClass(goal.dailyProfit)" class="font-medium">{{ goal.dailyProfit ? goal.dailyProfit.toFixed(2) + '%' : '-' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  goals: {
    type: Array,
    required: true
  },
  selectedGoal: {
    type: Object,
    default: null
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

const emit = defineEmits([
  'update:selectedGoal',
  'highlightGoal',
  'resetHighlight'
])
</script>

<style scoped>
.max-h-\[calc\(100vh-60px\)\] {
  max-height: calc(100vh - 60px);
}
</style>