<template>
  <div>
    <!-- 월 선택기 -->
    <div class="month-scroll fade-in" style="animation-delay: 0.1s">
      <button
        v-for="month in months"
        :key="month"
        :class="['month-button', { active: month === selectedMonth }]"
        @click="selectedMonth = month"
      >
        {{ month }}월
      </button>
    </div>

    <!-- 상태 표시기 -->
    <div class="status-indicators fade-in" style="animation-delay: 0.15s">
      <div class="indicator">
        <div class="indicator-color completed"></div>
        <span class="indicator-text">읽음</span>
      </div>
      <div class="indicator">
        <div class="indicator-color not-completed"></div>
        <span class="indicator-text">안읽음</span>
      </div>
      <div class="indicator">
        <div class="indicator-color current"></div>
        <span class="indicator-text">오늘</span>
      </div>
    </div>

    <!-- 일정 목록 -->
    <div class="schedule-body fade-in" style="animation-delay: 0.2s">
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>일정을 불러오는 중...</span>
      </div>
      <div v-else-if="!isInitialized" class="loading-state">
        <div class="loading-spinner"></div>
        <span>초기화 중...</span>
      </div>
      <div v-else-if="filteredSchedules && filteredSchedules.length === 0" class="no-schedules">
        {{ selectedMonth }}월에 등록된 일정이 없습니다.
      </div>
      <div v-else class="schedule-list">
        <div 
          v-for="schedule in filteredSchedules"
          :key="schedule.date" 
          :data-date="schedule.date"
          class="schedule-item"
          :class="[
            getReadingStatus(schedule),
            { 'bulk-edit-mode': isBulkEditMode }
          ]"
          @click="handleScheduleClick(schedule)"
        >
          <div class="checkbox" @click.stop>
            <input 
              type="checkbox"
              :checked="getReadingStatus(schedule) === 'completed'"
              @click.stop
              @change="toggleReadingStatus(schedule)"
            >
          </div>
          
          <div class="schedule-info">
            <div class="schedule-date">
              <span v-if="isToday(schedule.date)" class="today-badge">오늘</span>
              {{ formatScheduleDate(schedule.date) }}
            </div>
            <div class="schedule-reading">
              {{ schedule.book }} {{ schedule.start_chapter }}-{{ schedule.end_chapter }}장
            </div>
          </div>

          <div class="status-text">
            <svg v-if="getReadingStatus(schedule) === 'completed'" 
                 class="status-icon" 
                 width="16" height="16" 
                 viewBox="0 0 24 24" 
                 fill="none">
              <path d="M20 6L9 17L4 12" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"/>
            </svg>
            <svg v-else 
                 class="status-icon" 
                 width="16" height="16" 
                 viewBox="0 0 24 24" 
                 fill="none">
              <path d="M18 6L6 18M6 6l12 12" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round"/>
            </svg>
            {{ getStatusText(schedule) }}
          </div>
        </div>
      </div>
    </div>

    <Toast 
      ref="toast"
      :message="toastMessage"
      type="success"
      :duration="2000"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useTaskStore } from '~/stores/tasks'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'
import Toast from '~/components/Toast.vue'

const taskStore = useTaskStore()
const authStore = useAuthStore()
const api = useApi()

