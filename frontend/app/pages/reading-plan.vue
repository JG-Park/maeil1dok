<template>
  <div class="container">
    <!-- 고정 영역 -->
    <div class="fixed-area">
      <!-- 헤더 -->
      <div class="header fade-in">
        <button class="back-button" @click="$router.push('/')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </button>
        <h1>성경통독표</h1>
        <button v-if="authStore.isAuthenticated" class="edit-mode-button" @click="toggleBulkEditMode">
          {{ isBulkEditMode ? '완료' : '일괄수정' }}
        </button>
        <button v-else class="edit-mode-button" @click="goToLogin">
          로그인
        </button>
      </div>
    </div>

    <!-- 스크롤 영역 -->
    <div class="scroll-area">
      <BibleScheduleContent 
        :is-bulk-edit-mode="isBulkEditMode"
        :use-default-plan="false"
        @range-select="handleRangeSelect"
      />
    </div>
    <Toast />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import BibleScheduleContent from '~/components/BibleScheduleContent.vue'
import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import Toast from '~/components/Toast.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const isBulkEditMode = ref(false)
const api = useApi()
const { success, error } = useToast()

const toggleBulkEditMode = () => {
  isBulkEditMode.value = !isBulkEditMode.value
}

// 로그인 페이지로 이동
const goToLogin = () => {
  router.push('/login?redirect=' + encodeURIComponent(route.fullPath))
}

// 구간 선택 핸들러 수정
const handleRangeSelect = async ({ action, startSchedule, endSchedule, scheduleIds, planId }) => {
  try {
    // API 호출
    const { data } = await api.post('/api/v1/todos/reading/update/', {
      plan_id: planId,
      schedule_ids: scheduleIds,
      action: action === 'complete' ? 'complete' : 'cancel'
    })

    // 성공 시 토스트 메시지 표시
    if (data && data.success) {
      success(action === 'complete' ? '읽음으로 저장되었습니다.' : '읽지 않음으로 저장되었습니다.')
    }
  } catch (err) {
    error('일괄 수정 중 오류가 발생했습니다.')
  } finally {
    // 일괄 수정 모드 종료
    isBulkEditMode.value = false
  }
}
</script>

<style scoped>
.container {
  max-width: 768px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background: var(--background-color);
  position: relative;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
}

.fixed-area {
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  position: relative;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  height: 50px;
}

.scroll-area {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* iOS 안전영역 대응 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .scroll-area {
    padding-bottom: env(safe-area-inset-bottom);
  }
}

.back-button {
  padding: 0.5rem;
  margin: -0.5rem;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: var(--primary-light);
}

.header h1 {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.edit-mode-button {
  padding: 0.25rem 0.75rem;
  background: #F1F5F9;
  color: #64748B;
  border: 1px solid #CBD5E1;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.edit-mode-button:hover {
  background: #E2E8F0;
  color: #475569;
}

.edit-mode-button:active,
.edit-mode-button.active {
  background: #CBD5E1;
  color: #334155;
}

:root {
  --primary-color: #617475;
  --primary-light: #E9ECEC;
  --primary-dark: #4A5A5B;
  --text-primary: #2C3E50;
  --text-secondary: #666666;
  --background-color: #efece8;
}

@media (max-width: 640px) {
  .header {
    padding: 0.75rem;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  opacity: 0;
  animation: fadeIn 0.4s ease-out forwards;
}
</style>