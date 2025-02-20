import { useRuntimeConfig } from '#app'

export const useApi = () => {
  const getBaseUrl = () => {
    // SSR 환경에서는 서버 URL을 사용
    if (process.server) {
      return 'http://localhost:8000'
    }
    // 클라이언트 환경에서는 현재 호스트 기반 URL 사용
    const baseUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:8000'
      : `http://${window.location.hostname}:8000`
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