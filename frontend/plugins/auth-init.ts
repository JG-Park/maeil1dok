export default defineNuxtPlugin(async (nuxtApp) => {
  // Only initialize auth on client side
  if (process.client) {
    const authStore = useAuthStore()

    try {
      await authStore.initializeAuth()
    } catch (error) {
      console.error('Failed to initialize auth:', error)
    }
  }
})
