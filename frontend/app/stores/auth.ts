import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'

interface User {
  id: number
  username: string
  nickname: string
}

interface AuthState {
  user: User | null
  // 토큰은 HttpOnly 쿠키에 저장됨 (XSS 방지)
  // 아래 필드들은 하위 호환 및 상태 추적용으로만 사용
  token: string | null
  refreshToken: string | null
  refreshInterval: NodeJS.Timeout | null
  storageListenerAttached: boolean
  isRefreshing: boolean
  isLoggingOut: boolean
  // 쿠키 기반 인증 사용 여부
  useCookieAuth: boolean
}

// JWT 디코딩 유틸리티
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

// 토큰 만료 시간 확인 (초 단위로 남은 시간 반환)
function getTokenExpiryTime(token: string): number | null {
  const decoded = decodeJWT(token)
  if (!decoded || !decoded.exp) return null

  const now = Math.floor(Date.now() / 1000)
  return decoded.exp - now
}

interface KakaoLoginResponse {
  needsSignup?: boolean
  kakao_id?: string
  suggested_nickname?: string
  profile_image?: string
  access?: string
  refresh?: string
  user?: User
}

// 전역 window 타입 확장
declare global {
  interface Window {
    __pinia?: {
      auth?: any;
    };
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    refreshToken: null,
    refreshInterval: null,
    storageListenerAttached: false,
    isRefreshing: false,
    isLoggingOut: false,
    useCookieAuth: true  // 쿠키 기반 인증 활성화
  }),

  getters: {
    // 쿠키 기반 인증: 사용자 정보가 있으면 인증됨
    // (토큰은 HttpOnly 쿠키에 저장되어 JavaScript에서 접근 불가)
    isAuthenticated: (state) => !!state.user,
  },

  actions: {
    setTokens(access: string, refresh: string) {
      this.token = access
      this.refreshToken = refresh

      // Manually save to localStorage since pinia-plugin-persistedstate doesn't work properly
      if (process.client && typeof window !== 'undefined') {
        this.saveToLocalStorage()
      }

      // Automatically start token refresh timer when tokens are set
      if (process.client) {
        this.startTokenRefreshTimer()
      }
    },

    setUser(user: User) {
      this.user = user
      // Manually save to localStorage
      if (process.client && typeof window !== 'undefined') {
        this.saveToLocalStorage()
      }
    },

    saveToLocalStorage() {
      try {
        const authData = {
          token: this.token,
          refreshToken: this.refreshToken,
          user: this.user
        }
        localStorage.setItem('auth', JSON.stringify(authData))
      } catch (error) {
        console.error('Failed to save auth to localStorage:', error)
      }
    },

    loadFromLocalStorage() {
      try {
        const authData = localStorage.getItem('auth')
        if (authData) {
          const parsed = JSON.parse(authData)
          this.token = parsed.token
          this.refreshToken = parsed.refreshToken
          this.user = parsed.user
        }
      } catch (error) {
        console.error('Failed to load auth from localStorage:', error)
      }
    },

    async initializeAuth() {
      // 쿠키 기반 인증: 서버에서 사용자 정보를 가져와 인증 상태 확인
      // HttpOnly 쿠키는 JavaScript에서 접근 불가하므로 서버 요청으로 확인
      if (this.useCookieAuth) {
        try {
          await this.fetchUser()
          // 사용자 정보를 성공적으로 가져오면 인증됨
          // 타이머는 쿠키 기반에서는 불필요 (서버가 쿠키 갱신)
          return
        } catch (error: any) {
          // 401/403이면 미인증 상태 - localStorage fallback 시도
          if (error?.response?.status === 401 || error?.response?.status === 403) {
            // 쿠키 인증 실패, localStorage fallback 시도
            this.useCookieAuth = false
          } else {
            // 네트워크 오류 등 - 일시적 문제로 간주
            return
          }
        }
      }

      // 하위 호환: localStorage 기반 인증 (마이그레이션 완료 후 제거 예정)
      if (process.client && typeof window !== 'undefined') {
        this.loadFromLocalStorage()
      }

      // We only need to validate and refresh user data if we have a token
      if (!this.token || !this.refreshToken) {
        return
      }

      try {
        // 1. 토큰 만료 시간 확인
        const timeLeft = getTokenExpiryTime(this.token)

        // 토큰이 이미 만료되었으면 refresh 시도
        if (timeLeft !== null && timeLeft <= 0) {
          const refreshSuccess = await this.refreshAccessToken()
          if (!refreshSuccess) {
            // Refresh failed - try one more time after a short delay
            await new Promise(resolve => setTimeout(resolve, 2000))

            const retrySuccess = await this.refreshAccessToken()
            if (!retrySuccess) {
              this.logout()
              return
            }
          }
        }

        // 2. 서버에서 사용자 정보를 가져와 토큰 유효성 확인
        try {
          await this.fetchUser()
        } catch (error: any) {
          // Only logout if it's a permanent auth error (401/403)
          // Network errors, 500s, etc should NOT logout
          if (error?.response?.status === 401 || error?.response?.status === 403) {
            this.logout()
            return
          }
          // Otherwise, continue - we have cached user data
        }

        // 3. Timer is automatically started by setTokens(), but ensure it's running
        if (!this.refreshInterval) {
          this.startTokenRefreshTimer()
        }
      } catch (error) {
        // Don't logout on unexpected errors - keep existing session
      }
    },

    // Initialize listeners (should be called once from plugin)
    initializeListeners() {
      if (!process.client) return

      // 다중 탭 동기화 설정
      this.setupStorageSync()

      // Visibility API 설정 (백그라운드 탭 처리)
      this.setupVisibilityHandler()
    },

    // 다중 탭 간 인증 상태 동기화
    setupStorageSync() {
      if (!process.client || this.storageListenerAttached) return

      const handleStorageChange = (event: StorageEvent) => {
        // auth 관련 localStorage 변경만 처리
        if (event.key === 'auth') {
          try {
            const newValue = event.newValue ? JSON.parse(event.newValue) : null

            if (newValue) {
              // 다른 탭에서 로그인 또는 토큰 갱신
              if (newValue.token && newValue.token !== this.token) {
                this.token = newValue.token
                this.refreshToken = newValue.refreshToken
                this.user = newValue.user

                // 타이머 재시작
                this.startTokenRefreshTimer()
              }
            } else {
              // 다른 탭에서 로그아웃
              if (this.token) {
                this.logout()
              }
            }
          } catch (error) {
            // Silent fail
          }
        }
      }

      window.addEventListener('storage', handleStorageChange)
      this.storageListenerAttached = true
    },

    // Visibility API로 백그라운드 탭 처리
    setupVisibilityHandler() {
      if (!process.client) return

      const handleVisibilityChange = () => {
        if (document.hidden) {
          // 탭이 백그라운드로 갈 때 타이머 중지 (브라우저 throttle 방지)
        } else {
          // 탭이 다시 활성화될 때
          if (this.token && this.refreshToken) {
            // 즉시 토큰 상태 체크
            this.checkAndRefreshToken()

            // 타이머 재시작
            this.startTokenRefreshTimer()
          }
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
    },

    async fetchUser() {
      const api = useApi()
      try {
        const response = await api.get('/api/v1/auth/user/')
        // Handle both wrapped and unwrapped responses
        const userData = response.data || response
        this.setUser(userData)
      } catch (error) {
        throw error
      }
    },

    async login(username: string, password: string) {
      const api = useApi()
      try {
        const response = await api.post('/api/v1/auth/token/', {
          username,
          password
        })

        if (!response) {
          throw new Error('Login failed')
        }

        this.setTokens(response.access, response.refresh)
        await this.fetchUser()

        // Timer is automatically started by setTokens()

        return true
      } catch (error) {
        this.logout()
        return false
      }
    },

    async register(userData: {
      email: string
      password: string
      username: string
      gender: string
      birth_date: string
    }) {
      const api = useApi()
      try {
        const response = await api.post('/api/v1/auth/register/', userData)
        return true
      } catch (error) {
        return false
      }
    },

    async loginWithKakao(accessToken: string) {
      const api = useApi()
      try {
        const response = await api.post('/api/v1/auth/social-login/', { provider: 'kakao', access_token: accessToken })

        if (!response) {
          throw new Error('Empty response from API')
        }

        const data = response.data || response

        if (data.access) {
          this.setTokens(data.access, data.refresh)
          this.setUser(data.user)

          // Timer is automatically started by setTokens()

          return true
        } else if (data.needsSignup) {
          return data
        }

        throw new Error(data.message || 'Kakao login failed')
      } catch (err) {
        throw err
      }
    },

    async socialLogin(provider: string, code: string): Promise<KakaoLoginResponse> {
      const api = useApi()
      try {
        const response = await api.post('/api/v1/auth/social-login/', {
          provider,
          code
        })
        if (response.access) {
          this.setTokens(response.access, response.refresh)
          this.setUser(response.user)

          // Timer is automatically started by setTokens()
        }
        return response
      } catch (error) {
        throw error
      }
    },

    async loginWithKakaoResponse(response: any) {
      if (response.access) {
        this.setTokens(response.access, response.refresh)
        this.setUser(response.user)

        // Timer is automatically started by setTokens()

        return true
      }
      return false
    },

    async logout() {
      // 이미 로그아웃 중이면 중복 실행 방지
      if (this.isLoggingOut) {
        return
      }

      this.isLoggingOut = true
      this.stopTokenRefreshTimer()

      // 서버에 로그아웃 요청 (쿠키 삭제 및 토큰 블랙리스트)
      // user가 있을 때만 서버 로그아웃 요청 (비로그인 상태에서는 불필요)
      if (this.useCookieAuth && this.user) {
        try {
          const api = useApi()
          await api.post('/api/v1/auth/logout/')
        } catch (error) {
          // 로그아웃 API 실패해도 로컬 상태는 정리
          console.error('Server logout failed:', error)
        }
      }

      this.user = null
      this.token = null
      this.refreshToken = null

      // Clear from localStorage (하위 호환)
      if (process.client && typeof window !== 'undefined') {
        try {
          localStorage.removeItem('auth')
        } catch (error) {
          console.error('Failed to clear auth from localStorage:', error)
        }
      }

      this.isLoggingOut = false
    },

    // 토큰 자동 갱신 타이머 시작
    startTokenRefreshTimer() {
      // 기존 타이머가 있다면 중지
      this.stopTokenRefreshTimer()

      if (!process.client || !this.token) return

      // 5분마다 토큰 만료 시간 체크 (서버 부하 감소 및 배터리 절약)
      this.refreshInterval = setInterval(() => {
        this.checkAndRefreshToken()
      }, 5 * 60 * 1000) // 5분

      // 초기 실행
      this.checkAndRefreshToken()
    },

    // 토큰 자동 갱신 타이머 중지
    stopTokenRefreshTimer() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval)
        this.refreshInterval = null
      }
    },

    // 토큰 만료 시간 체크 및 필요시 갱신
    async checkAndRefreshToken() {
      if (!this.token || !this.refreshToken) return

      const timeLeft = getTokenExpiryTime(this.token)

      // 토큰이 5분 이내에 만료되면 갱신
      if (timeLeft !== null && timeLeft < 5 * 60) {
        await this.refreshAccessToken()
      }
    },

    async refreshAccessToken() {
      // refresh token이 없으면 갱신 불가
      if (!this.refreshToken) {
        return false
      }

      // 이미 갱신 중이면 중복 요청 방지
      if (this.isRefreshing) {
        return false
      }

      const api = useApi()
      this.isRefreshing = true

      try {
        const response = await api.post('/api/v1/auth/token/refresh/', {
          refresh: this.refreshToken
        })

        if (!response || !response.access) {
          throw new Error('Token refresh failed')
        }

        // With ROTATE_REFRESH_TOKENS=True, Django returns both access and refresh tokens
        // Update both tokens (or keep existing refresh token if not provided)
        const newRefreshToken = response.refresh || this.refreshToken
        this.setTokens(response.access, newRefreshToken)
        return true
      } catch (error) {
        this.logout()
        return false
      } finally {
        this.isRefreshing = false
      }
    }
  }

  // Note: We're manually handling localStorage persistence
  // instead of using pinia-plugin-persistedstate which doesn't work properly with Nuxt 3
}) 

// 전역 타입 선언 추가
declare global {
  interface Window {
    __pinia?: {
      auth?: any;
      getAuth?: () => ReturnType<typeof useAuthStore>;
    };
  }
}

// 브라우저 환경에서 스토어를 전역 window 객체에 노출
// 안전한 방식으로 수정 - 하이드레이션 후 실행되도록 변경
export function exposeStore() {
  if (process.client && typeof window !== 'undefined') {
    // 프로토타입이 있는 일반 객체 사용
    if (!window.__pinia) {
      window.__pinia = Object.create(Object.prototype);
    }
    // 스토어 인스턴스를 함수로 노출
    window.__pinia.getAuth = () => useAuthStore();
  }
}