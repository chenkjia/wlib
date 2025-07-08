
<template>
  <div class="redirect-loading">
    <div class="loading-spinner"></div>
    <p>正在重定向...</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  // 获取当前股票代码
  const stockCode = route.params.code
  
  // 重定向到主页，并传递股票代码作为查询参数
  router.replace({ 
    path: '/',
    query: { stock: stockCode }
  })
})
</script>

<style scoped>
.redirect-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f9fafb;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>