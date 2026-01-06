import type { Component, ComputedRef } from 'vue'

export type ToastType = 'info' | 'success' | 'warning' | 'error'
export type ToastPosition = 'top' | 'bottom' | 'top-right' | 'bottom-center'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  /** 토스트 ID (자동 생성, 수동 지정 가능) */
  id?: string
  /** 토스트 타입 */
  type?: ToastType
  /** 제목 (굵은 글씨) */
  title?: string
  /** 메시지 본문 */
  message: string
  /** 표시 시간 (ms), 0이면 자동 닫힘 안 함 */
  duration?: number
  /** 액션 버튼 */
  action?: ToastAction
  /** 닫기 버튼 표시 */
  dismissible?: boolean
  /** 아이콘 표시 */
  showIcon?: boolean
  /** 커스텀 아이콘 컴포넌트 */
  icon?: Component
}

export interface ToastInstance {
  id: string
  type: ToastType
  title?: string
  message: string
  duration: number
  action?: ToastAction
  dismissible: boolean
  showIcon: boolean
  icon?: Component
  createdAt: number
}

export interface PromiseToastOptions<T> {
  loading: string
  success: string | ((data: T) => string)
  error: string | ((error: Error) => string)
}

export interface UseToastReturn {
  /** 토스트 표시 */
  show: (options: ToastOptions | string) => string

  /** 타입별 단축 메서드 */
  info: (message: string, options?: Partial<ToastOptions>) => string
  success: (message: string, options?: Partial<ToastOptions>) => string
  warning: (message: string, options?: Partial<ToastOptions>) => string
  error: (message: string, options?: Partial<ToastOptions>) => string

  /** 특정 토스트 닫기 */
  dismiss: (id?: string) => void

  /** 모든 토스트 닫기 */
  dismissAll: () => void

  /** Promise 기반 토스트 */
  promise: <T>(
    promise: Promise<T>,
    options: PromiseToastOptions<T>
  ) => Promise<T>

  /** 현재 표시 중인 토스트 목록 */
  toasts: ComputedRef<ToastInstance[]>

  /** @deprecated 기존 API 호환용 */
  showToastMessage: (message: string, type?: ToastType) => string

  /** @deprecated 기존 API 호환용 */
  remove: (id: number | string) => void
}
