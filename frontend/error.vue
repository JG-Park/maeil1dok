<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
  error: Object as () => NuxtError
})

const handleError = () => clearError({ redirect: '/' })

const errorMessages: Record<number, { title: string; description: string }> = {
  404: {
    title: '페이지를 찾을 수 없습니다',
    description: '요청하신 페이지가 존재하지 않거나 이동되었습니다.'
  },
  500: {
    title: '서버 오류가 발생했습니다',
    description: '잠시 후 다시 시도해 주세요.'
  },
  403: {
    title: '접근 권한이 없습니다',
    description: '이 페이지에 접근할 수 없습니다.'
  }
}

const statusCode = props.error?.statusCode || 500
const errorInfo = errorMessages[statusCode] || {
  title: '오류가 발생했습니다',
  description: props.error?.message || '알 수 없는 오류가 발생했습니다.'
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full text-center">
      <!-- 에러 코드 -->
      <div class="mb-6">
        <span class="text-8xl font-bold text-blue-500">{{ statusCode }}</span>
      </div>

      <!-- 에러 제목 -->
      <h1 class="text-2xl font-bold text-gray-900 mb-3">
        {{ errorInfo.title }}
      </h1>

      <!-- 에러 설명 -->
      <p class="text-gray-600 mb-8">
        {{ errorInfo.description }}
      </p>

      <!-- 액션 버튼 -->
      <div class="space-y-3">
        <button
          @click="handleError"
          class="w-full btn btn-primary"
          aria-label="홈으로 돌아가기"
        >
          홈으로 돌아가기
        </button>

        <button
          @click="$router.back()"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          aria-label="이전 페이지로 돌아가기"
        >
          이전 페이지로 돌아가기
        </button>
      </div>

      <!-- 도움말 링크 -->
      <p class="mt-8 text-sm text-gray-500">
        문제가 계속되면
        <a
          href="mailto:support@maeil1dok.app"
          class="text-blue-500 hover:underline"
        >
          고객지원
        </a>
        에 문의해 주세요.
      </p>
    </div>
  </div>
</template>
