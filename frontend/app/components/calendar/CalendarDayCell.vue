<template>
  <div
    class="calendar-day-cell"
    :class="{
      'other-month': !isCurrentMonth,
      'today': isToday,
      'future': isFuture,
      'has-schedules': schedules.length > 0,
      'all-completed': allCompleted
    }"
    @click="handleClick"
  >
    <span class="day-number">{{ day }}</span>

    <!-- 텍스트 모드: 축약 텍스트 표시 -->
    <div v-if="displayMode === 'text' && isCurrentMonth && schedules.length > 0" class="schedule-indicators text-mode">
      <div
        v-for="(item, idx) in visibleSchedules"
        :key="idx"
        class="schedule-item"
        :style="{ '--plan-color': item.color }"
        :class="{ completed: item.is_completed }"
        :title="item.full_text || `${item.book} ${item.chapters}`"
      >
        <span class="schedule-text">{{ item.schedule_text }}</span>
      </div>
      <span v-if="schedules.length > maxItems" class="more-indicator">...</span>
    </div>

    <!-- 점 모드: 색상 점 표시 -->
    <div v-else-if="displayMode === 'dots' && isCurrentMonth && schedules.length > 0" class="schedule-indicators dots-mode">
      <span
        v-for="(item, idx) in visibleSchedules"
        :key="idx"
        class="schedule-dot"
        :style="{ backgroundColor: item.color }"
        :class="{ completed: item.is_completed }"
        :title="item.schedule_text || `${item.book} ${item.chapters}`"
      ></span>
      <span v-if="schedules.length > maxItems" class="more-indicator">...</span>
    </div>

    <!-- 심플 모드: 완료 표시만 -->
    <div v-else-if="displayMode === 'simple' && isCurrentMonth && allCompleted" class="completion-indicator"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface ScheduleDisplay {
  plan_id?: number
  plan_name?: string
  color: string
  book?: string
  chapters?: string
  schedule_text?: string
  full_text?: string
  is_completed: boolean
  schedule_id?: number
}

interface Props {
  day: number
  dateStr: string
  isCurrentMonth: boolean
  isToday: boolean
  isFuture: boolean
  schedules: ScheduleDisplay[]
  displayMode: 'dots' | 'text' | 'simple'
  maxItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxItems: 2,
  schedules: () => []
})

const emit = defineEmits<{
  (e: 'click', payload: { dateStr: string; day: number; schedules: ScheduleDisplay[] }): void
}>()

const visibleSchedules = computed(() => props.schedules.slice(0, props.maxItems))

const allCompleted = computed(() => {
  return props.schedules.length > 0 && props.schedules.every(s => s.is_completed)
})

const handleClick = () => {
  if (props.isCurrentMonth && props.schedules.length > 0) {
    emit('click', {
      dateStr: props.dateStr,
      day: props.day,
      schedules: props.schedules
    })
  }
}
</script>

<style scoped>
.calendar-day-cell {
  aspect-ratio: 1;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 2px;
  border-radius: var(--radius-md, 8px);
  background: white;
  border: 1px solid var(--gray-200, #E2E8F0);
  position: relative;
  transition: all 0.15s ease;
}

.calendar-day-cell.other-month {
  opacity: 0.3;
}

.calendar-day-cell.today {
  border-color: var(--primary-color, #3B82F6);
  border-width: 2px;
}

.calendar-day-cell.today .day-number {
  font-weight: 700;
}

.calendar-day-cell.future {
  background: var(--gray-50, #F8FAFC);
}

.calendar-day-cell.has-schedules {
  cursor: pointer;
}

.calendar-day-cell.has-schedules:hover {
  background: var(--gray-100, #F1F5F9);
  border-color: var(--gray-300, #CBD5E1);
}

.calendar-day-cell.all-completed {
  background: var(--primary-color, #3B82F6);
  border-color: var(--primary-color, #3B82F6);
}

.calendar-day-cell.all-completed .day-number {
  color: white;
}

.day-number {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary, #1E293B);
  line-height: 1.2;
}

/* 텍스트 모드 스타일 */
.schedule-indicators.text-mode {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
  overflow: hidden;
  flex: 1;
}

.schedule-item {
  display: flex;
  align-items: center;
  padding: 1px 3px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--plan-color) 15%, transparent);
  border-left: 2px solid var(--plan-color);
  min-height: 14px;
}

.schedule-item.completed {
  background: color-mix(in srgb, var(--plan-color) 25%, transparent);
}

.all-completed .schedule-item {
  background: rgba(255, 255, 255, 0.2);
  border-left-color: rgba(255, 255, 255, 0.6);
}

.schedule-text {
  font-size: 0.5625rem;
  color: var(--text-primary, #1E293B);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.all-completed .schedule-text {
  color: white;
}

/* 점 모드 스타일 */
.schedule-indicators.dots-mode {
  display: flex;
  gap: 3px;
  margin-top: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.schedule-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  opacity: 0.5;
}

.schedule-dot.completed {
  opacity: 1;
}

/* 공통 */
.more-indicator {
  font-size: 0.5rem;
  color: var(--text-secondary, #64748B);
  line-height: 1;
}

.all-completed .more-indicator {
  color: rgba(255, 255, 255, 0.8);
}

.completion-indicator {
  position: absolute;
  bottom: 4px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: white;
}

/* 반응형 */
@media (max-width: 640px) {
  .calendar-day-cell {
    min-height: 50px;
    padding: 2px 1px;
  }

  .day-number {
    font-size: 0.75rem;
  }

  .schedule-text {
    font-size: 0.5rem;
  }

  .schedule-item {
    padding: 0 2px;
    min-height: 12px;
  }

  .schedule-dot {
    width: 5px;
    height: 5px;
  }
}
</style>
