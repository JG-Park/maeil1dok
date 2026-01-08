<template>
  <div
    :data-date="date"
    class="schedule-item"
    :class="[
      readingStatus,
      {
        'current-location': isCurrentLocationInGroup,
        'selected-range': isInSelectedRange,
      },
    ]"
    @click="handleGroupClick"
  >
    <!-- 통합 체크박스 -->
    <div class="checkbox" @click.stop>
      <input
        type="checkbox"
        :checked="readingStatus === 'completed'"
        @click.stop="$emit('groupCheckbox', schedules)"
      />
    </div>

    <div class="schedule-info">
      <!-- 날짜 -->
      <div class="schedule-date">
        <span v-if="isTodayDate" class="today-badge">오늘</span>
        {{ formattedDate }}
      </div>

      <!-- 다중 구간일 때 개별 클릭 가능 -->
      <template v-if="schedules.length > 1">
        <div
          v-for="schedule in schedules"
          :key="schedule.id"
          class="schedule-reading-item"
          :class="{ 'current-location': isCurrentLocation(schedule) }"
          @click.stop="$emit('itemClick', schedule)"
        >
          <div class="checkbox" @click.stop>
            <input
              type="checkbox"
              :checked="schedule.is_completed"
              @click.stop="$emit('itemCheckbox', schedule)"
            />
          </div>
          <div class="schedule-reading">
            <span v-if="isCurrentLocation(schedule)" class="current-location-badge">
              현재 위치
            </span>
            <span class="bible-text">
              {{ schedule.book }}
              {{
                schedule.start_chapter === schedule.end_chapter
                  ? schedule.start_chapter
                  : `${schedule.start_chapter}-${schedule.end_chapter}`
              }}장
            </span>
          </div>
        </div>
      </template>

      <!-- 단일 구간일 때 -->
      <template v-else>
        <div class="schedule-reading" @click.stop="$emit('itemClick', schedules[0])">
          <span v-if="isCurrentLocationInGroup" class="current-location-badge">
            현재 위치
          </span>
          <span class="bible-text">{{ formattedScheduleGroup }}</span>
        </div>
      </template>
    </div>

    <!-- 상태 표시 -->
    <div class="status-text">
      <svg
        v-if="readingStatus === 'completed'"
        class="status-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M20 6L9 17L4 12"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <svg v-else class="status-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      {{ statusText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Schedule, ReadingStatus } from '~/types/plan';
import { STATUS_TEXT } from '~/types/plan';
import { DAY_NAMES } from '~/constants/bible';
import { isToday } from '~/utils/dateFormat';

const props = defineProps<{
  date: string;
  schedules: Schedule[];
  currentBook?: string;
  currentChapter?: number;
  isModal?: boolean;
  isBulkEditMode?: boolean;
  isInSelectedRange?: boolean;
  isMobile?: boolean;
}>();

const emit = defineEmits<{
  groupClick: [schedules: Schedule[]];
  groupCheckbox: [schedules: Schedule[]];
  itemClick: [schedule: Schedule];
  itemCheckbox: [schedule: Schedule];
}>();

/**
 * 오늘 날짜인지 확인
 */
const isTodayDate = computed(() => isToday(props.date));

/**
 * 날짜 포맷팅
 */
