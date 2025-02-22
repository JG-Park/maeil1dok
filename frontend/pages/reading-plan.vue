<template>
  <div class="container">
    <!-- 헤더 -->
    <div class="header fade-in">
      <button class="back-button" @click="$router.push('/')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1>성경통독표</h1>
      <button 
        class="edit-mode-button"
        @click="isBulkEditMode = !isBulkEditMode"
      >
        {{ isBulkEditMode ? '완료' : '일괄수정' }}
      </button>
    </div>

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

    <!-- 월 선택기 다음에 추가 -->
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
          @click="isBulkEditMode ? toggleReadingStatus(schedule) : goToSchedule(schedule)"
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

    <!-- 토스트 컴포넌트 -->
    <Toast 
      ref="toast"
      :message="toastMessage"
      type="success"
      :duration="2000"
    />

    <!-- 본문 이동 모달 -->
    <Transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal-wrapper" @click.stop>
          <div class="modal">
            <div class="modal-content">
              <h3>본문 페이지로 이동하시겠어요?</h3>
              <p class="reading-info">
                <span class="date">{{ formatScheduleDate(selectedSchedule?.date) }}</span>
                <span class="content">{{ selectedSchedule?.book }} {{ selectedSchedule?.start_chapter }}-{{ selectedSchedule?.end_chapter }}장</span>
              </p>
              <p class="guide-text">
                <span class="sub-text">혹시 읽음 상태를 변경하려고 하셨다면,<br>왼쪽 체크박스 혹은 좌측 상단 일괄수정 버튼을 눌러주세요.</span>
              </p>
              <div class="modal-buttons">
                <button class="cancel-button" @click="closeModal">취소</button>
                <button class="confirm-button" @click="confirmGoToSchedule">이동</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
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

// 상태 변수들
const selectedMonth = ref(new Date().getMonth() + 1)
const months = Array.from({ length: 12 }, (_, i) => i + 1)
const schedules = ref([])
const readingHistory = ref([])

// 월 선택기 드래그 스크롤 기능
const monthScroll = ref(null)
let isMouseDown = false
let startX
let scrollLeft

const onMouseDown = (e) => {
  isMouseDown = true
  startX = e.pageX - monthScroll.value.offsetLeft
  scrollLeft = monthScroll.value.scrollLeft
  monthScroll.value.style.cursor = 'grabbing'
}

const onMouseLeave = () => {
  isMouseDown = false
  monthScroll.value.style.cursor = 'grab'
}

const onMouseUp = () => {
  isMouseDown = false
  monthScroll.value.style.cursor = 'grab'
}

const onMouseMove = (e) => {
  if (!isMouseDown) return
  e.preventDefault()
  const x = e.pageX - monthScroll.value.offsetLeft
  const walk = (x - startX) * 2
  monthScroll.value.scrollLeft = scrollLeft - walk
}

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

// 데이터 초기화 상태 추가
const isInitialized = ref(false)

// 선택된 월의 스케줄만 필터링 - 수정
const filteredSchedules = computed(() => {
  // 초기화되지 않은 경우 null 반환 (로딩 중 상태와 빈 데이터를 구분)
  if (!isInitialized.value) return null
  if (!schedules.value) return []
  
  return schedules.value.filter(schedule => {
    const scheduleDate = new Date(schedule.date)
    const scheduleMonth = scheduleDate.getMonth() + 1
    return scheduleMonth === selectedMonth.value
  })
})

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

// 모달 상태 관리
const showModal = ref(false)
const selectedSchedule = ref(null)

// 모달 열기
const goToSchedule = (schedule) => {
  selectedSchedule.value = schedule
  showModal.value = true
  document.body.style.overflow = 'hidden' // 배경 스크롤 막기
}

// 모달 닫기
const closeModal = () => {
  showModal.value = false
  document.body.style.overflow = '' // 배경 스크롤 복구
}

// 본문 이동 확인
const confirmGoToSchedule = () => {
  const bookCode = findBookCode(selectedSchedule.value.book)
  if (!bookCode) {
    console.error('Invalid book name:', selectedSchedule.value.book)
    return
  }

  navigateTo(`/reading?book=${bookCode}&chapter=${selectedSchedule.value.start_chapter}`)
}

const findBookCode = (koreanName) => {
  const allBooks = [...bibleBooks.old, ...bibleBooks.new]
  const book = allBooks.find(b => b.name === koreanName)
  return book?.id
}

// Toast 관련 상태 추가
const toast = ref(null)
const toastMessage = ref('')

const showToast = (message = '저장되었어요!', type = 'success') => {
  toastMessage.value = message
  toast.value?.show()
}

