<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">{{ formattedDate }}</h3>
            <button @click="handleClose" class="close-btn" aria-label="닫기">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div v-if="schedules.length === 0" class="empty-state">
              이 날짜에 예정된 읽기가 없습니다.
            </div>

            <div v-else class="schedule-list">
              <div
                v-for="item in schedules"
                :key="item.schedule_id || `${item.plan_id}-${item.book}`"
                class="schedule-detail"
                :style="{ '--plan-color': item.color }"
                @click="handleNavigate(item)"
              >
                <div class="plan-info">
                  <span class="plan-badge" :style="{ backgroundColor: item.color }">
                    {{ item.plan_name }}
                  </span>
                  <span
                    class="status-badge"
                    :class="item.is_completed ? 'completed' : 'pending'"
                  >
                    {{ item.is_completed ? '완료' : '미완료' }}
                  </span>
                </div>
                <div class="reading-info">
                  <span class="reading-text">{{ getFullText(item) }}</span>
                  <svg class="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useScheduleFormatter } from '~/composables/useScheduleFormatter'

export interface ScheduleDetail {
  plan_id: number
  plan_name: string
  color: string
  book: string
  chapters?: string
  start_chapter?: number
  end_chapter?: number
  is_completed: boolean
  schedule_id?: number
  schedule_text?: string
}

interface Props {
  isOpen: boolean
  date: { dateStr: string; day: number } | null
  schedules: ScheduleDetail[]
  profileUserId?: number  // 프로필 사용자 ID (뒤로가기용)
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'navigate', schedule: ScheduleDetail): void
}>()

const router = useRouter()
const { getBookCode, parseChapters } = useScheduleFormatter()

const formattedDate = computed(() => {
  if (!props.date?.dateStr) return ''
  const [year, month, day] = props.date.dateStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = weekdays[date.getDay()]
  return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일 (${weekday})`
})

const getFullText = (item: ScheduleDetail) => {
  if (item.start_chapter && item.end_chapter) {
    if (item.start_chapter === item.end_chapter) {
      return `${item.book} ${item.start_chapter}장`
    }
    return `${item.book} ${item.start_chapter}-${item.end_chapter}장`
  }
  return `${item.book} ${item.chapters || ''}`
}

const handleClose = () => {
  emit('close')
}

const handleNavigate = (item: ScheduleDetail) => {
  const bookCode = getBookCode(item.book)
  if (!bookCode) {
    emit('navigate', item)
    return
  }

  let chapter = item.start_chapter
  if (!chapter && item.chapters) {
    const parsed = parseChapters(item.chapters)
    if (parsed) {
      chapter = parsed.start
    }
  }

  const query: Record<string, string> = {
    book: bookCode,
    chapter: chapter?.toString() || '1',
    plan: item.plan_id.toString()
  }

  // 프로필 사용자 ID가 있으면 해당 프로필로 뒤로가기
  if (props.profileUserId) {
    query.from = `profile/${props.profileUserId}`
  }

  router.push({
    path: '/reading',
    query
  })
  emit('close')
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
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--gray-200, #E2E8F0);
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--text-secondary, #64748B);
  border-radius: 8px;
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: var(--gray-100, #F1F5F9);
  color: var(--text-primary, #1E293B);
}

.modal-body {
  padding: 1rem 1.25rem;
  overflow-y: auto;
  flex: 1;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary, #64748B);
  padding: 2rem 0;
  font-size: 0.9375rem;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schedule-detail {
  padding: 0.875rem;
  background: var(--gray-50, #F8FAFC);
  border-radius: 12px;
  border-left: 4px solid var(--plan-color);
  cursor: pointer;
  transition: all 0.15s ease;
}

.schedule-detail:hover {
  background: var(--gray-100, #F1F5F9);
  transform: translateX(2px);
}

.plan-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.plan-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 6px;
  font-weight: 500;
}

.status-badge.completed {
  background: var(--green-100, #DCFCE7);
  color: var(--green-700, #15803D);
}

.status-badge.pending {
  background: var(--amber-100, #FEF3C7);
  color: var(--amber-700, #B45309);
}

.reading-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reading-text {
  font-size: 0.9375rem;
  color: var(--text-primary, #1E293B);
  font-weight: 500;
}

.arrow-icon {
  color: var(--text-secondary, #64748B);
  flex-shrink: 0;
}

/* 트랜지션 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95) translateY(10px);
}

@media (max-width: 640px) {
  .modal-content {
    max-width: 100%;
    margin: 0 0.5rem;
    max-height: 70vh;
  }

  .modal-header {
    padding: 0.875rem 1rem;
  }

  .modal-body {
    padding: 0.875rem 1rem;
  }

  .schedule-detail {
    padding: 0.75rem;
  }
}
</style>
