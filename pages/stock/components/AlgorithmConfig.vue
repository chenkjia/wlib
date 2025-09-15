<template>
  <div class="algorithm-config">
    <div class="mb-4">
      <h3 class="text-lg font-medium text-gray-800 mb-3 border-l-4 border-blue-500 pl-2">{{ title }}算法配置</h3>
      
      <!-- 算法组列表 -->
      <div class="space-y-2">
        <div v-for="(group, groupIndex) in algorithmGroups" :key="groupIndex">
          <!-- 下拉多选框和删除按钮在同一行 -->
          <div class="flex items-center space-x-2">
            <div class="flex-grow overflow-hidden">
              <USelect
                v-model="group.selectedConditions"
                :items="availableConditions"
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
                  <span v-if="!group.selectedConditions.length" class="text-gray-500">请选择条件</span>
                  <span v-else class="truncate inline-block max-w-[calc(100%-20px)]">已选择 {{ group.selectedConditions.length }} 个条件</span>
                </template>
              </USelect>
              
              <!-- 如果没有选择任何条件，显示提示 -->
              <div v-if="group.selectedConditions.length === 0" class="text-sm text-red-500 mt-2">
                请至少选择一个条件
              </div>
            </div>
            <button 
              @click="removeGroup(groupIndex)" 
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
  }
})

const emit = defineEmits(['update:value'])

// 标题根据类型确定
const title = computed(() => props.type === 'buy' ? '买入' : '卖出')

// 可用条件列表
const availableConditions = [
  // 短期与中期均线对比
  { value: 'MAS_GT_MAM', label: '短期均线高于中期均线' },
  { value: 'MAS_LT_MAM', label: '短期均线低于中期均线' },
  { value: 'MAS_CROSS_UP_MAM', label: '短期均线上穿中期均线' },
  { value: 'MAS_CROSS_DOWN_MAM', label: '短期均线下穿中期均线' },
  
  // 中期与长期均线对比
  { value: 'MAM_GT_MAL', label: '中期均线高于长期均线' },
  { value: 'MAM_LT_MAL', label: '中期均线低于长期均线' },
  { value: 'MAM_CROSS_UP_MAL', label: '中期均线上穿长期均线' },
  { value: 'MAM_CROSS_DOWN_MAL', label: '中期均线下穿长期均线' },
  
  // 长期与超长期均线对比
  { value: 'MAL_GT_MAX', label: '长期均线高于超长期均线' },
  { value: 'MAL_LT_MAX', label: '长期均线低于超长期均线' },
  { value: 'MAL_CROSS_UP_MAX', label: '长期均线上穿超长期均线' },
  { value: 'MAL_CROSS_DOWN_MAX', label: '长期均线下穿超长期均线' },
  
  // 成交量相关
  { value: 'VOLUME_HIGH', label: '成交量放大' }
]

// 算法组数据结构
const algorithmGroups = ref([])

// 计算属性：将算法组转换为标准格式
const algorithmConfig = computed(() => {
  // 将多选框格式转换为原来的数组格式
  return algorithmGroups.value.map(group => {
    return group.selectedConditions.map(conditionType => {
      return { conditionType }
    })
  })
})

// 监听配置变化，向父组件发送更新
watch(algorithmConfig, (newValue) => {
  emit('update:value', newValue)
}, { deep: true })

// 添加条件组
function addGroup() {
  algorithmGroups.value.push({
    selectedConditions: ['MAS_GT_MAM'] // 默认选择一个条件
  })
}

// 删除条件组
function removeGroup(groupIndex) {
  algorithmGroups.value.splice(groupIndex, 1)
}

// 初始化数据
function initializeData() {
  // 如果有初始值，则使用初始值
  if (props.initialValue && props.initialValue.length > 0) {
    // 将初始值转换为内部数据结构
    algorithmGroups.value = props.initialValue.map(group => {
      const selectedConditions = group.map(condition => {
        // 如果条件是字符串，直接使用
        if (typeof condition === 'string') {
          return condition
        }
        // 如果是对象，提取 conditionType
        return condition.conditionType
      })
      return { selectedConditions }
    })
  } else {
    // 否则创建一个默认的条件组
    algorithmGroups.value = [
      { selectedConditions: ['MAS_GT_MAM'] }
    ]
  }
}

// 初始化
initializeData()
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