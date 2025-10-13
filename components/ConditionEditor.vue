<template>
  <!-- 使用 Nuxt UI 的 Modal 组件美化弹窗 -->
  <UModal v-model:open="open" title="编辑条件组" description="使用与(AND) / 或(OR) / 非(NOT) 组合条件，可无限嵌套。">
    <template #body>
      <TreeNodeEditor :node="node" :enabledIndicators="enabledIndicators" />
    </template>
    <template #footer="{ close }">
      <UButton label="取消" color="neutral" variant="outline" @click="handleCancel(close)" />
      <UButton label="保存" color="primary" @click="handleSave(close)" />
    </template>
  </UModal>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import { availableConditions } from '~/utils/algorithmUtils.js'
import TreeNodeEditor from '~/components/TreeNodeEditor.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  node: { type: Object, required: true },
  enabledIndicators: { type: Array, default: () => ['ma', 'macd'] }
})

const emit = defineEmits(['cancel', 'save'])

// 绑定到 Nuxt UI 的 UModal v-model:open
const open = computed({
  get: () => props.show,
  set: (val) => {
    // 当 Modal 关闭时，通知父组件取消
    if (!val) emit('cancel')
  }
})

// 根据启用的指标过滤可用条件（与主界面一致的规则）
const filteredAvailableConditions = computed(() => {
  return availableConditions.filter(condition => {
    if (!condition.params || condition.params.length === 0) {
      return true
    }
    return condition.params.every(param => props.enabledIndicators.includes(param))
  })
})
const filteredOptions = computed(() => filteredAvailableConditions.value.map(c => ({ label: c.label, value: c.value })))

// 节点与组的基础结构
function createConditionNode(value) {
  const defaultValue = value ?? (filteredOptions.value[0]?.value || filteredAvailableConditions.value[0]?.value || availableConditions[0]?.value)
  return { type: 'condition', value: defaultValue }
}

function createGroupNode(op = 'AND', children = []) {
  return { type: 'group', op, children }
}

function handleCancel(close) {
  emit('cancel')
  close?.()
}
function handleSave(close) {
  // 将当前编辑的节点作为负载传递，父组件负责写回
  emit('save', props.node)
  close?.()
}
</script>

<style scoped>
/* 使用 Nuxt UI 组件，无需额外样式 */
</style>