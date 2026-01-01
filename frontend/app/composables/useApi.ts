import { useRuntimeConfig } from '#app'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

type AxiosConfig = {
  headers?: Record<string, string>
  params?: Record<string, any>
}

type AxiosRequestConfig = AxiosConfig;


export const useApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBaseUrl

  const auth = useAuthStore()

  const getBaseUrl = () => {
    // Docker Compose 환경에서 SSR 시 컨테이너 간 통신
    if (process.server) {
      // Docker 환경에서는 서비스명으로 접근
      // 로컬 개발 시에는 포트 8019 사용
      return process.env.DOCKER_ENV === 'true' ? 'http://backend:8000' : 'http://localhost:8019'
    }
    
    // 클라이언트에서는 설정된 apiBase 사용
    // 개발 환경: localhost:8019, 프로덕션: api.maeil1dok.app
    return config.public.apiBase
  }

  const getHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
    }
    
    if (auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`
    }
    
    return headers
  }

  // API 에러 클래스 - 상태 코드 포함
  class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.name = 'ApiError'
      this.status = status
    }
  }

  // 401 에러 시 토큰 갱신 후 재시도하는 공통 함수
  const fetchWithRetry = async (
    url: string,
    options: RequestInit,
    requiresAuth: boolean = true
  ) => {
    const authStore = useAuthStore()

    if (requiresAuth && !authStore.isAuthenticated) {
      throw new ApiError('Authentication required', 401)
    }

    let response = await fetch(url, options)

    // 401 에러 발생 시 토큰 갱신 후 재시도
    // 쿠키 기반 인증: refreshToken이 null이어도 서버에서 쿠키로 갱신 시도
    // localStorage 기반 인증: refreshToken이 있을 때만 시도
    if (response.status === 401) {
      // 쿠키 기반 인증이거나 refreshToken이 있는 경우 갱신 시도
      if (auth.useCookieAuth || auth.refreshToken) {
        const refreshSuccess = await auth.refreshAccessToken()
        if (refreshSuccess) {
          // 갱신된 헤더로 재시도
          options.headers = getHeaders()
          response = await fetch(url, options)
        } else {
          // 토큰 갱신 실패 시 로그아웃 (이미 로그인된 사용자만 해당)
          if (authStore.isAuthenticated) {
            auth.logout()
          }
          throw new ApiError('Authentication failed', 401)
        }
      } else {
        // 토큰 갱신 불가 - 미인증 상태
        throw new ApiError('Not authenticated', 401)
      }
    }

    if (!response.ok) {
      throw new ApiError(`API request failed: ${response.status}`, response.status)
    }

    return response
  }

  const get = async (url: string, config?: AxiosRequestConfig) => {
    try {
      let fullUrl = `${getBaseUrl()}${url}`
      if (config?.params) {
        const searchParams = new URLSearchParams()
        Object.entries(config.params).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            searchParams.append(key, value.toString())
          }
        })
        fullUrl += `?${searchParams.toString()}`
      }

      // 인증이 필요한 URL 경로 정의
      // 비로그인 사용자도 영상 개론 목록과 개별 영상 정보를 조회할 수 있도록 예외 처리
      const isVideoIntroAPI = url.includes('/api/v1/todos/user/video/intro/') || // 목록 조회 API
                             url.includes('/api/v1/todos/video/intro/');         // 개별 영상 조회 API

      // /api/v1/auth/user/는 인증 상태 확인용 엔드포인트이므로 guard에서 제외
      // 쿠키 기반 인증에서 새로고침 시 서버로 요청을 보내서 쿠키 유효성을 확인해야 함
      const isAuthCheckEndpoint = url.includes('/api/v1/auth/user/') ||
                                  url.includes('/api/v1/auth/verify/');

      const requiresAuth = url.includes('/api/v1/todos/hasena/status/') ||
                           url.includes('/api/v1/todos/plans/user/') ||  // 사용자 플랜 목록
                           (url.includes('/api/v1/todos/user/') && !isVideoIntroAPI);

      const authStore = useAuthStore();
      // 인증 확인 엔드포인트는 항상 서버로 요청 (쿠키 기반 인증 지원)
      if (requiresAuth && !isAuthCheckEndpoint && !authStore.isAuthenticated) {
        return { data: { success: false, message: 'Authentication required' } };
      }

      // 인증 확인 엔드포인트는 requiresAuth=false로 호출 (서버로 요청 보내야 함)
      const response = await fetchWithRetry(fullUrl, {
        headers: getHeaders(),
        credentials: 'include'
      }, requiresAuth && !isAuthCheckEndpoint)

      const data = await response.json()
      return { data }
    } catch (error) {
      throw error
    }
  }

  const post = async (url: string, data?: any, config?: AxiosRequestConfig) => {
    const fullUrl = `${getBaseUrl()}${url}`

    try {
      const isFormData = data instanceof FormData;
      const headers = getHeaders();

      if (isFormData) {
        delete headers['Content-Type'];
      }

      // 인증이 필요 없는 공개 엔드포인트 정의
      const publicEndpoints = [
        '/api/v1/auth/register/',
        '/api/v1/auth/token/',
        '/api/v1/auth/social-login/',
        '/api/v1/auth/complete-kakao-signup/',
        '/api/v1/auth/check-username/',
        '/api/v1/auth/check-nickname/'
      ];

      const requiresAuth = !publicEndpoints.some(endpoint => url.includes(endpoint));

      const response = await fetchWithRetry(fullUrl, {
        method: 'POST',
        headers: headers,
        body: isFormData ? data : JSON.stringify(data),
        credentials: 'include'
      }, requiresAuth)

      return response.json()
    } catch (error) {
      throw error
    }
  }

  const put = async (url: string, data: any) => {
    const fullUrl = `${getBaseUrl()}${url}`

    try {
      const response = await fetchWithRetry(fullUrl, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
        credentials: 'include'
      })

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  const patch = async (url: string, data: any) => {
    const fullUrl = `${getBaseUrl()}${url}`

    try {
      const response = await fetchWithRetry(fullUrl, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
        credentials: 'include'
      })

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  return {
    get,
    post,
    put,
    patch,
    async delete(url: string) {
      try {
        const response = await fetchWithRetry(`${getBaseUrl()}${url}`, {
          method: 'DELETE',
          headers: getHeaders(),
          credentials: 'include'
        })
        return response.json()
      } catch (error) {
        throw error
      }
    },
    async upload(url: string, formData: FormData) {
      try {
        const headers = auth.token ? { 'Authorization': `Bearer ${auth.token}` } : {}

        const response = await fetchWithRetry(`${getBaseUrl()}${url}`, {
          method: 'POST',
          headers,
          body: formData,
          credentials: 'include'
        })
        return response.json()
      } catch (error) {
        throw error
      }
    },
  }
}