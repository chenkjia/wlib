<template>
  <div class="flex flex-col items-center justify-center p-8">
    <div class="text-red-500 text-5xl mb-4">
      <span>⚠️</span>
    </div>
    <p class="text-red-600 font-medium mb-2">出错了</p>
    <p class="text-gray-600 text-center">{{ message }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  message: {
    type: String,
    default: '加载数据时发生错误'
  }
})
</script>