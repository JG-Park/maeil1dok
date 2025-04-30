// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: {
    enabled: process.env.NUXT_DEVTOOLS === 'true'
  },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
  ],
  css: [
    '@/assets/css/main.css',
    '@/assets/css/global.css'
  ],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://api.maeil1dok.app',
      KAKAO_CLIENT_ID: process.env.KAKAO_CLIENT_ID,
      kakaoJsKey: process.env.KAKAO_JS_KEY,
      KAKAO_REDIRECT_URI: process.env.KAKAO_REDIRECT_URI,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    }
  },
  app: {
    head: {
      title: '매일일독',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'manifest', href: '/manifest.json' }
      ],
      meta: [
        { name: 'msapplication-TileColor', content: '#ffffff' },
        { name: 'theme-color', content: '#ffffff' },
        { 
          name: 'viewport', 
          content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' 
        },
        { name: 'description', content: '' },
        { property: 'og:title', content: '매일일독' },
        { property: 'og:description', content: '' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: '/og-image.png' },
        { property: 'og:url', content: 'https://maeil1dok.app' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: '매일일독' },
        { name: 'twitter:description', content: '' },
        { name: 'twitter:image', content: '/og-image.png' }
      ],
      script: [
        {
          src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8742107706365412',
          async: true,
          crossorigin: 'anonymous'
        }
      ]
    }
  },
  // Auth 설정
  auth: {
    strategies: {
      local: {
        token: {
          property: 'access',
          global: true,
          required: true,
          type: 'Bearer'
        },
        user: {
          property: 'user'
        },
        endpoints: {
          login: { url: '/api/v1/auth/token/', method: 'post' },
          refresh: { url: '/api/v1/auth/token/refresh/', method: 'post' },
          user: { url: '/api/v1/auth/user/', method: 'get' },
          logout: false
        }
      }
    },
    redirect: {
      login: '/login',
      logout: '/login',
      home: '/'
    }
  },
  // 페이지 미들웨어 설정
  router: {
    middleware: ['auth']
  },
  // Vite 설정 추가
  vite: {
    server: {
      // 운영 환경에서는 HMR 관련 설정 비활성화
      hmr: process.env.NODE_ENV === 'production' ? false : {
        protocol: 'ws',
        host: 'localhost',
        port: 3000
      }
    }
  },
  // 개발/운영 환경 설정
  nitro: {
    preset: process.env.NODE_ENV === 'production' ? 'node-server' : 'dev'
  }
})
