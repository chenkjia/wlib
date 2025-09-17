<template>
  <div class="trade-stats-bar">
    <div class="stat-item">
      <span class="stat-label">交易:</span>
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
      <span class="stat-value" :class="winRateClass">{{ stats.winRate }}%</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">平均:</span>
      <span class="stat-value" :class="avgProfitClass">{{ stats.avgProfit }}%</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">累计:</span>
      <span class="stat-value" :class="totalProfitClass">{{ stats.totalProfit }}%</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  transactions: {
    type: Array,
    default: () => []
  }
})

// 计算交易统计数据
const stats = computed(() => {
  const transactions = props.transactions || []
  
  // 默认值
  const defaultStats = {
    totalTrades: 0,
    profitTrades: 0,
    lossTrades: 0,
    winRate: '0.00',
    avgProfit: '0.00',
    totalProfit: '0.00'
  }
  
  if (!transactions.length) return defaultStats
  
  // 计算统计数据
  const completedTrades = transactions.filter(t => t.sellTime) // 只计算已完成的交易
  const totalTrades = completedTrades.length
  
  if (totalTrades === 0) return defaultStats
  
  const profitTrades = completedTrades.filter(t => t.profit > 0).length
  const lossTrades = completedTrades.filter(t => t.profit <= 0).length
  
  const winRate = totalTrades > 0 ? (profitTrades / totalTrades * 100).toFixed(2) : '0.00'
  
  const profits = completedTrades.map(t => t.profit || 0)
  const avgProfit = profits.length > 0 
    ? (profits.reduce((sum, profit) => sum + profit, 0) / profits.length).toFixed(2) 
    : '0.00'
  
  const totalProfit = profits.length > 0 
    ? profits.reduce((sum, profit) => sum + profit, 0).toFixed(2) 
    : '0.00'
  
  return {
    totalTrades,
    profitTrades,
    lossTrades,
    winRate,
    avgProfit,
    totalProfit
  }
})

// 计算CSS类
const winRateClass = computed(() => {
  const rate = parseFloat(stats.value.winRate)
  if (rate > 50) return 'profit'
  if (rate < 50) return 'loss'
  return ''
})

const avgProfitClass = computed(() => {
  const profit = parseFloat(stats.value.avgProfit)
  if (profit > 0) return 'profit'
  if (profit < 0) return 'loss'
  return ''
})

const totalProfitClass = computed(() => {
  const profit = parseFloat(stats.value.totalProfit)
  if (profit > 0) return 'profit'
  if (profit < 0) return 'loss'
  return ''
})
</script>

<style scoped>
.trade-stats-bar {
  width: 100%;
  background-color: #000000;
  border-radius: 0;
  margin-bottom: 0;
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  box-shadow: none;
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

.profit {
  color: #00da3c;
}

.loss {
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