import { useRuntimeConfig } from '#app'
import { useNuxtApp } from '#app'
import { useAuthStore } from '../stores/auth'
import axios, { AxiosRequestConfig } from 'axios'

// API 응답 타입 정의
interface ApiResponse {
  data: any
  message?: string
  error?: string
}

// API 인스턴스 타입 정의
interface ApiInstance {
  get: (url: string, config?: any) => Promise<ApiResponse>
  post: (url: string, data?: any) => Promise<ApiResponse>
  delete: (url: string) => Promise<ApiResponse>
}

export const useApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBaseUrl

  const api = axios.create({
    baseURL,
    withCredentials: true
  })

  const auth = useAuthStore()

  const getBaseUrl = () => {
    if (process.server) {
      return 'http://localhost:8000'
    }
    
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
      
      // 인증이 필요한 API 경로인지 확인
      const requiresAuth = url.includes('/api/v1/todos/hasena/status/') || 
                           url.includes('/api/v1/todos/user/');
      
      // 인증이 필요하지만 로그인되지 않은 경우 즉시 반환
      const authStore = useAuthStore();
      if (requiresAuth && !authStore.isAuthenticated) {
        console.log('인증이 필요한 API 호출이지만 로그인되지 않았습니다:', url);
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
      // FormData인 경우와 일반 데이터인 경우 분리 처리
      const isFormData = data instanceof FormData;
      
      const headers = getHeaders();
      
      // FormData인 경우 Content-Type 헤더 제거 (브라우저가 자동으로 설정)
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
      console.error('API error:', error);
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
      console.error('API error:', error);
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