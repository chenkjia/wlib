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
                v-model="group[condIndex].field" 
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="maS">短期均线 (maS)</option>
                <option value="maM">中期均线 (maM)</option>
                <option value="maL">长期均线 (maL)</option>
                <option value="maX">超长期均线 (maX)</option>
                <option value="volumeMaS">短期成交量均线 (volumeMaS)</option>
                <option value="volumeMaM">中期成交量均线 (volumeMaM)</option>
                <option value="volumeMaL">长期成交量均线 (volumeMaL)</option>
                <option value="volumeMaX">超长期成交量均线 (volumeMaX)</option>
              </select>
              
              <select 
                v-model="group[condIndex].operator" 
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value=">">大于 (&gt;)</option>
                <option value="<">小于 (&lt;)</option>
                <option value=">=">大于等于 (&gt;=)</option>
                <option value="<=">小于等于 (&lt;=)</option>
                <option value="==">等于 (==)</option>
              </select>
              
              <div class="flex-1">
                <input 
                  v-if="isNumericValue(group[condIndex].field, group[condIndex].value2)" 
                  type="number" 
                  v-model.number="group[condIndex].value" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  step="0.01"
                />
                <select 
                  v-else 
                  v-model="group[condIndex].value2" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="maS">短期均线 (maS)</option>
                  <option value="maM">中期均线 (maM)</option>
                  <option value="maL">长期均线 (maL)</option>
                  <option value="maX">超长期均线 (maX)</option>
                  <option value="volumeMaS">短期成交量均线 (volumeMaS)</option>
                  <option value="volumeMaM">中期成交量均线 (volumeMaM)</option>
                  <option value="volumeMaL">长期成交量均线 (volumeMaL)</option>
                  <option value="volumeMaX">超长期成交量均线 (volumeMaX)</option>
                </select>
              </div>
              
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

// 初始化数据
function initializeData() {
  if (props.initialValue && props.initialValue.length > 0) {
    // 如果有初始值，解析初始值
    algorithmGroups.value = props.initialValue.map(group => {
      return group.map(condStr => parseConditionString(condStr))
    })
  } else {
    // 否则创建一个空的条件组
    algorithmGroups.value = [[
      { field: 'maS', operator: '>', value: 0, value2: 'maM', useField2: true }
    ]]
  }
}

// 解析条件字符串为对象
function parseConditionString(condStr) {
  // 示例: "maS > maM" 或 "volumeMaS > volumeMaL * 3"
  const numericMatch = condStr.match(/([a-zA-Z]+)\s*([<>=]+)\s*([0-9.]+)/)
  const fieldMatch = condStr.match(/([a-zA-Z]+)\s*([<>=]+)\s*([a-zA-Z]+)/)
  const multiplyMatch = condStr.match(/([a-zA-Z]+)\s*([<>=]+)\s*([a-zA-Z]+)\s*\*\s*([0-9.]+)/)
  
  if (numericMatch) {
    return {
      field: numericMatch[1],
      operator: numericMatch[2],
      value: parseFloat(numericMatch[3]),
      useField2: false
    }
  } else if (multiplyMatch) {
    return {
      field: multiplyMatch[1],
      operator: multiplyMatch[2],
      value2: multiplyMatch[3],
      multiplier: parseFloat(multiplyMatch[4]),
      useField2: true,
      useMultiplier: true
    }
  } else if (fieldMatch) {
    return {
      field: fieldMatch[1],
      operator: fieldMatch[2],
      value2: fieldMatch[3],
      useField2: true
    }
  }
  
  // 默认返回
  return { field: 'maS', operator: '>', value: 0, useField2: false }
}

// 添加新的条件组
function addGroup() {
  algorithmGroups.value.push([
    { field: 'maS', operator: '>', value: 0, value2: 'maM', useField2: true }
  ])
}

// 删除条件组
function removeGroup(groupIndex) {
  algorithmGroups.value.splice(groupIndex, 1)
  if (algorithmGroups.value.length === 0) {
    addGroup() // 确保至少有一个条件组
  }
}

// 添加条件
function addCondition(groupIndex) {
  algorithmGroups.value[groupIndex].push(
    { field: 'maS', operator: '>', value: 0, value2: 'maM', useField2: true }
  )
}

// 删除条件
function removeCondition(groupIndex, condIndex) {
  algorithmGroups.value[groupIndex].splice(condIndex, 1)
  if (algorithmGroups.value[groupIndex].length === 0) {
    removeGroup(groupIndex) // 如果条件组为空，删除该组
  }
}

// 判断是否使用数值输入
function isNumericValue(field, value2) {
  return !value2 || value2 === ''
}

// 生成代码预览
const generatedCode = computed(() => {
  const functionName = props.type === 'buy' ? 'buyFunction' : 'sellFunction'
  
  let code = `const ${functionName} = [
`
  
  algorithmGroups.value.forEach((group, groupIndex) => {
    code += `  // 条件组 ${groupIndex + 1}
`
    code += `  (i, dayLineWithMetric) => {
`
    code += `    if (i < 50) {
      return false
    }
`
    
    // 解构需要的变量
    const fields = new Set()
    group.forEach(cond => {
      fields.add(cond.field)
      if (cond.useField2 && cond.value2) {
        fields.add(cond.value2)
      }
    })
    
    if (fields.size > 0) {
      code += `    const {${Array.from(fields).join(', ')}} = dayLineWithMetric
`
    }
    
    // 生成条件判断
    if (group.length > 0) {
      code += `    return `
      
      group.forEach((cond, condIndex) => {
        if (condIndex > 0) {
          code += ` && `
        }
        
        if (cond.useField2 && cond.value2) {
          if (cond.useMultiplier) {
            code += `${cond.field}[i] ${cond.operator} ${cond.value2}[i] * ${cond.multiplier}`
          } else {
            code += `${cond.field}[i] ${cond.operator} ${cond.value2}[i]`
          }
        } else {
          code += `${cond.field}[i] ${cond.operator} ${cond.value}`
        }
      })
      
      code += `
`
    } else {
      code += `    return true
`
    }
    
    code += `  },
`
  })
  
  code += `]`
  return code
})

// 生成算法配置数组
const algorithmConfig = computed(() => {
  return algorithmGroups.value.map(group => {
    return group.map(cond => {
      let condStr = ''
      if (cond.useField2 && cond.value2) {
        if (cond.useMultiplier) {
          condStr = `${cond.field} ${cond.operator} ${cond.value2} * ${cond.multiplier}`
        } else {
          condStr = `${cond.field} ${cond.operator} ${cond.value2}`
        }
      } else {
        condStr = `${cond.field} ${cond.operator} ${cond.value}`
      }
      return condStr
    })
  })
})

// 监听配置变化，向父组件发送更新
watch(algorithmConfig, (newValue) => {
  emit('update:value', newValue)
}, { deep: true })

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