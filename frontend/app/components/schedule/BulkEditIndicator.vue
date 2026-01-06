<template>
  <Transition name="slide-fade">
    <div v-if="show" class="bulk-edit-indicator">
      <template v-if="!state.showActions">
        <span class="bulk-edit-message">{{ state.message }}</span>
      </template>
      <template v-else>
        <span class="bulk-edit-message">{{ state.message }}</span>
        <div class="bulk-edit-actions">
          <button class="action-button complete" @click="$emit('action', 'complete')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            읽음
          </button>
          <span class="action-divider">|</span>
          <button class="action-button cancel" @click="$emit('action', 'cancel')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            읽지 않음
          </button>
          <span class="bulk-edit-message">으로 기록</span>
        </div>
      </template>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { BulkEditState, ReadingAction } from '~/types/plan';

defineProps<{
  show: boolean;
  state: BulkEditState;
}>();

defineEmits<{
  action: [action: ReadingAction];
}>();
</script>

<style scoped>
.bulk-edit-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--primary-light);
  border: 1px solid var(--primary-color);
  border-radius: 10px;
  flex-wrap: wrap;
}

.bulk-edit-message {
  font-size: 0.8125rem;
  color: var(--primary-color);
  font-weight: 500;
}

.bulk-edit-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: all 0.15s;
}

.action-button.complete {
  background: var(--color-success);
  color: var(--color-text-inverse);
}

.action-button.complete:hover {
  background: var(--color-schedule-completed-text);
}

.action-button.cancel {
  background: var(--color-slate-200);
  color: var(--color-slate-700);
}

.action-button.cancel:hover {
  background: var(--color-slate-300);
}

.action-divider {
  color: var(--color-slate-300);
}

/* Transition */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
