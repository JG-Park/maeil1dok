// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: {
    enabled: process.env.NUXT_DEVTOOLS === 'true'
  },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/sitemap',
    '@nuxt/image',
  ],
  // 이미지 최적화 설정
  image: {
    // Vercel에서 자동 이미지 최적화 사용
    provider: 'vercel',
    // 지원 포맷
    format: ['webp', 'avif'],
    // 품질 설정
    quality: 80,
    // 스크린 사이즈
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },
  // Sitemap 설정
  site: {
    url: 'https://maeil1dok.app',
  },
  sitemap: {
    exclude: [
      '/reading',
      '/reading-plan',
      '/profile/**',
      '/groups/**',
      '/friends',
      '/scoreboard',
      '/admin/**',
      '/auth/**',
      '/hasena',
      '/notice/**',
      '/plans/**',
      '/intro/**',
    ],
  },
  css: [
    '@/assets/css/main.css',
    '@/assets/css/global.css',
    '@/assets/css/mobile-nav.css'
  ],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8019',
      bibleCacheUrl: process.env.NUXT_PUBLIC_BIBLE_CACHE_URL || '',  // 성경 캐시 서버 URL (failback용)
      KAKAO_CLIENT_ID: process.env.KAKAO_CLIENT_ID,
      kakaoJsKey: process.env.KAKAO_JS_KEY,
      KAKAO_REDIRECT_URI: process.env.KAKAO_REDIRECT_URI,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    }
  },
  app: {
    head: {
      htmlAttrs: {
        lang: 'ko',
      },
      title: '매일일독 - 성경 통독 관리 서비스',
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
        { name: 'description', content: '높은뜻 푸른교회의 성경 통독 관리 서비스. 45주 성경 통독 계획으로 체계적인 말씀 묵상을 시작하세요.' },
        { property: 'og:title', content: '매일일독 - 성경 통독 관리 서비스' },
        { property: 'og:description', content: '높은뜻 푸른교회의 성경 통독 관리 서비스. 45주 성경 통독 계획으로 체계적인 말씀 묵상을 시작하세요.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: 'https://maeil1dok.app/og-image.png' },
        { property: 'og:url', content: 'https://maeil1dok.app' },
        { property: 'og:locale', content: 'ko_KR' },
        { property: 'og:site_name', content: '매일일독' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: '매일일독 - 성경 통독 관리 서비스' },
        { name: 'twitter:description', content: '높은뜻 푸른교회의 성경 통독 관리 서비스. 45주 성경 통독 계획으로 체계적인 말씀 묵상을 시작하세요.' },
        { name: 'twitter:image', content: 'https://maeil1dok.app/og-image.png' },
        // 검색엔진 인증 메타 태그 (등록 후 인증 코드로 교체 필요)
        // { name: 'google-site-verification', content: 'YOUR_GOOGLE_VERIFICATION_CODE' },
        // { name: 'naver-site-verification', content: 'YOUR_NAVER_VERIFICATION_CODE' },
      ],
      script: [
        {
          src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8742107706365412',
          async: true,
          crossorigin: 'anonymous'
        },
        {
          src: 'https://kit.fontawesome.com/addd9ad2f2.js',
          defer: true,  // 렌더 블로킹 방지
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
  // 전역 auth 미들웨어 비활성화 - 필요한 페이지에서만 개별 설정
  // router: {
  //   middleware: ['auth']
  // },
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
  // Nitro 설정 - preset은 배포 환경에 따라 자동 감지됨
  // (Vercel: 'vercel', Node.js: 'node-server', Cloudflare: 'cloudflare' 등)
  nitro: {},
  build: {
    transpile: ['vue-cal']
  }
})
