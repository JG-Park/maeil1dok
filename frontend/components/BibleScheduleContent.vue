<template>
  <div class="bible-schedule-wrapper">
    <!-- 월 선택기 -->
    <div class="fixed-controls">
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
    </div>

    <!-- 일정 목록 -->
    <div 
      class="schedule-body fade-in" 
      style="animation-delay: 0.2s"
      :data-is-modal="props.isModal"
    >
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
            { 'bulk-edit-mode': props.isBulkEditMode },
            { 'current-location': isCurrentLocation(schedule) }
          ]"
          @click="handleScheduleClick(schedule)"
        >
          <div class="checkbox" @click.stop>
            <input 
              type="checkbox"
              :checked="authStore.isAuthenticated && getReadingStatus(schedule) === 'completed'"
              @click.stop="handleCheckboxClick(schedule, $event)"
            >
          </div>
          
          <div class="schedule-info">
            <div class="schedule-date">
              <span v-if="isToday(schedule.date)" class="today-badge">오늘</span>
              {{ formatScheduleDate(schedule.date) }}
            </div>
            <div class="schedule-reading">
              <span v-if="isCurrentLocation(schedule)" class="current-location-badge">현재 위치</span>
              <span class="bible-text">{{ schedule.book }} {{ schedule.start_chapter }}-{{ schedule.end_chapter }}장</span>
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
                <span class="sub-text">혹시 읽음 상태를 변경하려고 하셨나요?<br>왼쪽 체크박스를 직접 클릭하거나,<br>우측 상단 일괄수정 버튼을 누른 후 변경할 수 있어요.</span>
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

    <!-- 로그인 안내 모달 추가 -->
    <Transition name="fade">
      <div v-if="showLoginModal" class="modal-overlay" @click="closeLoginModal">
        <div class="modal-wrapper" @click.stop>
          <div class="modal">
            <div class="modal-content">
              <h3>로그인이 필요해요</h3>
              <p class="reading-info">
                <span class="content">읽음 표시를 기록하시려면<br>로그인이 필요해요.</span>
              </p>
              <div class="modal-buttons">
                <button class="cancel-button" @click="closeLoginModal">취소</button>
                <button class="confirm-button" @click="goToLogin">로그인</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useTaskStore } from '~/stores/tasks'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'
import Toast from '~/components/Toast.vue'
import { useRouter, useRoute } from 'vue-router'

const taskStore = useTaskStore()
const authStore = useAuthStore()
const api = useApi()
const router = useRouter()
const route = useRoute()

