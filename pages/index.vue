<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
    <div class="max-w-md w-full">
      <div class="text-center mb-10">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">股票分析系统</h1>
        <p class="text-gray-500">选择一个功能开始</p>
      </div>

      <div class="space-y-4">
        <NuxtLink to="/stock-query">
          <button class="w-full py-4 px-6 bg-white rounded-xl shadow-sm border border-gray-200 text-left hover:shadow-md hover:border-blue-300 transition-all duration-200 group">
            <div class="flex items-center">
              <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
                <span class="text-2xl">🏠</span>
              </div>
              <div>
                <div class="text-lg font-semibold text-gray-800">主页</div>
                <div class="text-sm text-gray-500">股票查询与分析</div>
              </div>
            </div>
          </button>
        </NuxtLink>

        <NuxtLink to="/smart-select">
          <button class="w-full py-4 px-6 bg-white rounded-xl shadow-sm border border-gray-200 text-left hover:shadow-md hover:border-green-300 transition-all duration-200 group">
            <div class="flex items-center">
              <div class="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mr-4 group-hover:bg-green-200 transition-colors">
                <span class="text-2xl">🎯</span>
              </div>
              <div>
                <div class="text-lg font-semibold text-gray-800">智能选股</div>
                <div class="text-sm text-gray-500">MACD指标筛选股票</div>
              </div>
            </div>
          </button>
        </NuxtLink>

        <NuxtLink to="/double-blind">
          <button class="w-full py-4 px-6 bg-white rounded-xl shadow-sm border border-gray-200 text-left hover:shadow-md hover:border-purple-300 transition-all duration-200 group">
            <div class="flex items-center">
              <div class="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mr-4 group-hover:bg-purple-200 transition-colors">
                <span class="text-2xl">📊</span>
              </div>
              <div>
                <div class="text-lg font-semibold text-gray-800">训练</div>
                <div class="text-sm text-gray-500">股票双盲训练与复盘</div>
              </div>
            </div>
          </button>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
})
</script>
