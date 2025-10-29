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
    refreshInterval: null
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
          // Fetch fresh user data from server to ensure it's up-to-date
          await this.fetchUser()

          // Start automatic token refresh timer
          this.startTokenRefreshTimer()
        } catch (error) {
          // If fetch fails but we have cached user data, keep it
          // Otherwise logout (token might be invalid)
          if (!this.user) {
            this.logout()
          } else {
            // Still start refresh timer even if fetch failed but we have cached user
            this.startTokenRefreshTimer()
          }
        }
      }
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

      // 1분마다 토큰 만료 시간 체크
      this.refreshInterval = setInterval(() => {
        this.checkAndRefreshToken()
      }, 60 * 1000) // 1분

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
      const api = useApi()
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
        console.error('Token refresh failed:', error)
        this.logout()
        return false
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