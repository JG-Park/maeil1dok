<template>
  <div class="bible-skeleton-container">
    <div 
      v-for="i in verseCount" 
      :key="i" 
      class="skeleton-verse"
    >
      <!-- Verse Number Placeholder -->
      <div class="skeleton-number skeleton-shimmer"></div>
      
      <!-- Verse Text Placeholder -->
      <div class="skeleton-content">
        <!-- First line -->
        <div 
          class="skeleton-line skeleton-shimmer" 
          :style="{ width: getLineWidth(i, 0) }"
        ></div>
        
        <!-- Second line -->
        <div 
          class="skeleton-line skeleton-shimmer" 
          :style="{ width: getLineWidth(i, 1) }"
        ></div>
        
        <!-- Third line (conditional) -->
        <div 
          v-if="i % 3 !== 0"
          class="skeleton-line skeleton-shimmer" 
          :style="{ width: getLineWidth(i, 2) }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  verseCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  verseCount: 8,
});

// Deterministic width generation based on index to avoid hydration mismatches
const getLineWidth = (index: number, lineIndex: number): string => {
  const baseWidths = [
    [95, 85, 60], // verse 0 pattern
    [90, 75, 0],  // verse 1 pattern (2 lines)
    [100, 90, 40], // verse 2 pattern
  ];
  
  const pattern = baseWidths[index % 3];
  const width = pattern[lineIndex] || 70;
  
  // Add slight variation based on index
  const variation = (index * 5) % 15;
  
  return `${width - variation}%`;
};
</script>

<style scoped>
.bible-skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  animation: fadeIn 0.5s ease-out;
}

.skeleton-verse {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.skeleton-number {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 0.2rem;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.skeleton-line {
  height: 1rem;
  border-radius: 4px;
}

/* Shimmer Effect - Copied from SkeletonLoader.vue */
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--color-bg-tertiary, #e5e7eb) 25%,
    var(--color-bg-hover, #f3f4f6) 50%,
    var(--color-bg-tertiary, #e5e7eb) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Dark mode overrides */
[data-theme="dark"] .skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--color-bg-tertiary, #374151) 25%,
    var(--color-bg-hover, #4b5563) 50%,
    var(--color-bg-tertiary, #374151) 75%
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .skeleton-verse {
    gap: 0.3rem;
  }
  
  .skeleton-number {
    width: 1.2rem;
    height: 1.2rem;
  }
}
</style>
