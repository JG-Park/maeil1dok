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
      // 페이지 로드 시 토큰이 있으면 사용자 정보 가져오기
      if (this.token) {
        await this.fetchUser()
      }
    },

    async login(email: string, password: string) {
      try {
        const response = await fetch('http://localhost:8000/api/v1/auth/token/', {
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
        const response = await fetch('http://localhost:8000/api/v1/auth/register/', {
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
        const response = await fetch('http://localhost:8000/api/v1/auth/user/', {
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
    }
  },

  persist: {
    key: 'auth',
    paths: ['token', 'isAuthenticated']
  }
}) 