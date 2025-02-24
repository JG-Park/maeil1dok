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
  isAuthenticated: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    isAuthenticated: false
  }),

  actions: {
    async initialize() {
      if (process.client) {
        const token = localStorage.getItem('token')
        if (token) {
          this.token = token
          this.isAuthenticated = true
          try {
            await this.fetchUser()
          } catch (error) {
            console.error('Failed to fetch user:', error)
            this.logout()
          }
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

        this.token = response.access
        this.isAuthenticated = true
        
        if (process.client) {
          localStorage.setItem('token', response.access)
        }
        
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
        this.user = userData
        this.isAuthenticated = true
      } catch (error) {
        console.error('Error fetching user:', error)
        this.logout()
      }
    },

    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      if (process.client) {
        localStorage.removeItem('token')
      }
    }
  },

  persist: {
    key: 'auth',
    paths: ['token', 'isAuthenticated']
  }
}) 