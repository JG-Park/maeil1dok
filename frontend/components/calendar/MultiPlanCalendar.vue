<template>
  <div class="multi-plan-calendar">
    <!-- 헤더 -->
    <CalendarHeader
      :year="currentYear"
      :month="currentMonth"
      :is-loading="isLoading"
      @prev="handlePrevMonth"
      @next="handleNextMonth"
      @today="handleGoToToday"
      @go-incomplete="showIncompleteModal = true"
      @settings="showSettingsModal = true"
    />

    <!-- 플랜 토글 패널 -->
    <PlanTogglePanel
      :settings="allActivePlans"
      @toggle="handleToggleVisibility"
    />

    <!-- 로딩 오버레이 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <!-- 달력 그리드 -->
    <div class="calendar-container" :class="{ loading: isLoading }">
      <div class="calendar-grid">
        <div v-for="day in weekDays" :key="day" class="weekday-label">
          {{ day }}
        </div>

        <MultiPlanCalendarDay
          v-for="(date, index) in calendarDates"
          :key="index"
          :date="date"
          :plans="getDisplayForDate(date.dateStr)"
          :is-today="date.isToday"
          :is-current-month="date.isCurrentMonth"
          @click="handleDayClick(date)"
        />
      </div>

      <!-- 범례 -->
      <CalendarLegend :visible-plans="visiblePlans" />
    </div>

    <!-- 설정 모달 -->
    <PlanSettingsModal
      v-if="showSettingsModal"
      :settings="allActivePlans"
      @close="showSettingsModal = false"
      @update-color="handleUpdateColor"
      @reorder="handleReorder"
    />

    <!-- 미완료 위치 선택 모달 -->
    <LastIncompleteModal
      v-if="showIncompleteModal"
      :positions="lastIncompletePositions"
      :is-loading="isLoadingPositions"
      @close="showIncompleteModal = false"
      @select="handleSelectIncomplete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCalendarDisplayStore } from '~/stores/calendarDisplay'
import CalendarHeader from './CalendarHeader.vue'
import PlanTogglePanel from './PlanTogglePanel.vue'
import MultiPlanCalendarDay from './MultiPlanCalendarDay.vue'
import CalendarLegend from './CalendarLegend.vue'
import PlanSettingsModal from './PlanSettingsModal.vue'
import LastIncompleteModal from './LastIncompleteModal.vue'

const props = defineProps<{
  userId?: number
}>()

const emit = defineEmits<{
  (e: 'day-click', date: { dateStr: string; day: number }): void
}>()

const calendarStore = useCalendarDisplayStore()

// 로컬 상태
const showSettingsModal = ref(false)
const showIncompleteModal = ref(false)
const isLoadingPositions = ref(false)

// 스토어 상태
const currentYear = computed(() => calendarStore.currentYear)
const currentMonth = computed(() => calendarStore.currentMonth)
const isLoading = computed(() => calendarStore.isLoading)
const visiblePlans = computed(() => calendarStore.visiblePlans)
const allActivePlans = computed(() => calendarStore.allActivePlans)
const lastIncompletePositions = computed(() => calendarStore.lastIncompletePositions)
const getDisplayForDate = calendarStore.getDisplayForDate

// 요일 라벨
const weekDays = ['일', '월', '화', '수', '목', '금', '토']

// 달력 날짜 계산
const calendarDates = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value - 1 // JS에서는 0-indexed

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const prevMonthLastDay = new Date(year, month, 0)

  const startDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const daysInPrevMonth = prevMonthLastDay.getDate()

  const dates: Array<{
    day: number
    dateStr: string
    isCurrentMonth: boolean
    isToday: boolean
  }> = []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 이전 달 날짜
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const prevMonth = month === 0 ? 12 : month
    const prevYear = month === 0 ? year - 1 : year
    const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    dates.push({
      day,
      dateStr,
      isCurrentMonth: false,
      isToday: false
    })
  }

  // 현재 달 날짜
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    dates.push({
      day,
      dateStr,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime()
    })
  }

  // 다음 달 날짜 (6주 채우기)
  const remainingDays = 42 - dates.length
  for (let day = 1; day <= remainingDays; day++) {
    const nextMonth = month === 11 ? 1 : month + 2
    const nextYear = month === 11 ? year + 1 : year
    const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    dates.push({
      day,
      dateStr,
      isCurrentMonth: false,
      isToday: false
    })
  }

  return dates
})

// 핸들러
const handlePrevMonth = async () => {
  await calendarStore.goToPreviousMonth()
}

const handleNextMonth = async () => {
  await calendarStore.goToNextMonth()
}

const handleGoToToday = async () => {
  await calendarStore.goToToday()
}

const handleToggleVisibility = async (id: number) => {
  await calendarStore.toggleVisibility(id)
}

const handleUpdateColor = async (id: number, color: string) => {
  await calendarStore.updateSetting(id, { color })
}

const handleReorder = async (orderedIds: number[]) => {
  await calendarStore.reorderPlans(orderedIds)
}

const handleDayClick = (date: { dateStr: string; day: number; isCurrentMonth: boolean }) => {
  if (date.isCurrentMonth) {
    emit('day-click', { dateStr: date.dateStr, day: date.day })
  }
}

const handleSelectIncomplete = async (position: { date: string }) => {
  showIncompleteModal.value = false
  await calendarStore.goToDate(position.date)
}

// 미완료 위치 모달 열 때 데이터 로드
watch(showIncompleteModal, async (isOpen) => {
  if (isOpen) {
    isLoadingPositions.value = true
    await calendarStore.fetchLastIncompletePositions()
    isLoadingPositions.value = false
  }
})

// 초기 데이터 로드
onMounted(async () => {
  await calendarStore.fetchMonthData()
})
</script>

<style scoped>
.multi-plan-calendar {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.calendar-container {
  position: relative;
  padding: 1rem;
  transition: opacity 0.2s ease;
}

.calendar-container.loading {
  opacity: 0.7;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #E2E8F0;
  border-top-color: #3B82F6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.weekday-label {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748B;
  padding: 0.5rem 0;
}

@media (max-width: 640px) {
  .calendar-container {
    padding: 0.75rem;
  }

  .calendar-grid {
    gap: 2px;
  }
}
</style>
