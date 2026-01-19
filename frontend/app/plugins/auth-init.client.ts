import { useReadingSettingsStore } from '~/stores/readingSettings'

export default defineNuxtPlugin({
  name: 'auth-init',
  parallel: false,
  async setup(nuxtApp) {
    const authStore = useAuthStore()
    const readingSettingsStore = useReadingSettingsStore()

    authStore.initializeListeners()

    try {
      await authStore.initializeAuth()
    } catch (error) {
      console.error('[auth-init] Failed to initialize auth:', error)
      authStore.user = null
      authStore.token = null
    }

    try {
      await readingSettingsStore.initialize()
    } catch (error) {
      console.error('[auth-init] Failed to initialize reading settings:', error)
    }
  }
})
