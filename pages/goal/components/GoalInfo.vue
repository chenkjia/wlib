<script setup>
import { ref } from 'vue'

const props = defineProps({
  goal: {
    type: Object,
    required: true
  },
  visible: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:visible'])

// 格式化函数
function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function formatDateTime(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatPrice(price) {
  if (price === null || price === undefined) return '-'
  return price.toFixed(2)
}

function formatProfit(profit) {
  if (profit === null || profit === undefined) return '-'
  return `${profit > 0 ? '+' : ''}${profit.toFixed(2)}%`
}

function getProfitClass(profit) {
  if (profit === null || profit === undefined) return ''
  return profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-600' : ''
}

function getTrendCategoryText(category) {
  const categoryMap = {
    'NEW_HIGH': '新高',
    'REBOUND': '反弹',
    'NORMAL': '普通'
  }
  return categoryMap[category] || category
}

function getTrendCategoryClass(category) {
  const classMap = {
    'NEW_HIGH': 'text-red-600 bg-red-50',
    'REBOUND': 'text-green-600 bg-green-50',
    'NORMAL': 'text-gray-600 bg-gray-50'
  }
  return classMap[category] || 'text-gray-600 bg-gray-50'
}

function formatDuration(duration) {
  if (!duration) return '-'
  return `${duration}天`
}

function formatDailyProfit(dailyProfit) {
  if (dailyProfit === null || dailyProfit === undefined) return '-'
  return `${dailyProfit > 0 ? '+' : ''}${dailyProfit.toFixed(2)}%`
}

function toggleVisibility() {
  emit('update:visible', !props.visible)
}
</script>

<template>
  <div class="goal-info" :class="{ 'collapsed': !visible }">
    <div class="info-header" :class="{ 'collapsed-header': !visible }">
      <h2 v-if="visible" class="text-xl font-bold">目标信息</h2>
      <button @click="toggleVisibility" class="toggle-btn" title="切换显示/隐藏">
        <i :class="visible ? 'icon-collapse' : 'icon-expand'" aria-hidden="true"></i>
      </button>
    </div>
    
    <div v-if="visible" class="info-content">
      <!-- 基本信息 -->
      <div class="info-section">
        <h3 class="section-title">基本信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">股票代码:</span>
            <span class="value font-medium">{{ goal.stockCode }}</span>
          </div>
          <div class="info-item">
            <span class="label">趋势类型:</span>
            <span class="value" :class="getTrendCategoryClass(goal.trendCategory)">
              {{ getTrendCategoryText(goal.trendCategory) }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">开始时间:</span>
            <span class="value">{{ formatDateTime(goal.startTime) }}</span>
          </div>
          <div class="info-item">
            <span class="label">开始价格:</span>
            <span class="value">{{ formatPrice(goal.startPrice) }}</span>
          </div>
          <div class="info-item">
            <span class="label">结束时间:</span>
            <span class="value">{{ formatDateTime(goal.endTime) }}</span>
          </div>
          <div class="info-item">
            <span class="label">结束价格:</span>
            <span class="value">{{ formatPrice(goal.endPrice) }}</span>
          </div>
        </div>
      </div>
      
      <!-- 收益信息 -->
      <div class="info-section">
        <h3 class="section-title">收益信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">总盈亏:</span>
            <span class="value font-medium" :class="getProfitClass(goal.profit)">
              {{ formatProfit(goal.profit) }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">持续天数:</span>
            <span class="value">{{ formatDuration(goal.duration) }}</span>
          </div>
          <div class="info-item">
            <span class="label">日均利润:</span>
            <span class="value" :class="getProfitClass(goal.dailyProfit)">
              {{ formatDailyProfit(goal.dailyProfit) }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">使用斜率分析:</span>
            <span class="value">{{ goal.usedSlopeAnalysis ? '是' : '否' }}</span>
          </div>
        </div>
      </div>
      
      <!-- 流动性统计 -->
      <div v-if="goal.liquidityStats" class="info-section">
        <h3 class="section-title">流动性统计</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">平均成交量:</span>
            <span class="value">{{ goal.liquidityStats.avgVolume?.toLocaleString() || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">平均成交额:</span>
            <span class="value">{{ goal.liquidityStats.avgAmount?.toLocaleString() || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">换手率:</span>
            <span class="value">{{ goal.liquidityStats.turnoverRate ? `${goal.liquidityStats.turnoverRate.toFixed(2)}%` : '-' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.goal-info {
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: width 0.3s ease;
  width: 100%;
  background-color: white;
}

.goal-info.collapsed {
  width: 40px;
}

.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.collapsed-header {
  justify-content: center;
  padding: 0.5rem;
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  color: #4b5563;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-btn:hover {
  color: #1f2937;
}

.icon-collapse::before {
  content: '▶';
  font-style: normal;
}

.icon-expand::before {
  content: '◀';
  font-style: normal;
}

.info-content {
  flex: 1;
  overflow: auto;
  padding: 1rem;
}

.info-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.25rem;
}

.value {
  font-size: 1rem;
}

.text-green-600 {
  color: #059669;
}

.text-red-600 {
  color: #dc2626;
}

.bg-red-50 {
  background-color: #fef2f2;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.bg-green-50 {
  background-color: #f0fdf4;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.bg-gray-50 {
  background-color: #f9fafb;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}
</style>