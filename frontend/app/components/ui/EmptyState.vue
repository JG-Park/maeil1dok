<template>
  <div class="empty-state-container" :class="{ fullscreen }">
    <div class="empty-icon">
      <slot name="icon">
        <InfoCircleIcon :size="48" />
      </slot>
    </div>
    <p class="empty-text">{{ text }}</p>
    <span v-if="hint" class="empty-hint">{{ hint }}</span>
    <div v-if="$slots.action" class="empty-action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  text: string;
  hint?: string;
  fullscreen?: boolean;
}>(), {
  hint: '',
  fullscreen: false,
});
</script>

<style scoped>
.empty-state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary, #6b7280);
}

.empty-state-container.fullscreen {
  min-height: calc(100vh - 120px);
  min-height: calc(100dvh - 120px);
}

.empty-icon {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-text {
  font-size: 0.9375rem;
  margin: 0 0 0.5rem;
}

.empty-hint {
  font-size: 0.8125rem;
  opacity: 0.7;
  margin-bottom: 1rem;
}

.empty-action {
  margin-top: 1rem;
}
</style>
