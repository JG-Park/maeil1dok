<template>
  <div class="min-h-screen flex items-center justify-center bg-bg-primary px-4">
    <div class="max-w-md w-full text-center">
      <div class="mb-6">
        <span class="text-6xl">😢</span>
      </div>

      <h1 class="text-2xl font-bold text-txt-primary mb-3">
        {{ errorInfo.title }}
      </h1>

      <p class="text-txt-secondary mb-8">
        {{ errorInfo.description }}
      </p>

      <div class="space-y-3">
        <button
          @click="goToLogin"
          class="w-full btn btn-primary"
        >
          다시 로그인하기
        </button>

        <button
          @click="goToHome"
          class="w-full px-4 py-3 border border-border rounded-lg bg-bg-secondary text-txt-primary hover:bg-bg-hover transition-colors"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

definePageMeta({
  layout: false
})

const route = useRoute()
const router = useRouter()

const reason = computed(() => route.query.reason as string || 'unknown')

const errorMessages: Record<string, { title: string; description: string }> = {
  code_required: {
    title: '인증 코드가 필요합니다',
    description: '로그인 과정에서 문제가 발생했습니다. 다시 시도해 주세요.'
  },
  invalid_code: {
    title: '인증 코드가 만료되었습니다',
    description: '로그인 세션이 만료되었거나 이미 사용된 코드입니다. 다시 로그인해 주세요.'
  },
  user_not_found: {
    title: '사용자를 찾을 수 없습니다',
    description: '계정 정보를 확인할 수 없습니다. 다시 로그인해 주세요.'
  },
  unknown: {
    title: '인증 오류가 발생했습니다',
    description: '로그인 과정에서 문제가 발생했습니다. 다시 시도해 주세요.'
  }
}

const errorInfo = computed(() => errorMessages[reason.value] || errorMessages.unknown)

const goToLogin = () => {
  router.push('/login')
}

const goToHome = () => {
  router.push('/')
}
</script>
