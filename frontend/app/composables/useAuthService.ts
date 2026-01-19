/**
 * AuthService - 단일 진입점 인증 서비스
 * 
 * 모든 인증 관련 작업은 이 서비스를 통해서만 수행합니다.
 * - 로그인/로그아웃
 * - 인증 상태 확인
 * - 토큰 갱신
 * - 초기화
 */

import { ref, computed, readonly } from 'vue'
import type { Ref, ComputedRef } from 'vue'

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

// 싱글톤 상태 (모듈 레벨)
const _user: Ref<AuthUser | null> = ref(null)
const _authState: Ref<AuthState> = ref('loading')
const _isInitialized: Ref<boolean> = ref(false)
const _isRefreshing: Ref<boolean> = ref(false)
const _refreshPromise: Ref<Promise<boolean> | null> = ref(null)
let _refreshInterval: ReturnType<typeof setInterval> | null = null

// 내부 헬퍼 함수들
function getBaseUrl(): string {
  if (process.server) {
    return process.env.DOCKER_ENV === 'true' ? 'http://backend:8000' : 'http://localhost:8019'
  }
  const config = useRuntimeConfig()
  return config.public.apiBase as string
}

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/csrftoken=([^;]+)/)
  return match?.[1] ?? null
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

    let data: T | undefined
    try {
      data = await response.json()
    } catch {
      // JSON 파싱 실패 시 무시
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

function startRefreshTimer(): void {
  stopRefreshTimer()
  if (!process.client) return
  
  // 5분마다 토큰 갱신 체크
  _refreshInterval = setInterval(() => {
    if (_authState.value === 'authenticated') {
      refreshToken()
    }
  }, 5 * 60 * 1000)
}

function stopRefreshTimer(): void {
  if (_refreshInterval) {
    clearInterval(_refreshInterval)
    _refreshInterval = null
  }
}

// 토큰 갱신 (중복 호출 방지)
async function refreshToken(): Promise<boolean> {
  if (_isRefreshing.value && _refreshPromise.value) {
    return _refreshPromise.value
  }

  _isRefreshing.value = true
  _refreshPromise.value = (async () => {
    try {
      const result = await apiRequest<{ access?: string }>('POST', '/api/v1/auth/token/refresh/')
      
      if (result.status === 401 || result.status === 403) {
        // 인증 만료 - 로그아웃 처리
        await _performLogout()
        return false
      }

      if (!result.ok || !result.data?.access) {
        return false
      }

      return true
    } catch {
      return false
    } finally {
      _isRefreshing.value = false
      _refreshPromise.value = null
    }
  })()

  return _refreshPromise.value
}

// 내부 로그아웃 처리
async function _performLogout(): Promise<void> {
  stopRefreshTimer()
  
  // 서버에 로그아웃 요청 (실패해도 진행)
  try {
    await apiRequest('POST', '/api/v1/auth/logout/')
  } catch {
    // 무시
  }

  _user.value = null
  _authState.value = 'unauthenticated'
  saveUserToStorage(null)

  // 네이티브 앱 알림
  if (process.client && typeof window !== 'undefined') {
    if ((window as any).__nativeBridge?.isNativeApp?.()) {
      (window as any).__nativeBridge.sendToNative({ type: 'auth:logout' })
    }
  }
}

// 사용자 정보 가져오기
async function fetchUser(): Promise<AuthUser | null> {
  const result = await apiRequest<AuthUser>('GET', '/api/v1/auth/user/')
  
  if (!result.ok || !result.data?.id) {
    return null
  }

  return result.data
}

/**
 * 인증 서비스 composable
 */
export function useAuthService() {
  /**
   * 인증 시스템 초기화 (앱 시작 시 1회 호출)
   */
  async function initialize(): Promise<void> {
    if (_isInitialized.value) {
      return
    }

    _authState.value = 'loading'

    try {
      // 1. localStorage에서 캐시된 사용자 정보 로드 (빠른 UI 표시용)
      const cachedUser = loadUserFromStorage()
      if (cachedUser) {
        _user.value = cachedUser
      }

      // 2. 서버에서 실제 인증 상태 확인
      const user = await fetchUser()
      
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
    }

    // 가시성 변경 리스너 등록
    if (process.client) {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && _authState.value === 'authenticated') {
          refreshToken()
        }
      })

      // 다른 탭과 동기화
      window.addEventListener('storage', (event) => {
        if (event.key === 'auth') {
          const newData = event.newValue ? JSON.parse(event.newValue) : null
          if (!newData?.user && _user.value) {
            // 다른 탭에서 로그아웃
            _user.value = null
            _authState.value = 'unauthenticated'
          } else if (newData?.user && newData.user.id !== _user.value?.id) {
            // 다른 탭에서 다른 계정으로 로그인
            _user.value = newData.user
            _authState.value = 'authenticated'
          }
        }
      })
    }
  }

  /**
   * 일반 로그인 (아이디/비밀번호)
   */
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

      // 사용자 정보 가져오기
      const user = await fetchUser()
      if (!user) {
        return { success: false, error: '사용자 정보를 가져올 수 없습니다.' }
      }

      _user.value = user
      _authState.value = 'authenticated'
      saveUserToStorage(user)
      startRefreshTimer()

      // ReadingSettings 초기화
      try {
        const { useReadingSettingsStore } = await import('~/stores/readingSettings')
        const readingSettingsStore = useReadingSettingsStore()
        await readingSettingsStore.onLogin()
      } catch {
        // 실패해도 로그인은 성공
      }

      return { success: true }
    } catch (error) {
      console.error('[AuthService] Login failed:', error)
      return { success: false, error: '로그인 중 오류가 발생했습니다.' }
    }
  }

  /**
   * 소셜 로그인 (카카오, 구글 등)
   */
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

      // 회원가입 필요
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

      // 로그인 성공
      if (data.access && data.user) {
        _user.value = data.user
        _authState.value = 'authenticated'
        saveUserToStorage(data.user)
        startRefreshTimer()

        // ReadingSettings 초기화
        try {
          const { useReadingSettingsStore } = await import('~/stores/readingSettings')
          const readingSettingsStore = useReadingSettingsStore()
          await readingSettingsStore.onLogin()
        } catch {
          // 실패해도 로그인은 성공
        }

        return { success: true }
      }

      return { success: false, error: '로그인 응답이 올바르지 않습니다.' }
    } catch (error) {
      console.error('[AuthService] Social login failed:', error)
      return { success: false, error: '소셜 로그인 중 오류가 발생했습니다.' }
    }
  }

  /**
   * 소셜 회원가입 완료
   */
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

  /**
   * 로그아웃
   */
  async function logout(): Promise<void> {
    await _performLogout()

    // 네비게이션 스토어 클리어
    if (process.client) {
      try {
        const { useNavigationStore } = await import('~/stores/navigation')
        const navigationStore = useNavigationStore()
        navigationStore.clear()
      } catch {
        // 무시
      }
    }
  }

  /**
   * 사용자 정보 새로고침
   */
  async function refreshUser(): Promise<boolean> {
    const user = await fetchUser()
    if (user) {
      _user.value = user
      saveUserToStorage(user)
      return true
    }
    return false
  }

  /**
   * 강제 재인증 (인증 상태 의심 시 호출)
   */
  async function revalidate(): Promise<boolean> {
    const user = await fetchUser()
    
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

  return {
    // 상태 (읽기 전용)
    user: computed(() => _user.value),
    authState: computed(() => _authState.value),
    isAuthenticated: computed(() => _authState.value === 'authenticated'),
    isLoading: computed(() => _authState.value === 'loading'),
    isInitialized: readonly(_isInitialized),

    // 액션
    initialize,
    login,
    loginWithSocial,
    completeSocialSignup,
    logout,
    refreshUser,
    refreshToken,
    revalidate
  }
}

// 타입 export
export type AuthService = ReturnType<typeof useAuthService>