const formattedDate = computed(() => {
  if (!props.date) return '';
  const date = new Date(props.date);
  const dayName = DAY_NAMES[date.getDay()];

  if (props.isMobile) {
    return `${date.getMonth() + 1}/${date.getDate()}(${dayName})`;
  }
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일(${dayName})`;
});

/**
 * 그룹 읽기 상태
 */
const readingStatus = computed((): ReadingStatus => {
  if (!props.schedules.length) return 'upcoming';

  const today = new Date();
  const scheduleDate = new Date(props.date);
  today.setHours(0, 0, 0, 0);
  scheduleDate.setHours(0, 0, 0, 0);

  const allCompleted = props.schedules.every((s) => s.is_completed);
  if (allCompleted) return 'completed';

  if (scheduleDate < today) return 'not_completed';
  if (scheduleDate.getTime() === today.getTime()) return 'current';
  return 'upcoming';
});

/**
 * 상태 텍스트
 */
const statusText = computed(() => STATUS_TEXT[readingStatus.value]);

/**
 * 스케줄 그룹 포맷팅
 */
const formattedScheduleGroup = computed(() => {
  if (!props.schedules.length) return '';

  if (props.schedules.length === 1) {
    const s = props.schedules[0];
    if (s.start_chapter === s.end_chapter) {
      return `${s.book} ${s.start_chapter}장`;
    }
    return `${s.book} ${s.start_chapter}-${s.end_chapter}장`;
  }

  const first = props.schedules[0];
  const last = props.schedules[props.schedules.length - 1];
  const startText = `${first.start_chapter}장`;
  const endText =
    first.book === last.book && first.start_chapter === last.end_chapter
      ? ''
      : `-${last.book} ${last.end_chapter}장`;

  return `${first.book} ${startText}${endText}`;
});

/**
 * 현재 위치가 그룹 내에 있는지 확인
 */
const isCurrentLocationInGroup = computed(() => {
  if (!props.isModal || !props.currentBook || !props.currentChapter) return false;
  return props.schedules.some((s) => isCurrentLocation(s));
});

/**
 * 현재 위치 확인 (개별 스케줄)
 */
function isCurrentLocation(schedule: Schedule): boolean {
  if (!props.isModal || !props.currentBook || !props.currentChapter) return false;
  return (
    schedule.book === props.currentBook &&
    props.currentChapter >= schedule.start_chapter &&
    props.currentChapter <= schedule.end_chapter
  );
}

/**
 * 그룹 클릭 핸들러
 */
function handleGroupClick() {
  emit('groupClick', props.schedules);
}
</script>

<style scoped>
.schedule-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-slate-200);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.schedule-item:hover {
  border-color: var(--color-slate-300);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 상태별 스타일 */
.schedule-item.completed {
  background: var(--color-schedule-completed-bg);
  border-color: var(--color-schedule-completed-border);
}

.schedule-item.completed .status-text {
  color: var(--color-schedule-completed-text);
}

.schedule-item.not_completed {
  background: var(--color-schedule-missed-bg);
  border-color: var(--color-schedule-missed-border);
}

.schedule-item.not_completed .status-text {
  color: var(--color-schedule-missed-text);
}

.schedule-item.current {
  background: var(--color-schedule-current-bg);
  border-color: var(--color-schedule-current-border);
}

.schedule-item.current .status-text {
  color: var(--color-schedule-current-text);
}

.schedule-item.upcoming {
  background: var(--color-bg-card);
}

.schedule-item.upcoming .status-text {
  color: var(--color-slate-400);
}

/* 현재 위치 표시 */
.schedule-item.current-location {
  border-color: var(--color-schedule-location-border-dark);
  box-shadow: 0 0 0 2px var(--color-schedule-location-bg);
}

/* 선택 범위 표시 */
.schedule-item.selected-range {
  background: var(--primary-light);
  border-color: var(--primary-color);
}

/* 체크박스 */
.checkbox {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  min-height: 32px;
  margin: -8px 8px -8px -8px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.checkbox:hover {
  background: rgba(97, 116, 117, 0.08);
}

.checkbox input[type='checkbox'] {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: 2px solid var(--color-slate-300);
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--color-bg-card);
}

.checkbox input[type='checkbox']:hover {
  border-color: var(--primary-color);
}

.checkbox input[type='checkbox']:checked {
  background: var(--primary-color);
  border-color: var(--primary-color);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6L9 17L4 12'/%3E%3C/svg%3E");
  background-size: 12px;
  background-position: center;
  background-repeat: no-repeat;
}

/* 일정 정보 */
.schedule-info {
  flex: 1;
  min-width: 0;
}

.schedule-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-slate-600);
  margin-bottom: 0.375rem;
}

.today-badge {
  padding: 0.125rem 0.375rem;
  background: var(--color-schedule-today-bg);
  color: var(--color-text-inverse);
  font-size: 0.625rem;
  font-weight: 600;
  border-radius: 4px;
}

.schedule-reading {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.schedule-reading-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;
}

.schedule-reading-item:hover {
  background: var(--color-slate-100);
}

.schedule-reading-item.current-location {
  background: var(--color-schedule-location-bg);
}

/* 다중 구간 내 작은 체크박스 */
.schedule-reading-item > .checkbox {
  min-width: auto;
  min-height: auto;
  margin: 0;
  padding: 0;
}

.schedule-reading-item > .checkbox input[type='checkbox'] {
  width: 18px;
  height: 18px;
  border-radius: 5px;
}

.current-location-badge {
  padding: 0.125rem 0.375rem;
  background: var(--color-schedule-location-bg-light);
  color: var(--color-schedule-location-text);
  font-size: 0.625rem;
  font-weight: 600;
  border-radius: 4px;
  border: 1px solid var(--color-schedule-location-border-dark);
}

.bible-text {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary);
}

/* 상태 텍스트 */
.status-text {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  flex-shrink: 0;
}

.status-icon {
  flex-shrink: 0;
}
</style>
