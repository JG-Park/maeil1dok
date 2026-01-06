<template>
  <div class="confirm-modal">
    <!-- Icon -->
    <div v-if="icon" class="confirm-icon" :class="`confirm-icon-${icon}`">
      <svg v-if="icon === 'warning'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <svg v-else-if="icon === 'error'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <svg v-else-if="icon === 'info'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <svg v-else-if="icon === 'success'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    </div>

    <!-- Title -->
    <h3 :id="`modal-title-${modalId}`" class="confirm-title">
      {{ title }}
    </h3>

    <!-- Description -->
    <p v-if="description" class="confirm-description">
      {{ description }}
    </p>

    <!-- Actions -->
    <div class="confirm-actions">
      <button
        type="button"
        class="confirm-btn confirm-btn-cancel"
        @click="handleCancel"
      >
        {{ cancelText }}
      </button>
      <button
        type="button"
        class="confirm-btn"
        :class="confirmButtonClass"
        @click="handleConfirm"
      >
        {{ confirmText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useModal } from '~/composables/useModal'
import type { ConfirmVariant, ConfirmIcon } from '~/types/modal'

const props = withDefaults(defineProps<{
  modalId: string
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: ConfirmVariant
  icon?: ConfirmIcon
}>(), {
  confirmText: '확인',
  cancelText: '취소',
  confirmVariant: 'primary'
})

const modal = useModal()

const confirmButtonClass = computed(() => {
  return props.confirmVariant === 'danger'
    ? 'confirm-btn-danger'
    : 'confirm-btn-primary'
})

function handleConfirm() {
  modal.close(props.modalId, true)
}

function handleCancel() {
  modal.close(props.modalId, false)
}
</script>

<style scoped>
.confirm-modal {
  padding: 1.5rem;
  text-align: center;
}

.confirm-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  border-radius: 50%;
}

.confirm-icon-warning {
  background: #fef3c7;
  color: #d97706;
}

.confirm-icon-error {
  background: #fee2e2;
  color: #dc2626;
}

.confirm-icon-info {
  background: #dbeafe;
  color: #2563eb;
}

.confirm-icon-success {
  background: #d1fae5;
  color: #059669;
}

.confirm-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary, #111827);
  margin: 0 0 0.5rem;
}

.confirm-description {
  font-size: 0.9375rem;
  color: var(--color-text-secondary, #6b7280);
  margin: 0 0 1.5rem;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 0.75rem;
}

.confirm-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.confirm-btn-cancel {
  background: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-text-primary, #374151);
}

.confirm-btn-cancel:hover {
  background: var(--color-bg-tertiary, #e5e7eb);
}

.confirm-btn-primary {
  background: var(--color-primary, #3b82f6);
  color: white;
}

.confirm-btn-primary:hover {
  background: var(--color-primary-dark, #2563eb);
}

.confirm-btn-danger {
  background: #dc2626;
  color: white;
}

.confirm-btn-danger:hover {
  background: #b91c1c;
}

/* Dark mode */
[data-theme="dark"] .confirm-modal,
.dark .confirm-modal {
  --color-text-primary: #f9fafb;
  --color-text-secondary: #9ca3af;
  --color-bg-secondary: #374151;
  --color-bg-tertiary: #4b5563;
}

[data-theme="dark"] .confirm-icon-warning,
.dark .confirm-icon-warning {
  background: #78350f;
  color: #fbbf24;
}

[data-theme="dark"] .confirm-icon-error,
.dark .confirm-icon-error {
  background: #7f1d1d;
  color: #f87171;
}

[data-theme="dark"] .confirm-icon-info,
.dark .confirm-icon-info {
  background: #1e3a8a;
  color: #60a5fa;
}

[data-theme="dark"] .confirm-icon-success,
.dark .confirm-icon-success {
  background: #064e3b;
  color: #34d399;
}
</style>
