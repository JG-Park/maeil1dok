import { ref, computed } from 'vue'
import { useApi } from './useApi'

export function useAuth() {
  const api = useApi()
  const user = ref(null)
  const isLoading = ref(true)
  const error = ref(null)

  // Computed properties for auth state
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.is_admin === true)

  // Function to fetch current user
  const fetchCurrentUser = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.get('/api/v1/users/me/')
      user.value = response.data
    } catch (err) {
      error.value = err.message || '사용자 정보를 가져오는데 실패했습니다.'
      user.value = null
    } finally {
      isLoading.value = false
    }
  }

  // Function to handle logout
  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout/')
      user.value = null
    } catch (err) {
      error.value = err.message || '로그아웃에 실패했습니다.'
    }
  }

  // Initialize - fetch user on first use
  fetchCurrentUser()

  return {
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
    error,
    fetchCurrentUser,
    logout,
  }
} 