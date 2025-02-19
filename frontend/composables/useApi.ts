import { useRuntimeConfig } from '#app'

export const useApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase

  const api = {
    async get(endpoint: string) {
      const response = await fetch(`${baseURL}${endpoint}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'API 요청 실패')
      }
      return response.json()
    },

    async post(endpoint: string, data: any) {
      const response = await fetch(`${baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'API 요청 실패')
      }
      return response.json()
    },

    async upload(endpoint: string, formData: FormData) {
      const response = await fetch(`${baseURL}${endpoint}`, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'API 요청 실패')
      }
      return response.json()
    },

    async delete(endpoint: string) {
      const response = await fetch(`${baseURL}${endpoint}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'API 요청 실패')
      }
      return response.status === 204 ? null : response.json()
    }
  }

  return api
} 