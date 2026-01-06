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
      <BibleReaderView
        ref="bibleReaderViewRef"
        :content="bibleContent"
        :is-loading="isLoading"
        :scroll-position="scrollPosition"
        :current-book-name="currentBookName"
        :current-chapter="currentChapter"
        :current-version-name="currentVersionName"
        :chapter-suffix="chapterSuffix"
        :has-prev-chapter="hasPrevChapter"
        :has-next-chapter="hasNextChapter"
        :is-tongdok-mode="isTongdokMode"
        :tongdok-schedule-range="tongdokScheduleRange"
        :is-completing="isCompleting"
        :is-current-chapter-read="isCurrentChapterRead"
        :is-marking-read="isMarkingRead"
        :book-progress="currentBookProgress"
        :is-authenticated="authStore.isAuthenticated"
        :is-bookmarked="isCurrentChapterBookmarked"
        :note-count="currentChapterNoteCount"
        :highlights="chapterHighlights"
        @back="goBack"
        @prev-chapter="goToPrevChapter"
        @next-chapter="goToNextChapter"
        @open-book-selector="showBookSelector = true"
        @open-version-selector="showVersionSelector = true"
        @open-settings="showSettingsModal = true"
        @bookmark-toggle="handleBookmarkToggle"
        @note-click="handleNoteClick"
        @mark-as-read="handleMarkAsRead"
        @scroll="handleScrollPosition"
        @bookmark="handleBookmarkAction"
        @highlight="handleHighlightAction"
        @copy="handleCopyAction"
        @share="handleShareAction"
        @exit-tongdok="handleExitTongdok"
        @tongdok-complete-click="showTongdokCompleteModal = true"
        @today-tongdok="handleTodayTongdok"
      />

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
// useBibleFetch는 이제 useBibleContent 내부에서 사용됨
import { useTongdokMode } from '~/composables/useTongdokMode';
import { usePersonalRecord } from '~/composables/usePersonalRecord';
import { useReadingPosition } from '~/composables/useReadingPosition';
import { useBookmark } from '~/composables/useBookmark';
import { useNote } from '~/composables/useNote';
import { useHighlight } from '~/composables/useHighlight';
import { useBibleModals } from '~/composables/bible/useBibleModals';
import { useBibleContent } from '~/composables/bible/useBibleContent';
import { useBiblePageState } from '~/composables/bible/useBiblePageState';
import { useAuthGuard } from '~/composables/useAuthGuard';
import { useAuthStore } from '~/stores/auth';
import { useReadingSettingsStore } from '~/stores/readingSettings';
import { useSelectedPlanStore } from '~/stores/selectedPlan';
import { useToast } from '~/composables/useToast';
import { useApi } from '~/composables/useApi';
// 뷰 컴포넌트
import BibleHome from '~/components/bible/BibleHome.vue';
import BibleTOC from '~/components/bible/BibleTOC.vue';
import BibleReaderView from '~/components/bible/BibleReaderView.vue';

// 모달 컴포넌트
import BookSelector from '~/components/bible/BookSelector.vue';
import VersionSelector from '~/components/bible/VersionSelector.vue';
import TongdokCompleteModal from '~/components/bible/TongdokCompleteModal.vue';
import NoteQuickModal from '~/components/bible/NoteQuickModal.vue';
import HighlightModal from '~/components/bible/HighlightModal.vue';
import ReadingSettingsModal from '~/components/ReadingSettingsModal.vue';

// 기타
import Toast from '~/components/Toast.vue';

// 타입
import type { VerseSelection } from '~/types/bible';

