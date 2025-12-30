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

  // 401 에러 시 토큰 갱신 후 재시도하는 공통 함수
  const fetchWithRetry = async (
    url: string,
    options: RequestInit,
    requiresAuth: boolean = true
  ) => {
    const authStore = useAuthStore()

    if (requiresAuth && !authStore.isAuthenticated) {
      throw new Error('Authentication required')
    }

    let response = await fetch(url, options)

    // 401 에러 발생 시 토큰 갱신 후 재시도
    // 단, refresh token이 있을 때만 시도 (비로그인 상태에서는 불필요)
    if (response.status === 401 && auth.refreshToken) {
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
        throw new Error('Authentication failed')
      }
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
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

      const requiresAuth = url.includes('/api/v1/auth/user/') ||  // User info endpoint needs auto-retry on 401
                           url.includes('/api/v1/todos/hasena/status/') ||
                           url.includes('/api/v1/todos/plans/user/') ||  // 사용자 플랜 목록
                           (url.includes('/api/v1/todos/user/') && !isVideoIntroAPI);

      const authStore = useAuthStore();
      if (requiresAuth && !authStore.isAuthenticated) {
        return { data: { success: false, message: 'Authentication required' } };
      }

      const response = await fetchWithRetry(fullUrl, {
        headers: getHeaders(),
        credentials: 'include'
      }, requiresAuth)

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