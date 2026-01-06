<template>
  <div class="bible-page">
    <!-- 홈/대시보드 뷰 -->
    <BibleHome
      v-if="viewMode === 'home'"
      @continue-reading="handleContinueReading"
      @select-book="handleHomeBookSelect"
      @show-toc="viewMode = 'toc'"
    />

    <!-- 목차 뷰 -->
    <BibleTOC
      v-else-if="viewMode === 'toc'"
      @select-book="handleTocBookSelect"
      @back="handleTocBack"
    />

    <!-- 성경 리더 뷰 -->
    <template v-else>
    <!-- 헤더 -->
    <header class="bible-header">
      <button class="back-button" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <button class="book-selector-button" @click="showBookSelector = true">
        <span class="book-name">{{ currentBookName }}</span>
        <span class="chapter-number">{{ currentChapter }}{{ chapterSuffix }}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <div class="header-actions">
        <NoteButton
          :note-count="currentChapterNoteCount"
          @click="handleNoteClick"
        />
        <BookmarkButton
          :is-bookmarked="isCurrentChapterBookmarked"
          @toggle="handleBookmarkToggle"
        />
        <button class="settings-button" @click="showSettingsModal = true" title="읽기 설정">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="version-button" @click="showVersionSelector = true">
          {{ currentVersionName }}
        </button>
      </div>
    </header>

    <!-- 통독모드 인디케이터 -->
    <div v-if="isTongdokMode && tongdokScheduleRange" class="tongdok-indicator">
      <span class="tongdok-badge">통독</span>
      <span class="tongdok-range">{{ tongdokScheduleRange }}</span>
      <button class="tongdok-close" @click="handleExitTongdok" title="통독모드 종료">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- 성경 본문 뷰어 -->
    <BibleViewer
      ref="bibleViewerRef"
      :content="bibleContent"
      :book="currentBookName"
      :chapter="currentChapter"
      :is-loading="isLoading"
      :initial-scroll-position="scrollPosition"
      @scroll="handleScrollPosition"
      @bookmark="handleBookmarkAction"
      @highlight="handleHighlightAction"
      @copy="handleCopyAction"
      @share="handleShareAction"
    >
      <!-- 본문 하단: 읽음 표시 영역 (읽기모드일 때만) -->
      <template #bottom>
        <div v-if="isReadingMode && !isLoading" class="content-bottom-action">
          <button
            class="mark-read-btn-inline"
            :class="{ 'is-read': isCurrentChapterRead }"
            :disabled="isMarkingRead"
            @click="handleMarkAsRead"
          >
            <svg v-if="isCurrentChapterRead" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ isCurrentChapterRead ? '읽음 완료' : '읽음으로 표시' }}</span>
          </button>

          <!-- 진도 표시 -->
          <ClientOnly>
            <div v-if="authStore.isAuthenticated && currentBookProgress.total > 0" class="progress-info-inline">
              <span class="progress-text">{{ currentBookProgress.read }} / {{ currentBookProgress.total }}장 완독</span>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${currentBookProgress.percentage}%` }"></div>
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
          @click="showTongdokCompleteModal = true"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>통독 완료</span>
        </button>
      </div>

      <nav class="bible-navigation">
        <button
          class="nav-button prev"
          :disabled="!hasPrevChapter"
          @click="goToPrevChapter"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          이전
        </button>

        <div class="chapter-info">
          {{ currentBookName }} {{ currentChapter }}{{ chapterSuffix }}
        </div>

        <button
          class="nav-button next"
          :disabled="!hasNextChapter"
          @click="goToNextChapter"
        >
          다음
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </nav>
    </div>

    <!-- 모달 -->
    <BookSelector
      v-model="showBookSelector"
      :current-book="currentBook"
      :current-chapter="currentChapter"
      @select="handleBookSelect"
    />

    <VersionSelector
      v-model="showVersionSelector"
      :current-version="currentVersion"
      @select="handleVersionSelect"
    />

    <!-- 통독 완료 모달 -->
    <TongdokCompleteModal
      v-model="showTongdokCompleteModal"
      :schedule-range="fullTongdokRange"
      :initial-auto-complete="tongdokAutoComplete"
      :is-loading="isCompleting"
      @confirm="handleTongdokComplete"
    />

    <!-- 노트 빠른 메모 모달 -->
    <NoteQuickModal
      v-model="showNoteModal"
      :book="currentBook"
      :book-name="currentBookName"
      :chapter="currentChapter"
      :existing-note="currentChapterNote"
      @save="handleNoteSave"
      @go-detail="handleNoteGoDetail"
    />

    <!-- 하이라이트 모달 -->
    <HighlightModal
      v-model="showHighlightModal"
      :book="currentBook"
      :book-name="currentBookName"
      :chapter="currentChapter"
      :start-verse="highlightSelection?.start ?? 1"
      :end-verse="highlightSelection?.end ?? 1"
      :existing-highlight="currentSelectionHighlight"
      :custom-colors="customColors"
      @save="handleHighlightSave"
      @delete="handleHighlightDelete"
      @add-custom-color="handleAddCustomColor"
    />

    <!-- 읽기 설정 모달 -->
    <ReadingSettingsModal
      :is-open="showSettingsModal"
      :current-version="currentVersion"
      @close="showSettingsModal = false"
    />

    <!-- 토스트 -->
    <Toast />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBibleData } from '~/composables/useBibleData';
// useBibleFetch는 이제 useBibleContent 내부에서 사용됨
import { useTongdokMode } from '~/composables/useTongdokMode';
import { usePersonalRecord } from '~/composables/usePersonalRecord';
import { useReadingPosition } from '~/composables/useReadingPosition';
import { useBookmark } from '~/composables/useBookmark';
import { useNote } from '~/composables/useNote';
import { useHighlight } from '~/composables/useHighlight';
import { useBibleModals } from '~/composables/bible/useBibleModals';
import { useBibleContent } from '~/composables/bible/useBibleContent';
import { useAuthGuard } from '~/composables/useAuthGuard';
import { useAuthStore } from '~/stores/auth';
import { useReadingSettingsStore } from '~/stores/readingSettings';
import { useToast } from '~/composables/useToast';
import BookSelector from '~/components/bible/BookSelector.vue';
import VersionSelector from '~/components/bible/VersionSelector.vue';
import BibleViewer from '~/components/bible/BibleViewer.vue';
import TongdokCompleteModal from '~/components/bible/TongdokCompleteModal.vue';
import BookmarkButton from '~/components/bible/BookmarkButton.vue';
import NoteButton from '~/components/bible/NoteButton.vue';
import NoteQuickModal from '~/components/bible/NoteQuickModal.vue';
import HighlightModal from '~/components/bible/HighlightModal.vue';
import BibleHome from '~/components/bible/BibleHome.vue';
import BibleTOC from '~/components/bible/BibleTOC.vue';
import ReadingSettingsModal from '~/components/ReadingSettingsModal.vue';
import Toast from '~/components/Toast.vue';

definePageMeta({
  layout: 'default'
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { requireAuth } = useAuthGuard();
const readingSettingsStore = useReadingSettingsStore();
const toast = useToast();

// Composables
const { bookNames, bookChapters, versionNames } = useBibleData();
const {
  fetchReadChapters,
  markAsRead,
  isChapterRead,
  getBookProgress,
  isLoading: isMarkingRead
} = usePersonalRecord();
// useBibleFetch는 이제 useBibleContent composable 내부에서 사용됨
const {
  tongdokMode,
  tongdokScheduleId,
  isCompleting,
  initTongdokMode,
  getTongdokScheduleRange,
  getFullScheduleRange,
  isLastChapterInTongdok,
  disableTongdokMode,
  completeReading
} = useTongdokMode();
const {
  loadReadingPosition,
  saveReadingPosition,
  cleanup: cleanupReadingPosition
} = useReadingPosition();
const {
  loadBookmarks,
  isChapterBookmarked,
  toggleChapterBookmark
} = useBookmark();
const {
  currentChapterNotes,
  showNoteModal,
  fetchChapterNotes,
  saveQuickNote,
  getChapterNoteCount
} = useNote();
const {
  chapterHighlights,
  customColors,
  addCustomColor,
  fetchChapterHighlights,
  createHighlight,
  updateHighlight,
  deleteHighlight
} = useHighlight();

// 콘텐츠 로딩 (useBibleContent composable)
const {
  content: bibleContent,
  isLoading,
  loadContent: loadBibleContentFromComposable,
} = useBibleContent();

// 상태
const viewMode = ref<'reader' | 'home' | 'toc'>('reader');
const currentBook = ref('gen');
const currentChapter = ref(1);
const currentVersion = ref('GAE');

// 모달 상태 (useBibleModals composable로 통합 관리)
const {
  showBookSelector,
  showVersionSelector,
  showTongdokCompleteModal,
  showHighlightModal,
  showSettingsModal,
  highlightSelection,
  openHighlightModal,
  closeTongdokCompleteModal,
} = useBibleModals();

// Refs
const bibleViewerRef = ref<InstanceType<typeof BibleViewer> | null>(null);
const scrollPosition = ref(0);

// Computed
const currentBookName = computed(() => bookNames[currentBook.value] || currentBook.value);
const currentVersionName = computed(() => versionNames[currentVersion.value] || currentVersion.value);
const maxChapters = computed(() => bookChapters[currentBook.value] || 1);
const chapterSuffix = computed(() => currentBook.value === 'psa' ? '편' : '장');

const hasPrevChapter = computed(() => {
  // 첫 번째 책의 첫 번째 장이 아니면 이전 장이 있음
  if (currentChapter.value > 1) return true;
  const allBooks = Object.keys(bookNames);
  const currentIndex = allBooks.indexOf(currentBook.value);
  return currentIndex > 0;
});

const hasNextChapter = computed(() => {
  // 현재 책의 마지막 장이 아니거나, 마지막 책이 아니면 다음 장이 있음
  if (currentChapter.value < maxChapters.value) return true;
  const allBooks = Object.keys(bookNames);
  const currentIndex = allBooks.indexOf(currentBook.value);
  return currentIndex < allBooks.length - 1;
});

// 통독모드 관련
const isTongdokMode = computed(() => tongdokMode.value);
const tongdokScheduleRange = computed(() =>
  getTongdokScheduleRange(currentBook.value, currentChapter.value)
);
const fullTongdokRange = computed(() => getFullScheduleRange());
const isAtLastTongdokChapter = computed(() =>
  isLastChapterInTongdok(currentBook.value, currentChapter.value)
);
const tongdokAutoComplete = computed(() =>
  readingSettingsStore.settings.tongdokAutoComplete
);

// 읽기모드 관련 (통독모드가 아닐 때)
const isReadingMode = computed(() => !isTongdokMode.value);
const isCurrentChapterRead = computed(() =>
  isChapterRead(currentBook.value, currentChapter.value)
);
const currentBookProgress = computed(() =>
  getBookProgress(currentBook.value, maxChapters.value)
);

// 북마크 관련
const isCurrentChapterBookmarked = computed(() =>
  isChapterBookmarked(currentBook.value, currentChapter.value)
);

// 노트 관련
const currentChapterNoteCount = computed(() => getChapterNoteCount());
const currentChapterNote = computed(() =>
  currentChapterNotes.value.find(
    n => n.book === currentBook.value && n.chapter === currentChapter.value
  ) || null
);

// 하이라이트 관련
const currentSelectionHighlight = computed(() => {
  if (!highlightSelection.value) return null;
  return chapterHighlights.value.find(
    h => h.start_verse === highlightSelection.value!.start &&
         h.end_verse === highlightSelection.value!.end
  ) || null;
});

// 쿼리 파라미터에서 초기값 설정 후 URL 정리
const initFromQuery = () => {
  const { book, chapter, version, tongdok, schedule, plan } = route.query;

  if (book && typeof book === 'string' && bookNames[book]) {
    currentBook.value = book;
  }

  if (chapter) {
    const chapterNum = parseInt(chapter as string);
    if (!isNaN(chapterNum) && chapterNum > 0) {
      currentChapter.value = Math.min(chapterNum, bookChapters[currentBook.value] || 1);
    }
  }

  // version이 없으면 기본값 GAE 사용
  if (version && typeof version === 'string' && versionNames[version]) {
    currentVersion.value = version;
  } else {
    currentVersion.value = 'GAE';
  }

  // 통독모드 초기화
  if (tongdok === 'true' || plan) {
    tongdokMode.value = true;
    if (schedule) {
      tongdokScheduleId.value = Number(schedule);
    }
  }

  // URL 정리 (쿼리 파라미터 제거)
  if (Object.keys(route.query).length > 0) {
    router.replace({ path: '/bible', query: {} });
  }
};

// 공유용 URL 생성 (version은 GAE가 아닐 때만 포함)
const generateShareUrl = () => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams();

  params.set('book', currentBook.value);
  params.set('chapter', String(currentChapter.value));

  // GAE(개역개정)가 아닐 때만 version 포함
  if (currentVersion.value !== 'GAE') {
    params.set('version', currentVersion.value);
  }

  return `${baseUrl}/bible?${params.toString()}`;
};

// 성경 본문 로드 (composable wrapper)
const loadBibleContent = async (book: string, chapter: number) => {
  await loadBibleContentFromComposable(book, chapter, currentVersion.value);
};

// 이벤트 핸들러
const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};

// BookSelector는 (book, chapter) 두 개의 개별 인수로 emit
const handleBookSelect = (book: string, chapter: number) => {
  currentBook.value = book;
  currentChapter.value = chapter;
  loadBibleContent(book, chapter);
};

const handleVersionSelect = (version: string) => {
  currentVersion.value = version;
  loadBibleContent(currentBook.value, currentChapter.value);
};

const goToPrevChapter = () => {
  if (currentChapter.value > 1) {
    currentChapter.value--;
  } else {
    // 이전 책의 마지막 장으로
    const allBooks = Object.keys(bookNames);
    const currentIndex = allBooks.indexOf(currentBook.value);
    if (currentIndex > 0) {
      const prevBook = allBooks[currentIndex - 1];
      if (prevBook) {
        currentBook.value = prevBook;
        currentChapter.value = bookChapters[prevBook] || 1;
      }
    }
  }
  loadBibleContent(currentBook.value, currentChapter.value);
  scrollToTop();
};

const goToNextChapter = async () => {
  // 통독모드에서 마지막 장인 경우
  if (isTongdokMode.value && isAtLastTongdokChapter.value) {
    // 자동 완료 설정이 켜져 있으면 바로 완료 처리
    if (tongdokAutoComplete.value) {
      await handleTongdokComplete({ autoComplete: true });
    } else {
      // 완료 모달 표시
      showTongdokCompleteModal.value = true;
    }
    return;
  }

  if (currentChapter.value < maxChapters.value) {
    currentChapter.value++;
  } else {
    // 다음 책의 첫 장으로
    const allBooks = Object.keys(bookNames);
    const currentIndex = allBooks.indexOf(currentBook.value);
    if (currentIndex < allBooks.length - 1) {
      const nextBook = allBooks[currentIndex + 1];
      if (nextBook) {
        currentBook.value = nextBook;
        currentChapter.value = 1;
      }
    }
  }
  loadBibleContent(currentBook.value, currentChapter.value);
  scrollToTop();
};

const scrollToTop = () => {
  nextTick(() => {
    bibleViewerRef.value?.restoreScrollPosition();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
};

// BibleViewer 이벤트 핸들러
const handleScrollPosition = (position: number) => {
  scrollPosition.value = position;
};

interface VerseSelection {
  start: number;
  end: number;
  text: string;
}

const handleBookmarkAction = (_verses: VerseSelection) => {
  // 북마크 기능: 현재 장 단위 북마크만 지원, 절 단위는 추후 구현 예정
};

const handleHighlightAction = (verses: VerseSelection) => {
  if (!requireAuth()) return;
  openHighlightModal({ start: verses.start, end: verses.end });
};

// 하이라이트 저장
const handleHighlightSave = async (data: { color: string; memo: string }) => {
  if (!highlightSelection.value) return;

  const existingHighlight = chapterHighlights.value.find(
    h => h.start_verse === highlightSelection.value!.start &&
         h.end_verse === highlightSelection.value!.end
  );

  try {
    if (existingHighlight) {
      await updateHighlight(existingHighlight.id, {
        color: data.color,
        memo: data.memo
      });
      toast.success('하이라이트가 수정되었습니다');
    } else {
      await createHighlight({
        book: currentBook.value,
        chapter: currentChapter.value,
        start_verse: highlightSelection.value.start,
        end_verse: highlightSelection.value.end,
        color: data.color,
        memo: data.memo
      });
      toast.success('하이라이트가 추가되었습니다');
    }
  } catch (error) {
    toast.error('하이라이트 저장에 실패했습니다');
  }
};

// 하이라이트 삭제
const handleHighlightDelete = async (highlightId: number) => {
  try {
    const success = await deleteHighlight(highlightId);
    if (success) {
      toast.success('하이라이트가 삭제되었습니다');
    } else {
      toast.error('하이라이트 삭제에 실패했습니다');
    }
  } catch (error) {
    toast.error('하이라이트 삭제에 실패했습니다');
  }
};

// 사용자 지정 색상 추가
const handleAddCustomColor = (color: string) => {
  addCustomColor(color);
};

const handleCopyAction = (_text: string) => {
  toast.success('복사 완료');
};

const handleShareAction = async (text: string) => {
  const shareUrl = generateShareUrl();
  const shareData = {
    title: `${currentBookName.value} ${currentChapter.value}${chapterSuffix.value}`,
    text: text || `${currentBookName.value} ${currentChapter.value}${chapterSuffix.value}`,
    url: shareUrl
  };

  // Web Share API 지원 시 네이티브 공유
  if (navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      // 사용자가 취소한 경우 무시
      if ((err as Error).name !== 'AbortError') {
        // 공유 실패 시 클립보드로 폴백
        await copyToClipboard(shareUrl);
      }
    }
  } else {
    // Web Share API 미지원 시 클립보드 복사
    await copyToClipboard(shareUrl);
  }
};

// 클립보드 복사 헬퍼
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('링크가 복사되었습니다');
  } catch {
    toast.error('복사에 실패했습니다');
  }
};

// 읽기모드: 읽음 표시 핸들러
const handleMarkAsRead = async () => {
  if (!requireAuth()) return;

  if (isCurrentChapterRead.value) {
    toast.info('이미 읽음으로 표시되었습니다');
    return;
  }

  try {
    await markAsRead(currentBook.value, currentChapter.value);
    toast.success(`${currentBookName.value} ${currentChapter.value}${chapterSuffix.value} 읽음 완료!`);
  } catch (err) {
    toast.error('읽음 표시에 실패했습니다');
  }
};

// 통독모드: 종료 핸들러
const handleExitTongdok = () => {
  disableTongdokMode();
  toast.info('통독모드를 종료했습니다');
};

// 북마크: 토글 핸들러
const handleBookmarkToggle = async () => {
  if (!requireAuth()) return;

  try {
    const result = await toggleChapterBookmark(
      currentBook.value,
      currentChapter.value,
      currentBookName.value
    );

    if (result.success) {
      if (result.added) {
        toast.success('북마크에 추가되었습니다');
      } else {
        toast.info('북마크가 삭제되었습니다');
      }
    }
  } catch (error) {
    toast.error('북마크 처리에 실패했습니다');
  }
};

// 노트: 클릭 핸들러
const handleNoteClick = () => {
  if (!requireAuth()) return;
  showNoteModal.value = true;
};

// 노트: 저장 핸들러
const handleNoteSave = async (content: string) => {
  try {
    const success = await saveQuickNote(
      currentBook.value,
      currentChapter.value,
      content
    );
    if (success) {
      toast.success('묵상노트가 저장되었습니다');
    }
  } catch (error) {
    toast.error('저장에 실패했습니다');
  }
};

// 노트: 상세 편집으로 이동
const handleNoteGoDetail = (noteId?: number, _content?: string) => {
  if (noteId) {
    router.push(`/bible/notes/${noteId}`);
  } else {
    // 새 노트 작성 후 목록으로
    router.push('/bible/notes');
  }
};

// 통독모드: 완료 처리 핸들러
const handleTongdokComplete = async (payload: { autoComplete: boolean }) => {
  // 자동 완료 설정 저장
  if (payload.autoComplete !== tongdokAutoComplete.value) {
    readingSettingsStore.updateSetting('tongdokAutoComplete', payload.autoComplete);
  }

  // API 호출
  const success = await completeReading();

  closeTongdokCompleteModal();

  if (success) {
    toast.success('오늘 통독을 완료했습니다!');
    // /plan 페이지로 이동
    router.push('/plan');
  } else {
    toast.error('완료 처리에 실패했습니다');
  }
};

// 진입점 모드 핸들러: 홈에서 계속 읽기
const handleContinueReading = async () => {
  const lastPos = await loadReadingPosition();
  if (lastPos) {
    currentBook.value = lastPos.book;
    currentChapter.value = lastPos.chapter;
    currentVersion.value = lastPos.version || 'GAE';
    scrollPosition.value = lastPos.scroll_position || 0;
  }
  viewMode.value = 'reader';
  loadBibleContent(currentBook.value, currentChapter.value);

  // 읽기 기록, 노트, 북마크 조회 (로그인 시)
  if (authStore.isAuthenticated) {
    await fetchReadChapters(currentBook.value);
    await fetchChapterNotes(currentBook.value, currentChapter.value);
    await fetchChapterHighlights(currentBook.value, currentChapter.value);
    await loadBookmarks(currentBook.value, currentChapter.value);
  }
};

// 진입점 모드 핸들러: 홈에서 책 선택
const handleHomeBookSelect = async (bookId: string, chapter: number = 1) => {
  currentBook.value = bookId;
  currentChapter.value = chapter;
  viewMode.value = 'reader';
  loadBibleContent(currentBook.value, currentChapter.value);

  if (authStore.isAuthenticated) {
    await fetchReadChapters(currentBook.value);
    await fetchChapterNotes(currentBook.value, currentChapter.value);
    await fetchChapterHighlights(currentBook.value, currentChapter.value);
    await loadBookmarks(currentBook.value, currentChapter.value);
  }
};

// 진입점 모드 핸들러: 목차에서 책 선택
const handleTocBookSelect = async (bookId: string, chapter: number = 1) => {
  currentBook.value = bookId;
  currentChapter.value = chapter;
  viewMode.value = 'reader';
  loadBibleContent(currentBook.value, currentChapter.value);

  if (authStore.isAuthenticated) {
    await fetchReadChapters(currentBook.value);
    await fetchChapterNotes(currentBook.value, currentChapter.value);
    await fetchChapterHighlights(currentBook.value, currentChapter.value);
    await loadBookmarks(currentBook.value, currentChapter.value);
  }
};

// 진입점 모드 핸들러: 목차에서 뒤로가기
const handleTocBack = () => {
  const entryPoint = readingSettingsStore.settings.defaultEntryPoint || 'last-position';
  if (entryPoint === 'home') {
    viewMode.value = 'home';
  } else {
    // 기본 진입점이 toc인 경우 뒤로가기는 이전 페이지로
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }
};

// 라이프사이클
onMounted(async () => {
  initTongdokMode();

  // URL에 book/chapter/plan/tongdok이 있으면 그것을 사용 (바로 reader로)
  const hasQueryParams = route.query.book || route.query.chapter || route.query.plan || route.query.tongdok;

  if (hasQueryParams) {
    viewMode.value = 'reader';
    initFromQuery();
    loadBibleContent(currentBook.value, currentChapter.value);
  } else if (!tongdokMode.value) {
    // 쿼리 파라미터가 없고 통독모드가 아니면 설정에 따른 진입점
    const entryPoint = readingSettingsStore.settings.defaultEntryPoint || 'last-position';

    switch (entryPoint) {
      case 'home':
        viewMode.value = 'home';
        // 홈 뷰에서는 본문 로드 불필요
        break;
      case 'toc':
        viewMode.value = 'toc';
        // 목차 뷰에서는 본문 로드 불필요
        break;
      case 'last-position':
      default:
        viewMode.value = 'reader';
        const lastPos = await loadReadingPosition();
        if (lastPos) {
          currentBook.value = lastPos.book;
          currentChapter.value = lastPos.chapter;
          currentVersion.value = lastPos.version || 'GAE';
          scrollPosition.value = lastPos.scroll_position || 0;
        }
        loadBibleContent(currentBook.value, currentChapter.value);
        break;
    }
  } else {
    viewMode.value = 'reader';
    initFromQuery();
    loadBibleContent(currentBook.value, currentChapter.value);
  }

  // 읽기 기록, 노트, 북마크 조회 (로그인 시, reader 모드일 때만)
  if (authStore.isAuthenticated && viewMode.value === 'reader') {
    if (!isTongdokMode.value) {
      await fetchReadChapters(currentBook.value);
    }
    await fetchChapterNotes(currentBook.value, currentChapter.value);
    await fetchChapterHighlights(currentBook.value, currentChapter.value);
    await loadBookmarks(currentBook.value, currentChapter.value);
  }

  // beforeunload 이벤트 등록 (페이지 이탈 시 위치 저장)
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload);
  }
});

onBeforeUnmount(() => {
  // cleanup
  cleanupReadingPosition();
  if (typeof window !== 'undefined') {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  }
  // 페이지 이탈 시 위치 저장
  if (!tongdokMode.value) {
    saveReadingPosition(currentBook.value, currentChapter.value, currentVersion.value, true);
  }
});

// beforeunload 핸들러
const handleBeforeUnload = () => {
  if (!tongdokMode.value) {
    saveReadingPosition(currentBook.value, currentChapter.value, currentVersion.value, true);
  }
};

// route.query 변경 감지 (딥링크 처리)
watch(
  () => route.query,
  (newQuery) => {
    // 쿼리 파라미터가 있으면 처리 (딥링크로 접근한 경우)
    if (newQuery.book || newQuery.chapter || newQuery.tongdok) {
      initFromQuery();
      loadBibleContent(currentBook.value, currentChapter.value);
    }
  }
);

// 책 변경 시 읽기 기록 조회
watch(
  () => currentBook.value,
  async (newBook) => {
    if (authStore.isAuthenticated && !isTongdokMode.value) {
      await fetchReadChapters(newBook);
    }
  }
);

// 책/장 변경 시 노트, 하이라이트, 북마크 조회
watch(
  [() => currentBook.value, () => currentChapter.value],
  async ([newBook, newChapter]) => {
    if (authStore.isAuthenticated) {
      await fetchChapterNotes(newBook, newChapter);
      await fetchChapterHighlights(newBook, newChapter);
      await loadBookmarks(newBook, newChapter);
    }
  }
);

// 책/장/역본 변경 시 위치 저장 (통독모드가 아닐 때)
watch(
  [() => currentBook.value, () => currentChapter.value, () => currentVersion.value],
  () => {
    if (!tongdokMode.value) {
      saveReadingPosition(currentBook.value, currentChapter.value, currentVersion.value);
    }
  },
  { flush: 'post' }
);
</script>

<style scoped>
.bible-page {
  max-width: 768px;
  margin: 0 auto;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-card, #ffffff);
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.06);
}

@media (max-width: 768px) {
  .bible-page {
    box-shadow: none;
  }
}

/* 헤더 (reading.vue 동일) */
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

/* 네비게이션 (reading.vue 동일) */
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
:root.dark .bible-page {
  background: var(--color-bg-primary);
}

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

:root.dark .reading-action {
  border-color: var(--color-border);
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