definePageMeta({
  layout: 'default'
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { requireAuth } = useAuthGuard();
const readingSettingsStore = useReadingSettingsStore();
const selectedPlanStore = useSelectedPlanStore();
const toast = useToast();
const api = useApi();

// Composables
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
  tongdokPlanId,
  isCompleting,
  initTongdokMode,
  getTongdokScheduleRange,
  getFullScheduleRange,
  isLastChapterInTongdok,
  disableTongdokMode,
  enableTongdokMode,
  completeReading,
  setReadingDetailResponse
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

// 페이지 상태 (useBiblePageState composable)
const {
  viewMode,
  currentBook,
  currentChapter,
  currentVersion,
  currentBookName,
  currentVersionName,
  maxChapters,
  chapterSuffix,
  hasPrevChapter,
  hasNextChapter,
  goBack,
  goToPrevChapter: goToPrevChapterBase,
  goToNextChapter: goToNextChapterBase,
  selectBook,
  selectVersion,
  initFromQuery: initFromQueryBase,
  generateShareUrl,
} = useBiblePageState();

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
const bibleReaderViewRef = ref<InstanceType<typeof BibleReaderView> | null>(null);
const scrollPosition = ref(0);

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

// 쿼리 파라미터에서 초기값 설정 후 URL 정리 (composable wrapper with tongdok mode)
const initFromQuery = () => {
  const { tongdok, schedule, plan } = route.query;

  // 기본 book/chapter/version 초기화는 composable에 위임
  initFromQueryBase(route.query);

  // 통독모드 초기화 (index.vue에서만 처리)
  if (tongdok === 'true' || plan) {
    tongdokMode.value = true;
    if (schedule) {
      tongdokScheduleId.value = Number(schedule);
    }
  }
};

// 성경 본문 로드 (composable wrapper)
const loadBibleContent = async (book: string, chapter: number) => {
  await loadBibleContentFromComposable(book, chapter, currentVersion.value);
};

// 이벤트 핸들러 (composable wrapper)
// goBack은 useBiblePageState에서 직접 사용

// BookSelector는 (book, chapter) 두 개의 개별 인수로 emit
const handleBookSelect = (book: string, chapter: number) => {
  selectBook(book, chapter);
  loadBibleContent(book, chapter);
};

const handleVersionSelect = (version: string) => {
  selectVersion(version);
  loadBibleContent(currentBook.value, currentChapter.value);
};

// 네비게이션 (composable wrapper with content loading)
const goToPrevChapter = () => {
  goToPrevChapterBase();
  loadBibleContent(currentBook.value, currentChapter.value);
  scrollToTop();
};

const goToNextChapter = async () => {
  // 통독모드에서 마지막 장인 경우 (tongdok mode는 index.vue에서만 처리)
  if (isTongdokMode.value && isAtLastTongdokChapter.value) {
    if (tongdokAutoComplete.value) {
      await handleTongdokComplete({ autoComplete: true });
    } else {
      showTongdokCompleteModal.value = true;
    }
    return;
  }

  goToNextChapterBase();
  loadBibleContent(currentBook.value, currentChapter.value);
  scrollToTop();
};

const scrollToTop = () => {
  nextTick(() => {
    bibleReaderViewRef.value?.scrollToTop();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
};

// BibleViewer 이벤트 핸들러
const handleScrollPosition = (position: number) => {
  scrollPosition.value = position;
};

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

// 통독모드: 오늘의 통독 시작 핸들러
const handleTodayTongdok = async () => {
  try {
    // 선택된 플랜 ID 확인
    const planId = selectedPlanStore.effectivePlanId;
    if (!planId) {
      toast.error('선택된 플랜이 없습니다. 메인 화면에서 플랜을 선택해주세요.');
      return;
    }

    // 오늘의 스케줄 조회
    const response = await api.get(`/api/v1/todos/schedules/today/?plan_id=${planId}`);

    if (response.data.success && response.data.schedules && response.data.schedules.length > 0) {
      const schedule = response.data.schedules[0];

      // 통독모드 활성화
      tongdokMode.value = true;
      tongdokScheduleId.value = schedule.id;
      tongdokPlanId.value = planId;

      // 읽기 상세 정보 설정 (plan_detail이 있는 경우)
      if (schedule.plan_detail) {
        setReadingDetailResponse({ data: { plan_detail: schedule.plan_detail } });
      }

      // 해당 책/장으로 이동
      handleBookSelect(schedule.book_code, schedule.start_chapter);

      toast.success('오늘의 통독을 시작합니다');
    } else {
      toast.info('오늘 예정된 통독 일정이 없습니다');
    }
  } catch (error) {
    console.error('오늘의 통독 조회 실패:', error);
    toast.error('통독 일정을 불러오는데 실패했습니다');
  }
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

// 헬퍼: 사용자 데이터 로딩 (인증된 사용자 전용)
const loadUserDataForChapter = async (book: string, chapter: number, skipReadChapters = false) => {
  if (!authStore.isAuthenticated) return;

  const promises: Promise<void>[] = [
    fetchChapterNotes(book, chapter),
    fetchChapterHighlights(book, chapter),
    loadBookmarks(book, chapter),
  ];

  if (!skipReadChapters) {
    promises.unshift(fetchReadChapters(book));
  }

  await Promise.all(promises);
};

// 헬퍼: reader 모드 진입 (공통 로직)
// Note: 사용자 데이터 로딩은 book/chapter watch에서 자동 처리됨
const enterReaderMode = async (book: string, chapter: number) => {
  currentBook.value = book;
  currentChapter.value = chapter;
  viewMode.value = 'reader';
  await loadBibleContent(book, chapter);
};

// 진입점 모드 핸들러: 홈에서 계속 읽기
const handleContinueReading = async () => {
  const lastPos = await loadReadingPosition();
  if (lastPos) {
    currentVersion.value = lastPos.version || 'GAE';
    scrollPosition.value = lastPos.scroll_position || 0;
    await enterReaderMode(lastPos.book, lastPos.chapter);
  } else {
    await enterReaderMode(currentBook.value, currentChapter.value);
  }
};

// 진입점 모드 핸들러: 홈에서 책 선택
const handleHomeBookSelect = async (bookId: string, chapter: number = 1) => {
  await enterReaderMode(bookId, chapter);
};

// 진입점 모드 핸들러: 목차에서 책 선택
const handleTocBookSelect = async (bookId: string, chapter: number = 1) => {
  await enterReaderMode(bookId, chapter);
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
  if (viewMode.value === 'reader') {
    await loadUserDataForChapter(
      currentBook.value,
      currentChapter.value,
      isTongdokMode.value // 통독모드일 때 readChapters 스킵
    );
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

/* 다크모드 */
:root.dark .bible-page {
  background: var(--color-bg-primary);
}
</style>
