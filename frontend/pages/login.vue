<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Back Button -->
      <button @click="$router.back()"
        class="mb-8 flex items-center text-gray-600 hover:text-gray-900 transition-colors">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>

      <div>
        <img class="mx-auto h-8 w-auto object-contain" src="@/assets/images/로고_투명.png" alt="매일일독">
      </div>

      <!-- 카카오 로그인 버튼 -->
      <button type="button" @click="handleKakaoLogin" class="social-button kakao-button w-full">
        <img src="@/assets/images/kakao.png" width="16" height="16" alt="카카오 로고">
        카카오로 시작하기
      </button>

      <!-- 구분선 -->
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-gray-50 text-gray-500">또는</span>
        </div>
      </div>

      <!-- 일반 로그인 폼 -->
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="username" class="sr-only">아이디</label>
            <input id="username" v-model="username" type="text" required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder="아이디">
          </div>
          <div>
            <label for="password" class="sr-only">비밀번호</label>
            <input id="password" v-model="password" type="password" required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder="비밀번호">
          </div>
        </div>

        <div>
          <button type="submit" class="submit-button" :disabled="loading">
            {{ loading ? '로그인 중...' : '로그인' }}
          </button>
        </div>

        <div class="text-sm text-center">
          <NuxtLink to="/register" class="register-link">
            계정이 없으신가요? 회원가입하기
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'
import { useRuntimeConfig } from 'nuxt/app'

const auth = useAuthStore()
const config = useRuntimeConfig()
const username = ref('')
const password = ref('')
const loading = ref(false)
const route = useRoute()
const router = useRouter()

const handleSubmit = async () => {
  loading.value = true
  try {
    const success = await auth.login(username.value, password.value)
    if (success) {
      const redirectPath = String(route.query.redirect || '')
      navigateTo(redirectPath || '/')
    } else {
      alert('로그인에 실패했습니다.')
    }
  } finally {
    loading.value = false
  }
}

const handleKakaoLogin = () => {
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${config.public.KAKAO_CLIENT_ID}&redirect_uri=${config.public.KAKAO_REDIRECT_URI}&response_type=code`
  window.location.href = kakaoAuthUrl
}


</script>

<style scoped>
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
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.submit-button:hover {
  background-color: var(--primary-dark);
  transform: translateY(-1px);
}

.submit-button:active {
  transform: translateY(0);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.register-link {
  display: inline-block;
  margin-top: 1rem;
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

.social-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.kakao-button {
  background-color: #FEE500;
  color: #000000;
  border: none;
}

.kakao-button:hover {
  background-color: #FDD835;
  transform: translateY(-1px);
}

.kakao-button:active {
  transform: translateY(0);
}
</style>