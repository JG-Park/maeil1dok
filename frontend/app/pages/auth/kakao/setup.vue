<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Back Button -->
      <button 
        @click="$router.back()" 
        class="mb-8 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
      </button>

      <!-- Header -->
      <div>
        <img 
          class="mx-auto h-8 w-auto object-contain" 
          src="@/assets/images/로고_투명.png" 
          alt="매일일독"
        >
        <p class="mt-3 text-center text-gray-600">
          매일일독에서 사용하실 닉네임을 입력해주세요
        </p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="mt-8 space-y-6">
        <div class="rounded-md shadow-sm">
          <div>
            <label for="nickname" class="sr-only">닉네임</label>
            <input
              id="nickname"
              v-model="nickname"
              type="text"
              required
              @input="checkNickname"
              class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              :class="{
                'border-red-500 focus:ring-red-500 focus:border-red-500': nicknameError,
                'border-green-500 focus:ring-green-500 focus:border-green-500': isNicknameChecked && !nicknameError
              }"
              placeholder="2자 이상의 닉네임을 입력해주세요"
            >
            <div class="mt-2 min-h-[20px] flex items-center">
              <template v-if="nicknameError">
                <svg class="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                <span class="text-red-500 text-sm">{{ nicknameError }}</span>
              </template>
              <template v-if="isNicknameChecked && !nicknameError">
                <svg class="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span class="text-green-500 text-sm">사용 가능한 닉네임입니다</span>
              </template>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#4B9F7E] hover:bg-[#3B7E63] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4B9F7E] transition-all duration-200"
            :class="{'opacity-50 cursor-not-allowed': loading || !isNicknameChecked}"
            :disabled="loading || !isNicknameChecked"
          >
            <svg 
              v-if="loading" 
              class="animate-spin h-5 w-5 text-white mr-2" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? '처리 중...' : '시작하기' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'
import { useNavigation } from '~/composables/useNavigation'

const route = useRoute()
const auth = useAuthStore()
const api = useApi()
const { consumeRedirectUrl } = useNavigation()

const nickname = ref('')
const profileImage = ref<string | null>(null)
const loading = ref(false)
const kakaoId = ref<string | null>(null)

onMounted(() => {
  // URL 쿼리에서 정보 가져오기
  kakaoId.value = route.query.kakao_id as string || null
  nickname.value = route.query.suggested_nickname as string || ''
  profileImage.value = route.query.profile_image as string || null

  if (!kakaoId.value) {
    navigateTo('/login')
  }
})

const handleSubmit = async () => {
  if (!kakaoId.value || !nickname.value) return

  loading.value = true
  try {
    const response = await api.post('/api/v1/auth/social-signup/', {
      provider: 'kakao',
      kakao_id: kakaoId.value,
      nickname: nickname.value,
      profile_image: profileImage.value
    })

    if (response.access) {
      auth.setTokens(response.access, response.refresh)
      auth.setUser(response.user)
      // 네비게이션 스토어에서 리다이렉트 URL 소비 (로그인 전 접근하려던 페이지)
      const redirectUrl = consumeRedirectUrl() || '/'
      navigateTo(redirectUrl)
    }
  } catch (error: any) {
    console.error('Signup failed:', error)
    alert(error.message || '회원가입에 실패했습니다. 다시 시도해주세요.')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
button:disabled {
  @apply opacity-70 cursor-not-allowed transform-none;
}

.btn-primary:not(:disabled):hover {
  @apply transform -translate-y-0.5;
}
</style> 