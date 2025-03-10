import { ref } from 'vue'

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

const toasts = ref<ToastMessage[]>([])
let nextId = 0

export function useToast() {
  const addToast = (message: string, type: ToastMessage['type']) => {
    const id = nextId++
    toasts.value.push({ id, message, type })
    
    // 3초 후 자동으로 제거
    setTimeout(() => {
      removeToast(id)
    }, 3000)
  }

  const removeToast = (id: number) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  // showToastMessage 함수 추가
  const showToastMessage = (message: string, type: ToastMessage['type'] = 'success') => {
    addToast(message, type)
  }

  return {
    toasts,
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    info: (message: string) => addToast(message, 'info'),
    warning: (message: string) => addToast(message, 'warning'),
    remove: removeToast,
    showToastMessage // 새로 추가한 함수 export
  }
} 