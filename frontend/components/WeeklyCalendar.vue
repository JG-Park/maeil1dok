<template>
  <div class="section weekly-calendar" :class="{ 'monthly-mode': isMonthlyView }">
    <div class="calendar-header">
      <h3 class="month-year">{{ currentMonthYear }}</h3>
      <button class="view-button" @click="toggleCalendarView">
        {{ isMonthlyView ? '주간 보기' : '이번 달 보기' }}
        <svg class="arrow-icon" :class="{ 'arrow-up': isMonthlyView, 'arrow-down': !isMonthlyView }" width="12"
          height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </button>
    </div>

    <div class="weekly-view">
      <div class="days-row">
        <div v-for="(day, index) in weekDays" :key="index" class="day-cell" :class="{
          'selected': isSelectedDay(day.date),
          'today': isToday(day.date),
          'sunday': index === 0,
          'saturday': index === 6,
          'has-plans': hasPlans(day.date),
          'has-completed-plan': hasCompletedPlan(day.date)
        }" @click="selectDay(day.date)">
          <div class="weekday" :class="{ 'sunday': index === 0, 'saturday': index === 6 }">{{ day.weekday }}</div>
          <div class="day-number">{{ day.day }}</div>
          <div v-if="hasCompletedPlan(day.date)" class="day-indicator completed"></div>
          <div v-else-if="hasPlans(day.date)" class="day-indicator"></div>
        </div>
      </div>
    </div>

    <!-- 월간 달력 - 하단 UI -->
    <div class="monthly-view">
      <div class="month-grid">
        <div v-for="(dayName, index) in dayNames" :key="`header-${index}`" class="day-header"
          :class="{ 'sunday': index === 0, 'saturday': index === 6 }">{{ dayName }}</div>

        <div v-for="(day, index) in monthDays" :key="index" class="day-cell" :class="{
          'selected': isSelectedDay(day.date),
          'today': isToday(day.date),
          'other-month': !day.currentMonth,
          'sunday': day.dayOfWeek === 0,
          'saturday': day.dayOfWeek === 6,
          'has-plans': hasPlans(day.date),
          'has-completed-plan': hasCompletedPlan(day.date)
        }" @click="selectDay(day.date)">
          <div class="day-number">{{ day.day }}</div>
          <div v-if="hasCompletedPlan(day.date)" class="day-indicator completed"></div>
          <div v-else-if="hasPlans(day.date)" class="day-indicator"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
const props = defineProps({
  weekStatus: {
    type: Array,
    default: () => [],
    // [{ date: 'YYYY-MM-DD', plans: [{ planId, planName, completed }] }]
  },
  selectedDate: {
    type: String,
    default: () => new Date().toISOString().slice(0, 10)
  }
})

const emits = defineEmits(['select-date'])

// 현재 선택된 날짜 (기본값: 오늘)
const currentDate = ref(new Date(props.selectedDate || new Date()))

// 달력 뷰 상태 (기본값: 주간 뷰)
const isMonthlyView = ref(false)

// 요일 이름
const dayNames = ['일', '월', '화', '수', '목', '금', '토']

// 일정 데이터 상태
const scheduleData = ref([])
const isLoading = ref(false)

// 현재 월/년 표시
const currentMonthYear = computed(() => {
  return `${currentDate.value.getFullYear()}년 ${currentDate.value.getMonth() + 1}월`
})

// 주간 달력 데이터 생성
const weekDays = computed(() => {
  const days = []
  const date = new Date(currentDate.value)
  const day = date.getDay() // 현재 요일 (0: 일요일, 6: 토요일)

  // 현재 주의 일요일로 설정
  date.setDate(date.getDate() - day)

  // 일주일 데이터 생성
  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(date)
    days.push({
      date: formatDate(currentDay),
      day: currentDay.getDate(),
      weekday: dayNames[currentDay.getDay()]
    })
    date.setDate(date.getDate() + 1)
  }

  return days
})

// 월간 달력 데이터 생성
const monthDays = computed(() => {
  const days = []
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  // 현재 월의 첫날
  const firstDay = new Date(year, month, 1)
  // 현재 월의 마지막 날
  const lastDay = new Date(year, month + 1, 0)

  // 첫 주의 시작일 (이전 달의 날짜들)
  const startDay = new Date(firstDay)
  startDay.setDate(startDay.getDate() - startDay.getDay())

  // 마지막 주의 마지막일 (다음 달의 날짜들)
  const endDay = new Date(lastDay)
  const remainingDays = 6 - endDay.getDay()
  endDay.setDate(endDay.getDate() + remainingDays)

  // 캘린더 데이터 생성 (6주 표시)
  const currentDay = new Date(startDay)
  while (currentDay <= endDay) {
    days.push({
      date: formatDate(currentDay),
      day: currentDay.getDate(),
      currentMonth: currentDay.getMonth() === month
    })
    currentDay.setDate(currentDay.getDate() + 1)
  }

  return days
})

