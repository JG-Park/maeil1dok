<template>
  <div class="bible-page">
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
    />

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

      <!-- 읽기모드: 읽음 표시 영역 -->
      <div v-else-if="isReadingMode" class="reading-action">
        <button
          class="mark-read-btn"
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
          <div v-if="authStore.isAuthenticated && currentBookProgress.total > 0" class="progress-info">
            <span class="progress-text">{{ currentBookProgress.read }} / {{ currentBookProgress.total }}장</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${currentBookProgress.percentage}%` }"></div>
            </div>
          </div>
        </ClientOnly>
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

    <!-- 토스트 -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBibleData } from '~/composables/useBibleData';
import { useBibleFetch } from '~/composables/useBibleFetch';
import { useTongdokMode } from '~/composables/useTongdokMode';
import { usePersonalRecord } from '~/composables/usePersonalRecord';
import { useReadingPosition } from '~/composables/useReadingPosition';
import { useBookmark } from '~/composables/useBookmark';
import { useNote } from '~/composables/useNote';
import { useHighlight } from '~/composables/useHighlight';
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
import Toast from '~/components/Toast.vue';

definePageMeta({
  layout: 'default'
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
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
const { fetchKntContent, fetchStandardContent, getFallbackUrl } = useBibleFetch();
const {
  tongdokMode,
  tongdokScheduleId,
  tongdokPlanId,
  isCompleting,
  initTongdokMode,
  getTongdokScheduleRange,
  getFullScheduleRange,
  isLastChapterInTongdok,
  disableTongdokMode,
  completeReading
} = useTongdokMode();
const {
  lastReadingPosition,
  loadReadingPosition,
  saveReadingPosition,
  cleanup: cleanupReadingPosition
} = useReadingPosition();
const {
  currentBookmarks,
  isBookmarkLoading,
  loadBookmarks,
  isChapterBookmarked,
  toggleChapterBookmark
} = useBookmark();
const {
  currentChapterNotes,
  isNoteLoading,
  showNoteModal,
  editingNote,
  fetchChapterNotes,
  saveQuickNote,
  getChapterNoteCount
} = useNote();
const {
  chapterHighlights,
  isHighlightLoading,
  customColors,
  addCustomColor,
  fetchChapterHighlights,
  getVerseHighlight,
  createHighlight,
  updateHighlight,
  deleteHighlight
} = useHighlight();

// 상태
const currentBook = ref('gen');
const currentChapter = ref(1);
const currentVersion = ref('GAE');
const bibleContent = ref('');
const chapterTitle = ref('');
const isLoading = ref(true);

// 모달 상태
const showBookSelector = ref(false);
const showVersionSelector = ref(false);
const showTongdokCompleteModal = ref(false);
const showHighlightModal = ref(false);

// 하이라이트 선택 상태
const highlightSelection = ref<{ start: number; end: number } | null>(null);

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

// 쿼리 파라미터에서 초기값 설정
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

  if (version && typeof version === 'string' && versionNames[version]) {
    currentVersion.value = version;
  }

  // 통독모드 초기화
  if (tongdok === 'true' || plan) {
    tongdokMode.value = true;
    if (schedule) {
      tongdokScheduleId.value = Number(schedule);
    }
  }
};

// URL 업데이트
const updateUrl = () => {
  const query: Record<string, string> = {
    book: currentBook.value,
    chapter: String(currentChapter.value),
    version: currentVersion.value,
  };

  if (tongdokMode.value) {
    query.tongdok = 'true';
    if (tongdokScheduleId.value) {
      query.schedule = String(tongdokScheduleId.value);
    }
  }

  router.replace({ query });
};

// 성경 본문 로드
const loadBibleContent = async (book: string, chapter: number) => {
  isLoading.value = true;

  try {
    if (currentVersion.value === 'KNT') {
      await loadKntContent(book, chapter);
    } else {
      await loadStandardContent(book, chapter);
    }
  } catch (error) {
    console.error('성경 본문 로드 실패:', error);
    showErrorContent(book, chapter);
  } finally {
    isLoading.value = false;
  }
};

// KNT(새한글성경) 로드
const loadKntContent = async (book: string, chapter: number) => {
  const result = await fetchKntContent(book, chapter);

  if (result.source === 'error') {
    showErrorContent(book, chapter);
    return;
  }

  try {
    const jsonData = JSON.parse(result.content);
    if (jsonData.found) {
      parseKntContent(jsonData, book, chapter);
    } else {
      showErrorContent(book, chapter);
    }
  } catch {
    showErrorContent(book, chapter);
  }
};

// 표준 역본 로드
const loadStandardContent = async (book: string, chapter: number) => {
  const result = await fetchStandardContent(currentVersion.value, book, chapter);

  if (result.source === 'error') {
    showErrorContent(book, chapter);
    return;
  }

  parseStandardContent(result.content, book, chapter);
};

// KNT 파싱
const parseKntContent = (jsonData: any, book: string, chapter: number) => {
  const suffix = book === 'psa' ? '편' : '장';
  chapterTitle.value = `${bookNames[book]} ${chapter}${suffix}`;

  if (!jsonData.html) {
    bibleContent.value = '<p class="no-content">내용을 찾을 수 없습니다.</p>';
    return;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(jsonData.html, 'text/html');

  // 본문 추출
  const contentEl = doc.querySelector('.content') || doc.body;
  const verses: string[] = [];

  contentEl.querySelectorAll('p, .verse').forEach((el) => {
    const text = el.textContent?.trim();
    if (text) {
      verses.push(`<p class="verse">${text}</p>`);
    }
  });

  bibleContent.value = verses.length > 0
    ? verses.join('')
    : '<p class="no-content">내용을 찾을 수 없습니다.</p>';
};

// 표준 역본 파싱
const parseStandardContent = (htmlText: string, book: string, chapter: number) => {
  const suffix = book === 'psa' ? '편' : '장';
  chapterTitle.value = `${bookNames[book]} ${chapter}${suffix}`;

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const bibleElement = doc.getElementById('tdBible1');

  if (!bibleElement) {
    showErrorContent(book, chapter);
    return;
  }

  // 불필요한 요소 제거
  bibleElement.querySelectorAll('script, style, .hidden').forEach(el => el.remove());

  // 본문 추출
  const verses: string[] = [];
  bibleElement.querySelectorAll('p, div').forEach((el) => {
    const html = el.innerHTML?.trim();
    if (html && html.length > 0) {
      verses.push(`<div class="verse-line">${html}</div>`);
    }
  });

  bibleContent.value = verses.length > 0
    ? verses.join('')
    : bibleElement.innerHTML || '<p class="no-content">내용을 찾을 수 없습니다.</p>';
};

// 에러 표시
const showErrorContent = (book: string, chapter: number) => {
  const fallbackUrl = getFallbackUrl(currentVersion.value, book, chapter);
  bibleContent.value = `
    <div class="error-message">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h3>성경을 불러오는데 문제가 발생했습니다</h3>
      <p>잠시 후 다시 시도하거나, 대한성서공회 사이트에서 직접 확인해주세요.</p>
      <a href="${fallbackUrl}" target="_blank" class="external-link">
        대한성서공회에서 보기
      </a>
    </div>
  `;
};

// 이벤트 핸들러
const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};

const handleBookSelect = (selection: { book: string; chapter: number }) => {
  currentBook.value = selection.book;
  currentChapter.value = selection.chapter;
  updateUrl();
  loadBibleContent(selection.book, selection.chapter);
};

const handleVersionSelect = (version: string) => {
  currentVersion.value = version;
  updateUrl();
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
  updateUrl();
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
  updateUrl();
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

const handleBookmarkAction = (verses: VerseSelection) => {
  // TODO: 북마크 기능 구현 (Phase 3)
  console.log('Bookmark:', verses);
};

const handleHighlightAction = (verses: VerseSelection) => {
  if (!authStore.isAuthenticated) {
    toast.info('로그인이 필요합니다');
    router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`);
    return;
  }
  highlightSelection.value = { start: verses.start, end: verses.end };
  showHighlightModal.value = true;
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

