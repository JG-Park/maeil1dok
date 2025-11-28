<template>
  <div class="profile-calendar fade-in">
    <div class="calendar-header">
      <button @click="previousMonth" class="month-nav-button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <h3 class="current-month">{{ currentMonthLabel }}</h3>
      <button @click="nextMonth" class="month-nav-button" :disabled="isCurrentMonth">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
    </div>

    <div class="calendar-grid">
      <div v-for="day in weekDays" :key="day" class="weekday-label">
        {{ day }}
      </div>

      <div
        v-for="(date, index) in calendarDates"
        :key="index"
        class="calendar-day"
        :class="{
          'other-month': !date.isCurrentMonth,
          'today': date.isToday,
          'completed': date.completed,
          'future': date.isFuture
        }"
      >
        <span class="day-number">{{ date.day }}</span>
        <div v-if="date.completed && date.isCurrentMonth" class="completion-indicator"></div>
      </div>
    </div>

    <div class="calendar-legend">
      <div class="legend-item">
        <div class="legend-icon completed"></div>
        <span>완료</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon today"></div>
        <span>오늘</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon future"></div>
        <span>미래</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  calendarData: {
    type: Array,
    default: () => []
  }
})

const currentDate = new Date()
const currentYear = ref(currentDate.getFullYear())
const currentMonth = ref(currentDate.getMonth())

const weekDays = ['일', '월', '화', '수', '목', '금', '토']

const currentMonthLabel = computed(() => {
  return `${currentYear.value}년 ${currentMonth.value + 1}월`
})

const isCurrentMonth = computed(() => {
  return currentYear.value === currentDate.getFullYear() &&
         currentMonth.value === currentDate.getMonth()
})

const calendarDates = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const prevMonthLastDay = new Date(year, month, 0)

  const startDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const daysInPrevMonth = prevMonthLastDay.getDate()

  const dates = []

  // Previous month days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    dates.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      completed: false,
      isToday: false,
      isFuture: false
    })
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const isCompleted = props.calendarData.some(d => d.date === dateStr && d.completed)

    dates.push({
      day,
      isCurrentMonth: true,
      completed: isCompleted,
      isToday: date.toDateString() === today.toDateString(),
      isFuture: date > today
    })
  }

  // Next month days
  const remainingDays = 42 - dates.length
  for (let day = 1; day <= remainingDays; day++) {
    dates.push({
      day,
      isCurrentMonth: false,
      completed: false,
      isToday: false,
      isFuture: false
    })
  }

  return dates
})

const previousMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (isCurrentMonth.value) return

  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}
</script>

<style scoped>
.profile-calendar {
  padding: 1rem;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.month-nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: transparent;
  border: 1px solid var(--gray-300);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.month-nav-button:hover:not(:disabled) {
  background: var(--gray-100);
  border-color: var(--primary-color);
}

.month-nav-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.current-month {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.weekday-label {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 0.5rem 0;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: white;
  border: 1px solid var(--gray-200);
  position: relative;
  transition: all var(--transition-fast);
}

.calendar-day.other-month {
  opacity: 0.3;
}

.calendar-day.today {
  border-color: var(--primary-color);
  border-width: 2px;
  font-weight: 700;
}

.calendar-day.completed {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.calendar-day.future {
  background: var(--gray-50);
}

.day-number {
  font-size: 0.875rem;
  font-weight: 500;
}

.completion-indicator {
  position: absolute;
  bottom: 4px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: white;
}

.calendar-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--gray-200);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.legend-icon {
  width: 16px;
  height: 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--gray-300);
}

.legend-icon.completed {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.legend-icon.today {
  border-color: var(--primary-color);
  border-width: 2px;
}

.legend-icon.future {
  background: var(--gray-50);
}

@media (max-width: 640px) {
  .profile-calendar {
    padding: 0.75rem;
  }

  .calendar-grid {
    gap: 0.25rem;
  }

  .day-number {
    font-size: 0.75rem;
  }

  .calendar-legend {
    gap: 1rem;
    font-size: 0.8125rem;
  }
}
</style>