// 날짜 포맷 함수 (YYYY-MM-DD)
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 날짜 선택 함수
function selectDay(date) {
  currentDate.value = new Date(date)
  emits('select-date', date)
  // 월이 변경되었는지 확인하고 필요하면 데이터 다시 로드
  const newMonth = currentDate.value.getMonth()
  const oldMonth = new Date(date).getMonth()
  if (newMonth !== oldMonth) {
    loadMonthlySchedules(true)
  }
}

// 오늘 날짜로 이동
function navigateToToday() {
  const today = new Date()
  currentDate.value = today
  emits('select-date', formatDate(today))
  // 데이터 다시 로드
  loadMonthlySchedules(true)
}

// 이전 달로 이동
function navigateToPrevMonth() {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentDate.value = newDate
  // 달이 변경되었으니 데이터 다시 로드
  loadMonthlySchedules(true)
  emits('select-date', formatDate(newDate))
}

// 다음 달로 이동
function navigateToNextMonth() {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentDate.value = newDate
  // 달이 변경되었으니 데이터 다시 로드
  loadMonthlySchedules(true)
  emits('select-date', formatDate(newDate))
}

// 달력 뷰 토글 (주간/월간)
function toggleCalendarView() {
  isMonthlyView.value = !isMonthlyView.value
}

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  loadMonthlySchedules()
})

// 선택된 날짜인지 확인
function isSelectedDay(date) {
  return formatDate(currentDate.value) === date
}

// 오늘 날짜인지 확인
function isToday(date) {
  return formatDate(new Date()) === date
}

// 일요일인지 확인
function isSunday(date) {
  return new Date(date).getDay() === 0
}

// 토요일인지 확인
function isSaturday(date) {
  return new Date(date).getDay() === 6
}

// 해당 날짜에 계획이 있는지 확인
function hasPlans(date) {
  if (!scheduleData.value || !Array.isArray(scheduleData.value)) {
    return false
  }
  
  // 날짜별 데이터 찾기
  const dateData = scheduleData.value.find(item => item && item.date === date)
  
  // 일정이 있는지 확인
  return dateData && Array.isArray(dateData.schedules) && dateData.schedules.length > 0
}

// 해당 날짜에 완료된 계획이 있는지 확인
function hasCompletedPlan(date) {
  if (!scheduleData.value || !Array.isArray(scheduleData.value)) {
    return false
  }
  
  // 날짜별 데이터 찾기
  const dateData = scheduleData.value.find(item => item && item.date === date)
  
  // 완료된 일정이 있는지 확인
  if (dateData && Array.isArray(dateData.schedules)) {
    // 1. 개별 일정의 is_completed 필드 확인
    const hasCompletedSchedule = dateData.schedules.some(schedule => schedule && schedule.is_completed === true)
    if (hasCompletedSchedule) return true
    
    // 2. 날짜 자체에 is_completed 필드가 있는지 확인 (로그인 사용자 응답 형식)
    if (dateData.is_completed === true) return true
  }
  
  return false
}

// 월별 일정 데이터 로드
async function loadMonthlySchedules(forceReload = false) {
  // 이미 로딩 중이면 중복 요청 방지
  if (isLoading.value) return
  
  // 이미 데이터가 있고 강제 로드가 아니면 스킵
  if (scheduleData.value.length > 0 && !forceReload) return
  
  try {
    isLoading.value = true
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth() + 1

    // API 호출 주소 설정 (개발 환경과 프로덕션 환경에 따라 다르게 설정)
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8019' : 'http://192.168.0.41:8019'

    // 기본 플랜 ID 설정 (필요에 따라 실제 플랜 ID로 변경해야 함)
    const planId = 1 // 기본 플랜 ID

    // 현재 달, 이전 달, 다음 달 데이터를 모두 가져오기 위한 월 배열 생성
    const prevMonth = month === 1 ? 12 : month - 1
    const nextMonth = month === 12 ? 1 : month + 1
    const months = [prevMonth, month, nextMonth]
    
    // 해당 월에 맞는 연도 계산 (이전 년도, 현재 년도, 다음 년도)
    const prevYear = prevMonth === 12 ? year - 1 : year
    const nextYear = nextMonth === 1 ? year + 1 : year
    const years = [prevYear, year, nextYear]

    // 모든 월의 데이터를 가져오기 위한 병렬 요청
    const promises = months.map((m, i) =>
      fetch(`${baseUrl}/api/v1/todos/schedules/month/?month=${m}&plan_id=${planId}&year=${years[i]}`)
        .then(res => res.json())
        .catch(err => {
          return [] // 오류 발생 시 빈 배열 반환
        })
    )

    const results = await Promise.all(promises)

    // 모든 월의 데이터를 하나로 합치기
    const allSchedulesByDate = {}

    // 각 월의 데이터 처리
    results.forEach(data => {
      if (Array.isArray(data)) {
        // 날짜별로 그룹화
        data.forEach(schedule => {
          const date = schedule.date
          if (!allSchedulesByDate[date]) {
            allSchedulesByDate[date] = []
          }

          // 완료 여부 확인 (is_completed 필드가 있는지 확인)
          const isCompleted = schedule.is_completed === true
          
          // 일정 데이터 추가
          allSchedulesByDate[date].push({
            id: schedule.id,
            title: schedule.title || schedule.content || schedule.book_name,
            is_completed: isCompleted
          })
        })
      } else if (data && data.success && data.schedules) {
        // success 필드가 있는 경우
        Object.keys(data.schedules).forEach(date => {
          if (!allSchedulesByDate[date]) {
            allSchedulesByDate[date] = []
          }

          const schedulesForDate = data.schedules[date].map(schedule => {
            // 완료 여부 확인 (is_completed 필드가 있는지 확인)
            const isCompleted = schedule.is_completed === true


            return {
              id: schedule.id,
              title: schedule.title || schedule.content,
              is_completed: isCompleted
            }
          })

          allSchedulesByDate[date] = [
            ...allSchedulesByDate[date],
            ...schedulesForDate
          ]
        })
      }
    })

    // 데이터 형식 변환: [{ date, schedules: [{ id, title, is_completed }] }]
    scheduleData.value = Object.keys(allSchedulesByDate).map(date => {
      // 각 날짜의 일정 데이터
      const schedules = allSchedulesByDate[date]
      
      // 완료된 일정이 있는지 확인
      const hasCompletedSchedule = schedules.some(s => s.is_completed === true)
      
      return {
        date,
        schedules,
        // 일정 완료 여부 저장 (날짜 레벨에도 완료 여부 표시)
        is_completed: hasCompletedSchedule
      }
    })
  } catch (error) {
    alert('서버 연결에 문제가 있습니다.')
  } finally {
    isLoading.value = false
  }
}

