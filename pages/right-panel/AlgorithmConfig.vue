<template>
  <div class="algorithm-config">
    <div class="mb-4">
      <!-- 算法组列表 -->
      <div class="space-y-2">
        <div v-for="(condition, conditionIndex) in algorithmGroups" :key="conditionIndex">
          <!-- 下拉多选框和删除按钮在同一行 -->
          <div class="flex items-center space-x-2">
            <div class="flex-grow overflow-hidden">
              <USelect
                v-model="algorithmGroups[conditionIndex]"
                :items="filteredAvailableConditions"
                multiple
                searchable
                placeholder="选择条件"
                class="w-full"
                :ui="{
                  container: 'w-full max-w-full',
                  base: 'w-full max-w-full',
                  trigger: 'w-full max-w-full'
                }"
              >
                <template #label>
                  <span v-if="!algorithmGroups[conditionIndex].length" class="text-gray-500">请选择条件</span>
                  <span v-else class="truncate inline-block max-w-[calc(100%-20px)]">已选择 {{ algorithmGroups.value[conditionIndex].length }} 个条件</span>
                </template>
              </USelect>
              
              <!-- 如果没有选择任何条件，显示提示 -->
              <div v-if="algorithmGroups[conditionIndex].length === 0" class="text-sm text-red-500 mt-2">
                请至少选择一个条件
              </div>
            </div>
            <button 
              @click="removeGroup(conditionIndex)" 
              class="text-red-500 hover:text-red-700 focus:outline-none flex-shrink-0 w-6 h-6 flex items-center justify-center"
              title="删除条件组"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 添加条件组按钮 -->
      <button 
        @click="addGroup" 
        class="mt-4 w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        添加条件组
      </button>
    </div>
    
    <!-- 预览部分已移除 -->
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch } from 'vue'
import { availableConditions } from '~/utils/algorithmUtils.js'
const props = defineProps({
  // 算法类型：'buy' 或 'sell'
  type: {
    type: String,
    required: true,
    validator: (value) => ['buy', 'sell'].includes(value)
  },
  // 初始算法配置
  initialValue: {
    type: Array,
    default: () => []
  },
  // 启用的指标
  enabledIndicators: {
    type: Array,
    default: () => ['ma', 'macd']
  }
})

const emit = defineEmits(['update:value'])

// 标题根据类型确定
const title = computed(() => props.type === 'buy' ? '买入' : '卖出')

// 根据启用的指标过滤可用条件
const filteredAvailableConditions = computed(() => {
  return availableConditions.filter(condition => {
    // 如果条件没有params属性，则始终显示
    if (!condition.params || condition.params.length === 0) {
      return true
    }
    
    // 检查条件所需的参数是否在启用的指标中
    return condition.params.every(param => props.enabledIndicators.includes(param))
  })
})


// 算法组数据结构 - 使用props中的initialValue进行初始化
const algorithmGroups = ref(JSON.parse(JSON.stringify(props.initialValue && props.initialValue.length > 0 ? props.initialValue : [[]])))

watch(() => props.initialValue, (newValue) => {
  if(JSON.stringify(algorithmGroups.value) !== JSON.stringify(newValue)) {
    algorithmGroups.value = JSON.parse(JSON.stringify(newValue && newValue.length > 0 ? newValue : [[]]))
  }
}, { deep: true })

// 监听配置变化，向父组件发送更新
watch(algorithmGroups, (newValue) => {
  emit('update:value', newValue)
}, { deep: true })

// 添加条件组
function addGroup() {
  algorithmGroups.value.push([])
}

// 删除条件组
function removeGroup(groupIndex) {
  algorithmGroups.value.splice(groupIndex, 1)
}
</script>

<style scoped>
.algorithm-config {
  max-width: 100%;
  overflow-x: hidden;
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>