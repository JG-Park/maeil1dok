<template>
  <BaseModal
    :model-value="true"
    title="미완료 위치로 이동"
    size="sm"
    position="bottom"
    :close-on-overlay="true"
    :close-on-esc="true"
    @update:model-value="handleClose"
    @close="handleClose"
  >
    <div class="last-incomplete-content">
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>불러오는 중...</span>
      </div>

      <div v-else-if="positions.length === 0" class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <p>모든 플랜이 완료되었습니다!</p>
      </div>

      <div v-else class="position-list">
        <button
          v-for="position in positions"
          :key="position.subscription_id"
          class="position-item"
          @click="handleSelect(position)"
        >
          <span class="color-dot" :style="{ backgroundColor: position.color }" />
          <div class="position-info">
            <span class="plan-name">{{ position.plan_name }}</span>
            <span class="reading-info">{{ position.book }} {{ position.chapters }}</span>
            <span class="date-info">{{ formatDate(position.date) }}</span>
          </div>
          <svg class="arrow-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import type { LastIncompletePosition } from '~/stores/calendarDisplay'
import BaseModal from '~/components/ui/modal/BaseModal.vue'

const props = defineProps<{
  positions: LastIncompletePosition[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', position: LastIncompletePosition): void
}>()

const handleClose = () => {
  emit('close')
}

const handleSelect = (position: LastIncompletePosition) => {
  emit('select', position)
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = weekdays[date.getDay()]
  return `${month}월 ${day}일 (${weekday})`
}
</script>

<style scoped>
.last-incomplete-content {
  min-height: 150px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--text-secondary, #64748B);
  font-size: 0.875rem;
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-border, #E2E8F0);
  border-top-color: var(--primary-color, #617475);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
  color: var(--color-success, #22C55E);
}

.empty-state p {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary, #1E293B);
}

.position-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.position-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  background: var(--color-bg-secondary, #F8FAFC);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
}

.position-item:hover {
  background: var(--color-bg-hover, #F1F5F9);
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.position-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.plan-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reading-info {
  font-size: 0.8125rem;
  color: var(--text-secondary, #64748B);
}

.date-info {
  font-size: 0.75rem;
  color: var(--text-tertiary, #94A3B8);
}

.arrow-icon {
  color: var(--text-tertiary, #94A3B8);
  flex-shrink: 0;
}

/* Dark mode support */
:root.dark .position-item {
  background: var(--color-bg-secondary);
}

:root.dark .position-item:hover {
  background: var(--color-bg-hover);
}

:root.dark .empty-state p {
  color: var(--text-primary);
}
</style>
