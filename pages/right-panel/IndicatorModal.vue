<template>
  <UModal v-model:open="open" :ui="{ overlay: 'backdrop-blur-sm' }" title="指标编辑">
    <!-- 触发按钮放在 UModal 内部 -->
    <UButton :label="triggerLabel" icon="i-lucide-plus" color="primary" size="sm" v-if="showTrigger" />
    <template #body>
      <div class="p-4 space-y-4">
        <h3 class="text-lg font-medium">{{ isEdit ? '编辑指标' : '新增指标' }}</h3>
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
            <label class="block text-sm text-gray-600 mb-1">使用的基础指标</label>
            <USelectMenu v-model="form.usedIndicators" :options="availableIndicatorOptions" multiple placeholder="选择所用基础指标" />
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">计算方法</label>
            <USelectMenu v-model="form.calcMethod" :options="calcMethodOptions" placeholder="选择计算方法" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm text-gray-600 mb-1">计算参数（JSON）</label>
            <UTextarea v-model="formParamsText" :rows="6" placeholder='{"window": 14}' />
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
import { ref, watch, computed } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  indicator: { type: Object, default: null },
  showTrigger: { type: Boolean, default: true },
  triggerLabel: { type: String, default: '新增指标' },
  availableIndicatorOptions: {
    type: Array,
    default: () => [
      { label: 'MA 均线', value: 'ma' },
      { label: 'MACD', value: 'macd' }
    ]
  },
  calcMethodOptions: {
    type: Array,
    default: () => [
      { label: '简单移动平均 (SMA)', value: 'sma' },
      { label: '指数移动平均 (EMA)', value: 'ema' },
      { label: 'MACD 默认', value: 'macd_default' }
    ]
  }
})

const emit = defineEmits(['update:open', 'submit', 'cancel'])

const open = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

const isEdit = computed(() => !!props.indicator)
const form = ref({ name: '', code: '', usedIndicators: [], calcMethod: '', calcParams: {} })
const formParamsText = ref('')

watch(
  () => props.indicator,
  (ind) => {
    if (ind) {
      form.value = {
        name: ind.name || '',
        code: ind.code || '',
        usedIndicators: Array.isArray(ind.usedIndicators) ? [...ind.usedIndicators] : [],
        calcMethod: ind.calcMethod || '',
        calcParams: ind.calcParams || {}
      }
      formParamsText.value = JSON.stringify(form.value.calcParams || {}, null, 2)
      open.value = true
    } else {
      // 创建模式
      form.value = { name: '', code: '', usedIndicators: [], calcMethod: '', calcParams: {} }
      formParamsText.value = ''
    }
  },
  { immediate: true }
)

function parseParamsText() {
  try {
    const obj = formParamsText.value ? JSON.parse(formParamsText.value) : {}
    return obj
  } catch (e) {
    throw new Error('计算参数必须是合法 JSON')
  }
}

function handleSubmit() {
  try {
    const payload = { ...form.value, calcParams: parseParamsText() }
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