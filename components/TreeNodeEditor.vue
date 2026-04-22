<template>
  <!-- 递归条件编辑器（独立组件，Nuxt UI 风格） -->
  <div v-if="node">
    <!-- 条件节点 -->
    <div v-if="node.type === 'condition'" class="flex items-center gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800/40 shadow-sm">
      <USelect v-model="node.timeframe" :items="timeframeOptions" class="w-28" />
      <USelectMenu
        v-model="node.value"
        :items="groupedFilteredOptions"
        value-key="value"
        searchable
        :search-input="{ placeholder: '搜索条件（名称/编码）' }"
        class="flex-1"
      />
      <UButton color="danger" variant="soft" size="sm" label="删除" @click="removeSelf" />
    </div>

    <!-- 组节点 -->
    <UCard v-else-if="node.type === 'group'" class="border-0 bg-gray-50 dark:bg-gray-800/40 shadow-sm">
      <template #header>
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">逻辑操作符</label>
          <USelect v-model="node.op" :items="['AND', 'OR', 'NOT']" class="w-28" />
          <UButton v-if="parent" class="ml-auto" color="danger" variant="soft" size="sm" label="删除该组" @click="removeSelf" />
        </div>
      </template>

      <div class="space-y-2">
        <TreeNodeEditor 
          v-for="(child, i) in node.children" 
          :key="i" 
          :node="child" 
          :parent="node" 
          :index="i" 
          :enabledIndicators="enabledIndicators" 
        />
      </div>

      <template #footer>
        <div class="flex items-center gap-2">
          <UButton color="primary" variant="soft" size="sm" label="添加条件" @click="addCondition(node)" />
          <UButton color="success" variant="soft" size="sm" label="添加子组" @click="addGroup(node)" />
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { availableConditions } from '~/utils/algorithmUtils.js'

defineOptions({ name: 'TreeNodeEditor' })

const props = defineProps({
  node: { type: Object, required: true },
  parent: { type: Object, required: false },
  index: { type: Number, required: false },
  enabledIndicators: { type: Array, default: () => ['ma', 'macd'] }
})

// 根据启用的指标过滤可用条件（与主界面一致的规则）
const filteredAvailableConditions = computed(() => {
  const indicatorParams = ['ma', 'macd', 'kdj', 'bias', 'volume']
  return availableConditions.filter(condition => {
    if (!condition.params || condition.params.length === 0) {
      return true
    }
    return condition.params.every(param => {
      // 非指标依赖（如 line/time）不参与开关过滤
      if (!indicatorParams.includes(param)) return true
      return props.enabledIndicators.includes(param)
    })
  })
})
const filteredOptions = computed(() => filteredAvailableConditions.value.map(c => ({ label: c.label, value: c.value })))

function getConditionGroup(condition) {
  const value = String(condition?.value || '')
  if (value.startsWith('MACD_')) return 'MACD类'
  if (value.startsWith('KDJ_')) return 'KDJ类'
  if (value.startsWith('BIAS_')) return 'BIAS类'
  if (value.startsWith('VOLUME_')) return '量能类'
  if (Array.isArray(condition?.params) && condition.params.includes('ma')) return '均线类'
  return '其他'
}

const groupedFilteredOptions = computed(() => {
  const groups = new Map([
    ['均线类', []],
    ['MACD类', []],
    ['KDJ类', []],
    ['BIAS类', []],
    ['量能类', []],
    ['其他', []]
  ])

  for (const item of filteredOptions.value) {
    const source = filteredAvailableConditions.value.find(c => c.value === item.value)
    const groupName = getConditionGroup(source)
    groups.get(groupName).push(item)
  }

  const result = []
  for (const [groupName, options] of groups.entries()) {
    if (!options.length) continue
    result.push([
      { type: 'label', label: groupName },
      ...options
    ])
  }
  return result
})

const timeframeOptions = [
  { label: '日线', value: 'day' },
  { label: '周线', value: 'week' },
  { label: '小时线', value: 'hour' }
]

function createConditionNode(value) {
  const defaultValue = value ?? (filteredOptions.value[0]?.value || filteredAvailableConditions.value[0]?.value || availableConditions[0]?.value)
  return { type: 'condition', value: defaultValue, timeframe: 'day' }
}
function createGroupNode(op = 'AND', children = []) {
  return { type: 'group', op, children }
}

function removeSelf() {
  if (props.parent && typeof props.index === 'number') {
    props.parent.children.splice(props.index, 1)
  }
}
function addCondition(target) {
  target.children.push(createConditionNode())
}
function addGroup(target) {
  target.children.push(createGroupNode('AND', []))
}
</script>

<style scoped>
/* 使用 Nuxt UI 组件，无需额外样式 */
</style>
