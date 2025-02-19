// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss'
  ],
  css: [
    '@/assets/css/main.css'
  ],
  serverMiddleware: [
    { path: '/bible-proxy', handler: '~/server/middleware/proxy.ts' }
  ],
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:8000'
    }
  }
})
