<template>
  <UModal v-model:open="open" :ui="{ overlay: 'backdrop-blur-sm', width: 'w-full sm:max-w-4xl' }" :title="isEdit?'编辑指标':'新增指标'">
    <!-- 触发按钮放在 UModal 内部 -->
    <UButton :label="triggerLabel" icon="i-lucide-plus" color="info" size="sm" v-if="showTrigger" />
    <template #body>
      <div class="p-4 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">指标名称</label>
            <UInput v-model="form.name" placeholder="如：我的指标A" />
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">指标代码</label>
            <UInput v-model="form.code" placeholder="如：my_indicator_a" />
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">计算方法</label>
            <USelect value-key="name" v-model="form.calcMethod" :items="calcMethodOptions" placeholder="选择计算方法" />
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">指标组</label>
            <USelect value-key="value" v-model="form.group" :items="props.groupOptions" placeholder="选择指标组" />
          </div>
          <div v-if="form.calcMethod!==''" class="col-span-2">
            <label class="block text-sm text-gray-600 mb-1">计算参数</label>
            <IndicatorParamEditor
              v-model="paramEditorValue"
              :indicatorOptions="indicatorExternalOptions"
              :calcMethod="form.calcMethod"
            />
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <UButton @click="handleSubmit" label="保存" color="primary" />
          <UButton @click="handleCancel" label="取消" color="gray" />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup>
import { ref, watch, computed, toRaw } from 'vue'
import IndicatorParamEditor from './IndicatorParamEditor.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  indicator: { type: Object, default: null },
  showTrigger: { type: Boolean, default: true },
  triggerLabel: { type: String, default: '新增指标' },
  groupOptions: {
    type: Array,
    default: () => []
  },
  availableIndicatorOptions: {
    type: Array,
    default: () => []
  },
  calcMethodOptions: {
    type: Array,
    default: () => [
    ]
  }
})

const emit = defineEmits(['update:open', 'submit', 'cancel'])

const open = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

const isEdit = computed(() => !!props.indicator)
const form = ref({ name: '', code: '', calcMethod: '', calcParams: {}, group: 'default' })

// getData 参数的选择逻辑已移至 IndicatorParamEditor 内部
// 使用 form.calcParams 作为参数编辑器的 v-model 来源
const paramEditorValue = computed({
  get: () => form.value.calcParams,
  set: (val) => { form.value.calcParams = val || {} }
})
// 从外部传入的指标列表，供参数编辑器使用（第二和第五个下拉）
const indicatorExternalOptions = computed(() => {
  const a = props.availableIndicatorOptions.map(({name,code}) => {
    return {label:name,value:code}
  })
  console.log(a)
  return a
})

watch(
  () => props.indicator,
  (ind) => {
    console.log(ind)
    if (ind) {
      form.value = {
        name: ind.name || '',
        code: ind.code || '',
        calcMethod: ind.calcMethod || '',
        calcParams: ind.calcParams || {},
        group: ind.group || 'default'
      }
      // 初始化参数：直接回填 calcParams，具体渲染逻辑在参数编辑器中处理
      form.value.calcParams = form.value.calcParams || {}
      open.value = true
    } else {
      // 创建模式
      form.value = { name: '', code: '', calcMethod: '', calcParams: {}, group: 'default' }
      form.value.calcParams = {}
    }
  },
  { immediate: true }
)

function handleSubmit() {
  try {
    const payload = { ...form.value, calcParams: toRaw(form.value.calcParams)}
    emit('submit', { payload, isEdit: isEdit.value })
    open.value = false
  } catch (e) {
    // 简单提示即可，保持统一风格
    window.alert(e.message || '参数错误')
  }
}

function handleCancel() {
  emit('cancel')
  open.value = false
}
</script>

<style scoped>
/* 保持统一简洁风格 */
</style>