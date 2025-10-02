<template>
  <div class="w-full h-full flex flex-col">
    <!-- 面板头部 -->
    <div class="flex items-center justify-between p-4 border-b" style="border-color: var(--border-light);">
      <h2 class="finance-title-lg">分析面板</h2>
      <!-- 面板状态切换按钮 -->
      <div class="flex gap-2">
        <button 
          @click="togglePanelState('normal')"
          class="finance-btn-secondary px-3 py-1 text-sm"
          :class="{ 'finance-btn-primary': panelState === 'normal' }"
        >
          正常
        </button>
        <button 
          @click="togglePanelState('expanded')"
          class="finance-btn-secondary px-3 py-1 text-sm"
          :class="{ 'finance-btn-primary': panelState === 'expanded' }"
        >
          展开
        </button>
        <button 
          @click="togglePanelState('collapsed')"
          class="finance-btn-secondary px-3 py-1 text-sm"
          :class="{ 'finance-btn-primary': panelState === 'collapsed' }"
        >
          收起
        </button>
      </div>
    </div>

    <!-- 面板内容 -->
    <div class="flex-grow overflow-y-auto p-4">
      <!-- MA参数设置 -->
      <div class="mb-6">
        <h3 class="finance-title-md mb-3">MA参数设置</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm mb-1">短期MA</label>
            <input
              v-model.number="maLocal.s"
              type="number"
              class="finance-input w-full"
              min="1"
              @change="updateMA"
            />
          </div>
          <div>
            <label class="block text-sm mb-1">中期MA</label>
            <input
              v-model.number="maLocal.m"
              type="number"
              class="finance-input w-full"
              min="1"
              @change="updateMA"
            />
          </div>
          <div>
            <label class="block text-sm mb-1">长期MA</label>
            <input
              v-model.number="maLocal.l"
              type="number"
              class="finance-input w-full"
              min="1"
              @change="updateMA"
            />
          </div>
          <div>
            <label class="block text-sm mb-1">超长期MA</label>
            <input
              v-model.number="maLocal.x"
              type="number"
              class="finance-input w-full"
              min="1"
              @change="updateMA"
            />
          </div>
        </div>
      </div>

      <!-- 买入条件设置 -->
      <div class="mb-6">
        <h3 class="finance-title-md mb-3">买入条件</h3>
        <div class="space-y-2">
          <div v-for="(condition, index) in buyConditionsLocal" :key="index" class="flex gap-2">
            <select
              v-model="buyConditionsLocal[index][0]"
              class="finance-input flex-1"
              @change="updateBuyConditions"
            >
              <option value="MAM_CROSS_UP_MAL">中期MA上穿长期MA</option>
              <option value="MAS_CROSS_UP_MAM">短期MA上穿中期MA</option>
              <option value="PRICE_CROSS_UP_MAM">价格上穿中期MA</option>
            </select>
            <button
              @click="removeBuyCondition(index)"
              class="finance-btn-danger px-3"
            >
              删除
            </button>
          </div>
          <button
            @click="addBuyCondition"
            class="finance-btn-primary w-full mt-2"
          >
            添加买入条件
          </button>
        </div>
      </div>

      <!-- 卖出条件设置 -->
      <div class="mb-6">
        <h3 class="finance-title-md mb-3">卖出条件</h3>
        <div class="space-y-2">
          <div v-for="(condition, index) in sellConditionsLocal" :key="index" class="flex gap-2">
            <select
              v-model="sellConditionsLocal[index][0]"
              class="finance-input flex-1"
              @change="updateSellConditions"
            >
              <option value="MAM_CROSS_DOWN_MAL">中期MA下穿长期MA</option>
              <option value="MAS_CROSS_DOWN_MAM">短期MA下穿中期MA</option>
              <option value="PRICE_CROSS_DOWN_MAM">价格下穿中期MA</option>
            </select>
            <button
              @click="removeSellCondition(index)"
              class="finance-btn-danger px-3"
            >
              删除
            </button>
          </div>
          <button
            @click="addSellCondition"
            class="finance-btn-primary w-full mt-2"
          >
            添加卖出条件
          </button>
        </div>
      </div>

      <!-- 计算按钮 -->
      <div class="space-y-2">
        <button
          @click="handleCalculation('page')"
          class="finance-btn-primary w-full"
        >
          页内计算
        </button>
        <button
          @click="handleCalculation('all')"
          class="finance-btn-secondary w-full"
        >
          全局计算
        </button>
        <button
          @click="handleCalculation('star')"
          class="finance-btn-secondary w-full"
        >
          星标计算
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  ma: {
    type: Object,
    required: true
  },
  buyConditions: {
    type: Array,
    required: true
  },
  sellConditions: {
    type: Array,
    required: true
  },
  panelState: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:ma', 'update:buyConditions', 'update:sellConditions', 'calculation', 'changePanelState'])

// 本地状态
const maLocal = ref({ ...props.ma })
const buyConditionsLocal = ref([...props.buyConditions])
const sellConditionsLocal = ref([...props.sellConditions])

// 监听属性变化
watch(() => props.ma, (newValue) => {
  maLocal.value = { ...newValue }
}, { deep: true })

watch(() => props.buyConditions, (newValue) => {
  buyConditionsLocal.value = [...newValue]
}, { deep: true })

watch(() => props.sellConditions, (newValue) => {
  sellConditionsLocal.value = [...newValue]
}, { deep: true })

// MA参数更新
function updateMA() {
  emit('update:ma', { ...maLocal.value })
}

// 买入条件管理
function addBuyCondition() {
  buyConditionsLocal.value.push(['MAM_CROSS_UP_MAL'])
  updateBuyConditions()
}

function removeBuyCondition(index) {
  buyConditionsLocal.value.splice(index, 1)
  updateBuyConditions()
}

function updateBuyConditions() {
  emit('update:buyConditions', [...buyConditionsLocal.value])
}

// 卖出条件管理
function addSellCondition() {
  sellConditionsLocal.value.push(['MAM_CROSS_DOWN_MAL'])
  updateSellConditions()
}

function removeSellCondition(index) {
  sellConditionsLocal.value.splice(index, 1)
  updateSellConditions()
}

function updateSellConditions() {
  emit('update:sellConditions', [...sellConditionsLocal.value])
}

// 计算处理
function handleCalculation(type) {
  emit('calculation', {
    type,
    ma: maLocal.value,
    buyConditions: buyConditionsLocal.value,
    sellConditions: sellConditionsLocal.value
  })
}

// 面板状态切换
function togglePanelState(state) {
  emit('changePanelState', state)
}
</script>

<style scoped>
.finance-title-md {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* 滚动条样式 */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: var(--border-light) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: var(--border-light);
  border-radius: 3px;
}
</style>