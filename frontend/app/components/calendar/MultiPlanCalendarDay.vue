<template>
  <div
    class="calendar-day"
    :class="{
      'is-today': isToday,
      'other-month': !isCurrentMonth
    }"
    @click="$emit('click')"
  >
    <span class="day-number">{{ date.day }}</span>

    <div class="plan-indicators">
      <div
        v-for="(item, index) in plans.items"
        :key="index"
        class="plan-dot"
        :class="{ completed: item.is_completed }"
        :style="{ backgroundColor: item.color }"
        :title="`${item.plan_name}: ${item.book} ${item.chapters}`"
      />
      <span v-if="plans.hasMore" class="more-indicator">...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface DateInfo {
  day: number
  dateStr: string
  isCurrentMonth: boolean
  isToday: boolean
}

interface PlanItem {
  plan_id: number
  plan_name: string
  color: string
  book: string
  chapters: string
  is_completed: boolean
}

interface PlansDisplay {
  items: PlanItem[]
  hasMore: boolean
  totalCount: number
}

defineProps<{
  date: DateInfo
  plans: PlansDisplay
  isToday: boolean
  isCurrentMonth: boolean
}>()

defineEmits<{
  (e: 'click'): void
}>()
</script>

<style scoped>
.calendar-day {
  min-height: 60px;
  padding: 4px;
  background: var(--color-bg-card);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.calendar-day:hover {
  background: var(--color-slate-50);
}

.calendar-day.other-month {
  background: var(--color-slate-50);
}

.calendar-day.other-month .day-number {
  color: var(--color-slate-400);
}

.calendar-day.is-today {
  background: var(--color-info-bg);
  border: 2px solid var(--color-accent-secondary);
}

.calendar-day.is-today .day-number {
  color: var(--color-accent-secondary);
  font-weight: 700;
}

.day-number {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-slate-700);
  line-height: 1;
  margin-bottom: 4px;
}

.plan-indicators {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  align-items: center;
}

.plan-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.plan-dot.completed {
  position: relative;
}

.plan-dot.completed::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 4px;
  background: white;
  border-radius: 50%;
}

.more-indicator {
  font-size: 0.625rem;
  color: var(--color-slate-400);
  font-weight: 600;
  line-height: 1;
}

@media (max-width: 640px) {
  .calendar-day {
    min-height: 48px;
    padding: 2px;
  }

  .day-number {
    font-size: 0.75rem;
  }

  .plan-indicators {
    gap: 2px;
  }

  .plan-dot {
    width: 6px;
    height: 6px;
  }

  .plan-dot.completed::after {
    width: 3px;
    height: 3px;
  }

  .more-indicator {
    font-size: 0.5rem;
  }
}
</style>
