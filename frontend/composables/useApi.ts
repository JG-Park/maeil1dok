import { useRuntimeConfig } from '#app'
import { useNuxtApp } from '#app'
import { useAuthStore } from '../stores/auth'

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
  const auth = useAuthStore()

  const getBaseUrl = () => {
    const config = useRuntimeConfig()
    
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

  const get = async (url: string) => {
    const fullUrl = `${getBaseUrl()}${url}`
    
    try {
      let response = await fetch(fullUrl, {
        headers: getHeaders(),
        credentials: 'include'
      })

      // 401 에러시 토큰 갱신 시도
      if (response.status === 401) {
        const refreshSuccess = await auth.refreshAccessToken()
        if (refreshSuccess) {
          // 새 토큰으로 재시도
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

      return await response.json()
    } catch (error) {
      console.error("API Request failed:", error)
      throw error
    }
  }

  const post = async (url: string, data?: any) => {
    const fullUrl = `${getBaseUrl()}${url}`
    
    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
        credentials: 'include'  // 쿠키를 포함하기 위해 추가
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error("API Post failed:", error)
      throw error
    }
  }

  return {
    get,
    post,
    async delete(url: string) {
      try {
        const response = await fetch(`${getBaseUrl()}${url}`, {
          method: 'DELETE',
          headers: getHeaders()
        })
        if (!response.ok) throw new Error('API request failed')
        return response.json()
      } catch (error) {
        console.error("API Delete failed:", error)
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
        console.error("API Upload failed:", error)
        throw error
      }
    },
  }
}

// 성경 읽기 진도 관련 API
export const useBibleProgressApi = () => {
  const api = useApi()

  // 읽기 진도 조회
  const getBibleProgress = async (book: string, chapter: number) => {
    try {
      const response = await api.get(`/api/v1/todos/bible-progress/status/?book=${book}&chapter=${chapter}`)
      return response
    } catch (error) {
      console.error('[Bible Progress API] Failed to get bible progress:', error)
      throw error
    }
  }

  // 읽기 완료 처리 (date 파라미터는 유지)
  const completeBibleReading = async (date: string) => {
    try {
      const response = await api.post('/api/v1/todos/bible-progress/complete/', {
        date
      })
      return response
    } catch (error) {
      console.error('Failed to complete bible reading:', error)
      throw error
    }
  }

  // 읽기 완료 취소 (date 파라미터는 유지)
  const cancelBibleReading = async (date: string) => {
    try {
      const response = await api.post('/api/v1/todos/bible-progress/cancel/', {
        date
      })
      return response
    } catch (error) {
      console.error('Failed to cancel bible reading:', error)
      throw error
    }
  }

  return {
    getBibleProgress,
    completeBibleReading,
    cancelBibleReading
  }
} 