import { defineStore } from 'pinia'

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
      try {
        const response = await fetch('https://dailybible-api.jgplabs.kr/api/v1/auth/token/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        if (!response.ok) {
          throw new Error('Login failed')
        }

        const data = await response.json()
        this.token = data.access
        this.isAuthenticated = true
        
        if (process.client) {
          localStorage.setItem('token', data.access)
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
      try {
        const response = await fetch('https://dailybible-api.jgplabs.kr/api/v1/auth/register/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        })

        if (!response.ok) {
          throw new Error('Registration failed')
        }

        const data = await response.json()
        return true
      } catch (error) {
        console.error('Registration error:', error)
        return false
      }
    },

    async fetchUser() {
      try {
        const response = await fetch('https://dailybible-api.jgplabs.kr/api/v1/auth/user/', {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch user')
        }

        const userData = await response.json()
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