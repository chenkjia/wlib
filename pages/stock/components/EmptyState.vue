<template>
  <div class="flex flex-col items-center justify-center p-8">
    <div class="text-gray-400 text-5xl mb-4">
      <span>📊</span>
    </div>
    <p class="text-gray-600 text-center">{{ message }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  message: {
    type: String,
    default: '暂无数据'
  }
})
</script>