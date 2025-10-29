import { createPersistedState } from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.$pinia.use(createPersistedState({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }))
})