// 날짜 변경 시 데이터 다시 로드
function handleDateChange() {
  loadMonthlySchedules()
}
</script>

<style scoped>
.weekly-calendar {
  margin: 0 auto 1.5rem auto;
  background: #fff;
  border-radius: 16px;
  padding: 1rem;
  overflow: hidden;
}

/* 캘린더 헤더 */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.month-year {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.view-button {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: #0080ff;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.view-button:hover {
  background: rgba(0, 128, 255, 0.1);
}

.arrow-icon {
  transition: transform 0.3s ease;
}

.arrow-icon.arrow-up {
  transform: rotate(180deg);
}

.arrow-icon.arrow-down {
  transform: rotate(0deg);
}

.prev-month-button {
  background: transparent;
  border: none;
  color: #0080ff;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.prev-month-button:hover {
  background: rgba(0, 128, 255, 0.1);
}

.next-month-button {
  background: transparent;
  border: none;
  color: #0080ff;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.next-month-button:hover {
  background: rgba(0, 128, 255, 0.1);
}

/* 일요일, 토요일 색상 */
.day-header.sunday,
.weekday.sunday {
  color: #ff5252;
}

.day-header.saturday,
.weekday.saturday {
  color: #4a90e2;
}

/* 주간 달력 */
.weekly-view {
  margin-bottom: 0.5rem;
  animation: slideDown 0.4s ease;
}

.weekday {
  font-size: 0.8rem;
  font-weight: 500;
  color: #000;
  margin-bottom: 0.25rem;
}

.days-row {
  display: flex;
  justify-content: space-between;
  gap: 6px;
}

.day-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  min-width: 36px;
  border: 1px solid #E5E5E5;
}

.day-number {
  font-size: 0.85rem;
  font-weight: 500;
  color: #333;
  line-height: 1.2;
  margin-bottom: 4px;
}

.day-number.other-month {
  color: #ccc;
}

.day-indicator {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: #999; /* 기본 색상을 회색으로 변경 */
  margin: 0 auto;
  margin-top: 2px;
}

.has-plans .day-indicator {
  background-color: #999; /* 일정이 있는 경우 회색 */
  opacity: 1;
}

.day-indicator.completed {
  background-color: #4CAF50; /* 완료된 일정은 초록색 */
}

.has-completed-plan .day-indicator {
  background-color: #4CAF50; /* 완료된 일정은 초록색 */
  opacity: 1;
}

/* 선택된 날짜 */
.day-cell.selected {
  border: 1.5px solid rgba(102, 153, 255, 0.5);
  background-color: #F2FAFF;
}

.day-cell.selected .day-number {
  color: #000;
}


/* 오늘 날짜 */
.day-cell.today:not(.selected) {
  border: 1.5px solid rgba(102, 153, 255, 0.5);
  background-color: #F2FAFF;
}

/* 월간 달력 */
.monthly-view {
  display: none;
}

.weekly-calendar.monthly-mode .weekly-view {
  display: none;
}

.weekly-calendar.monthly-mode .monthly-view {
  display: block;
  animation: slideUp 0.4s ease;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
  row-gap: 3px;
}

.day-header {
  text-align: center;
  font-size: 0.8rem;
  color: #000;
  padding: 0.5rem 0 0.1rem 0;
  font-weight: 600;
}

.monthly-view .day-cell.other-month .day-number {
  color: #ccc;
}

.monthly-view .day-cell.today:not(.selected) {
  border: 1px solid #0080ff;
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

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
