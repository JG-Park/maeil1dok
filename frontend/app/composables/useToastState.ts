import { ref, computed } from 'vue'
import type { ToastInstance, ToastOptions, ToastType } from '~/types/toast'

// 전역 상태 (싱글톤)
const toastList = ref<ToastInstance[]>([])
let idCounter = 0

const MAX_TOASTS = 5
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  info: 3000,
  success: 3000,
  warning: 4000,
  error: 5000
}

function generateId(): string {
  return `toast-${++idCounter}-${Date.now()}`
}

export function useToastState() {
  const toasts = computed(() => toastList.value)

  function show(options: ToastOptions | string): string {
    const opts: ToastOptions = typeof options === 'string'
      ? { message: options }
      : options

    const id = opts.id || generateId()
    const type = opts.type || 'info'
    const duration = opts.duration ?? DEFAULT_DURATIONS[type]

    // 동일 ID가 있으면 업데이트
    const existingIndex = toastList.value.findIndex(t => t.id === id)
    if (existingIndex !== -1) {
      toastList.value[existingIndex] = {
        ...toastList.value[existingIndex],
        type,
        title: opts.title,
        message: opts.message,
        duration,
        action: opts.action,
        dismissible: opts.dismissible ?? true,
        showIcon: opts.showIcon ?? true,
        icon: opts.icon
      }
      toastList.value = [...toastList.value]
      return id
    }

    const instance: ToastInstance = {
      id,
      type,
      title: opts.title,
      message: opts.message,
      duration,
      action: opts.action,
      dismissible: opts.dismissible ?? true,
      showIcon: opts.showIcon ?? true,
      icon: opts.icon,
      createdAt: Date.now()
    }

    // 최대 개수 초과 시 가장 오래된 것 제거
    if (toastList.value.length >= MAX_TOASTS) {
      toastList.value = toastList.value.slice(1)
    }

    toastList.value = [...toastList.value, instance]

    // 자동 제거 (duration > 0일 때)
    if (duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }

    return id
  }

  function dismiss(id?: string): void {
    if (id) {
      toastList.value = toastList.value.filter(t => t.id !== id)
    } else if (toastList.value.length > 0) {
      // id 없으면 최신 것 제거
      toastList.value = toastList.value.slice(0, -1)
    }
  }

  function dismissAll(): void {
    toastList.value = []
  }

  function update(id: string, updates: Partial<ToastOptions>): void {
    const index = toastList.value.findIndex(t => t.id === id)
    if (index === -1) return

    toastList.value[index] = {
      ...toastList.value[index],
      ...updates
    }
    toastList.value = [...toastList.value]
  }

  return {
    toasts,
    show,
    dismiss,
    dismissAll,
    update
  }
}
