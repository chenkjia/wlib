<template>
  <div class="flex items-center gap-2">
    <template v-if="calcMethod === 'getData'">
      <!-- getData: 数据字段选择 -->
      <USelect value-key="value" v-model="dataField" :items="getDataFieldOptions" />
    </template>
    <template v-else-if="calcMethod === 'calculateMA' || calcMethod === 'calculateEMA'">
      <USelect class="w-120" value-key="value" v-model="indicatorField" :items="indicatorOptions" />
      <!-- calculateMA: 移动平均线参数 -->
      <UInput v-model="days" type="number" placeholder="移动平均线天数" />
    </template>
    <template v-else-if="calcMethod === 'compare'">
      <!-- 通用：五个下拉选择器 -->
      <!-- 第一个：时间选择（当天、前一天、前2天） -->
      <USelect class="w-120" value-key="value" v-model="timeA" :items="timeOptions" />
      <!-- 第二个：指标选择（从外部传入列表） -->
      <USelect class="w-120" value-key="value" v-model="indicatorA" :items="indicatorOptions" />
      <!-- 第三个：操作符（相等、大于、小于、与、或者） -->
      <USelect class="w-120" value-key="value" v-model="operator" :items="operatorOptions" />
      <!-- 第四个：时间选择（当天、前一天、前2天） -->
      <USelect class="w-120" value-key="value" v-model="timeB" :items="timeOptions" />
      <!-- 第五个：指标选择（从外部传入列表） -->
      <USelect class="w-120" value-key="value" v-model="indicatorB" :items="indicatorOptions" />
    </template>
  </div>

  <!-- 可选：调试输出 -->
  <!-- <pre class="mt-2 text-xs text-gray-500">{{ localValue }}</pre> -->
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  indicatorOptions: { type: Array, default: () => [] },
  calcMethod: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

// 固定的时间选项（第一个和第四个使用相同的选项）
const timeOptions = [
  { label: '当天', value: 0 },
  { label: '前1天', value: 1 },
  { label: '前2天', value: 2 }
]

// 操作符选项（第三个选择）
const operatorOptions = [
  { label: '相等', value: 'equals' },
  { label: '大于', value: 'gt' },
  { label: '小于', value: 'lt' },
]

// getData 的数据字段选项
const getDataFieldOptions = [
  { label: '开盘价', value: 'open' },
  { label: '收盘价', value: 'close' },
  { label: '最低价', value: 'low' },
  { label: '最高价', value: 'high' },
  { label: '成交量', value: 'volume' },
  { label: '换手率', value: 'turnoverRate' }
]

// 本地状态（五个选择 / 或 getData 字段）
const timeA = ref(0)
const indicatorA = ref('')
const operator = ref('eq')
const timeB = ref(0)
const indicatorB = ref('')
const dataField = ref('close')
const indicatorField = ref('')
const days = ref(0)

const localValue = computed(() => ({
  timeA: timeA.value,
  indicatorA: indicatorA.value,
  operator: operator.value,
  timeB: timeB.value,
  indicatorB: indicatorB.value,
  dataField: dataField.value,
  indicatorField: indicatorField.value,
  days: days.value
}))

// 将本地变更同步到父组件 v-model
watch(localValue, (val) => {
  emit('update:modelValue', val)
})


// 初始化与外部值变化同步到本地
watch(
  () => props.modelValue,
  (val) => {
    if (!val || typeof val !== 'object') return
    dataField.value = val.dataField ?? 'close'
    // 通用参数初始化
    timeA.value = val.timeA ?? 0
    indicatorA.value = val.indicatorA ?? ''
    operator.value = val.operator ?? 'eq'
    timeB.value = val.timeB ?? 0
    indicatorB.value = val.indicatorB ?? ''
    // 移动平均线参数初始化
    indicatorField.value = val.indicatorField ?? ''
    days.value = val.days ?? 0
  },
  { immediate: true, deep: true }
)

// 当计算方法切换时，确保本地状态与外部值一致
watch(
  () => props.calcMethod,
  update,
  { immediate: true }
)
function update() {
  if (props.calcMethod === 'getData') {
    emit('update:modelValue', { dataField: dataField.value })
  } else if (props.calcMethod === 'calculateMA' || props.calcMethod === 'calculateEMA') {
    emit('update:modelValue', { indicatorField: indicatorField.value, days: days.value })
  } else if (props.calcMethod === 'compare') {
    emit('update:modelValue', {
      timeA: timeA.value,
      indicatorA: indicatorA.value,
      operator: operator.value,
      timeB: timeB.value,
      indicatorB: indicatorB.value
    })
  }
}
</script>

<style scoped>
</style>