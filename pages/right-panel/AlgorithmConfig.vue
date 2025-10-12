<template>
  <div class="algorithm-config">
    <div class="mb-4">
      <!-- 条件组列表 -->
      <div class="space-y-3">
        <div v-for="(group, groupIndex) in algorithmGroups" :key="groupIndex" class="border rounded-md p-3 bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700 truncate">条件组 {{ groupIndex + 1 }}：{{ summarizeNode(group) }}</div>
            <div class="flex items-center space-x-2">
              <button 
                @click="openEditor(groupIndex)" 
                class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                编辑条件
              </button>
              <button 
                @click="removeGroup(groupIndex)" 
                class="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                删除组
              </button>
            </div>
          </div>
          <div v-if="isGroupEmpty(group)" class="text-xs text-red-500 mt-2">请至少在该条件组中添加一个条件</div>
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

    <!-- 条件编辑器弹窗 -->
    <div v-if="showEditor" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div class="bg-white rounded-md shadow-lg w-[90%] max-w-2xl">
        <div class="px-4 py-3 border-b">
          <h3 class="text-base font-medium text-gray-800">编辑条件组</h3>
        </div>
        <div class="p-4 space-y-3">
          <div class="text-sm text-gray-600">使用与(AND) / 或(OR) / 非(NOT) 组合条件，可无限嵌套。</div>
          <TreeNodeEditor :node="editingNode" />
        </div>
        <div class="px-4 py-3 border-t flex justify-end space-x-2">
          <button 
            @click="cancelEditor"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-1 focus:ring-gray-300"
          >取消</button>
          <button 
            @click="saveEditor"
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
          >保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch, defineComponent, h } from 'vue'
import { availableConditions, algorithmMap } from '~/utils/algorithmUtils.js'

