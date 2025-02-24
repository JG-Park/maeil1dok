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
            console.error('Failed to initialize auth:', error)
            this.logout()
          }
        }
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
        console.error('Login error:', error)
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
        console.error('Registration error:', error)
        return false
      }
    },

    async fetchUser() {
      const api = useApi()
      try {
        const userData = await api.get('/api/v1/auth/user/')
        this.setUser(userData)
      } catch (error) {
        console.error('Error fetching user:', error)
        throw error
      }
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
        console.error('Token refresh failed:', error)
        this.logout()
        return false
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
        console.error('Social login failed:', error)
        throw error
      }
    }
  },

  persist: {
    key: 'auth',
    paths: ['token', 'refreshToken']
  }
}) 