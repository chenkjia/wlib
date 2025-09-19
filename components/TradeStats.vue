<template>
  <div class="trade-stats-container">
    <!-- 第一行：交易相关指标 -->
    <div class="trade-stats-bar">
      <div class="stat-item">
        <span class="stat-label">交易总天数:</span>
        <span class="stat-value">{{ stats.daysDuration }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">交易总涨跌幅:</span>
        <span class="stat-value" :class="priceChangeClass">{{ formatNumber(stats.priceChange) }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">交易日均涨跌幅:</span>
        <span class="stat-value" :class="dailyChangeClass">{{ formatNumber(stats.dailyChange) }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">交易笔数:</span>
        <span class="stat-value">{{ stats.totalTrades }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">盈/亏:</span>
        <span class="stat-value">
          <span class="profit">{{ stats.profitTrades }}</span>/<span class="loss">{{ stats.lossTrades }}</span>
        </span>
      </div>
      <div class="stat-item">
        <span class="stat-label">胜率:</span>
        <span class="stat-value" :class="winRateClass">{{ formatNumber(stats.winRate) }}%</span>
      </div>
    </div>
    
    <!-- 第二行：日线及对比指标 -->
    <div class="trade-stats-bar">
      <div class="stat-item">
        <span class="stat-label">日线总天数:</span>
        <span class="stat-value">{{ stats.dayLineCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">日线总涨跌幅:</span>
        <span class="stat-value" :class="dayLinePriceChangeClass">{{ formatNumber(stats.dayLinePriceChange) }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">日线日均涨跌幅:</span>
        <span class="stat-value" :class="dayLineDailyChangeClass">{{ formatNumber(stats.dayLineDailyChange) }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">涨跌幅差值:</span>
        <span class="stat-value" :class="priceChangeDiffClass">{{ formatNumber(stats.priceChangeDiff) }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">日均差值:</span>
        <span class="stat-value" :class="dailyChangeDiffClass">{{ formatNumber(stats.dailyChangeDiff) }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">最大回撤:</span>
        <span class="stat-value" :class="maxDrawdownClass">{{ formatNumber(stats.maxDrawdown) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  backtestData: {
    type: Object,
    default: () => ({})
  }
})

// 格式化数字，保留两位小数
const formatNumber = (value) => {
  if (value === undefined || value === null) return '0.00'
  return Number(value).toFixed(2)
}

// 计算交易统计数据
const stats = computed(() => {
  const data = props.backtestData || {}
  
  // 使用backtestData中的数据，如果不存在则使用默认值
  return {
    // 交易相关指标
    totalTrades: data.totalTrades || 0,
    profitTrades: data.profitTrades || 0,
    lossTrades: data.lossTrades || 0,
    winRate: data.winRate || 0,
    daysDuration: data.daysDuration || 0,
    priceChange: data.priceChange || 0,
    dailyChange: data.dailyChange || 0,
    maxDrawdown: data.maxDrawdown || 0,
    
    // 日线相关指标
    dayLineCount: data.dayLineCount || 0,
    dayLinePriceChange: data.dayLinePriceChange || 0,
    dayLineDailyChange: data.dayLineDailyChange || 0,
    
    // 对比指标
    priceChangeDiff: data.priceChangeDiff || 0,
    dailyChangeDiff: data.dailyChangeDiff || 0
  }
})

// 计算CSS类 - 交易相关指标
const winRateClass = computed(() => stats.value.winRate >= 50 ? 'positive' : 'negative')

const priceChangeClass = computed(() => stats.value.priceChange > 0 ? 'positive' : 'negative')

const dailyChangeClass = computed(() => stats.value.dailyChange > 0 ? 'positive' : 'negative')

// 计算CSS类 - 日线相关指标
const dayLinePriceChangeClass = computed(() => stats.value.dayLinePriceChange > 0 ? 'positive' : 'negative')

const dayLineDailyChangeClass = computed(() => stats.value.dayLineDailyChange > 0 ? 'positive' : 'negative')

// 计算CSS类 - 对比指标
const priceChangeDiffClass = computed(() => stats.value.priceChangeDiff > 0 ? 'positive' : 'negative')

const dailyChangeDiffClass = computed(() => stats.value.dailyChangeDiff > 0 ? 'positive' : 'negative')

const maxDrawdownClass = computed(() => 'negative') // 最大回撤始终为负面指标
</script>

<style scoped>
.trade-stats-container {
  width: 100%;
  background-color: #000000;
  border-radius: 0;
  margin-bottom: 0;
  box-shadow: none;
  display: flex;
  flex-direction: column;
}

.trade-stats-bar {
  width: 100%;
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  border-bottom: 1px solid #222;
}

.trade-stats-bar:last-child {
  border-bottom: none;
}

.stat-item {
  display: flex;
  align-items: center;
  margin-right: 12px;
  white-space: nowrap;
}

.stat-label {
  font-size: 12px;
  color: #aaa;
  margin-right: 4px;
}

.stat-value {
  font-size: 13px;
  font-weight: bold;
  color: #fff;
}

.positive {
  color: #00da3c;
}

.negative {
  color: #ec0000;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .trade-stats-bar {
    padding: 2px 4px;
  }
  
  .stat-item {
    margin-right: 6px;
  }
  
  .stat-label, .stat-value {
    font-size: 11px;
  }
}
</style>