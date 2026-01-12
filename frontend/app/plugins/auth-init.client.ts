import { useReadingSettingsStore } from '~/stores/readingSettings'

export default defineNuxtPlugin({
  name: 'auth-init',
  parallel: false,
  async setup(nuxtApp) {
    const authStore = useAuthStore()
    const readingSettingsStore = useReadingSettingsStore()

    await new Promise(resolve => {
      if (typeof window !== 'undefined') {
        setTimeout(resolve, 0)
      } else {
        resolve(null)
      }
    })

    authStore.initializeListeners()

    try {
      await authStore.initializeAuth()
    } catch (error) {
      console.error('Failed to initialize auth:', error)
    }

    try {
      await readingSettingsStore.initialize()
    } catch (error) {
      console.error('Failed to initialize reading settings:', error)
    }
  }
})