const handleCopyAction = (text: string) => {
  // 복사 성공 시 토스트 표시 등 (선택적)
  console.log('Copied:', text);
};

const handleShareAction = (text: string) => {
  // 공유 완료 (선택적 핸들링)
  console.log('Shared:', text);
};

// 읽기모드: 읽음 표시 핸들러
const handleMarkAsRead = async () => {
  if (!authStore.isAuthenticated) {
    // 비로그인 시 로그인 유도
    toast.info('로그인이 필요합니다');
    router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`);
    return;
  }

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
  if (!authStore.isAuthenticated) {
    toast.info('로그인이 필요합니다');
    router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`);
    return;
  }

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
  if (!authStore.isAuthenticated) {
    toast.info('로그인이 필요합니다');
    router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`);
    return;
  }
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
const handleNoteGoDetail = (noteId?: number, content?: string) => {
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

  showTongdokCompleteModal.value = false;

  if (success) {
    toast.success('오늘 통독을 완료했습니다!');
    // /plan 페이지로 이동
    router.push('/plan');
  } else {
    toast.error('완료 처리에 실패했습니다');
  }
};

// 라이프사이클
onMounted(async () => {
  initTongdokMode();

  // URL에 book/chapter가 있으면 그것을 사용
  const hasQueryParams = route.query.book || route.query.chapter;

  if (hasQueryParams) {
    initFromQuery();
  } else if (!tongdokMode.value) {
    // 쿼리 파라미터가 없고 통독모드가 아니면 마지막 위치 로드
    const lastPos = await loadReadingPosition();
    if (lastPos) {
      currentBook.value = lastPos.book;
      currentChapter.value = lastPos.chapter;
      currentVersion.value = lastPos.version || 'GAE';
      scrollPosition.value = lastPos.scroll_position || 0;
      updateUrl();
    }
  } else {
    initFromQuery();
  }

  loadBibleContent(currentBook.value, currentChapter.value);

  // 읽기 기록 및 노트 조회 (로그인 시)
  if (authStore.isAuthenticated) {
    if (!isTongdokMode.value) {
      await fetchReadChapters(currentBook.value);
    }
    await fetchChapterNotes(currentBook.value, currentChapter.value);
    await fetchChapterHighlights(currentBook.value, currentChapter.value);
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

// route.query 변경 감지
watch(
  () => route.query,
  (newQuery) => {
    if (newQuery.book && newQuery.book !== currentBook.value) {
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

// 책/장 변경 시 노트 조회
watch(
  [() => currentBook.value, () => currentChapter.value],
  async ([newBook, newChapter]) => {
    if (authStore.isAuthenticated) {
      await fetchChapterNotes(newBook, newChapter);
      await fetchChapterHighlights(newBook, newChapter);
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
  background: var(--color-bg-primary, #f9fafb);
}

/* 헤더 */
.bible-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-card, #fff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-button {
  padding: 0.5rem;
  margin: -0.5rem;
  color: var(--text-primary, #1f2937);
  border-radius: 8px;
  transition: background 0.2s;
}

.back-button:hover {
  background: var(--color-bg-hover, #f3f4f6);
}

.book-selector-button {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-primary, #f9fafb);
  border-radius: 8px;
  font-size: 0.9375rem;
  color: var(--text-primary, #1f2937);
  transition: background 0.2s;
}

.book-selector-button:hover {
  background: var(--color-bg-hover, #f3f4f6);
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
  gap: 0.5rem;
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

/* 하단 영역 */
.bible-bottom-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 768px;
  margin: 0 auto;
  background: var(--color-bg-card, #fff);
  border-top: 1px solid var(--color-border, #e5e7eb);
}

/* 통독모드 액션 영역 */
.tongdok-action {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
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

/* 읽기모드 액션 영역 */
.reading-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.mark-read-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  max-width: 280px;
  padding: 0.75rem 1.25rem;
  background: var(--primary-color, #6366f1);
  color: white;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.mark-read-btn:hover:not(:disabled) {
  background: var(--primary-dark, #4f46e5);
}

.mark-read-btn.is-read {
  background: var(--color-success, #10b981);
}

.mark-read-btn.is-read:hover:not(:disabled) {
  background: var(--color-success-dark, #059669);
}

.mark-read-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  max-width: 200px;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
  white-space: nowrap;
  min-width: 60px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--color-bg-tertiary, #e5e7eb);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color, #6366f1);
  transition: width 0.3s ease;
}

/* 네비게이션 */
.bible-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  color: var(--primary-color, #6366f1);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-button:hover:not(:disabled) {
  background: var(--primary-light, #eef2ff);
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
    padding-bottom: env(safe-area-inset-bottom);
  }
}

/* 다크모드 */
:root.dark .bible-page {
  background: var(--color-bg-primary);
}

:root.dark .bible-header {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .bible-bottom-area {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .reading-action {
  border-color: var(--color-border);
}

:root.dark .tongdok-indicator {
  background: rgba(99, 102, 241, 0.15);
  border-color: var(--color-border);
}

:root.dark .tongdok-action {
  border-color: var(--color-border);
}
</style>
