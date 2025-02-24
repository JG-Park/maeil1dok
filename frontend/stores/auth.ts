import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'

interface User {
  id: number
  email: string
  username: string
  gender: string
  birth_date: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    setTokens(access, refresh) {
      this.token = access
      this.refreshToken = refresh
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
    },

    setUser(user) {
      this.user = user
    },

    async initializeAuth() {
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
    },

    async login(email: string, password: string) {
      const api = useApi()
      try {
        const response = await api.post('/api/v1/auth/token/', {
          email,
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
        this.isAuthenticated = true
      } catch (error) {
        console.error('Error fetching user:', error)
        this.logout()
      }
    },

    logout() {
      this.user = null
      this.token = null
      this.refreshToken = null
      this.isAuthenticated = false
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
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
        await this.fetchUser()
        return true
      } catch (error) {
        this.logout()
        return false
      }
    }
  },

  persist: {
    key: 'auth',
    paths: ['token', 'refreshToken', 'isAuthenticated']
  }
}) 