<template>
  <div class="plan-toggle-panel">
    <div class="toggle-list">
      <button
        v-for="setting in settings"
        :key="setting.id"
        class="toggle-item"
        :class="{ active: setting.is_visible }"
        @click="$emit('toggle', setting.id)"
      >
        <span
          class="color-dot"
          :style="{ backgroundColor: setting.is_visible ? setting.color : '#CBD5E1' }"
        />
        <span class="plan-name">{{ setting.plan_name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlanDisplaySetting } from '~/stores/calendarDisplay'

defineProps<{
  settings: PlanDisplaySetting[]
}>()

defineEmits<{
  (e: 'toggle', id: number): void
}>()
</script>

<style scoped>
.plan-toggle-panel {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #E2E8F0;
  background: #F8FAFC;
}

.toggle-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.toggle-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid #E2E8F0;
  background: white;
  border-radius: 9999px;
  font-size: 0.8125rem;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-item:hover {
  border-color: #CBD5E1;
}

.toggle-item.active {
  color: #1E293B;
  border-color: #94A3B8;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background-color 0.2s ease;
}

.plan-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

@media (max-width: 640px) {
  .plan-toggle-panel {
    padding: 0.375rem 0.75rem;
  }

  .toggle-item {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }

  .color-dot {
    width: 8px;
    height: 8px;
  }

  .plan-name {
    max-width: 80px;
  }
}
</style>
