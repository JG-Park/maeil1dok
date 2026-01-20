/**
 * AuthService - 단일 진입점 인증 서비스 (SSR-safe)
 * 
 * useState를 사용하여 SSR에서 요청 간 상태 격리 보장
 */

import { computed, readonly } from 'vue'

export interface AuthUser {
  id: number
  username: string
  nickname: string
  email?: string
  profile_image?: string
  is_staff?: boolean
  email_verified?: boolean
  has_usable_password_flag?: boolean
}

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

export interface LoginResult {
  success: boolean
  error?: string
}

export interface SocialLoginResult {
  success: boolean
  error?: string
  needsSignup?: boolean
  signupData?: {
    provider: string
    social_id: string
    suggested_nickname?: string
    profile_image?: string
    email?: string
  }
}

// 클라이언트 전용 상태 (토큰 갱신 타이머)
let _refreshInterval: ReturnType<typeof setInterval> | null = null

function getBaseUrl(): string {
  if (import.meta.server) {
    return process.env.DOCKER_ENV === 'true' ? 'http://backend:8000' : 'http://localhost:8019'
  }
  const config = useRuntimeConfig()
  return config.public.apiBase as string
}

const CSRF_TOKEN_KEY = 'csrfToken'

function getCsrfToken(): string | null {
  if (typeof window === 'undefined') return null
  
  const storedToken = localStorage.getItem(CSRF_TOKEN_KEY)
  if (storedToken) return storedToken
  
  const match = document.cookie.match(/csrftoken=([^;]+)/)
  return match?.[1] ?? null
}

function saveCsrfToken(token: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CSRF_TOKEN_KEY, token)
  }
}

