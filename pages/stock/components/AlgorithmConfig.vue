<template>
  <div class="algorithm-config">
    <div class="mb-4">
      <h3 class="text-lg font-medium text-gray-800 mb-3 border-l-4 border-blue-500 pl-2">{{ title }}算法配置</h3>
      
      <!-- 算法组列表 -->
      <div class="space-y-4">
        <div v-for="(group, groupIndex) in algorithmGroups" :key="groupIndex" class="bg-gray-50 p-3 rounded-md">
          <div class="flex justify-between items-center mb-2">
            <h4 class="font-medium">条件组 {{ groupIndex + 1 }}</h4>
            <button 
              @click="removeGroup(groupIndex)" 
              class="text-red-500 hover:text-red-700 focus:outline-none"
              title="删除条件组"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          
          <!-- 条件列表 -->
          <div class="space-y-2">
            <div v-for="(condition, condIndex) in group" :key="condIndex" class="flex items-center space-x-2">
              <select 
                v-model="group[condIndex].conditionType" 
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="MAS_GT_MAM">短期均线高于中期均线</option>
                <option value="MAS_LT_MAM">短期均线低于中期均线</option>
                <option value="MAS_CROSS_UP_MAM">短期均线上穿中期均线</option>
                <option value="MAS_CROSS_DOWN_MAM">短期均线下穿中期均线</option>
                <option value="MAS_GT_MAL">短期均线高于长期均线</option>
                <option value="MAS_LT_MAL">短期均线低于长期均线</option>
                <option value="MAM_GT_MAL">中期均线高于长期均线</option>
                <option value="MAM_LT_MAL">中期均线低于长期均线</option>
                <option value="VOLUME_HIGH">成交量放大</option>
              </select>
              
              <button 
                @click="removeCondition(groupIndex, condIndex)" 
                class="text-red-500 hover:text-red-700 focus:outline-none"
                title="删除条件"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <!-- 添加条件按钮 -->
            <button 
              @click="addCondition(groupIndex)" 
              class="mt-2 w-full px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-1 focus:ring-gray-500"
            >
              添加条件
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

// 算法组数据结构
const algorithmGroups = ref([])

// 计算属性：将算法组转换为标准格式
const algorithmConfig = computed(() => {
  return algorithmGroups.value
})

// 监听配置变化，向父组件发送更新
watch(algorithmConfig, (newValue) => {
  emit('update:value', newValue)
}, { deep: true })

// 添加条件组
function addGroup() {
  algorithmGroups.value.push([
    { conditionType: 'MAS_GT_MAM' } // 默认添加一个条件
  ])
}

// 添加条件
function addCondition(groupIndex) {
  algorithmGroups.value[groupIndex].push({ conditionType: 'MAS_GT_MAM' })
}

// 删除条件组
function removeGroup(groupIndex) {
  algorithmGroups.value.splice(groupIndex, 1)
}

// 删除条件
function removeCondition(groupIndex, condIndex) {
  algorithmGroups.value[groupIndex].splice(condIndex, 1)
  
  // 如果条件组为空，则删除该条件组
  if (algorithmGroups.value[groupIndex].length === 0) {
    removeGroup(groupIndex)
  }
}

// 初始化数据
function initializeData() {
  // 如果有初始值，则使用初始值
  if (props.initialValue && props.initialValue.length > 0) {
    // 将初始值转换为内部数据结构
    algorithmGroups.value = props.initialValue.map(group => {
      return group.map(condition => {
        // 如果条件是字符串，则转换为对象
        if (typeof condition === 'string') {
          return { conditionType: condition }
        }
        return condition
      })
    })
  } else {
    // 否则创建一个默认的条件组
    algorithmGroups.value = [
      [{ conditionType: 'MAS_GT_MAM' }]
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