<template>
  <div v-if="visiblePlans.length > 0" class="calendar-legend">
    <div class="legend-title">범례</div>
    <div class="legend-items">
      <div v-for="plan in visiblePlans" :key="plan.id" class="legend-item">
        <span class="legend-dot" :style="{ backgroundColor: plan.color }" />
        <span class="legend-name">{{ plan.plan_name }}</span>
      </div>
    </div>
    <div class="legend-status">
      <div class="status-item">
        <span class="status-dot filled" />
        <span class="status-label">완료</span>
      </div>
      <div class="status-item">
        <span class="status-dot" />
        <span class="status-label">미완료</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlanDisplaySetting } from '~/stores/calendarDisplay'

defineProps<{
  visiblePlans: PlanDisplaySetting[]
}>()
</script>

<style scoped>
.calendar-legend {
  margin-top: 1rem;
  padding: 0.75rem;
  background: var(--color-slate-50);
  border-radius: 8px;
}

.legend-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-slate-500);
  margin-bottom: 0.5rem;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-name {
  font-size: 0.75rem;
  color: var(--color-slate-600);
}

.legend-status {
  display: flex;
  gap: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-slate-200);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-accent-secondary);
  position: relative;
}

.status-dot.filled::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 5px;
  height: 5px;
  background: var(--color-bg-card);
  border-radius: 50%;
}

.status-label {
  font-size: 0.75rem;
  color: var(--color-slate-500);
}

@media (max-width: 640px) {
  .calendar-legend {
    padding: 0.5rem;
    margin-top: 0.75rem;
  }

  .legend-items {
    gap: 0.5rem;
  }

  .legend-dot,
  .status-dot {
    width: 8px;
    height: 8px;
  }

  .status-dot.filled::after {
    width: 4px;
    height: 4px;
  }

  .legend-name,
  .status-label {
    font-size: 0.6875rem;
  }
}
</style>
