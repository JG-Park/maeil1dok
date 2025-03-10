<template>
  <TransitionGroup name="toast" tag="div" class="toast-container">
    <div
      v-for="msg in messages"
      :key="msg.id"
      class="toast"
      :class="msg.type"
    >
      <div class="toast-content">
        <svg v-if="msg.type === 'success'" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        {{ msg.message }}
      </div>
    </div>
  </TransitionGroup>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

const messages = ref<ToastMessage[]>([])

const show = (message: string, type: ToastMessage['type'] = 'success') => {
  const id = Date.now()
  messages.value.push({ id, message, type })
  setTimeout(() => {
    messages.value = messages.value.filter(m => m.id !== id)
  }, 3000)
}

defineExpose({ show })
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.toast {
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  background: #1E293B;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
  min-width: 200px;
  max-width: 90vw;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toast.success {
  background: #065F46;
}

.toast.error {
  background: #DC2626;
}

.toast.info {
  background: #2563EB;
}

.toast.warning {
  background: #D97706;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style> 