<template>
  <div
    class="toast-item"
    :class="`toast-${toast.type}`"
    role="alert"
    :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
    aria-atomic="true"
  >
    <!-- Icon -->
    <div v-if="toast.showIcon" class="toast-icon">
      <component :is="toast.icon" v-if="toast.icon" />
      <template v-else>
        <!-- Success: 원 안에 체크마크 -->
        <svg v-if="toast.type === 'success'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 12l3 3 5-6"/>
        </svg>
        <!-- Error: 원 안에 X -->
        <svg v-else-if="toast.type === 'error'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M15 9l-6 6M9 9l6 6"/>
        </svg>
        <!-- Warning: 삼각형 안에 느낌표 -->
        <svg v-else-if="toast.type === 'warning'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <path d="M12 9v4"/>
          <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
        </svg>
        <!-- Info: 원 안에 i -->
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="8" r="0.5" fill="currentColor"/>
          <path d="M12 11v5"/>
        </svg>
      </template>
    </div>

    <!-- Content -->
    <div class="toast-content">
      <p v-if="toast.title" class="toast-title">{{ toast.title }}</p>
      <p class="toast-message">{{ toast.message }}</p>
    </div>

    <!-- Action -->
    <button
      v-if="toast.action"
      type="button"
      class="toast-action"
      @click="handleAction"
    >
      {{ toast.action.label }}
    </button>

    <!-- Dismiss -->
    <button
      v-if="toast.dismissible"
      type="button"
      class="toast-dismiss"
      aria-label="닫기"
      @click="handleDismiss"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ToastInstance } from '~/types/toast'

const props = defineProps<{
  toast: ToastInstance
}>()

const emit = defineEmits<{
  dismiss: [id: string]
}>()

function handleAction() {
  props.toast.action?.onClick()
  emit('dismiss', props.toast.id)
}

function handleDismiss() {
  emit('dismiss', props.toast.id)
}
</script>

<style scoped>
.toast-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  min-width: var(--toast-min-width);
  max-width: var(--toast-max-width);
  border-radius: var(--toast-radius);
  color: white;
  font-size: 0.9375rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
}

.toast-info {
  background: var(--toast-bg-info);
}

.toast-success {
  background: var(--toast-bg-success);
}

.toast-warning {
  background: var(--toast-bg-warning);
}

.toast-error {
  background: var(--toast-bg-error);
}

.toast-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  margin: 0 0 0.125rem;
  font-size: 0.9375rem;
}

.toast-message {
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.95;
  line-height: 1.4;
}

.toast-action {
  flex-shrink: 0;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: background 0.15s ease;
}

.toast-action:hover {
  background: rgba(255, 255, 255, 0.3);
}

.toast-dismiss {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  color: white;
  opacity: 0.7;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.toast-dismiss:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

/* Mobile adjustments */
@media (max-width: 480px) {
  .toast-item {
    min-width: auto;
    width: 100%;
  }
}
</style>
