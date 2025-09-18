<template>
  <div class="calculation-queue-status">
    <div class="status-header">
      <h3 class="text-lg font-medium">计算队列状态</h3>
      <span v-if="isProcessing" class="processing-badge">处理中</span>
    </div>
    
    <div class="status-content">
      <div class="status-item">
        <span class="label">队列长度:</span>
        <span class="value">{{ queueLength }}</span>
      </div>
      
      <div v-if="currentTask" class="current-task">
        <div class="task-header">
          <span class="label">当前任务:</span>
          <span class="task-id">{{ currentTask.id }}</span>
        </div>
        <div class="task-details">
          <div class="task-param">
            <span class="param-label">MA参数:</span>
            <span class="param-value">
              S:{{ currentTask.params.ma.s }}, 
              M:{{ currentTask.params.ma.m }}, 
              L:{{ currentTask.params.ma.l }}, 
              X:{{ currentTask.params.ma.x }}
            </span>
          </div>
          <div class="task-time">
            <span class="time-label">添加时间:</span>
            <span class="time-value">{{ formatTime(currentTask.addedAt) }}</span>
          </div>
        </div>
      </div>
      
      <div v-if="pendingTasks.length > 0" class="pending-tasks">
        <div class="pending-header">
          <span class="label">等待中的任务:</span>
          <span class="count">{{ pendingTasks.length }}</span>
        </div>
        <ul class="task-list">
          <li v-for="task in pendingTasks.slice(0, 3)" :key="task.id" class="task-item">
            <span class="task-id">{{ task.id }}</span>
            <span class="task-time">{{ formatTime(task.addedAt) }}</span>
          </li>
          <li v-if="pendingTasks.length > 3" class="more-tasks">
            还有 {{ pendingTasks.length - 3 }} 个任务...
          </li>
        </ul>
      </div>
      
      <div class="completed-count">
        <span class="label">已完成任务:</span>
        <span class="value">{{ completedCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 状态数据
const queueLength = ref(0)
const isProcessing = ref(false)
const currentTask = ref(null)
const pendingTasks = ref([])
const completedCount = ref(0)

// 监听器ID
const listenerId = `queue_status_${Date.now()}`
let calculationQueueService = null

// 格式化时间
function formatTime(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 更新状态
function updateStatus(status) {
  queueLength.value = status.queueLength
  isProcessing.value = status.isProcessing
  currentTask.value = status.currentTask
  pendingTasks.value = status.pendingTasks
  completedCount.value = status.completedCount
}

// 组件挂载时初始化
onMounted(async () => {
  try {
    // 导入计算队列服务
    calculationQueueService = await import('~/services/CalculationQueueService.js').then(m => m.default)
    
    // 获取初始状态
    const status = calculationQueueService.getStatus()
    updateStatus(status)
    
    // 添加状态监听器
    calculationQueueService.addListener(listenerId, updateStatus)
  } catch (error) {
    console.error('初始化队列状态组件失败:', error)
  }
})

// 组件卸载时清理
onUnmounted(() => {
  if (calculationQueueService) {
    calculationQueueService.removeListener(listenerId)
  }
})
</script>

<style scoped>
.calculation-queue-status {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.processing-badge {
  background-color: #3b82f6;
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
}

.current-task {
  background-color: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 0.25rem;
  padding: 0.75rem;
}

.task-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.task-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.pending-tasks {
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  padding: 0.75rem;
}

.pending-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.task-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.task-item {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 0.875rem;
}

.more-tasks {
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
  padding-top: 0.25rem;
}

.completed-count {
  display: flex;
  justify-content: space-between;
}

.label {
  font-weight: 500;
  color: #4b5563;
}

.value {
  font-weight: 600;
}

.task-id {
  font-family: monospace;
  color: #4b5563;
}

.task-time {
  color: #6b7280;
  font-size: 0.75rem;
}
</style>