async function apiRequest<T>(
  method: 'GET' | 'POST',
  url: string,
  body?: any
): Promise<{ data?: T; status: number; ok: boolean }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  
  if (method === 'POST') {
    const csrf = getCsrfToken()
    if (csrf) headers['X-CSRFToken'] = csrf
  }

  try {
    const response = await fetch(`${getBaseUrl()}${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include'
    })

    const csrfTokenFromHeader = response.headers.get('X-CSRFToken')
    if (csrfTokenFromHeader) {
      saveCsrfToken(csrfTokenFromHeader)
    }

    let data: T | undefined
    try {
      data = await response.json()
    } catch {
    }

    return { data, status: response.status, ok: response.ok }
  } catch (error) {
    console.error(`[AuthService] API request failed: ${url}`, error)
    return { status: 0, ok: false }
  }
}

function saveUserToStorage(user: AuthUser | null): void {
  if (typeof localStorage === 'undefined') return
  
  try {
    if (user) {
      localStorage.setItem('auth', JSON.stringify({ user }))
    } else {
      localStorage.removeItem('auth')
    }
  } catch (error) {
    console.error('[AuthService] Failed to save to localStorage:', error)
  }
}

function loadUserFromStorage(): AuthUser | null {
  if (typeof localStorage === 'undefined') return null
  
  try {
    const data = localStorage.getItem('auth')
    if (!data) return null
    const parsed = JSON.parse(data)
    return parsed?.user ?? null
  } catch {
    return null
  }
}

async function fetchUserFromApi(): Promise<AuthUser | null> {
  const result = await apiRequest<AuthUser>('GET', '/api/v1/auth/user/')
  
  if (!result.ok || !result.data?.id) {
    return null
  }

  return result.data
}

export function useAuthService() {
  const _user = useState<AuthUser | null>('auth:user', () => null)
  const _authState = useState<AuthState>('auth:state', () => 'loading')
  const _isInitialized = useState<boolean>('auth:initialized', () => false)
  const _initPromise = useState<Promise<void> | null>('auth:initPromise', () => null)
  const _refreshState = useState<{ isRefreshing: boolean; promise: Promise<boolean> | null }>(
    'auth:refreshState',
    () => ({ isRefreshing: false, promise: null })
  )

  function stopRefreshTimer(): void {
    if (_refreshInterval) {
      clearInterval(_refreshInterval)
      _refreshInterval = null
    }
  }

  async function performLogout(): Promise<void> {
    stopRefreshTimer()
    
    try {
      await apiRequest('POST', '/api/v1/auth/logout/')
    } catch {
    }

    _user.value = null
    _authState.value = 'unauthenticated'
    saveUserToStorage(null)

    if (import.meta.client && typeof window !== 'undefined') {
      if ((window as any).__nativeBridge?.isNativeApp?.()) {
        (window as any).__nativeBridge.sendToNative({ type: 'auth:logout' })
      }
    }
  }

  async function refreshToken(): Promise<boolean> {
    if (_refreshState.value.isRefreshing && _refreshState.value.promise) {
      return _refreshState.value.promise
    }

    _refreshState.value.isRefreshing = true
    _refreshState.value.promise = (async () => {
      try {
        const result = await apiRequest<{ access?: string }>('POST', '/api/v1/auth/token/refresh/')
        
        if (result.status === 401 || result.status === 403) {
          await performLogout()
          return false
        }

        if (!result.ok || !result.data?.access) {
          return false
        }

        return true
      } catch {
        return false
      } finally {
        _refreshState.value.isRefreshing = false
        _refreshState.value.promise = null
      }
    })()

    return _refreshState.value.promise
  }

  function startRefreshTimer(): void {
    stopRefreshTimer()
    if (!import.meta.client) return
    
    _refreshInterval = setInterval(() => {
      if (_authState.value === 'authenticated') {
        refreshToken()
      }
    }, 5 * 60 * 1000)
  }

  async function initialize(): Promise<void> {
    if (_isInitialized.value) {
      return
    }

    if (_initPromise.value) {
      return _initPromise.value
    }

    _initPromise.value = (async () => {
      _authState.value = 'loading'

      try {
        const cachedUser = loadUserFromStorage()
        if (cachedUser) {
          _user.value = cachedUser
        }

        const user = await fetchUserFromApi()
        
        if (user) {
          _user.value = user
          _authState.value = 'authenticated'
          saveUserToStorage(user)
          startRefreshTimer()
        } else {
          _user.value = null
          _authState.value = 'unauthenticated'
          saveUserToStorage(null)
        }
      } catch (error) {
        console.error('[AuthService] Initialization failed:', error)
        _user.value = null
        _authState.value = 'unauthenticated'
        saveUserToStorage(null)
      } finally {
        _isInitialized.value = true
        _initPromise.value = null
      }

      if (import.meta.client) {
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden && _authState.value === 'authenticated') {
            refreshToken()
          }
        })

        window.addEventListener('storage', (event) => {
          if (event.key === 'auth') {
            const newData = event.newValue ? JSON.parse(event.newValue) : null
            if (!newData?.user && _user.value) {
              _user.value = null
              _authState.value = 'unauthenticated'
            } else if (newData?.user && newData.user.id !== _user.value?.id) {
              _user.value = newData.user
              _authState.value = 'authenticated'
            }
          }
        })
      }
    })()

    return _initPromise.value
  }

  async function login(username: string, password: string): Promise<LoginResult> {
    try {
      const result = await apiRequest<{ access?: string; user?: AuthUser }>(
        'POST',
        '/api/v1/auth/token/',
        { username, password }
      )

      if (!result.ok) {
        return { 
          success: false, 
          error: result.status === 401 
            ? '아이디 또는 비밀번호가 올바르지 않습니다.' 
            : '로그인에 실패했습니다.' 
        }
      }

      const user = await fetchUserFromApi()
      if (!user) {
        return { success: false, error: '사용자 정보를 가져올 수 없습니다.' }
      }

      _user.value = user
      _authState.value = 'authenticated'
      saveUserToStorage(user)
      startRefreshTimer()

      try {
        const { useReadingSettingsStore } = await import('~/stores/readingSettings')
        const readingSettingsStore = useReadingSettingsStore()
        await readingSettingsStore.onLogin()
      } catch {
      }

      return { success: true }
    } catch (error) {
      console.error('[AuthService] Login failed:', error)
      return { success: false, error: '로그인 중 오류가 발생했습니다.' }
    }
  }

  async function loginWithSocial(
    provider: 'kakao' | 'google',
    payload: { code?: string; access_token?: string }
  ): Promise<SocialLoginResult> {
    try {
      const result = await apiRequest<{
        access?: string
        user?: AuthUser
        needsSignup?: boolean
        social_id?: string
        suggested_nickname?: string
        profile_image?: string
        email?: string
      }>(
        'POST',
        '/api/v1/auth/social-login/',
        { provider, ...payload }
      )

      if (!result.ok) {
        return { success: false, error: '소셜 로그인에 실패했습니다.' }
      }

      const data = result.data!

      if (data.needsSignup) {
        return {
          success: false,
          needsSignup: true,
          signupData: {
            provider,
            social_id: data.social_id || '',
            suggested_nickname: data.suggested_nickname,
            profile_image: data.profile_image,
            email: data.email
          }
        }
      }

      if (data.access && data.user) {
        _user.value = data.user
        _authState.value = 'authenticated'
        saveUserToStorage(data.user)
        startRefreshTimer()

        try {
          const { useReadingSettingsStore } = await import('~/stores/readingSettings')
          const readingSettingsStore = useReadingSettingsStore()
          await readingSettingsStore.onLogin()
        } catch {
        }

        return { success: true }
      }

      return { success: false, error: '로그인 응답이 올바르지 않습니다.' }
    } catch (error) {
      console.error('[AuthService] Social login failed:', error)
      return { success: false, error: '소셜 로그인 중 오류가 발생했습니다.' }
    }
  }

  async function completeSocialSignup(data: {
    provider: string
    social_id: string
    nickname: string
    email?: string
    gender?: string
    birth_date?: string
  }): Promise<LoginResult> {
    try {
      const result = await apiRequest<{ access?: string; user?: AuthUser }>(
        'POST',
        '/api/v1/auth/complete-social-signup/',
        data
      )

      if (!result.ok || !result.data?.user) {
        return { success: false, error: '회원가입에 실패했습니다.' }
      }

      _user.value = result.data.user
      _authState.value = 'authenticated'
      saveUserToStorage(result.data.user)
      startRefreshTimer()

      return { success: true }
    } catch (error) {
      console.error('[AuthService] Social signup failed:', error)
      return { success: false, error: '회원가입 중 오류가 발생했습니다.' }
    }
  }

  async function logout(): Promise<void> {
    await performLogout()

    if (import.meta.client) {
      try {
        const { useNavigationStore } = await import('~/stores/navigation')
        const navigationStore = useNavigationStore()
        navigationStore.clear()
      } catch {
      }
    }
  }

  async function refreshUser(): Promise<boolean> {
    const user = await fetchUserFromApi()
    if (user) {
      _user.value = user
      saveUserToStorage(user)
      return true
    }
    return false
  }

  async function revalidate(): Promise<boolean> {
    const user = await fetchUserFromApi()
    
    if (user) {
      _user.value = user
      _authState.value = 'authenticated'
      saveUserToStorage(user)
      return true
    } else {
      _user.value = null
      _authState.value = 'unauthenticated'
      saveUserToStorage(null)
      return false
    }
  }

  // 호환성 메서드
  function setTokens(_access: string, _refresh?: string): void {
    _authState.value = 'authenticated'
  }

  function setUser(user: AuthUser): void {
    _user.value = user
    _authState.value = 'authenticated'
    saveUserToStorage(user)
    startRefreshTimer()
  }

  async function fetchUserCompat(): Promise<void> {
    const user = await fetchUserFromApi()
    if (user) {
      _user.value = user
      _authState.value = 'authenticated'
      saveUserToStorage(user)
      startRefreshTimer()
    } else {
      throw new Error('Failed to fetch user')
    }
  }

  async function socialLogin(provider: string, code: string): Promise<any> {
    const result = await loginWithSocial(provider as 'kakao' | 'google', { code })
    
    if (result.success) {
      return {
        access: 'cookie-based',
        user: _user.value
      }
    }
    
    if (result.needsSignup && result.signupData) {
      return {
        needsSignup: true,
        kakao_id: result.signupData.social_id,
        google_id: result.signupData.social_id,
        provider_id: result.signupData.social_id,
        suggested_nickname: result.signupData.suggested_nickname,
        profile_image: result.signupData.profile_image,
        email: result.signupData.email
      }
    }
    
    throw new Error(result.error || 'Social login failed')
  }

  async function initializeAuth(): Promise<void> {
    return initialize()
  }

  return {
    user: computed(() => _user.value),
    authState: computed(() => _authState.value),
    isAuthenticated: computed(() => _authState.value === 'authenticated'),
    isLoading: computed(() => _authState.value === 'loading'),
    isInitialized: readonly(_isInitialized),

    initialize,
    login,
    loginWithSocial,
    completeSocialSignup,
    logout,
    refreshUser,
    refreshToken,
    revalidate,

    setTokens,
    setUser,
    fetchUser: fetchUserCompat,
    socialLogin,
    initializeAuth
  }
}

export type AuthService = ReturnType<typeof useAuthService>
