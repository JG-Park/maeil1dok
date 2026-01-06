<template>
  <div class="loading-spinner-container" :class="{ inline, fullscreen }">
    <SpinnerIcon :size="size" />
    <p v-if="text" class="loading-text">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: number;
  text?: string;
  inline?: boolean;
  fullscreen?: boolean;
}>(), {
  size: 32,
  text: '',
  inline: false,
  fullscreen: false,
});
</script>

<style scoped>
.loading-spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: var(--text-secondary, #6b7280);
}

.loading-spinner-container:not(.inline) {
  min-height: 200px;
}

.loading-spinner-container.fullscreen {
  min-height: calc(100vh - 120px);
  min-height: calc(100dvh - 120px);
}

.loading-text {
  font-size: 0.9375rem;
  margin: 0;
}
</style>
