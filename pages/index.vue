<script setup>
import { ref } from 'vue'

const columns = [
  { accessorKey: 'name', header: '姓名' },
  { accessorKey: 'age', header: '年龄' },
  { accessorKey: 'city', header: '城市' }
]

const data = ref([
  { name: '张三', age: 25, city: '北京' },
  { name: '李四', age: 30, city: '上海' },
  { name: '王五', age: 28, city: '广州' }
])
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">数据表格示例</h1>
    <UCard>
      <UTable :data="data" :columns="columns" hover />
    </UCard>
  </div>
</template>

<style>
</style> 