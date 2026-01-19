import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'

interface HasenaResponseWrapped {
  success: boolean
  data: HasenaData
}

interface HasenaData {
  id: number
  date: string
  is_completed: boolean
  created_at: string
  updated_at: string
}

// 직접 데이터를 반환하는 경우도 처리
type HasenaResponse = HasenaResponseWrapped | HasenaData

export const useHasenaStore = defineStore('hasena', () => {
  const api = useApi()
  
  // 상태
  const isCompleted = ref<boolean>(false)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)
  
  // 날짜 포맷 함수
  const formatApiDate = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
  
  // 하세나 완료 상태 조회
  const fetchStatus = async (): Promise<HasenaResponse | null> => {
    // 인증되지 않은 사용자는 API 호출하지 않음 (401 방지)
    const { useAuthService } = await import('~/composables/useAuthService')
    const auth = useAuthService()
    if (!auth.isAuthenticated.value) {
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      const { data } = await api.get<HasenaResponse>('/api/v1/todos/hasena/status/')
      if (data.success) {
        isCompleted.value = data.data.is_completed
      }
      return data
    } catch (err: any) {
      error.value = err.message || '완료 상태를 불러오는데 실패했습니다'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // 하세나 완료 상태 업데이트
  const updateStatus = async (date: Date): Promise<any> => {
    isLoading.value = true
    error.value = null
    
    try {
      const formattedDate = formatApiDate(date)
      
      const response = await api.post('/api/v1/todos/hasena/update/', {
        date: formattedDate,
        is_completed: !isCompleted.value
      })
      
      // 응답 구조 분석 및 안전한 처리
      if (response.data) {
        // 이전 값 저장
        const oldValue = isCompleted.value
        
        // 응답 구조에 따라 처리
        if (response.data.success && response.data.data) {
          // success 필드가 있는 경우
          isCompleted.value = response.data.data.is_completed
        } else if (response.data.is_completed !== undefined) {
          // 직접 데이터가 반환되는 경우
          isCompleted.value = response.data.is_completed
        }
      }
      
      return response.data
    } catch (err: any) {
      error.value = err.message || '완료 처리에 실패했습니다'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // 상태 초기화
  const reset = (): void => {
    isCompleted.value = false
    isLoading.value = false
    error.value = null
  }
  
  return {
    isCompleted,
    isLoading,
    error,
    fetchStatus,
    updateStatus,
    reset
  }
}) 