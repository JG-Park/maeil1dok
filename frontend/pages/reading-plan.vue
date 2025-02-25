<template>
  <div class="container">
    <!-- 고정 영역 -->
    <div class="fixed-area">
      <!-- 헤더 -->
      <div class="header fade-in">
        <button class="back-button" @click="$router.push('/')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <h1>성경통독표</h1>
        <button 
          v-if="authStore.isAuthenticated"
          class="edit-mode-button"
          @click="toggleBulkEditMode"
        >
          {{ isBulkEditMode ? '완료' : '일괄수정' }}
        </button>
        <div v-else style="width: 64px"></div>
      </div>
    </div>

    <!-- 스크롤 영역 -->
    <div class="scroll-area">
      <BibleScheduleContent 
        :is-bulk-edit-mode="isBulkEditMode"
        @update:is-bulk-edit-mode="isBulkEditMode = $event"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import BibleScheduleContent from '~/components/BibleScheduleContent.vue'

const authStore = useAuthStore()
const isBulkEditMode = ref(false)

const toggleBulkEditMode = () => {
  isBulkEditMode.value = !isBulkEditMode.value
}
</script>

<style scoped>
.container {
  max-width: 768px;
  margin: 0 auto;
  height: 100vh; /* 뷰포트 높이 사용 */
  height: 100dvh; /* 동적 뷰포트 높이 사용 */
  display: flex;
  flex-direction: column;
  background: var(--background-color);
  position: relative; /* fixed에서 relative로 변경 */
  width: 100%;
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
  min-height: 0; /* 중요: flex 자식 요소의 스크롤을 위해 필요 */
  overflow: hidden; /* BibleScheduleContent에서 스크롤 처리 */
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
  padding: 0.2rem 0.75rem;
  background: #F1F5F9;
  color: #64748B;
  border: 1px solid #CBD5E1;
  border-radius: 8px;
  font-size: 0.875rem;
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

  .edit-mode-button {
    padding: 0.25rem 0.5rem;
    font-size: 0.8125rem;
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