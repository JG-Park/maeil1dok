<template>
  <Teleport to="body">
    <TransitionGroup name="modal-stack">
      <div
        v-for="modal in stack"
        :key="modal.id"
        class="modal-wrapper"
        :style="{ zIndex: modal.options.zIndex }"
      >
        <!-- Overlay (z-index: base) - wrapper와 함께 트랜지션 -->
        <div
          v-if="modal.options.showOverlay"
          class="modal-overlay"
          :style="{ zIndex: modal.options.zIndex }"
          @click="handleOverlayClick(modal)"
        />

        <!-- Modal Container (z-index는 ModalContainer 내부에서 처리) -->
        <ModalContainer
          :modal="modal"
          @close="handleClose(modal)"
        />
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import { useModalState } from '~/composables/useModalState'
import { useScrollLock } from '~/composables/useScrollLock'
import ModalContainer from './ModalContainer.vue'
import type { ModalInstance } from '~/types/modal'

const state = useModalState()
const stack = state.stack

// 스크롤 락
const { lock, unlock } = useScrollLock({ enabled: state.isOpen })

// ESC 키 핸들러
function handleEscKey(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return

  const topModal = state.topModal.value
  if (!topModal || !topModal.options.closeOnEsc) return

  event.preventDefault()
  state.cancel(topModal.id)
}

// 오버레이 클릭 핸들러
function handleOverlayClick(modal: ModalInstance): void {
  if (!modal.options.closeOnOverlay) return
  state.cancel(modal.id)
}

// 닫기 핸들러
function handleClose(modal: ModalInstance): void {
  state.cancel(modal.id)
}

// 키보드 이벤트 등록
onMounted(() => {
  document.addEventListener('keydown', handleEscKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
})

// 스크롤 락 상태 동기화
watch(state.isOpen, (isOpen) => {
  if (isOpen) {
    lock()
  } else {
    unlock()
  }
}, { immediate: true })
</script>

<style>
/* Modal tokens */
:root {
  --modal-width-sm: 320px;
  --modal-width-md: 420px;
  --modal-width-lg: 560px;
  --modal-width-xl: 720px;
  --modal-overlay-bg: rgba(0, 0, 0, 0.5);
  --modal-radius: 16px;
  --modal-radius-bottom: 16px 16px 0 0;
  --modal-duration: 200ms;
  --modal-easing: cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-wrapper {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  pointer-events: none;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--modal-overlay-bg);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  pointer-events: auto;
}

/* Stack transition - overlay와 modal이 동시에 트랜지션 */
.modal-stack-enter-active,
.modal-stack-leave-active {
  transition: opacity var(--modal-duration) var(--modal-easing);
}

.modal-stack-enter-active .modal-overlay,
.modal-stack-leave-active .modal-overlay {
  transition: opacity var(--modal-duration) var(--modal-easing),
              backdrop-filter var(--modal-duration) var(--modal-easing);
}

.modal-stack-enter-from,
.modal-stack-leave-to {
  opacity: 0;
}

.modal-stack-enter-from .modal-overlay,
.modal-stack-leave-to .modal-overlay {
  backdrop-filter: blur(0);
  -webkit-backdrop-filter: blur(0);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .modal-stack-enter-active,
  .modal-stack-leave-active,
  .modal-stack-enter-active .modal-overlay,
  .modal-stack-leave-active .modal-overlay {
    transition: opacity 100ms;
  }
}
</style>
