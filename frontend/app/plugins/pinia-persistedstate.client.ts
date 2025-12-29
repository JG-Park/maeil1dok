import { createPersistedState } from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin((nuxtApp) => {
  // Note: This plugin is registered but not actively used
  // Auth store manually handles localStorage persistence
  const persistedState = createPersistedState({
    storage: typeof window !== 'undefined' ? localStorage : null,
  })

  nuxtApp.$pinia.use(persistedState)
})
