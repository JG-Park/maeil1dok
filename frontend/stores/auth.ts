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
    refreshToken: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
  },

  actions: {
    setTokens(access: string, refresh: string) {
      this.token = access
      this.refreshToken = refresh
      if (process.client) {
        localStorage.setItem('access_token', access)
        localStorage.setItem('refresh_token', refresh)
      }
    },

    setUser(user: User) {
      this.user = user
    },

    async initializeAuth() {
      if (process.client) {
        const access = localStorage.getItem('access_token')
        const refresh = localStorage.getItem('refresh_token')
        
        if (access && refresh) {
          this.token = access
          this.refreshToken = refresh
          try {
            await this.fetchUser()
          } catch (error) {
            this.logout()
          }
        }
      }
    },

    async fetchUser() {
      const api = useApi()
      try {
        const userData = await api.get('/api/v1/auth/user/')
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
        return true
      }
      return false
    },

    logout() {
      this.user = null
      this.token = null
      this.refreshToken = null
      if (process.client) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    },

    async refreshAccessToken() {
      const api = useApi()
      try {
        const response = await api.post('/api/v1/auth/token/refresh/', {
          refresh: this.refreshToken
        })

        if (!response) {
          throw new Error('Token refresh failed')
        }

        this.setTokens(response.access, response.refresh)
        return true
      } catch (error) {
        this.logout()
        return false
      }
    }
  },

  persist: {
    key: 'auth',
    paths: ['token', 'refreshToken']
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