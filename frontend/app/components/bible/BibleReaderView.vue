<template>
  <div class="bible-reader-view">
    <!-- 헤더 -->
    <header class="bible-header">
      <button class="back-button" @click="$emit('back')">
        <ChevronLeftIcon />
      </button>

      <button
        class="bookmark-toggle-button"
        :class="{ 'is-bookmarked': isBookmarked }"
        @click="$emit('bookmark-toggle')"
        :title="isBookmarked ? '북마크 삭제' : '북마크 추가'"
      >
        <BookmarkFilledIcon v-if="isBookmarked" :size="20" />
        <BookmarkOutlineIcon v-else :size="20" />
      </button>

      <button class="book-selector-button" @click="$emit('open-book-selector')">
        <span class="book-name">{{ currentBookName }}</span>
        <span class="chapter-number">{{ currentChapter }}{{ chapterSuffix }}</span>
        <ChevronDownIcon />
      </button>

      <div class="header-actions">
        <BibleToolPopover
          :note-count="noteCount"
          @note-click="$emit('note-click')"
          @open-settings="$emit('open-settings')"
          @reading-plan-click="$emit('reading-plan-click')"
        />
        <!-- 통독모드 버튼 (로그인 사용자, 비통독 모드일 때) -->
        <button
          v-if="isAuthenticated && !isTongdokMode"
          class="tongdok-mode-btn"
          @click="$emit('today-tongdok')"
          title="통독모드"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <path d="M9 16l2 2 4-4"/>
          </svg>
          <span>통독모드</span>
        </button>
        <button class="version-button" @click="$emit('open-version-selector')">
          {{ currentVersionName }}
        </button>
      </div>
    </header>

    <!-- 통독모드 인디케이터 -->
    <div v-if="isTongdokMode && tongdokScheduleRange" class="tongdok-indicator">
      <div class="tongdok-info-container">
        <div class="tongdok-info-row">
          <span class="tongdok-badge">통독중</span>
          <span class="tongdok-range">
            {{ tongdokScheduleRange }}
            <span v-if="tongdokProgress" class="tongdok-remaining">
              [{{ tongdokProgress.total - tongdokProgress.current + 1 }}장 남음]
            </span>
          </span>
        </div>
        <div class="tongdok-date">{{ formattedScheduleDate }}</div>
      </div>
      <div class="tongdok-actions">
        <a
          v-if="tongdokAudioLink"
          href="#"
          class="tongdok-btn-label audio"
          @click.prevent="$emit('audio-link-click', tongdokAudioLink)"
          title="오디오"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
          </svg>
          <span>오디오</span>
        </a>
        <a
          v-if="tongdokGuideLink"
          :href="tongdokGuideLink"
          target="_blank"
          class="tongdok-btn-label guide"
          title="해설"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>해설</span>
        </a>
        <button
          class="tongdok-btn-label complete"
          :disabled="isCompleting"
          @click="$emit('tongdok-complete-click')"
          title="통독 완료"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <span>완료</span>
        </button>
        <button class="tongdok-btn-label close" @click="$emit('exit-tongdok')" title="통독모드 종료">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>통독종료</span>
        </button>
      </div>
    </div>

    <!-- 성경 본문 뷰어 -->
    <BibleViewer
      ref="bibleViewerRef"
      :content="content"
      :book="currentBookName"
      :chapter="currentChapter"
      :is-loading="isLoading"
      :initial-scroll-position="scrollPosition"
      :highlights="highlights"
      @scroll="$emit('scroll', $event)"
      @bookmark="$emit('bookmark', $event)"
      @highlight="$emit('highlight', $event)"
      @copy="$emit('copy', $event)"
      @share="$emit('share', $event)"
    >
      <!-- 본문 하단: 읽음 표시 영역 -->
      <template #bottom>
        <!-- 통독 모드일 때 -->
        <div v-if="isTongdokMode && !isLoading" class="content-bottom-action">
          <button
            class="tongdok-complete-btn-inline"
            :disabled="isCompleting"
            @click="$emit('tongdok-complete-click')"
          >
            <CheckCircleOutlineIcon />
            <span>통독 완료</span>
          </button>
        </div>

        <!-- 일반 읽기 모드일 때 -->
        <div v-if="!isTongdokMode && !isLoading" class="content-bottom-action">
          <button
            class="mark-read-btn-inline"
            :class="{ 'is-read': isCurrentChapterRead }"
            :disabled="isMarkingRead"
            @click="$emit('mark-as-read')"
          >
            <CheckCircleIcon v-if="isCurrentChapterRead" />
            <CheckCircleOutlineIcon v-else />
            <span>{{ isCurrentChapterRead ? '읽음 완료' : '읽음으로 표시' }}</span>
          </button>

          <!-- 진도 표시 -->
          <ClientOnly>
            <div v-if="isAuthenticated && bookProgress.total > 0" class="progress-info-inline">
              <span class="progress-label">{{ currentBookName }} 읽기 진도</span>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${bookProgress.percentage}%` }"></div>
              </div>
              <span class="progress-text">{{ bookProgress.read }} / {{ bookProgress.total }}장 <span class="progress-percentage">({{ bookProgress.percentage }}%)</span></span>
            </div>
          </ClientOnly>
        </div>
      </template>
    </BibleViewer>

    <!-- 첫 방문 온보딩 팁 -->
    <FirstVisitTip
      tip-key="highlight_drag"
      tip-text="텍스트를 드래그하면 하이라이트, 복사, 공유 메뉴가 나타나요!"
      :duration="10000"
      :delay="2000"
    />

    <!-- 하단 네비게이션 -->
    <div class="bible-bottom-area">
      <!-- 통독모드: 진행률 바 영역 -->
      <div v-if="isTongdokMode && tongdokProgress" class="tongdok-progress-area">
        <div class="story-progress-bar">
          <div
            v-for="i in tongdokProgress.total"
            :key="i"
            class="progress-segment"
            :class="{
              'filled': i < tongdokProgress.current,
              'current': i === tongdokProgress.current
            }"
          ></div>
        </div>
        <div class="progress-text-indicator">
          {{ tongdokProgress.current }}/{{ tongdokProgress.total }}
        </div>
      </div>



      <nav class="bible-navigation">
        <button
          class="nav-button prev"
          :disabled="!hasPrevChapter"
          @click="$emit('prev-chapter')"
        >
          <ChevronLeftIcon />
          이전
        </button>

        <button class="chapter-info" @click="$emit('open-book-selector')">
          <template v-if="isTongdokMode && formattedScheduleDate">
            <span class="schedule-date">{{ formattedScheduleDate }}</span>
            <span class="schedule-range">{{ tongdokScheduleRange }}</span>
          </template>
          <template v-else>
            <span class="chapter-info-text">{{ currentBookName }} {{ currentChapter }}{{ chapterSuffix }}</span>
            <ChevronDownIcon class="chapter-info-icon" :size="14" />
          </template>
        </button>

        <button
          class="nav-button next"
          :disabled="!hasNextChapter"
          @click="$emit('next-chapter')"
        >
          다음
          <ChevronRightIcon />
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import BibleViewer from '~/components/bible/BibleViewer.vue';
import BibleToolPopover from '~/components/bible/BibleToolPopover.vue';
import FirstVisitTip from '~/components/bible/FirstVisitTip.vue';
import ChevronLeftIcon from '~/components/icons/ChevronLeftIcon.vue';
import ChevronRightIcon from '~/components/icons/ChevronRightIcon.vue';
import ChevronDownIcon from '~/components/icons/ChevronDownIcon.vue';
import CheckCircleIcon from '~/components/icons/CheckCircleIcon.vue';
import CheckCircleOutlineIcon from '~/components/icons/CheckCircleOutlineIcon.vue';
import XMarkIcon from '~/components/icons/XMarkIcon.vue';
import BookmarkFilledIcon from '~/components/icons/BookmarkFilledIcon.vue';
import BookmarkOutlineIcon from '~/components/icons/BookmarkOutlineIcon.vue';

// Highlight 인터페이스
interface Highlight {
  id: number;
  start_verse: number;
  end_verse: number;
  color: string;
  memo?: string;
}

// Props
interface Props {
  // 콘텐츠
  content: string;
  isLoading: boolean;
  scrollPosition?: number;

  // 현재 위치
  currentBookName: string;
  currentChapter: number;
  currentVersionName: string;
  chapterSuffix: string;

  // 네비게이션
  hasPrevChapter: boolean;
  hasNextChapter: boolean;

  // 통독모드
  isTongdokMode: boolean;
  tongdokScheduleRange?: string | null;
  tongdokScheduleDate?: string | null;
  tongdokAudioLink?: string | null;
  tongdokGuideLink?: string | null;
  tongdokProgress?: { current: number; total: number } | null;
  isCompleting?: boolean;

  // 읽기모드
  isCurrentChapterRead: boolean;
  isMarkingRead?: boolean;
  bookProgress: { read: number; total: number; percentage: number };

  // 사용자 데이터
  isAuthenticated: boolean;
  isBookmarked: boolean;
  noteCount: number;

  // 하이라이트
  highlights?: Highlight[];
}

const props = withDefaults(defineProps<Props>(), {
  scrollPosition: 0,
  tongdokScheduleRange: null,
  tongdokScheduleDate: null,
  tongdokAudioLink: null,
  tongdokGuideLink: null,
  tongdokProgress: null,
  isCompleting: false,
  isMarkingRead: false,
  highlights: () => [],
});

const formatScheduleDate = (dateString: string | null): string => {
  if (!dateString) return '';
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dayOfWeek = days[date.getDay()];
  return `${year}년 ${month}월 ${day}일(${dayOfWeek})`;
};

const formattedScheduleDate = computed(() => formatScheduleDate(props.tongdokScheduleDate));

// Emits
defineEmits<{
  // 네비게이션
  back: [];
  'prev-chapter': [];
  'next-chapter': [];

  // 모달 열기
  'open-book-selector': [];
  'open-version-selector': [];
  'open-settings': [];

  // 사용자 액션
  'bookmark-toggle': [];
  'note-click': [];
  'mark-as-read': [];

  // BibleViewer 이벤트 전달
  scroll: [position: number];
  bookmark: [verses: { start: number; end: number; text: string }];
  highlight: [verses: { start: number; end: number; text: string }];
  copy: [text: string];
  share: [text: string];

  // 통독모드
  'exit-tongdok': [];
  'tongdok-complete-click': [];
  'today-tongdok': [];
  'audio-link-click': [url: string];
  'reading-plan-click': [];
}>();

// Refs
const bibleViewerRef = ref<InstanceType<typeof BibleViewer> | null>(null);

// Expose
defineExpose({
  bibleViewerRef,
  scrollToTop: () => {
    bibleViewerRef.value?.restoreScrollPosition();
  },
});
</script>

<style scoped>
.bible-reader-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* 헤더 */
.bible-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-card, #fff);
  position: sticky;
  top: 0;
  z-index: 100;
  height: 50px;
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
  transition: all 0.15s ease;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--text-primary, #1f2937);
  border-radius: 8px;
  transition: background 0.2s;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
}

.back-button:hover {
  background: var(--color-bg-hover, #f3f4f6);
}

.back-button:active {
  background: var(--color-bg-active, #e5e7eb);
}

.bookmark-toggle-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--text-secondary, #6b7280);
  border-radius: 8px;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
}

.bookmark-toggle-button:hover {
  background: var(--color-bg-hover, #f3f4f6);
  color: var(--text-primary, #1f2937);
}

.bookmark-toggle-button:active {
  background: var(--color-bg-active, #e5e7eb);
}

.bookmark-toggle-button.is-bookmarked {
  color: var(--primary-color, #6366f1);
}

.bookmark-toggle-button.is-bookmarked:hover {
  color: var(--primary-dark, #4f46e5);
}

.book-selector-button {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-secondary, #f3f4f6);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: 10px;
  font-size: 0.9375rem;
  color: var(--text-primary, #1f2937);
  transition: all 0.2s ease;
  cursor: pointer;
  min-width: 0;
}

.book-selector-button:hover {
  background: var(--color-bg-hover, #e5e7eb);
  border-color: var(--color-border, #d1d5db);
}

.book-selector-button:active {
  background: var(--color-bg-active, #d1d5db);
  transform: scale(0.98);
}

.book-selector-button svg {
  color: var(--text-secondary, #6b7280);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.book-selector-button:hover svg {
  transform: translateY(1px);
}

.book-name {
  font-weight: 600;
}

.chapter-number {
  color: var(--text-secondary, #6b7280);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.tongdok-mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.375rem 0.625rem;
  color: var(--primary-color, #6366f1);
  background: var(--primary-light, #eef2ff);
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.tongdok-mode-btn:hover {
  background: var(--primary-color, #6366f1);
  color: white;
}

.tongdok-mode-btn:active {
  transform: scale(0.95);
}

.version-button {
  padding: 0.375rem 0.75rem;
  background: var(--primary-light, #eef2ff);
  color: var(--primary-color, #6366f1);
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: all 0.2s;
}

.version-button:hover {
  background: var(--primary-color, #6366f1);
  color: white;
}

/* 통독 인디케이터 */
.tongdok-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--primary-light, #eef2ff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.tongdok-info-container {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
  min-width: 0;
}

.tongdok-info-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tongdok-badge {
  padding: 0.125rem 0.375rem;
  background: var(--primary-color, #6366f1);
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.tongdok-range {
  font-size: 0.9375rem;
  color: var(--text-primary, #1f2937);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tongdok-remaining {
  font-weight: 500;
  color: var(--primary-color, #6366f1);
  margin-left: 0.25rem;
  font-size: 0.875rem;
}

.tongdok-date {
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
  margin-left: 0.125rem;
}

.tongdok-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.tongdok-btn-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
}

.tongdok-btn-label:hover {
  background: rgba(255, 255, 255, 0.5);
}

.tongdok-btn-label:active {
  transform: scale(0.96);
}

.tongdok-btn-label.audio {
  color: var(--text-secondary, #4b5563);
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.tongdok-btn-label.audio:hover {
  background: white;
  color: var(--primary-color, #6366f1);
}

.tongdok-btn-label.guide {
  color: var(--text-secondary, #4b5563);
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.tongdok-btn-label.guide:hover {
  background: white;
  color: var(--primary-color, #6366f1);
}

.tongdok-btn-label.complete {
  color: var(--color-success, #10b981);
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.tongdok-btn-label.complete:hover {
  background: rgba(16, 185, 129, 0.1);
}

.tongdok-btn-label.close {
  color: var(--text-secondary, #6b7280);
  background: transparent;
  border: 1px solid transparent;
}

.tongdok-btn-label.close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-primary, #1f2937);
}

/* 하단 영역 - 글래스모피즘 플로팅 디자인 */
.bible-bottom-area {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 400px;
  z-index: 20;

  /* 글래스모피즘 */
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}





/* 본문 하단 읽음 표시 영역 (인라인) */
.content-bottom-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 2.5rem 1.5rem 2rem;
  margin-top: 2rem;
  /* 시스템 폰트 강제 적용 - 본문 명조체 상속 방지 */
  font-family: "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  /* 부드러운 구분선 대신 그라데이션 페이드 */
  border-top: none;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--color-bg-secondary, #f8f9fa) 20%,
    var(--color-bg-secondary, #f8f9fa) 100%
  );
  border-radius: 24px 24px 0 0;
}

.mark-read-btn-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  width: 100%;
  max-width: 280px;
  padding: 1rem 1.75rem;
  background: linear-gradient(135deg, var(--primary-color, #6366f1) 0%, #818cf8 100%);
  color: white;
  border-radius: 16px;
  font-family: "Pretendard", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 14px rgba(99, 102, 241, 0.35),
    0 2px 6px rgba(99, 102, 241, 0.2);
}

.mark-read-btn-inline:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--primary-dark, #4f46e5) 0%, #6366f1 100%);
  transform: translateY(-2px);
  box-shadow: 
    0 8px 20px rgba(99, 102, 241, 0.4),
    0 4px 10px rgba(99, 102, 241, 0.25);
}

.mark-read-btn-inline:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
  box-shadow: 
    0 2px 8px rgba(99, 102, 241, 0.3),
    0 1px 4px rgba(99, 102, 241, 0.2);
}

.mark-read-btn-inline.is-read {
  background: linear-gradient(135deg, var(--color-success, #10b981) 0%, #34d399 100%);
  box-shadow: 
    0 4px 14px rgba(16, 185, 129, 0.35),
    0 2px 6px rgba(16, 185, 129, 0.2);
}

.mark-read-btn-inline.is-read:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--color-success-dark, #059669) 0%, #10b981 100%);
  box-shadow: 
    0 8px 20px rgba(16, 185, 129, 0.4),
    0 4px 10px rgba(16, 185, 129, 0.25);
}

.mark-read-btn-inline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.progress-info-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  max-width: 260px;
  padding: 1rem 1.25rem;
  background: var(--color-bg-card, rgba(255, 255, 255, 0.8));
  border-radius: 14px;
  border: 1px solid var(--color-border-light, rgba(0, 0, 0, 0.06));
}

.progress-info-inline .progress-label {
  font-family: "Pretendard", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary, #374151);
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.progress-info-inline .progress-text {
  font-family: "Pretendard", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.progress-info-inline .progress-percentage {
  color: var(--primary-color, #6366f1);
  font-weight: 600;
}

.progress-info-inline .progress-bar {
  width: 100%;
  height: 8px;
  background: var(--color-bg-tertiary, #e5e7eb);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
}

.progress-info-inline .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color, #6366f1) 0%, #818cf8 100%);
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 4px;
}

/* 네비게이션 */
.bible-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem;
  min-height: 50px;
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.25rem;
  color: var(--color-slate-600, #475569);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: transparent;
  outline: none;
}

.nav-button.prev {
  padding-left: 0.75rem;
}

.nav-button.next {
  padding-right: 0.75rem;
}

.nav-button:hover:not(:disabled) {
  background: var(--color-slate-200, #e2e8f0);
  color: var(--color-slate-800, #1e293b);
}

.nav-button:active:not(:disabled) {
  transform: translateY(1px);
}

.nav-button:disabled {
  color: var(--text-muted, #9ca3af);
  cursor: not-allowed;
}

.chapter-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  font-size: 0.8125rem;
  color: var(--text-secondary, #6b7280);
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.chapter-info:hover {
  background: var(--color-slate-100, #f1f5f9);
}

.chapter-info:active {
  background: var(--color-slate-200, #e2e8f0);
  transform: scale(0.98);
}

.chapter-info-text {
  font-weight: 500;
  color: var(--text-primary, #1f2937);
}

.chapter-info-icon {
  color: var(--text-tertiary, #9ca3af);
  margin-top: 2px;
  transition: transform 0.2s ease;
}

.chapter-info:hover .chapter-info-icon {
  transform: translateY(1px);
}

.chapter-info .schedule-date {
  font-size: 0.75rem;
  color: var(--primary-color, #6366f1);
  font-weight: 500;
}

.chapter-info .schedule-range {
  font-size: 0.8125rem;
  color: var(--text-primary, #1f2937);
  font-weight: 500;
}

/* iOS 안전영역 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .bible-bottom-area {
    bottom: calc(16px + env(safe-area-inset-bottom));
  }
}

/* 다크모드 */
:root.dark .bible-header {
  background: var(--color-bg-card);
}

:root.dark .bookmark-toggle-button {
  color: var(--text-secondary);
}

:root.dark .bookmark-toggle-button:hover {
  background: var(--color-bg-hover);
  color: var(--text-primary);
}

:root.dark .bookmark-toggle-button.is-bookmarked {
  color: var(--primary-color);
}

:root.dark .tongdok-mode-btn {
  background: rgba(99, 102, 241, 0.2);
  color: var(--primary-color);
}

:root.dark .tongdok-mode-btn:hover {
  background: var(--primary-color);
  color: white;
}

:root.dark .bible-bottom-area {
  background: rgba(30, 30, 30, 0.8);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

:root.dark .nav-button {
  color: var(--color-slate-400, #94a3b8);
}

:root.dark .nav-button:hover:not(:disabled) {
  background: var(--color-slate-700, #334155);
  color: var(--color-slate-200, #e2e8f0);
}

:root.dark .chapter-info {
  color: var(--text-secondary);
}

:root.dark .chapter-info:hover {
  background: var(--color-slate-700, #334155);
}

:root.dark .chapter-info:active {
  background: var(--color-slate-600, #475569);
}

:root.dark .chapter-info-text {
  color: var(--text-primary);
}

:root.dark .tongdok-indicator {
  background: rgba(99, 102, 241, 0.15);
  border-color: var(--color-border);
}

:root.dark .tongdok-range {
  color: var(--text-primary-dark, #e5e5e5);
}

:root.dark .tongdok-remaining {
  color: var(--primary-color, #818cf8);
}

:root.dark .tongdok-date {
  color: var(--text-secondary-dark, #9ca3af);
}

:root.dark .tongdok-btn-label.audio,
:root.dark .tongdok-btn-label.guide {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary-dark, #9ca3af);
}

:root.dark .tongdok-btn-label.audio:hover,
:root.dark .tongdok-btn-label.guide:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

:root.dark .tongdok-btn-label.complete {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
  color: var(--color-success, #34d399);
}

:root.dark .tongdok-btn-label.complete:hover {
  background: rgba(16, 185, 129, 0.2);
}

:root.dark .tongdok-btn-label.close {
  color: var(--text-secondary-dark, #9ca3af);
}

:root.dark .tongdok-btn-label.close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

:root.dark .content-bottom-action {
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--color-bg-secondary-dark, #1e1e1e) 20%,
    var(--color-bg-secondary-dark, #1e1e1e) 100%
  );
}

:root.dark .progress-info-inline {
  background: var(--color-bg-card-dark, rgba(45, 45, 45, 0.8));
  border-color: rgba(255, 255, 255, 0.08);
}

:root.dark .progress-info-inline .progress-label {
  color: var(--text-primary-dark, #e5e5e5);
}

:root.dark .progress-info-inline .progress-text {
  color: var(--text-secondary-dark, #9ca3af);
}

:root.dark .progress-info-inline .progress-bar {
  background: var(--color-bg-tertiary-dark, #2d2d2d);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 통독 완료 미니 버튼 (헤더) */
.tongdok-complete-mini-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--color-success, #10b981);
  border-radius: 6px;
  transition: all 0.2s;
}

.tongdok-complete-mini-btn:hover:not(:disabled) {
  background: rgba(16, 185, 129, 0.15);
}

.tongdok-complete-mini-btn:active:not(:disabled) {
  background: rgba(16, 185, 129, 0.25);
  transform: scale(0.95);
}

.tongdok-complete-mini-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 통독 완료 인라인 버튼 (본문 하단) */
.tongdok-complete-btn-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  width: 100%;
  max-width: 280px;
  padding: 1rem 1.75rem;
  background: linear-gradient(135deg, var(--color-success, #10b981) 0%, #34d399 100%);
  color: white;
  border-radius: 16px;
  font-family: "Pretendard", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 14px rgba(16, 185, 129, 0.35),
    0 2px 6px rgba(16, 185, 129, 0.2);
}

.tongdok-complete-btn-inline:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--color-success-dark, #059669) 0%, #10b981 100%);
  transform: translateY(-2px);
  box-shadow: 
    0 8px 20px rgba(16, 185, 129, 0.4),
    0 4px 10px rgba(16, 185, 129, 0.25);
}

.tongdok-complete-btn-inline:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
  box-shadow: 
    0 2px 8px rgba(16, 185, 129, 0.3),
    0 1px 4px rgba(16, 185, 129, 0.2);
}

.tongdok-complete-btn-inline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 통독 진행률 바 (인스타그램 스토리 스타일) */
.tongdok-progress-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

:root.dark .tongdok-progress-area {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.story-progress-bar {
  display: flex;
  flex: 1;
  gap: 4px;
}

.progress-segment {
  flex: 1;
  height: 4px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  transition: all 0.3s ease;
}

:root.dark .progress-segment {
  background: rgba(255, 255, 255, 0.2);
}

.progress-segment.filled {
  background: var(--primary-color, #6366f1);
}

.progress-segment.current {
  background: var(--color-success, #10b981);
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
  animation: pulse-segment 2s infinite;
}

.progress-text-indicator {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
  white-space: nowrap;
  min-width: 2rem;
  text-align: right;
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
}

:root.dark .progress-text-indicator {
  color: var(--text-secondary-dark, #9ca3af);
}

@keyframes pulse-segment {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

</style>
