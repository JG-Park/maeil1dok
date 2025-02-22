import { useRuntimeConfig } from '#app'
import { useNuxtApp } from '#app'

export const useApi = () => {
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

  return {
    async get(url: string) {
      const fullUrl = `${getBaseUrl()}${url}`
      console.log("Making GET request to:", fullUrl)  // 실제 요청 URL 확인
      
      const response = await fetch(fullUrl)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API Error:", errorData)  // 에러 응답 확인
        throw new Error('API request failed')
      }
      const data = await response.json()
      console.log("API Response data:", data)  // 응답 데이터 확인
      return data
    },
    async post(url: string, data: any) {
      const response = await fetch(`${getBaseUrl()}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('API request failed')
      return response.json()
    },
    async delete(url: string) {
      const response = await fetch(`${getBaseUrl()}${url}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('API request failed')
      return response.json()
    },
    async upload(url: string, formData: FormData) {
      const response = await fetch(`${getBaseUrl()}${url}`, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) throw new Error('API request failed')
      return response.json()
    },
  }
}

// 성경 읽기 진도 관련 API
export const useBibleProgressApi = () => {
  const { $api } = useNuxtApp()

  // 읽기 진도 조회
  const getBibleProgress = async (date: string) => {
    try {
      const response = await $api.get(`/todos/bible-progress/status/`, {
        params: { date }
      })
      return response.data
    } catch (error) {
      console.error('Failed to get bible progress:', error)
      throw error
    }
  }

  // 읽기 진도 업데이트
  const updateBibleProgress = async (date: string, lastChapterRead: number) => {
    try {
      const response = await $api.post('/todos/bible-progress/', {
        date,
        last_chapter_read: lastChapterRead
      })
      return response.data
    } catch (error) {
      console.error('Failed to update bible progress:', error)
      throw error
    }
  }

  // 읽기 완료 처리
  const completeBibleReading = async (date: string) => {
    try {
      const response = await $api.post('/todos/bible-progress/complete/', {
        date
      })
      return response.data
    } catch (error) {
      console.error('Failed to complete bible reading:', error)
      throw error
    }
  }

  // 읽기 완료 취소
  const cancelBibleReading = async (date: string) => {
    try {
      const response = await $api.post('/todos/bible-progress/cancel/', {
        date
      })
      return response.data
    } catch (error) {
      console.error('Failed to cancel bible reading:', error)
      throw error
    }
  }

  return {
    getBibleProgress,
    updateBibleProgress,
    completeBibleReading,
    cancelBibleReading
  }
} 