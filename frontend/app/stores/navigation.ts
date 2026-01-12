/**
 * Navigation Store - 통합 네비게이션 상태 관리
 *
 * 앱 내 네비게이션 히스토리 추적, 로그인 후 리다이렉트 URL 관리,
 * 스마트 뒤로가기 기능을 위한 중앙 집중식 상태 관리
 *
 * @example
 * const navigationStore = useNavigationStore();
 *
 * // 리다이렉트 URL 저장 (로그인 전)
 * navigationStore.setRedirectUrl('/protected-page');
 *
 * // 리다이렉트 URL 소비 (로그인 후)
 * const url = navigationStore.consumeRedirectUrl();
 *
 * // 뒤로가기 가능 여부 확인
 * if (navigationStore.canGoBack) {
 *   // 앱 내 히스토리 있음
 * }
 */

import { defineStore } from 'pinia'

interface NavigationState {
  /**
   * 앱 내 방문한 페이지 경로 스택
   * 외부 진입 vs 앱 내 이동 구분에 사용
   */
  historyStack: string[]

  /**
   * 로그인 후 리다이렉트할 URL
   * 인증이 필요한 페이지 접근 시 저장됨
   */
  redirectUrl: string | null

  /**
   * 스토어 초기화 여부 (SSR/Client 중복 방지)
   */
  isInitialized: boolean
}

const MAX_HISTORY_SIZE = 50
const STORAGE_KEY = 'maeil1dok_navigation'

export const useNavigationStore = defineStore('navigation', {
  state: (): NavigationState => ({
    historyStack: [],
    redirectUrl: null,
    isInitialized: false,
  }),

  getters: {
    /**
     * 앱 내 히스토리가 있어서 뒤로가기 가능한지 여부
     * 현재 페이지 포함 2개 이상이어야 뒤로갈 페이지가 있음
     */
    canGoBack: (state): boolean => state.historyStack.length > 1,

    /**
     * 이전 페이지 경로
     * 뒤로가기 시 이동할 페이지
     */
    previousRoute: (state): string | null => {
      if (state.historyStack.length > 1) {
        return state.historyStack[state.historyStack.length - 2] || null
      }
      return null
    },

    /**
     * 현재 페이지 경로
     */
    currentRoute: (state): string | null => {
      if (state.historyStack.length > 0) {
        return state.historyStack[state.historyStack.length - 1] || null
      }
      return null
    },

    /**
     * 히스토리 스택 길이
     */
    historyLength: (state): number => state.historyStack.length,
  },

  actions: {
    /**
     * sessionStorage에서 상태 복원
     * 페이지 새로고침 시에도 히스토리 유지
     */
    initialize() {
      if (this.isInitialized || !import.meta.client) return

      try {
        const saved = sessionStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          this.historyStack = Array.isArray(parsed.historyStack) ? parsed.historyStack : []
          this.redirectUrl = typeof parsed.redirectUrl === 'string' ? parsed.redirectUrl : null
        }
      } catch (error) {
        console.debug('[NavigationStore] Failed to load from sessionStorage:', error)
      }

      this.isInitialized = true
    },

    /**
     * 새 경로를 히스토리 스택에 추가
     * 미들웨어에서 라우트 변경 시 자동 호출됨
     *
     * @param path - 방문한 페이지의 전체 경로 (query 포함)
     */
    pushRoute(path: string) {
      if (!import.meta.client) return

      // 연속 중복 방지
      const lastPath = this.historyStack[this.historyStack.length - 1]
      if (lastPath === path) return

      this.historyStack.push(path)

      // 최대 크기 유지
      if (this.historyStack.length > MAX_HISTORY_SIZE) {
        this.historyStack = this.historyStack.slice(-MAX_HISTORY_SIZE)
      }

      this._persist()
    },

    /**
     * 히스토리 스택에서 마지막 항목 제거
     * 뒤로가기 시 호출됨
     */
    popRoute() {
      if (!import.meta.client) return

      if (this.historyStack.length > 0) {
        this.historyStack.pop()
        this._persist()
      }
    },

    /**
     * 로그인 후 리다이렉트할 URL 저장
     * useAuthGuard에서 로그인 페이지로 리다이렉트 전 호출
     *
     * @param url - 리다이렉트 대상 URL
     */
    setRedirectUrl(url: string) {
      if (!import.meta.client) return

      // 로그인/회원가입 페이지는 저장하지 않음
      if (url.startsWith('/login') || url.startsWith('/register') || url.startsWith('/auth/')) {
        return
      }

      this.redirectUrl = url
      this._persist()
    },

    /**
     * 저장된 리다이렉트 URL 반환 및 초기화
     * 로그인 성공 후 호출하여 원래 페이지로 복귀
     *
     * @returns 저장된 URL 또는 null
     */
    consumeRedirectUrl(): string | null {
      if (!import.meta.client) return null

      const url = this.redirectUrl
      this.redirectUrl = null
      this._persist()
      return url
    },

    /**
     * 저장된 리다이렉트 URL 확인 (소비하지 않음)
     *
     * @returns 저장된 URL 또는 null
     */
    peekRedirectUrl(): string | null {
      return this.redirectUrl
    },

    /**
     * 모든 상태 초기화
     * 로그아웃 시 호출
     */
    clear() {
      this.historyStack = []
      this.redirectUrl = null
      this._persist()
    },

    /**
     * 히스토리 스택만 초기화
     * 특정 상황에서 히스토리만 리셋 필요 시 사용
     */
    clearHistory() {
      this.historyStack = []
      this._persist()
    },

    /**
     * sessionStorage에 현재 상태 저장
     * @internal
     */
    _persist() {
      if (!import.meta.client) return

      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          historyStack: this.historyStack,
          redirectUrl: this.redirectUrl,
        }))
      } catch (error) {
        console.debug('[NavigationStore] Failed to persist to sessionStorage:', error)
      }
    },
  },
})

// 타입 export
export type NavigationStore = ReturnType<typeof useNavigationStore>
