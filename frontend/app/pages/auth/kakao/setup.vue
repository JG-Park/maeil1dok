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
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter, navigateTo } from '#app'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '~/composables/useApi'
import { useModal } from '~/composables/useModal'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const api = useApi()
const modal = useModal()

const nickname = ref(route.query.suggested_nickname || '')
const loading = ref(false)
const isNicknameChecked = ref(false)
const nicknameError = ref('')

// 페이지 로드 시 닉네임 중복 체크
onMounted(() => {
  if (nickname.value) {
    checkNickname()
  }
})

const checkNickname = async () => {
  // 디바운스 처리를 위한 타임아웃
  if (checkNickname.timeout) {
    clearTimeout(checkNickname.timeout)
  }

  checkNickname.timeout = setTimeout(async () => {
    if (!nickname.value) return
    
    try {
      const response = await api.post('/api/v1/auth/check-nickname/', {
        nickname: nickname.value
      })
      
      if (response.available) {
        isNicknameChecked.value = true
        nicknameError.value = ''
      } else {
        isNicknameChecked.value = false
        nicknameError.value = '이미 사용중인 닉네임입니다.'
      }
    } catch (error) {
      isNicknameChecked.value = false
      nicknameError.value = '중복 확인 중 오류가 발생했습니다.'
    }
  }, 300) // 300ms 딜레이
}

const handleSubmit = async () => {
  if (!isNicknameChecked.value) {
    await modal.alert({
      title: '확인 필요',
      description: '닉네임 중복 확인이 필요합니다.',
      icon: 'warning'
    })
    return
  }

  loading.value = true
  try {
    // 카카오 회원가입 완료 API 호출
    const response = await api.post('/api/v1/auth/complete-kakao-signup/', {
      nickname: nickname.value,
      ...route.query  // 카카오에서 받은 정보 포함
    })

    if (response.access) {
      auth.setTokens(response.access, response.refresh)
      auth.setUser(response.user)
      // Timer is automatically started by setTokens()
      navigateTo('/')
    }
  } catch (error) {
    await modal.alert({
      title: '오류 발생',
      description: '회원가입 중 오류가 발생했습니다.',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

// 닉네임이 변경되면 중복확인 상태 초기화
watch(nickname, () => {
  isNicknameChecked.value = false
  nicknameError.value = ''
})

// TypeScript를 위한 타입 선언
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    timeout?: NodeJS.Timeout
  }
}
checkNickname.timeout = null
</script>

<style scoped>
button:disabled {
  @apply opacity-70 cursor-not-allowed transform-none;
}

.btn-primary:not(:disabled):hover {
  @apply transform -translate-y-0.5;
}
</style> 