const props = defineProps({
  isModal: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['schedule-select'])

// 상태 변수들
const selectedMonth = ref(new Date().getMonth() + 1)
const months = Array.from({ length: 12 }, (_, i) => i + 1)
const schedules = ref([])
const readingHistory = ref([])
const isLoading = ref(true)
const isInitialized = ref(false)
const isBulkEditMode = ref(false)
const toastMessage = ref('')
const toast = ref(null)

// 선택된 월의 스케줄만 필터링
const filteredSchedules = computed(() => {
  if (!isInitialized.value) return null
  if (!schedules.value) return []
  
  return schedules.value.filter(schedule => {
    const scheduleDate = new Date(schedule.date)
    return scheduleDate.getMonth() + 1 === selectedMonth.value
  })
})

// 날짜 포맷팅 함수
const formatScheduleDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  
  const isMobile = window.innerWidth <= 640
  
  if (isMobile) {
    return `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]})`
  }
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일(${days[date.getDay()]})`
}

// 읽기 상태 확인 함수
const getReadingStatus = (schedule) => {
  const today = new Date()
  const scheduleDate = new Date(schedule.date)
  
  today.setHours(0, 0, 0, 0)
  scheduleDate.setHours(0, 0, 0, 0)
  
  if (authStore.isAuthenticated) {
    const isRead = readingHistory.value.some(history => 
      history.book === schedule.book && 
      history.last_chapter_read === schedule.end_chapter
    )
    if (isRead) return 'completed'
  }
  
  if (scheduleDate.getTime() === today.getTime()) {
    return 'current'
  }
  
  if (scheduleDate < today) {
    return 'not_completed'
  }
  
  return 'upcoming'
}

// 오늘 날짜인지 확인
const isToday = (dateString) => {
  const today = new Date()
  const scheduleDate = new Date(dateString)
  
  return today.getFullYear() === scheduleDate.getFullYear() &&
         today.getMonth() === scheduleDate.getMonth() &&
         today.getDate() === scheduleDate.getDate()
}

// 상태 텍스트 반환
const getStatusText = (schedule) => {
  if (getReadingStatus(schedule) === 'completed') {
    return '읽음'
  }
  
  if (isToday(schedule.date)) {
    return '아직 안읽음'
  }
  
  return '안읽음'
}

// 읽기 상태 토글
const toggleReadingStatus = async (schedule) => {
  if (!authStore.isAuthenticated) {
    toastMessage.value = '로그인이 필요합니다'
    toast.value?.show()
    return
  }

  try {
    const currentStatus = getReadingStatus(schedule)
    const action = currentStatus === 'completed' ? 'cancel' : 'complete'
    
    await api.post('/api/v1/todos/bible-progress/bulk-update/', {
      schedules: [schedule],
      action: action
    })
    
    await fetchReadingHistory()
    toastMessage.value = action === 'complete' ? '읽음으로 저장했어요.' : '안읽음으로 저장했어요.'
    toast.value?.show()
    
  } catch (error) {
    console.error('Failed to update reading status:', error)
    toastMessage.value = '저장에 실패했어요'
    toast.value?.show()
  }
}

// 읽기 이력 가져오기
const fetchReadingHistory = async () => {
  try {
    const response = await api.get('/api/v1/todos/reading-history/')
    readingHistory.value = response
  } catch (error) {
    console.error('Failed to fetch reading history:', error)
  }
}

// 스케줄 클릭 핸들러
const handleScheduleClick = (schedule) => {
  if (isBulkEditMode.value) {
    toggleReadingStatus(schedule)
  } else if (props.isModal) {
    emit('schedule-select', schedule)
  } else {
    goToSchedule(schedule)
  }
}

// 첫 번째 미완료 항목으로 스크롤
const scrollToFirstIncomplete = () => {
  nextTick(() => {
    const firstIncomplete = filteredSchedules.value?.find(schedule => 
      getReadingStatus(schedule) === 'not_completed'
    )
    
    if (firstIncomplete) {
      const element = document.querySelector(`[data-date="${firstIncomplete.date}"]`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  })
}

// 컴포넌트 마운트 시 초기화
onMounted(async () => {
  try {
    isLoading.value = true
    const result = await taskStore.fetchBibleSchedules()
    if (result && Array.isArray(result)) {
      schedules.value = result
    }
    
    if (authStore.isAuthenticated) {
      await fetchReadingHistory()
    }
  } catch (error) {
    console.error('Failed to initialize reading plan:', error)
  } finally {
    isLoading.value = false
    isInitialized.value = true
    scrollToFirstIncomplete()
  }
})
</script>

<style scoped>
.month-scroll {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
  background: white;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  border-bottom: 1px solid #F1F5F9;
}

.month-scroll::-webkit-scrollbar {
  display: none;
}

.month-button {
  padding: 0.5rem 0.75rem;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: white;
  font-size: 0.875rem;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  font-weight: 500;
  flex-shrink: 0;
}

.month-button.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.schedule-body {
  background: #FFFFFF;
  padding: 1rem;
  max-height: 60vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schedule-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  transition: all 0.2s ease;
  border: 1px solid #E2E8F0;
  cursor: pointer;
}

.schedule-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.schedule-date {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.today-badge {
  background: #2563EB;
  color: white;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.schedule-item.completed .today-badge {
  background: var(--primary-color);
}

.schedule-reading {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary);
}

/* 상태별 스타일 */
.schedule-item.completed {
  background: #F0FDF4;
  border-color: #DCFCE7;
}

.schedule-item.completed .schedule-reading {
  color: #166534;
}

.schedule-item.current {
  background: #EFF6FF;
  border-color: #BFDBFE;
}

.schedule-item.current .schedule-reading {
  color: #1E40AF;
}

.schedule-item.not_completed {
  background: #FEF2F2;
  border-color: #FEE2E2;
}

.schedule-item.not_completed .schedule-reading,
.schedule-item.not_completed .status-text {
  color: #991B1B;
}

.schedule-item.upcoming {
  background: #F8FAFC;
  border-color: #E2E8F0;
}

.schedule-item.upcoming .schedule-reading,
.schedule-item.upcoming .status-text {
  color: #64748B;
}

.checkbox {
  margin-right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  min-height: 32px;
  margin: -8px 8px -8px -8px;
}

.checkbox input[type="checkbox"] {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: 2px solid #CBD5E1;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.checkbox input[type="checkbox"]:checked {
  background: var(--primary-color);
  border-color: var(--primary-color);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6L9 17L4 12'/%3E%3C/svg%3E");
  background-size: 12px;
  background-position: center;
  background-repeat: no-repeat;
}

.status-text {
  font-size: 0.875rem;
  font-weight: 500;
  padding-left: 1rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.status-icon {
  flex-shrink: 0;
}

.status-indicators {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: white;
  border-bottom: 1px solid #F1F5F9;
}

.indicator {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.indicator-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.indicator-text {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.indicator-color.completed {
  background: #F0FDF4;
  border: 1px solid #DCFCE7;
}

.indicator-color.not-completed {
  background: #FEF2F2;
  border: 1px solid #FEE2E2;
}

.indicator-color.current {
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  background: white;
  border-radius: 12px;
  font-size: 0.9375rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--primary-light);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.no-schedules {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  background: white;
  border-radius: 12px;
  font-size: 0.9375rem;
}

/* 모바일 대응 */
@media (max-width: 640px) {
  .month-scroll {
    padding: 0.75rem;
  }

  .schedule-body {
    padding: 0.75rem;
  }

  .schedule-item {
    padding: 0.875rem;
  }

  .status-text {
    font-size: 0.8125rem;
    padding-left: 0.75rem;
  }

  .checkbox {
    min-width: 44px;
    min-height: 44px;
  }

  .today-badge {
    padding: 0.0625rem 0.25rem;
    font-size: 0.6875rem;
  }
}

/* CSS 변수 */
:root {
  --primary-color: #617475;
  --primary-light: #E9ECEC;
  --primary-dark: #4A5A5B;
  --text-primary: #2C3E50;
  --text-secondary: #666666;
  --background-color: #efece8;
}
</style> 