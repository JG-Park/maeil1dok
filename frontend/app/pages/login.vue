<template>
  <div class="login-container">
    <div class="login-box">
      <!-- Back Button -->
      <button @click="handleBack" class="back-btn">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>

      <!-- 로고 -->
      <div class="logo-container">
        <img src="@/assets/images/로고_투명.png" alt="매일일독" class="logo">
      </div>

      <!-- 카카오 로그인 버튼 -->
      <button type="button" @click="handleKakaoLogin" class="kakao-button">
        <img src="@/assets/images/kakao.png" width="16" height="16" alt="카카오 로고">
        카카오로 시작하기
      </button>

      <!-- 구분선 -->
      <div class="divider">
        <span>또는</span>
      </div>

      <!-- 일반 로그인 폼 -->
      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="input-group">
          <label for="username" class="visually-hidden">아이디</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            autocomplete="username"
            class="form-input input-top"
            placeholder="아이디"
          >

          <label for="password" class="visually-hidden">비밀번호</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="form-input input-bottom"
            placeholder="비밀번호"
          >
        </div>

        <button type="submit" class="submit-button" :disabled="loading">
          {{ loading ? '로그인 중...' : '로그인' }}
        </button>

        <div class="register-section">
          <NuxtLink to="/register" class="register-link">
            계정이 없으신가요? 회원가입하기
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'
import { useRuntimeConfig } from 'nuxt/app'
import { useHead } from '#imports'
import { useModal } from '~/composables/useModal'
import { useNavigation } from '~/composables/useNavigation'

useHead({
  title: '로그인 - 매일일독',
  meta: [
    { name: 'description', content: '매일일독에 로그인하여 성경 통독 진행률을 확인하세요. 카카오 로그인을 지원합니다.' },
    { property: 'og:title', content: '로그인 - 매일일독' },
    { property: 'og:description', content: '매일일독에 로그인하여 성경 통독 진행률을 확인하세요.' },
    { property: 'og:url', content: 'https://maeil1dok.app/login' },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'ko_KR' },
    { property: 'og:site_name', content: '매일일독' },
  ],
  link: [
    { rel: 'canonical', href: 'https://maeil1dok.app/login' },
  ],
})

const auth = useAuthStore()
const config = useRuntimeConfig()
const modal = useModal()
const { goBack, consumeRedirectUrl, setRedirectUrl } = useNavigation()
const username = ref('')
const password = ref('')
const loading = ref(false)
const route = useRoute()
const router = useRouter()

onMounted(() => {
  const queryRedirect = String(route.query.redirect || '')
  if (queryRedirect) {
    setRedirectUrl(queryRedirect)
  }
})

const handleSubmit = async () => {
  loading.value = true
  try {
    const success = await auth.login(username.value, password.value)
    if (success) {
      const redirectPath = consumeRedirectUrl() || '/'
      navigateTo(redirectPath)
    } else {
      await modal.alert({
        title: '로그인 실패',
        description: '로그인에 실패했습니다.',
        icon: 'error'
      })
    }
  } finally {
    loading.value = false
  }
}

const handleKakaoLogin = () => {
  const redirectUri = encodeURIComponent(config.public.KAKAO_REDIRECT_URI)
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${config.public.KAKAO_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code`
  window.location.href = kakaoAuthUrl
}

const handleBack = () => {
  goBack('/')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-base);
  padding: 3rem 1rem;
}

.login-box {
  width: 100%;
  max-width: 28rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.back-btn {
  display: flex;
  align-items: center;
  color: var(--color-slate-500);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  margin: -0.5rem;
  transition: color 0.2s ease;
  align-self: flex-start;
}

.back-btn:hover {
  color: var(--color-slate-800);
}

.logo-container {
  text-align: center;
  margin-bottom: 1rem;
}

.logo {
  height: 2rem;
  width: auto;
  object-fit: contain;
  margin: 0 auto;
  transition: filter 0.2s ease;
}

/* 다크모드에서 로고 반전 */
[data-theme="dark"] .logo {
  filter: brightness(0) invert(1);
}

.kakao-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #FEE500;
  color: #000000 !important;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.kakao-button:hover {
  background-color: #FDD835;
  transform: translateY(-1px);
}

.kakao-button:active {
  transform: translateY(0);
}

.divider {
  position: relative;
  text-align: center;
  margin: 0.5rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: var(--color-slate-300);
}

.divider span {
  position: relative;
  display: inline-block;
  padding: 0 0.5rem;
  background-color: var(--color-bg-base);
  color: var(--color-slate-500);
  font-size: 0.875rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
  border-radius: 0.375rem;
  overflow: hidden;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.form-input {
  appearance: none;
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-slate-300);
  background-color: var(--color-bg-card);
  color: var(--color-slate-800);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-input::placeholder {
  color: var(--color-slate-400);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent-secondary);
  box-shadow: 0 0 0 3px var(--color-accent-bg);
  z-index: 10;
  position: relative;
}

.input-top {
  border-top-left-radius: 0.375rem;
  border-top-right-radius: 0.375rem;
  border-bottom: none;
}

.input-bottom {
  border-bottom-left-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
}

.submit-button {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.submit-button:hover:not(:disabled) {
  background-color: var(--primary-dark);
  transform: translateY(-1px);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.register-section {
  text-align: center;
  font-size: 0.875rem;
}

.register-link {
  display: inline-block;
  color: var(--primary-color);
  font-weight: 500;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.register-link:hover {
  background-color: var(--primary-light);
  color: var(--primary-dark);
}

@media (max-width: 640px) {
  .login-container {
    padding: 2rem 1rem;
  }

  .login-box {
    gap: 1.5rem;
  }
}

/* Tablet: iPad Mini and similar */
@media (min-width: 768px) {
  .login-container {
    padding: 3rem 2rem;
  }

  .login-box {
    max-width: 480px;
    gap: 2rem;
    padding: 2.5rem;
  }

  .logo {
    width: 200px;
  }

  h1 {
    font-size: 1.75rem;
  }

  .social-buttons {
    gap: 1rem;
  }

  .social-button {
    font-size: 1rem;
    padding: 0.875rem;
  }
}

/* Tablet Large: iPad Pro and larger tablets */
@media (min-width: 1024px) {
  .login-container {
    padding: 4rem 3rem;
  }

  .login-box {
    max-width: 560px;
    gap: 2.5rem;
    padding: 3rem;
  }

  .logo {
    width: 240px;
  }

  h1 {
    font-size: 2rem;
  }

  .social-buttons {
    gap: 1.25rem;
  }

  .social-button {
    font-size: 1.125rem;
    padding: 1rem;
  }
}
</style>
