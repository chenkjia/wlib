<template>
  <!-- 使用 Nuxt UI 的 Modal 组件美化弹窗 -->
  <UModal v-model:open="open" title="编辑条件组" description="使用与(AND) / 或(OR) / 非(NOT) 组合条件，可无限嵌套。">
    <template #body>
      <div class="mb-3 rounded-md border border-gray-200 bg-gray-50 p-3">
        <div class="mb-2 text-xs font-medium text-gray-600">快捷预设（点击后直接替换当前条件组）</div>
        <div class="grid grid-cols-1 gap-2">
          <button
            v-for="preset in quickPresets"
            :key="preset.key"
            type="button"
            class="rounded-md border px-3 py-2 text-left text-xs transition-colors"
            :class="preset.disabled
              ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
              : 'border-blue-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'"
            :disabled="preset.disabled"
            @click="applyPreset(preset)"
          >
            <div class="font-medium">{{ preset.label }}</div>
            <div class="mt-1 text-[11px] text-gray-500">{{ preset.desc }}</div>
          </button>
        </div>
      </div>
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
  return { type: 'condition', value: defaultValue, timeframe: 'day' }
}

function createGroupNode(op = 'AND', children = []) {
  return { type: 'group', op, children }
}

const presetDefinitions = [
  {
    key: 'mid-long-uptrend',
    label: '中长期上升期间',
    desc: '收盘价高于长期均线 + MACD DIF 大于0轴 + 长期均线向上',
    requiredIndicators: ['ma', 'macd'],
    op: 'AND',
    conditions: ['CLOSE_GT_MAL', 'MACD_DIF_GT_ZERO', 'MAL_UP']
  },
  {
    key: 'multi-bull',
    label: '多头趋势延续',
    desc: '中期均线高于长期 + DIF 在 DEA 上方 + 长期均线向上',
    requiredIndicators: ['ma', 'macd'],
    op: 'AND',
    conditions: ['MAM_GT_MAL', 'MACD_DIF_GT_DEA', 'MAL_UP']
  },
  {
    key: 'breakout',
    label: '强势突破',
    desc: '当天突破历史新高 + DIF 大于0轴 + 收盘价高于中期均线',
    requiredIndicators: ['ma', 'macd'],
    op: 'AND',
    conditions: ['PRICE_BREAK_ALL_TIME_HIGH_TODAY', 'MACD_DIF_GT_ZERO', 'CLOSE_GT_MAM']
  },
  {
    key: 'repair',
    label: '低位修复',
    desc: '绿柱抽脚 + DIF 不超过5 + 收盘价高于长期均线',
    requiredIndicators: ['ma', 'macd'],
    op: 'AND',
    conditions: ['MACD_GREEN_BAR_PULL_LEG', 'MACD_DIF_LTE_5', 'CLOSE_GT_MAL']
  }
]

const quickPresets = computed(() => {
  return presetDefinitions.map((preset) => {
    const disabled = preset.requiredIndicators.some(indicator => !props.enabledIndicators.includes(indicator))
    return { ...preset, disabled }
  })
})

function applyPreset(preset) {
  if (!preset || preset.disabled) return
  const conditions = Array.isArray(preset.conditions) ? preset.conditions : []
  const children = conditions.map(value => createConditionNode(value))
  const root = createGroupNode(preset.op || 'AND', children)
  props.node.type = root.type
  props.node.op = root.op
  props.node.children = root.children
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
