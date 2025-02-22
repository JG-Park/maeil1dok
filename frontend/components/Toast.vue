<template>
  <Transition name="toast">
    <div v-if="isVisible" class="toast" :class="type">
      <div class="toast-content">
        <svg v-if="type === 'success'" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        {{ message }}
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  message: String,
  type: {
    type: String,
    default: 'success'
  },
  duration: {
    type: Number,
    default: 2000
  }
})

const isVisible = ref(false)

// 외부에서 show 메서드를 호출할 수 있도록
const show = () => {
  isVisible.value = true
  setTimeout(() => {
    isVisible.value = false
  }, props.duration)
}

defineExpose({ show })
</script>

<style scoped>
.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  background: #1E293B;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toast.success {
  background: #065F46;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style> 