const props = defineProps({
  isModal: {
    type: Boolean,
    default: false
  },
  isBulkEditMode: {
    type: Boolean,
    default: false
  },
  currentBook: {
    type: String,
    default: ''
  },
  currentChapter: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['schedule-select', 'update:is-bulk-edit-mode'])

// 상태 변수들
const selectedMonth = ref(new Date().getMonth() + 1)
const months = Array.from({ length: 12 }, (_, i) => i + 1)
const schedules = ref([])
const readingHistory = ref([])
const isLoading = ref(true)
const isInitialized = ref(false)
const toastMessage = ref('')
const toast = ref(null)

// 모달 관련 상태와 함수들
const showModal = ref(false)
const selectedSchedule = ref(null)

// 로그인 모달 관련 상태와 함수들
const showLoginModal = ref(false)

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
  
  // 로그인한 사용자는 실제 읽기 상태 표시
  if (authStore.isAuthenticated) {
    const isRead = readingHistory.value.some(history => 
      history.book === schedule.book && 
      history.last_chapter_read === schedule.end_chapter
    )
    if (isRead) return 'completed'
    
    if (scheduleDate < today) {
      return 'not_completed'
    }
  } else {
    // 비로그인 사용자는 과거 일정을 모두 읽음으로 표시
    if (scheduleDate < today) {
      return 'completed'
    }
  }
  
  // 오늘 날짜는 current로 표시
  if (scheduleDate.getTime() === today.getTime()) {
    return 'current'
  }
  
  // 미래 날짜는 upcoming으로 표시
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
    showLoginModal.value = true
    document.body.style.overflow = 'hidden'
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
  if (props.isBulkEditMode) {
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
    // 로그인한 경우
    if (authStore.isAuthenticated) {
      // 현재 월의 첫 번째 미완료 항목 찾기
      const firstIncomplete = filteredSchedules.value?.find(schedule => 
        getReadingStatus(schedule) === 'not_completed'
      )
      
      if (firstIncomplete) {
        // 미완료 항목이 있으면 해당 위치로 스크롤
        const element = document.querySelector(`[data-date="${firstIncomplete.date}"]`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      } else {
        // 모두 읽은 상태면 다음 읽을 항목(미래 날짜 중 가장 빠른 날짜) 찾기
        const nextToRead = filteredSchedules.value?.find(schedule => {
          const scheduleDate = new Date(schedule.date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          scheduleDate.setHours(0, 0, 0, 0)
          return scheduleDate > today
        })

        if (nextToRead) {
          const element = document.querySelector(`[data-date="${nextToRead.date}"]`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }
      }
    } 
    // 비로그인의 경우 오늘 날짜로 스크롤
    else {
      const today = new Date()
      const todaySchedule = filteredSchedules.value?.find(schedule => {
        const scheduleDate = new Date(schedule.date)
        return scheduleDate.getDate() === today.getDate() &&
               scheduleDate.getMonth() === today.getMonth() &&
               scheduleDate.getFullYear() === today.getFullYear()
      })
      
      if (todaySchedule) {
        const element = document.querySelector(`[data-date="${todaySchedule.date}"]`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      } else {
        // 오늘 일정이 없으면 다음 읽을 항목으로 스크롤
        const nextSchedule = filteredSchedules.value?.find(schedule => {
          const scheduleDate = new Date(schedule.date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          scheduleDate.setHours(0, 0, 0, 0)
          return scheduleDate > today
        })

        if (nextSchedule) {
          const element = document.querySelector(`[data-date="${nextSchedule.date}"]`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }
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

const closeModal = () => {
  showModal.value = false
  document.body.style.overflow = ''
}

const goToSchedule = (schedule) => {
  // 비로그인 사용자는 바로 본문으로 이동
  if (!authStore.isAuthenticated) {
    const bookCode = findBookCode(schedule.book)
    if (!bookCode) {
      console.error('Invalid book name:', schedule.book)
      return
    }
    router.push(`/reading?book=${bookCode}&chapter=${schedule.start_chapter}&from=reading-plan&month=${selectedMonth.value}`)
    return
  }

  // 로그인 사용자는 모달 표시
  selectedSchedule.value = schedule
  showModal.value = true
  document.body.style.overflow = 'hidden'
}

const confirmGoToSchedule = () => {
  const bookCode = findBookCode(selectedSchedule.value.book)
  if (!bookCode) {
    console.error('Invalid book name:', selectedSchedule.value.book)
    return
  }

  // 라우팅 전에 overflow 스타일 제거
  document.body.style.overflow = ''
  
  router.push(`/reading?book=${bookCode}&chapter=${selectedSchedule.value.start_chapter}&from=reading-plan&month=${selectedMonth.value}`)
}

// 한글 성경 이름을 코드로 변환하는 함수
const findBookCode = (koreanName) => {
  const bibleBooks = {
    old: [
      { id: 'gen', name: '창세기' },
      { id: 'exo', name: '출애굽기' },
      { id: 'lev', name: '레위기' },
      { id: 'num', name: '민수기' },
      { id: 'deu', name: '신명기' },
      { id: 'jos', name: '여호수아' },
      { id: 'jdg', name: '사사기' },
      { id: 'rut', name: '룻기' },
      { id: '1sa', name: '사무엘상' },
      { id: '2sa', name: '사무엘하' },
      { id: '1ki', name: '열왕기상' },
      { id: '2ki', name: '열왕기하' },
      { id: '1ch', name: '역대상' },
      { id: '2ch', name: '역대하' },
      { id: 'ezr', name: '에스라' },
      { id: 'neh', name: '느헤미야' },
      { id: 'est', name: '에스더' },
      { id: 'job', name: '욥기' },
      { id: 'psa', name: '시편' },
      { id: 'pro', name: '잠언' },
      { id: 'ecc', name: '전도서' },
      { id: 'sng', name: '아가' },
      { id: 'isa', name: '이사야' },
      { id: 'jer', name: '예레미야' },
      { id: 'lam', name: '예레미야애가' },
      { id: 'ezk', name: '에스겔' },
      { id: 'dan', name: '다니엘' },
      { id: 'hos', name: '호세아' },
      { id: 'jol', name: '요엘' },
      { id: 'amo', name: '아모스' },
      { id: 'oba', name: '오바댜' },
      { id: 'jon', name: '요나' },
      { id: 'mic', name: '미가' },
      { id: 'nam', name: '나훔' },
      { id: 'hab', name: '하박국' },
      { id: 'zep', name: '스바냐' },
      { id: 'hag', name: '학개' },
      { id: 'zec', name: '스가랴' },
      { id: 'mal', name: '말라기' }
    ],
    new: [
      { id: 'mat', name: '마태복음' },
      { id: 'mrk', name: '마가복음' },
      { id: 'luk', name: '누가복음' },
      { id: 'jhn', name: '요한복음' },
      { id: 'act', name: '사도행전' },
      { id: 'rom', name: '로마서' },
      { id: '1co', name: '고린도전서' },
      { id: '2co', name: '고린도후서' },
      { id: 'gal', name: '갈라디아서' },
      { id: 'eph', name: '에베소서' },
      { id: 'php', name: '빌립보서' },
      { id: 'col', name: '골로새서' },
      { id: '1th', name: '데살로니가전서' },
      { id: '2th', name: '데살로니가후서' },
      { id: '1ti', name: '디모데전서' },
      { id: '2ti', name: '디모데후서' },
      { id: 'tit', name: '디도서' },
      { id: 'phm', name: '빌레몬서' },
      { id: 'heb', name: '히브리서' },
      { id: 'jas', name: '야고보서' },
      { id: '1pe', name: '베드로전서' },
      { id: '2pe', name: '베드로후서' },
      { id: '1jn', name: '요한일서' },
      { id: '2jn', name: '요한이서' },
      { id: '3jn', name: '요한삼서' },
      { id: 'jud', name: '유다서' },
      { id: 'rev', name: '요한계시록' }
    ]
  }
  
  const allBooks = [...bibleBooks.old, ...bibleBooks.new]
  const book = allBooks.find(b => b.name === koreanName)
  return book?.id
}

const closeLoginModal = () => {
  showLoginModal.value = false
  document.body.style.overflow = ''
}

const goToLogin = () => {
  const queryString = route.query ? new URLSearchParams(Object.entries(route.query)).toString() : ''
  const currentPath = `${route.path}${queryString ? '?' + queryString : ''}`
  navigateTo({
    path: '/login',
    query: {
      redirect: currentPath
    }
  })
  showLoginModal.value = false
}

// 체크박스 클릭 핸들러 추가
const handleCheckboxClick = (schedule, event) => {
  event.preventDefault() // 기본 체크박스 동작 방지
  toggleReadingStatus(schedule)
}

// 현재 위치 확인 함수
const isCurrentLocation = (schedule) => {
  if (!props.isModal || !props.currentBook || !props.currentChapter) return false
  
  const bookCode = findBookCode(schedule.book)
  return bookCode === props.currentBook && 
         props.currentChapter >= schedule.start_chapter && 
         props.currentChapter <= schedule.end_chapter
}

// 현재 위치로 스크롤하는 함수
const scrollToCurrentLocation = () => {
  if (!props.isModal || !props.currentBook || !props.currentChapter) return

  nextTick(() => {
    const currentSchedule = filteredSchedules.value?.find(schedule => {
      const bookCode = findBookCode(schedule.book)
      return bookCode === props.currentBook && 
             props.currentChapter >= schedule.start_chapter && 
             props.currentChapter <= schedule.end_chapter
    })

    if (currentSchedule) {
      const element = document.querySelector(`[data-date="${currentSchedule.date}"]`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  })
}

// 컴포넌트가 마운트되거나 currentBook/currentChapter가 변경될 때 스크롤
onMounted(() => {
  if (props.isModal) {
    scrollToCurrentLocation()
  }
})

watch([() => props.currentBook, () => props.currentChapter], () => {
  if (props.isModal) {
    scrollToCurrentLocation()
  }
})
</script>

<style scoped>
.bible-schedule-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.fixed-controls {
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 2;
  background: white;
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

.status-indicators {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: white;
  border-bottom: 1px solid #F1F5F9;
}

.schedule-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: #FFFFFF;
  padding: 1rem;
}

/* isModal prop이 true일 때만 max-height 적용 */
.schedule-body[data-is-modal="true"] {
  max-height: 65vh;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 2rem;
}

/* iOS 안전영역 대응 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .schedule-body {
    padding-bottom: calc(env(safe-area-inset-bottom) + 1rem);
  }

  .schedule-list {
    padding-bottom: calc(2rem + env(safe-area-inset-bottom));
  }
}

.month-scroll::-webkit-scrollbar {
  display: none;
}

.month-button {
  padding: 0.2rem 0.75rem;
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

/* 오늘 배지 기본 스타일 */
.today-badge {
  background: #405e9f;
  color: white;
  padding: 0.05rem 0.25rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 600;
}

/* 읽음 상태일 때 오늘 배지 스타일 */
.schedule-item.completed .today-badge {
  background: var(--primary-color);
  color: white;
}

/* 현재 위치이면서 읽음 상태일 때 오늘 배지 스타일 */
.schedule-item.current-location.completed .today-badge {
  background: var(--primary-color);
  color: white;
}

.schedule-reading {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 상태별 스타일 */
.schedule-item.completed {
  background: #F0FDF4;
  border-color: #c3e0cd;
}

/* 일반적인 읽음 상태 스타일 */
.schedule-item.completed .schedule-reading .bible-text {
  color: #166534;
  text-decoration: line-through;
  text-decoration-color: rgba(22, 101, 52, 0.4);
  text-decoration-thickness: 2px;
}

/* 현재 위치이면서 읽음 상태일 때 */
.schedule-item.current-location.completed {
  background: #F0FDF4;
  border-color: #c3e0cd;
}

.schedule-item.current-location.completed .schedule-reading .bible-text {
  color: #166534;
  text-decoration: line-through;
  text-decoration-color: rgba(22, 101, 52, 0.4);
  text-decoration-thickness: 2px;
}

.schedule-item.current-location.completed .current-location-badge {
  color: #997b1b;
  text-decoration: none;
  border: 1px solid #e5d87b;
  background: #FEF9C3;
}

.schedule-item.current-location.completed .status-text {
  color: #166534;
}

.schedule-item.current {
  background: #EFF6FF;
  border-color: #BFDBFE;
}

.schedule-item.current .schedule-reading {
  color: #546395;
}

.schedule-item.not_completed {
  background: #FEF2F2;
  border-color: #dabbbb;
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
  border: 1px solid #c3e0cd;
}

.indicator-color.not-completed {
  background: #FEF2F2;
  border: 1px solid #dabbbb;
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


  .current-location-badge {
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

.progress-card {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.login-message {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border-radius: 12px;
  z-index: 1;
  padding: 1rem;
  text-align: center;
  color: var(--text-secondary);
}

/* 모달 스타일 */
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
  font-size: 1.2rem;
  line-height: 1.6;
  font-weight: 600;
  color: var(--primary-color);
  text-align: center;
  margin: 0.2rem 0;
}

.guide-text {
  margin-bottom: 2.5rem;
  line-height: 1.6;
}

.sub-text {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  line-height: 1.2;
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

/* 모달 트랜지션 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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

.current-location-badge {
  background: #FEF9C3;
  color: #997b1b;
  padding: 0.125rem 0.375rem;
  padding: 0.05rem 0.25rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 600;
  border: 1px solid #e5d87b;
}

.schedule-item.current-location {
  background: #FEFCE8;
  border-color: #FEF08A;
}

.schedule-item.current-location .schedule-reading {
  color: #997b1b;
}

.schedule-item.current-location .status-text {
  color: #997b1b;
}

/* 현재 위치이면서 오늘이고 안읽음 상태일 때 */
.schedule-item.current-location.current {
  background: #FEFCE8;
  border-color: #e5d87b;
}

.schedule-item.current-location.current .schedule-reading {
  color: #997b1b;
}

.schedule-item.current-location.current .status-text {
  color: #997b1b;
}

.schedule-item.current-location.current .today-badge {
  background: #FEF9C3;
  color: #997b1b;
  border: 1px solid #e5d87b;
}

/* 현재 위치 배지도 같은 스타일로 통일 */
.schedule-item.current-location.current .current-location-badge {
  background: #FEF9C3;
  color: #997b1b;
  border: 1px solid #e5d87b;
}
</style> 