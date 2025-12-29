<script setup lang="ts">
interface Props {
  type?: 'text' | 'card' | 'avatar' | 'button' | 'calendar'
  lines?: number
  width?: string
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  lines: 3,
  width: '100%',
  height: 'auto'
})
</script>

<template>
  <!-- 텍스트 스켈레톤 -->
  <div v-if="type === 'text'" class="space-y-2" role="status" aria-label="콘텐츠 로딩 중">
    <div
      v-for="i in lines"
      :key="i"
      class="skeleton-shimmer h-4 rounded"
      :style="{ width: i === lines ? '60%' : '100%' }"
    />
  </div>

  <!-- 카드 스켈레톤 -->
  <div v-else-if="type === 'card'" class="rounded-lg border border-gray-200 p-4 space-y-3" role="status" aria-label="카드 로딩 중">
    <div class="skeleton-shimmer h-40 rounded-lg" />
    <div class="space-y-2">
      <div class="skeleton-shimmer h-5 rounded w-3/4" />
      <div class="skeleton-shimmer h-4 rounded w-1/2" />
    </div>
  </div>

  <!-- 아바타 스켈레톤 -->
  <div v-else-if="type === 'avatar'" class="flex items-center gap-3" role="status" aria-label="프로필 로딩 중">
    <div class="skeleton-shimmer w-12 h-12 rounded-full" />
    <div class="space-y-2 flex-1">
      <div class="skeleton-shimmer h-4 rounded w-24" />
      <div class="skeleton-shimmer h-3 rounded w-32" />
    </div>
  </div>

  <!-- 버튼 스켈레톤 -->
  <div v-else-if="type === 'button'" role="status" aria-label="버튼 로딩 중">
    <div class="skeleton-shimmer h-10 rounded-lg" :style="{ width }" />
  </div>

  <!-- 캘린더 스켈레톤 -->
  <div v-else-if="type === 'calendar'" class="space-y-2" role="status" aria-label="캘린더 로딩 중">
    <div class="flex justify-between items-center mb-4">
      <div class="skeleton-shimmer h-6 w-32 rounded" />
      <div class="flex gap-2">
        <div class="skeleton-shimmer w-8 h-8 rounded" />
        <div class="skeleton-shimmer w-8 h-8 rounded" />
      </div>
    </div>
    <div class="grid grid-cols-7 gap-1">
      <div v-for="i in 35" :key="i" class="skeleton-shimmer h-10 rounded" />
    </div>
  </div>

  <span class="sr-only">로딩 중...</span>
</template>

<style scoped>
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
