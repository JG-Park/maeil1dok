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
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null
  }),

  actions: {
    async login(email: string, password: string) {
      try {
        const response = await fetch('http://localhost:8000/api/v1/auth/token/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email,
            password 
          }),
          credentials: 'include'
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Login error details:', errorData)
          throw new Error('Login failed')
        }

        const data = await response.json()
        this.token = data.access
        localStorage.setItem('token', data.access)
        
        await this.fetchUser()
        
        return true
      } catch (error) {
        console.error('Login error:', error)
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
      if (!this.token) return

      try {
        const response = await fetch('http://localhost:8000/api/v1/auth/user/', {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch user')
        }

        const data = await response.json()
        this.user = data
      } catch (error) {
        console.error('Fetch user error:', error)
      }
    },

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
    }
  }
}) 