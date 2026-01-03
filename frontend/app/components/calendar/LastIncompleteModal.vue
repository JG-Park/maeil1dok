<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">미완료 위치로 이동</h3>
        <button class="close-btn" @click="$emit('close')">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
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
            @click="$emit('select', position)"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LastIncompletePosition } from '~/stores/calendarDisplay'

defineProps<{
  positions: LastIncompletePosition[]
  isLoading: boolean
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'select', position: LastIncompletePosition): void
}>()

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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--color-bg-card);
  border-radius: 16px;
  width: 100%;
  max-width: 360px;
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-slate-200);
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-slate-800);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-slate-500);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--color-slate-100);
  color: var(--color-slate-800);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--color-slate-500);
  font-size: 0.875rem;
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-slate-200);
  border-top-color: var(--color-accent-secondary);
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
  color: var(--color-success);
}

.empty-state p {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-slate-800);
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
  background: var(--color-slate-50);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
}

.position-item:hover {
  background: var(--color-slate-100);
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
  color: var(--color-slate-800);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reading-info {
  font-size: 0.8125rem;
  color: var(--color-slate-600);
}

.date-info {
  font-size: 0.75rem;
  color: var(--color-slate-400);
}

.arrow-icon {
  color: var(--color-slate-400);
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal-content {
    max-width: 100%;
    max-height: 60vh;
    border-radius: 16px 16px 0 0;
  }

  .position-item {
    padding: 0.75rem;
  }
}
</style>
