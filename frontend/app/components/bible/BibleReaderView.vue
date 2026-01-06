<template>
  <div class="bible-reader-view">
    <!-- 헤더 -->
    <header class="bible-header">
      <button class="back-button" @click="$emit('back')">
        <ChevronLeftIcon />
      </button>

      <button class="book-selector-button" @click="$emit('open-book-selector')">
        <span class="book-name">{{ currentBookName }}</span>
        <span class="chapter-number">{{ currentChapter }}{{ chapterSuffix }}</span>
        <ChevronDownIcon />
      </button>

      <div class="header-actions">
        <NoteButton
          :note-count="noteCount"
          @click="$emit('note-click')"
        />
        <BookmarkButton
          :is-bookmarked="isBookmarked"
          @toggle="$emit('bookmark-toggle')"
        />
        <button class="settings-button" @click="$emit('open-settings')" title="읽기 설정">
          <MenuIcon />
        </button>
        <button class="version-button" @click="$emit('open-version-selector')">
          {{ currentVersionName }}
        </button>
      </div>
    </header>

    <!-- 통독모드 인디케이터 -->
    <div v-if="isTongdokMode && tongdokScheduleRange" class="tongdok-indicator">
      <span class="tongdok-badge">통독</span>
      <span class="tongdok-range">{{ tongdokScheduleRange }}</span>
      <button class="tongdok-close" @click="$emit('exit-tongdok')" title="통독모드 종료">
        <XMarkIcon />
      </button>
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
      <!-- 본문 하단: 읽음 표시 영역 (읽기모드일 때만) -->
      <template #bottom>
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
              <span class="progress-text">{{ bookProgress.read }} / {{ bookProgress.total }}장 완독</span>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${bookProgress.percentage}%` }"></div>
              </div>
            </div>
          </ClientOnly>
        </div>
      </template>
    </BibleViewer>

    <!-- 하단 네비게이션 -->
    <div class="bible-bottom-area">
      <!-- 통독모드: 완료 버튼 영역 -->
      <div v-if="isTongdokMode" class="tongdok-action">
        <button
          class="tongdok-complete-btn"
          :disabled="isCompleting"
          @click="$emit('tongdok-complete-click')"
        >
          <CheckCircleOutlineIcon />
          <span>통독 완료</span>
        </button>
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

        <div class="chapter-info">
          {{ currentBookName }} {{ currentChapter }}{{ chapterSuffix }}
        </div>

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
import { ref } from 'vue';
import BibleViewer from '~/components/bible/BibleViewer.vue';
import BookmarkButton from '~/components/bible/BookmarkButton.vue';
import NoteButton from '~/components/bible/NoteButton.vue';
import ChevronLeftIcon from '~/components/icons/ChevronLeftIcon.vue';
import ChevronRightIcon from '~/components/icons/ChevronRightIcon.vue';
import ChevronDownIcon from '~/components/icons/ChevronDownIcon.vue';
import CheckCircleIcon from '~/components/icons/CheckCircleIcon.vue';
import CheckCircleOutlineIcon from '~/components/icons/CheckCircleOutlineIcon.vue';
import XMarkIcon from '~/components/icons/XMarkIcon.vue';
import MenuIcon from '~/components/icons/MenuIcon.vue';

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

withDefaults(defineProps<Props>(), {
  scrollPosition: 0,
  tongdokScheduleRange: null,
  isCompleting: false,
  isMarkingRead: false,
  highlights: () => [],
});

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

.settings-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--text-secondary, #6b7280);
  background: transparent;
  border-radius: 8px;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.settings-button:hover {
  background: var(--color-bg-hover, #f3f4f6);
  color: var(--text-primary, #1f2937);
}

.settings-button:active {
  background: var(--color-bg-active, #e5e7eb);
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
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--primary-light, #eef2ff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.tongdok-badge {
  padding: 0.125rem 0.5rem;
  background: var(--primary-color, #6366f1);
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tongdok-range {
  flex: 1;
  font-size: 0.875rem;
  color: var(--primary-color, #6366f1);
  font-weight: 500;
}

.tongdok-close {
  padding: 0.375rem;
  margin: -0.375rem;
  margin-left: 0.5rem;
  color: var(--primary-color, #6366f1);
  border-radius: 6px;
  transition: all 0.2s;
}

.tongdok-close:hover {
  background: rgba(99, 102, 241, 0.1);
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

/* 통독모드 액션 영역 */
.tongdok-action {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

:root.dark .tongdok-action {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.tongdok-complete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  max-width: 280px;
  padding: 0.75rem 1.25rem;
  background: var(--color-success, #10b981);
  color: white;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.tongdok-complete-btn:hover:not(:disabled) {
  background: var(--color-success-dark, #059669);
}

.tongdok-complete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 본문 하단 읽음 표시 영역 (인라인) */
.content-bottom-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 1rem 1rem;
  margin-top: 1.5rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.mark-read-btn-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  max-width: 260px;
  padding: 0.875rem 1.5rem;
  background: var(--primary-color, #6366f1);
  color: white;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

.mark-read-btn-inline:hover:not(:disabled) {
  background: var(--primary-dark, #4f46e5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.mark-read-btn-inline:active:not(:disabled) {
  transform: translateY(0);
}

.mark-read-btn-inline.is-read {
  background: var(--color-success, #10b981);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
}

.mark-read-btn-inline.is-read:hover:not(:disabled) {
  background: var(--color-success-dark, #059669);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.mark-read-btn-inline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.progress-info-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  max-width: 200px;
}

.progress-info-inline .progress-text {
  font-size: 0.8125rem;
  color: var(--text-secondary, #6b7280);
  white-space: nowrap;
}

.progress-info-inline .progress-bar {
  width: 100%;
  height: 6px;
  background: var(--color-bg-tertiary, #e5e7eb);
  border-radius: 3px;
  overflow: hidden;
}

.progress-info-inline .progress-fill {
  height: 100%;
  background: var(--primary-color, #6366f1);
  transition: width 0.3s ease;
  border-radius: 3px;
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
  font-size: 0.8125rem;
  color: var(--text-secondary, #6b7280);
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

:root.dark .tongdok-indicator {
  background: rgba(99, 102, 241, 0.15);
  border-color: var(--color-border);
}

:root.dark .settings-button {
  color: var(--text-secondary);
}

:root.dark .settings-button:hover {
  background: var(--color-bg-hover);
  color: var(--text-primary);
}

:root.dark .content-bottom-action {
  border-color: var(--color-border);
}

:root.dark .progress-info-inline .progress-bar {
  background: var(--color-bg-tertiary);
}
</style>
