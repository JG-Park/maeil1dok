export default defineNuxtPlugin({
  name: 'auth-init',
  parallel: false,
  async setup(nuxtApp) {
    const authStore = useAuthStore()

    // Wait for Pinia persistence to restore state
    // Use nextTick to ensure persistence plugin has completed
    await new Promise(resolve => {
      if (typeof window !== 'undefined') {
        // Wait for next event loop tick to ensure localStorage has been read
        setTimeout(resolve, 0)
      } else {
        resolve(null)
      }
    })

    // Initialize event listeners (storage sync, visibility handler)
    // This should only run once
    authStore.initializeListeners()

    try {
      // Initialize auth after persistence restoration
      await authStore.initializeAuth()
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      // Don't logout on initialization error - let the user try to continue
    }
  }
})
