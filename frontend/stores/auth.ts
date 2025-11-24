import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'

interface User {
  id: number
  username: string
  nickname: string
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  refreshInterval: NodeJS.Timeout | null
  storageListenerAttached: boolean
  isRefreshing: boolean
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
    isRefreshing: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
  },

  actions: {
    setTokens(access: string, refresh: string) {
      this.token = access
      this.refreshToken = refresh
      // Pinia persistence plugin will automatically save to localStorage
    },

    setUser(user: User) {
      this.user = user
      // Pinia persistence plugin will automatically save to localStorage
    },

    async initializeAuth() {
      // Pinia persistence plugin automatically restores state from localStorage
      // We only need to validate and refresh user data if we have a token
      if (this.token && this.refreshToken) {
        try {
          // 1. 토큰 만료 시간 확인
          const timeLeft = getTokenExpiryTime(this.token)

          // 토큰이 이미 만료되었으면 refresh 시도
          if (timeLeft !== null && timeLeft <= 0) {
            console.log('Access token expired, attempting refresh...')
            const refreshSuccess = await this.refreshAccessToken()
            if (!refreshSuccess) {
              console.log('Refresh failed, logging out')
              this.logout()
              return
            }
          }

          // 2. 서버에서 사용자 정보를 가져와 토큰 유효성 확인
          await this.fetchUser()

          // 3. 자동 토큰 갱신 타이머 시작
          this.startTokenRefreshTimer()
        } catch (error) {
          console.error('Auth initialization failed:', error)
          // 토큰이 블랙리스트 처리되었거나 유효하지 않은 경우 로그아웃
          this.logout()
        }
      }

      // 4. 다중 탭 동기화 설정
      this.setupStorageSync()

      // 5. Visibility API 설정 (백그라운드 탭 처리)
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
                console.log('Token updated in another tab, syncing...')
                this.token = newValue.token
                this.refreshToken = newValue.refreshToken
                this.user = newValue.user

                // 타이머 재시작
                this.startTokenRefreshTimer()
              }
            } else {
              // 다른 탭에서 로그아웃
              if (this.token) {
                console.log('Logged out in another tab, syncing...')
                this.logout()
              }
            }
          } catch (error) {
            console.error('Failed to sync storage:', error)
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
          console.log('Tab hidden, pausing token refresh')
        } else {
          // 탭이 다시 활성화될 때
          console.log('Tab visible, checking token status')

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

        // Start automatic token refresh timer
        this.startTokenRefreshTimer()

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

          // Start automatic token refresh timer
          this.startTokenRefreshTimer()

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

          // Start automatic token refresh timer
          this.startTokenRefreshTimer()
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

        // Start automatic token refresh timer
        this.startTokenRefreshTimer()

        return true
      }
      return false
    },

    logout() {
      this.stopTokenRefreshTimer()
      this.user = null
      this.token = null
      this.refreshToken = null
      // Pinia persistence plugin will automatically clear from localStorage
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
        console.log(`Access token expires in ${timeLeft}s, refreshing...`)
        await this.refreshAccessToken()
      }
    },

    async refreshAccessToken() {
      // 이미 갱신 중이면 중복 요청 방지
      if (this.isRefreshing) {
        console.log('Token refresh already in progress')
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
        console.log('Token refreshed successfully')
        return true
      } catch (error) {
        console.error('Token refresh failed:', error)
        this.logout()
        return false
      } finally {
        this.isRefreshing = false
      }
    }
  },

  persist: {
    key: 'auth',
    paths: ['token', 'refreshToken', 'user'],
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
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