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
    // SSR 환경에서는 서버 URL을 사용
    if (process.server) {
      return 'http://localhost:8000'
    }
    // 클라이언트 환경에서는 현재 호스트 기반 URL 사용
    const baseUrl = 'https://dailybible-api.jgplabs.kr'
    console.log("API Base URL:", baseUrl)  // 실제 사용되는 baseUrl 확인
    return baseUrl
  }

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      ...(auth.token ? { 'Authorization': `Bearer ${auth.token}` } : {})
    }
  }

  return {
    async get(url: string) {
      const fullUrl = `${getBaseUrl()}${url}`
      console.log("Making GET request to:", fullUrl)  // 실제 요청 URL 확인
      
      try {
        const response = await fetch(fullUrl, {
          headers: getHeaders()
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("API Error:", errorData)  // 에러 응답 확인
          throw new Error(errorData.message || 'API request failed')
        }
        const data = await response.json()
        console.log("API Response data:", data)  // 응답 데이터 확인
        return data
      } catch (error) {
        console.error("API Request failed:", error)
        throw error
      }
    },
    async post(url: string, data: any) {
      try {
        const response = await fetch(`${getBaseUrl()}${url}`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        })
        if (!response.ok) throw new Error('API request failed')
        return response.json()
      } catch (error) {
        console.error("API Post failed:", error)
        throw error
      }
    },
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
    console.log('[Bible Progress API] Requesting progress for:', { book, chapter })
    
    try {
      const response = await api.get(`/api/v1/todos/bible-progress/status/?book=${book}&chapter=${chapter}`)
      console.log('[Bible Progress API] Response:', response)
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