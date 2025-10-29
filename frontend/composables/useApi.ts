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
      
      const requiresAuth = url.includes('/api/v1/todos/hasena/status/') || 
                           (url.includes('/api/v1/todos/user/') && !isVideoIntroAPI);
      
      const authStore = useAuthStore();
      if (requiresAuth && !authStore.isAuthenticated) {
        return { data: { success: false, message: 'Authentication required' } };
      }
      
      let response = await fetch(fullUrl, {
        headers: getHeaders(),
        credentials: 'include'
      })

      if (response.status === 401) {
        const refreshSuccess = await auth.refreshAccessToken()
        if (refreshSuccess) {
          response = await fetch(fullUrl, {
            headers: getHeaders(),
            credentials: 'include'
          })
        } else {
          auth.logout()
          throw new Error('Authentication failed')
        }
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

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
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: headers,
        body: isFormData ? data : JSON.stringify(data),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      throw error
    }
  }

  const put = async (url: string, data: any) => {
    const fullUrl = `${getBaseUrl()}${url}`
    
    try {
      const headers = getHeaders();
      
      const response = await fetch(fullUrl, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  const patch = async (url: string, data: any) => {
    const fullUrl = `${getBaseUrl()}${url}`
    
    try {
      const headers = getHeaders();
      
      const response = await fetch(fullUrl, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
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
        const response = await fetch(`${getBaseUrl()}${url}`, {
          method: 'DELETE',
          headers: getHeaders()
        })
        if (!response.ok) throw new Error('API request failed')
        return response.json()
      } catch (error) {
        throw error
      }
    },
    async upload(url: string, formData: FormData) {
      try {
        const headers = auth.token ? { 'Authorization': `Bearer ${auth.token}` } : {}
        
        const response = await fetch(`${getBaseUrl()}${url}`, {
          method: 'POST',
          headers,
          body: formData,
        })
        if (!response.ok) throw new Error('API request failed')
        return response.json()
      } catch (error) {
        throw error
      }
    },
  }
}