// 읽기 상태 토글 함수 수정
const toggleReadingStatus = async (schedule) => {
  if (!authStore.isAuthenticated) {
    showToast('로그인이 필요합니다', 'error')
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
    showToast(action === 'complete' ? '읽음으로 저장했어요.' : '안읽음으로 저장했어요.')
    
  } catch (error) {
    console.error('Failed to update reading status:', error)
    showToast('저장에 실패했어요', 'error')
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

// 로딩 상태 추가
const isLoading = ref(true)

// 첫 번째 미완료 항목으로 스크롤하는 함수 추가
const scrollToFirstIncomplete = () => {
  // 약간의 지연을 추가하여 DOM이 완전히 렌더링될 때까지 기다립니다
  setTimeout(() => {
    const firstIncomplete = filteredSchedules.value?.find(schedule => 
      getReadingStatus(schedule) === 'not_completed'
    )
    
    if (firstIncomplete) {
      const element = document.querySelector(`[data-date="${firstIncomplete.date}"]`)
      if (element) {
        // 스크롤 컨테이너를 찾아서 스크롤 위치를 계산합니다
        const container = document.querySelector('.schedule-body')
        const elementTop = element.offsetTop
        const containerTop = container.offsetTop
        const offset = elementTop - containerTop - (container.clientHeight / 2) + (element.clientHeight / 2)
        
        container.scrollTo({
          top: offset,
          behavior: 'smooth'
        })
      }
    }
  }, 100) // 100ms 지연
}

// 컴포넌트 마운트 시 초기화 - 수정
onMounted(async () => {
  try {
    isLoading.value = true
    const result = await taskStore.fetchBibleSchedules()
    if (result && Array.isArray(result)) {
      schedules.value = result
    } else {
      console.error('Invalid schedules data:', result)
    }
    
    if (authStore.isAuthenticated) {
      await fetchReadingHistory()
    }
  } catch (error) {
    console.error('Failed to initialize reading plan:', error)
  } finally {
    isLoading.value = false
    isInitialized.value = true
    // 데이터 로딩이 완료된 후 약간의 지연을 두고 스크롤 실행
    setTimeout(scrollToFirstIncomplete, 200)
  }
})

// 성경 책 목록 (reading.vue에서 가져옴)
const bibleBooks = {
  old: [
    { id: 'gen', name: '창세기', chapters: 50 },
    // ... 나머지 구약 책들
  ],
  new: [
    { id: 'mat', name: '마태복음', chapters: 28 },
    // ... 나머지 신약 책들
  ]
}

// 오늘 날짜인지 확인하는 함수 추가
const isToday = (dateString) => {
  const today = new Date()
  const scheduleDate = new Date(dateString)
  
  return today.getFullYear() === scheduleDate.getFullYear() &&
         today.getMonth() === scheduleDate.getMonth() &&
         today.getDate() === scheduleDate.getDate()
}

// 상태 텍스트 반환 함수 추가
const getStatusText = (schedule) => {
  if (getReadingStatus(schedule) === 'completed') {
    return '읽음'
  }
  
  if (isToday(schedule.date)) {
    return '아직 안읽음'
  }
  
  return '안읽음'
}

// 일괄 수정 모드 상태
const isBulkEditMode = ref(false)
</script>

<style scoped>
.container {
  max-width: 768px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--background-color);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  height: 50px;
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
  background: #F1F5F9;  /* 회색 배경 */
  color: #64748B;       /* 회색 텍스트 */
  border: 1px solid #CBD5E1;  /* 회색 테두리 */
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.edit-mode-button:hover {
  background: #E2E8F0;  /* 호버 시 더 진한 회색 */
  color: #475569;       /* 호버 시 더 진한 텍스트 */
}

/* 활성화 상태 (일괄 수정 모드일 때) */
.edit-mode-button:active,
.edit-mode-button.active {
  background: #CBD5E1;
  color: #334155;
}

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
  height: calc(100vh - 150px); /* 헤더와 월 선택기를 제외한 높이 */
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

/* 읽음 상태일 때 오늘 배지 색상 변경 */
.schedule-item.completed .today-badge {
  background: var(--primary-color);
}

.schedule-reading {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary);
}

.schedule-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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

/* 과거의 안읽은 것 - 빨간색으로 */
.schedule-item.not_completed {
  background: #FEF2F2;
  border-color: #FEE2E2;
}

.schedule-item.not_completed .schedule-reading,
.schedule-item.not_completed .status-text {
  color: #991B1B;
}

/* 미래의 것 - 회색으로 */
.schedule-item.upcoming {
  background: #F8FAFC;
  border-color: #E2E8F0;
}

.schedule-item.upcoming .schedule-reading,
.schedule-item.upcoming .status-text {
  color: #64748B;
}

/* 날짜 텍스트 색상 조정 */
.schedule-item.not_completed .schedule-date {
  color: #991B1B;  /* 과거 안읽은 것 - 빨간색 */
}

.schedule-item.upcoming .schedule-date {
  color: #94A3B8;  /* 미래의 것 - 회색 */
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
  background-size: 14px;
}

.checkbox input[type="checkbox"]:checked {
  background: var(--primary-color);
  border-color: var(--primary-color);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6L9 17L4 12'/%3E%3C/svg%3E");
  background-size: 12px;
  background-position: center;
  background-repeat: no-repeat;
}

.no-schedules {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  background: white;
  border-radius: 12px;
  font-size: 0.9375rem;
}

@media (max-width: 640px) {
  .header {
    padding: 0.75rem;
  }

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

  .checkbox input[type="checkbox"] {
    width: 28px;
    height: 28px;
    background-size: 16px;
  }

  .today-badge {
    padding: 0.0625rem 0.25rem;
    font-size: 0.6875rem;
  }

  .edit-mode-button {
    padding: 0.25rem 0.5rem;
    font-size: 0.8125rem;
  }
}

/* 애니메이션 */
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

/* CSS 변수 */
:root {
  --primary-color: #617475;
  --primary-light: #E9ECEC;
  --primary-dark: #4A5A5B;
  --text-primary: #2C3E50;
  --text-secondary: #666666;
  --background-color: #efece8;
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

/* 읽은 본문 취소선 */
.schedule-item.completed .schedule-reading {
  text-decoration: line-through;
  text-decoration-color: rgba(22, 163, 74, 0.3);
  text-decoration-thickness: 2px;
}

/* 상태별 아이콘 색상 */
.schedule-item.completed .status-icon {
  color: #166534;
}

.schedule-item.not_completed .status-icon,
.schedule-item.upcoming .status-icon {
  color: #991B1B;
}

.schedule-item.current .status-icon {
  color: #1E40AF;
}

/* 일괄 수정 모드 스타일 */
.schedule-item.bulk-edit-mode {
  cursor: pointer;
  transition: all 0.2s ease;
}

/* 기본 호버 효과 (미래의 것) */
.schedule-item.bulk-edit-mode.upcoming:hover {
  background: #F8FAFC;
  border-color: #E2E8F0;
}

/* 읽음 상태 호버 효과 */
.schedule-item.bulk-edit-mode.completed:hover {
  background: #DCFCE7;
  border-color: #16A34A;
}

/* 안읽음 상태 호버 효과 */
.schedule-item.bulk-edit-mode.not_completed:hover {
  background: #FEE2E2;
  border-color: #DC2626;
}

/* 오늘 상태 호버 효과 */
.schedule-item.bulk-edit-mode.current:hover {
  background: #DBEAFE;
  border-color: #2563EB;
}

/* Toast 관련 스타일 추가 */
:deep(.toast) {
  font-weight: 500;
}

:deep(.toast.error) {
  background: #991B1B;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-wrapper {
  width: 90%;
  max-width: 400px;
  margin: auto;
  animation: scaleIn 0.2s ease-out;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  padding: 2rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.modal-content {
  text-align: center;
}

.modal h3 {
  font-size: 1.375rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2rem;
  line-height: 1.4;
  word-break: keep-all;
}

.reading-info {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.75rem;
  color: var(--primary-color);
}

.reading-info .date {
  font-size: 0.9375rem;
  font-weight: 400;
  color: var(--text-secondary);
}

.reading-info .content {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
}

.guide-text {
  margin-bottom: 2.5rem;
  line-height: 1.6;
}

.sub-text {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  line-height: 1.6;
  word-break: keep-all;
}

.modal-buttons {
  display: flex;
  gap: 0.5rem;
}

.modal-buttons button {
  flex: 1;
  padding: 0.875rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s ease;
  letter-spacing: -0.025em;
}

.cancel-button {
  background: #F1F5F9;
  border: none;
  color: var(--text-secondary);
}

.confirm-button {
  background: var(--primary-color);
  border: none;
  color: white;
}

.cancel-button:hover {
  background: #E2E8F0;
}

.confirm-button:hover {
  background: var(--primary-dark);
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

@media (max-width: 640px) {
  .status-indicators {
    padding: 0.625rem 0.75rem;
  }
  
  .indicator-text {
    font-size: 0.75rem;
  }
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

/* 모달 애니메이션 */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 모달 트랜지션 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .modal-wrapper,
.fade-leave-active .modal-wrapper {
  transition: transform 0.2s ease;
}

.fade-enter-from .modal-wrapper,
.fade-leave-to .modal-wrapper {
  transform: scale(0.95);
}
</style> 