const props = defineProps({
  // 算法类型：'buy' 或 'sell'
  type: {
    type: String,
    required: true,
    validator: (value) => ['buy', 'sell'].includes(value)
  },
  // 初始算法配置（兼容旧结构：数组；新结构：条件树）
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

// 根据启用的指标过滤可用条件
const filteredAvailableConditions = computed(() => {
  return availableConditions.filter(condition => {
    if (!condition.params || condition.params.length === 0) {
      return true
    }
    return condition.params.every(param => props.enabledIndicators.includes(param))
  })
})

// 节点与组的基础结构
function createConditionNode(value) {
  // 若未提供，默认取第一个可用条件
  const defaultValue = value ?? (filteredAvailableConditions.value[0]?.value || availableConditions[0]?.value)
  return { type: 'condition', value: defaultValue }
}

function createGroupNode(op = 'AND', children = []) {
  return { type: 'group', op, children }
}

function isTreeNode(value) {
  return value && typeof value === 'object' && value.type
}

function normalizeGroup(input) {
  // 旧结构：数组 ['COND_A', 'COND_B'] -> 组(AND) 包含多个条件节点
  if (Array.isArray(input)) {
    return createGroupNode('AND', input.map(v => createConditionNode(v)))
  }
  // 新结构：已是树
  if (isTreeNode(input)) return input
  // 默认空组
  return createGroupNode('AND', [])
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// 算法组数据结构 - 使用props中的initialValue进行初始化（转换为树结构）
const algorithmGroups = ref(
  (props.initialValue && props.initialValue.length > 0)
    ? props.initialValue.map(normalizeGroup)
    : [createGroupNode('AND', [])]
)

watch(() => props.initialValue, (newValue) => {
  const normalized = (newValue && newValue.length > 0)
    ? newValue.map(normalizeGroup)
    : [createGroupNode('AND', [])]
  if (JSON.stringify(algorithmGroups.value) !== JSON.stringify(normalized)) {
    algorithmGroups.value = deepClone(normalized)
  }
}, { deep: true })

// 监听配置变化，向父组件发送更新（直接发送树结构）
watch(algorithmGroups, (newValue) => {
  emit('update:value', deepClone(newValue))
}, { deep: true })

// 条件编辑器状态
const showEditor = ref(false)
const activeGroupIndex = ref(-1)
const editingNode = ref(createGroupNode('AND', []))

function openEditor(groupIndex) {
  activeGroupIndex.value = groupIndex
  editingNode.value = deepClone(algorithmGroups.value[groupIndex] ?? createGroupNode('AND', []))
  showEditor.value = true
}

function cancelEditor() {
  showEditor.value = false
  activeGroupIndex.value = -1
}

function saveEditor() {
  if (activeGroupIndex.value >= 0) {
    algorithmGroups.value[activeGroupIndex.value] = deepClone(editingNode.value)
  }
  cancelEditor()
}

// 添加条件组
function addGroup() {
  algorithmGroups.value.push(createGroupNode('AND', []))
}

// 删除条件组
function removeGroup(groupIndex) {
  algorithmGroups.value.splice(groupIndex, 1)
}

// 获取条件标签
function getConditionLabel(value) {
  return algorithmMap[value]?.label ?? value
}

// 组是否为空
function isGroupEmpty(group) {
  return group?.type === 'group' && (!group.children || group.children.length === 0)
}

// 摘要描述
function summarizeNode(node) {
  if (!node) return '空'
  if (node.type === 'condition') {
    return getConditionLabel(node.value)
  }
  if (node.type === 'group') {
    if (!node.children || node.children.length === 0) return `${node.op}(空)`
    const inner = node.children.map(child => summarizeNode(child))
    if (node.op === 'NOT') {
      return `非(${inner[0] ?? '空'})`
    }
    const sep = node.op === 'AND' ? ' 且 ' : ' 或 '
    return inner.join(sep)
  }
  return '未知'
}

// 递归条件编辑器组件
const TreeNodeEditor = defineComponent({
  name: 'TreeNodeEditor',
  props: {
    node: { type: Object, required: true },
    parent: { type: Object, required: false },
    index: { type: Number, required: false }
  },
  setup(props) {
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
    return () => {
      const node = props.node
      if (!node) return h('div')

      if (node.type === 'condition') {
        return h('div', { class: 'flex items-center space-x-2 p-2 border rounded-md bg-white' }, [
          h('select', {
            class: 'flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500',
            value: node.value,
            onChange: (e) => { node.value = e.target.value }
          }, filteredAvailableConditions.value.map(c => h('option', { value: c.value }, c.label))),
          h('button', {
            class: 'px-2 py-1 text-red-600 bg-red-100 hover:bg-red-200 rounded-md text-sm',
            onClick: removeSelf
          }, '删除')
        ])
      }

      if (node.type === 'group') {
        return h('div', { class: 'space-y-2 p-2 border rounded-md bg-white' }, [
          // 操作符选择
          h('div', { class: 'flex items-center space-x-2' }, [
            h('label', { class: 'text-sm text-gray-600' }, '逻辑操作符'),
            h('select', {
              class: 'px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500',
              value: node.op,
              onChange: (e) => { node.op = e.target.value }
            }, [
              h('option', { value: 'AND' }, 'AND'),
              h('option', { value: 'OR' }, 'OR'),
              h('option', { value: 'NOT' }, 'NOT')
            ]),
            props.parent ? h('button', {
              class: 'ml-auto px-2 py-1 text-red-600 bg-red-100 hover:bg-red-200 rounded-md text-sm',
              onClick: removeSelf
            }, '删除该组') : null
          ]),

          // 子节点列表
          h('div', { class: 'space-y-2' },
            node.children.map((child, i) => h(TreeNodeEditor, { node: child, parent: node, index: i }))
          ),

          // 添加按钮
          h('div', { class: 'flex items-center space-x-2' }, [
            h('button', {
              class: 'px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm',
              onClick: () => addCondition(node)
            }, '添加条件'),
            h('button', {
              class: 'px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm',
              onClick: () => addGroup(node)
            }, '添加子组')
          ])
        ])
      }

      return h('div')
    }
  }
})
</script>

<style scoped>
.algorithm-config {
  max-width: 100%;
  overflow-x: hidden;
}
</style>