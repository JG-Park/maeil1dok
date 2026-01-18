import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { useReadingSettingsStore } from '~/stores/readingSettings'

interface User {
  id: number
  username: string
  nickname: string
  email?: string
  profile_image?: string
  is_staff?: boolean
  email_verified?: boolean
  has_usable_password_flag?: boolean
}

type RefreshResult = 'success' | 'auth_error' | 'network_error'

interface AuthState {
  user: User | null
  token: string | null
  refreshInterval: ReturnType<typeof setInterval> | null
  storageListenerAttached: boolean
  isRefreshing: boolean
  refreshPromise: Promise<RefreshResult> | null
  isLoggingOut: boolean
}

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
    refreshInterval: null,
    storageListenerAttached: false,
    isRefreshing: false,
    refreshPromise: null,
    isLoggingOut: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
  },

  actions: {
    setAccessToken(access: string) {
      this.token = access

      if (process.client) {
        this.startTokenRefreshTimer()
      }
    },

    setUser(user: User) {
      this.user = user
      if (process.client && typeof window !== 'undefined') {
        this.saveToLocalStorage()
      }
    },

    saveToLocalStorage() {
      try {
        if (this.user) {
          const userData = { user: this.user }
          localStorage.setItem('auth', JSON.stringify(userData))
        } else {
          localStorage.removeItem('auth')
        }
      } catch (error) {
        console.error('Failed to save auth to localStorage:', error)
      }
    },

    loadFromLocalStorage() {
      try {
        const authData = localStorage.getItem('auth')
        if (!authData) return

        const parsed = JSON.parse(authData)
        if (parsed && parsed.user) {
          this.user = parsed.user
        }
      } catch (error) {
        console.error('Failed to load auth from localStorage:', error)
      }
    },

    async restoreUserFromCookie() {
      try {
        await this.fetchUser()
      } catch (error: any) {
        const statusCode = error?.status || error?.response?.status
        if (statusCode === 401 || statusCode === 403) {
          this.user = null
          if (process.client && typeof window !== 'undefined') {
            this.saveToLocalStorage()
          }
        }
      }
    },

    async initializeAuth() {
      await this.restoreUserFromCookie()

      if (this.user && process.client) {
        this.startTokenRefreshTimer()
      }
    },

    initializeListeners() {
      if (!process.client) return

      this.setupStorageSync()
      this.setupVisibilityHandler()
      this.setupNativeAppCallbacks()
    },

    setupNativeAppCallbacks() {
      if (!window.__nativeBridge?.isNativeApp()) return

      window.__nativeBridge.registerAuthCallback(
        (credentials) => {
          this.setAccessToken(credentials.token)
          this.setUser(credentials.user)
          this.startTokenRefreshTimer()
        },
        () => {
          this.logout()
        }
      )
    },

    setupStorageSync() {
      if (!process.client || this.storageListenerAttached) return

      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'auth') {
          try {
            const newValue = event.newValue ? JSON.parse(event.newValue) : null

            if (newValue) {
              if (newValue.user && newValue.user.id !== this.user?.id) {
                this.user = newValue.user
                this.startTokenRefreshTimer()
              }
            } else {
              if (this.user) {
                this.logout()
              }
            }
          } catch (error) {
          }
        }
      }

      window.addEventListener('storage', handleStorageChange)
      this.storageListenerAttached = true
    },

    setupVisibilityHandler() {
      if (!process.client) return

      const handleVisibilityChange = () => {
        if (document.hidden) return

        if (this.user) {
          this.checkAndRefreshToken()
          this.startTokenRefreshTimer()
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
    },

    async fetchUser() {
      const api = useApi()
      const response = await api.get('/api/v1/auth/user/')
      const userData = response.data || response

      if (!userData || userData.success === false || !userData.id) {
        throw new Error('Invalid user data received')
      }

      this.setUser(userData)
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

        await this.fetchUser()

        const readingSettingsStore = useReadingSettingsStore()
        await readingSettingsStore.onLogin()

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
          this.setUser(data.user)

          const readingSettingsStore = useReadingSettingsStore()
          await readingSettingsStore.onLogin()

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
          this.setUser(response.user)

          const readingSettingsStore = useReadingSettingsStore()
          await readingSettingsStore.onLogin()
        }
        return response
      } catch (error) {
        throw error
      }
    },

    async loginWithKakaoResponse(response: any) {
      if (response.access) {
        this.setUser(response.user)

        const readingSettingsStore = useReadingSettingsStore()
        await readingSettingsStore.onLogin()

        return true
      }
      return false
    },

    async logout() {
      if (this.isLoggingOut) {
        return
      }

      this.isLoggingOut = true
      this.stopTokenRefreshTimer()

      try {
        const api = useApi()
        await api.post('/api/v1/auth/logout/')
      } catch (error) {
        console.error('Server logout failed:', error)
      }

      this.user = null
      this.token = null

      if (process.client && typeof window !== 'undefined') {
        this.saveToLocalStorage()

        try {
          const { useNavigationStore } = await import('~/stores/navigation')
          const navigationStore = useNavigationStore()
          navigationStore.clear()
        } catch (error) {
          console.debug('Failed to clear navigation store:', error)
        }

        if (window.__nativeBridge?.isNativeApp()) {
          window.__nativeBridge.sendToNative({ type: 'auth:logout' })
        }
      }

      this.isLoggingOut = false
    },

    startTokenRefreshTimer() {
      this.stopTokenRefreshTimer()

      if (!process.client) return

      if (!this.user) return

      this.refreshInterval = setInterval(() => {
        this.checkAndRefreshToken()
      }, 5 * 60 * 1000)

      this.checkAndRefreshToken()
    },

    stopTokenRefreshTimer() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval)
        this.refreshInterval = null
      }
    },

    async checkAndRefreshToken() {
      if (!this.user) return
      const result = await this.refreshAccessToken()
      if (result === 'auth_error') {
        this.notifyNativeAuthExpired()
        this.logout()
      }
    },

    notifyNativeAuthExpired() {
      if (!process.client || typeof window === 'undefined') return
      if (!window.__nativeBridge?.isNativeApp()) return

      window.__nativeBridge.sendToNative({ type: 'auth:expired' })
    },

    async refreshAccessToken(): Promise<RefreshResult> {
      if (this.isRefreshing && this.refreshPromise) {
        return this.refreshPromise
      }

      this.isRefreshing = true
      this.refreshPromise = this._doRefresh()

      try {
        return await this.refreshPromise
      } finally {
        this.isRefreshing = false
        this.refreshPromise = null
      }
    },

    async _doRefresh(): Promise<RefreshResult> {
      const config = useRuntimeConfig()
      const baseUrl = process.server
        ? (process.env.DOCKER_ENV === 'true' ? 'http://backend:8000' : 'http://localhost:8019')
        : config.public.apiBase

      try {
        const requestBody = {}

        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (process.client && typeof document !== 'undefined') {
          const csrfMatch = document.cookie.match(/csrftoken=([^;]+)/)
          if (csrfMatch) {
            headers['X-CSRFToken'] = csrfMatch[1]
          }
        }

        const response = await fetch(`${baseUrl}/api/v1/auth/token/refresh/`, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          credentials: 'include'
        })

        if (response.status === 401 || response.status === 403) {
          return 'auth_error'
        }

        if (!response.ok) {
          return 'network_error'
        }

        const data = await response.json()

        if (!data || !data.access) {
          return 'auth_error'
        }

        this.setAccessToken(data.access)

        return 'success'
      } catch (error) {
        console.debug('Token refresh failed:', error)
        return 'network_error'
      }
    }
  }

}) 

  declare global {
    interface Window {
      __pinia?: {
        auth?: any;
        getAuth?: () => ReturnType<typeof useAuthStore>;
      };
    }
  }

  export function exposeStore() {
    if (process.client && typeof window !== 'undefined') {
      if (!window.__pinia) {
        window.__pinia = Object.create(Object.prototype);
      }
      window.__pinia.getAuth = () => useAuthStore();
    }
  }
