<template>
  <div class="skeleton-loader" :class="[type, { animated }]" :style="customStyle">
    <div v-if="type === 'card'" class="skeleton-card">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-content">
        <div class="skeleton-line" style="width: 60%"></div>
        <div class="skeleton-line" style="width: 40%"></div>
        <div class="skeleton-line" style="width: 80%"></div>
      </div>
    </div>
    
    <div v-else-if="type === 'list'" class="skeleton-list">
      <div v-for="i in count" :key="i" class="skeleton-list-item">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-content">
          <div class="skeleton-line" style="width: 70%"></div>
          <div class="skeleton-line" style="width: 50%"></div>
        </div>
      </div>
    </div>
    
    <div v-else-if="type === 'table'" class="skeleton-table">
      <div class="skeleton-table-header">
        <div v-for="i in columns" :key="`h${i}`" class="skeleton-cell"></div>
      </div>
      <div v-for="i in rows" :key="`r${i}`" class="skeleton-table-row">
        <div v-for="j in columns" :key="`c${j}`" class="skeleton-cell"></div>
      </div>
    </div>
    
    <div v-else-if="type === 'text'" class="skeleton-text">
      <div v-for="i in lines" :key="i" class="skeleton-line" :style="{ width: `${100 - i * 10}%` }"></div>
    </div>
    
    <div v-else class="skeleton-custom"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type?: 'card' | 'list' | 'table' | 'text' | 'custom'
  count?: number
  rows?: number
  columns?: number
  lines?: number
  height?: string
  width?: string
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'card',
  count: 3,
  rows: 5,
  columns: 4,
  lines: 3,
  animated: true
})

const customStyle = computed(() => ({
  height: props.height,
  width: props.width
}))
</script>

<style scoped>
.skeleton-loader {
  width: 100%;
}

.skeleton-loader.animated * {
  animation: shimmer 1.5s infinite ease-in-out;
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Card skeleton */
.skeleton-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #E5E7EB;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-line {
  height: 12px;
  background: #E5E7EB;
  border-radius: 4px;
}

/* List skeleton */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-list-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
}

/* Table skeleton */
.skeleton-table {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  overflow: hidden;
}

.skeleton-table-header {
  display: grid;
  grid-template-columns: repeat(var(--columns, 4), 1fr);
  gap: 1rem;
  padding: 1rem;
  background: #F9FAFB;
  border-bottom: 1px solid #E5E7EB;
}

.skeleton-table-row {
  display: grid;
  grid-template-columns: repeat(var(--columns, 4), 1fr);
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #F3F4F6;
}

.skeleton-cell {
  height: 12px;
  background: #E5E7EB;
  border-radius: 4px;
}

/* Text skeleton */
.skeleton-text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Custom skeleton */
.skeleton-custom {
  background: #E5E7EB;
  border-radius: 0.5rem;
  min-height: 100px;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .skeleton-card,
  .skeleton-list-item {
    padding: 0.75rem;
  }
  
  .skeleton-avatar {
    width: 40px;
    height: 40px;
  }
}
</style>