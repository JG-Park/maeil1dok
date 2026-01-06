<template>
  <div
    ref="viewerRef"
    class="bible-viewer"
    :class="[`theme-${effectiveTheme}`, { 'verse-joining': settings.verseJoining }]"
    :style="viewerStyle"
    @scroll="handleScroll"
  >
    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>성경을 불러오는 중...</p>
    </div>

    <!-- 성경 본문 -->
    <div
      v-else
      class="bible-content"
      @mouseup="handleTextSelection"
      @touchend="handleTextSelection"
      v-html="renderedContent"
    ></div>

    <!-- 절 선택 액션 메뉴 -->
    <Teleport to="body">
      <Transition name="action-menu">
        <div
          v-if="showActionMenu"
          class="verse-action-menu"
          :style="actionMenuPosition"
          @click.stop
        >
          <button class="action-button" @click="handleBookmark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>북마크</span>
          </button>
          <button class="action-button" @click="handleHighlight">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>하이라이트</span>
          </button>
          <button class="action-button" @click="handleCopy">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span>복사</span>
          </button>
          <button class="action-button" @click="handleShare">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="18" cy="5" r="3" stroke="currentColor" stroke-width="2"/>
              <circle cx="6" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              <circle cx="18" cy="19" r="3" stroke="currentColor" stroke-width="2"/>
              <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span>공유</span>
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useReadingSettingsStore, FONT_FAMILIES, LINE_HEIGHTS, FONT_WEIGHTS } from '~/stores/readingSettings';

interface Props {
  content: string;
  book: string;
  chapter: number;
  isLoading?: boolean;
  initialScrollPosition?: number;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  initialScrollPosition: 0,
});

const emit = defineEmits<{
  scroll: [position: number];
  'verse-select': [verses: { start: number; end: number; text: string }];
  bookmark: [verses: { start: number; end: number; text: string }];
  highlight: [verses: { start: number; end: number; text: string }];
  copy: [text: string];
  share: [text: string];
}>();

// Store
const settingsStore = useReadingSettingsStore();
const settings = computed(() => settingsStore.settings);
const effectiveTheme = computed(() => settingsStore.effectiveTheme);

// Refs
const viewerRef = ref<HTMLElement | null>(null);

// 절 선택 상태
const showActionMenu = ref(false);
const selectedVerses = ref({ start: 0, end: 0 });
const selectedText = ref('');
const actionMenuPosition = ref({ top: '0px', left: '0px' });

// 스타일 계산
const viewerStyle = computed(() => ({
  '--reading-font-family': FONT_FAMILIES[settings.value.fontFamily].css,
  '--reading-font-size': `${settings.value.fontSize}px`,
  '--reading-font-weight': FONT_WEIGHTS[settings.value.fontWeight],
  '--reading-line-height': LINE_HEIGHTS[settings.value.lineHeight],
  '--reading-text-align': settings.value.textAlign,
}));

// 본문 렌더링 (절 번호에 data-verse 속성 추가)
const renderedContent = computed(() => {
  if (!props.content) return '';

  // sup 태그에 클릭 가능한 클래스와 data-verse 추가
  let content = props.content.replace(
    /<sup>(\d+)<\/sup>/g,
    '<sup class="verse-num" data-verse="$1">$1</sup>'
  );

  // 기존 절 번호 스타일 개선
  content = content.replace(
    /<sup class="verse-num"/g,
    '<sup class="verse-num clickable"'
  );

  return content;
});

// 스크롤 핸들러 (throttle 적용)
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
const handleScroll = () => {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  scrollTimeout = setTimeout(() => {
    if (viewerRef.value) {
      const { scrollTop, scrollHeight, clientHeight } = viewerRef.value;
      const maxScroll = scrollHeight - clientHeight;
      const position = maxScroll > 0 ? scrollTop / maxScroll : 0;
      emit('scroll', position);
    }
  }, 100);
};

// 텍스트 선택 핸들러
const handleTextSelection = () => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    hideActionMenu();
    return;
  }

  const text = selection.toString().trim();
  if (!text) {
    hideActionMenu();
    return;
  }

  // 선택된 텍스트에서 절 번호 추출
  const range = selection.getRangeAt(0);
  const verses = extractVerseNumbers(range);

  if (verses.start > 0) {
    selectedVerses.value = verses;
    selectedText.value = text;
    showActionMenuAt(range);
  }
};

// 절 번호 추출
const extractVerseNumbers = (range: Range): { start: number; end: number } => {
  const container = range.commonAncestorContainer;
  const parent = container.parentElement?.closest('.bible-content') || viewerRef.value;

  if (!parent) return { start: 0, end: 0 };

  // 선택 범위 내의 절 번호 찾기
  const allVerseNums = parent.querySelectorAll('.verse-num[data-verse]');
  let start = 0;
  let end = 0;

  allVerseNums.forEach((el) => {
    const verseNum = parseInt(el.getAttribute('data-verse') || '0');
    if (verseNum === 0) return;

    // 선택 범위와 비교
    const position = range.comparePoint(el, 0);
    if (position <= 0 && start === 0) {
      start = verseNum;
    }
    if (position <= 0) {
      end = verseNum;
    }
  });

  // 시작 절이 없으면 첫 번째 절로
  if (start === 0 && end > 0) start = 1;
  if (end === 0 && start > 0) end = start;

  return { start, end };
};

// 액션 메뉴 표시
const showActionMenuAt = (range: Range) => {
  const rect = range.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // 메뉴 위치 계산 (선택 영역 위)
  let top = rect.top - 60;
  let left = rect.left + rect.width / 2 - 120; // 메뉴 너비의 절반

  // 화면 경계 처리
  if (top < 10) {
    top = rect.bottom + 10;
  }
  if (left < 10) {
    left = 10;
  }
  if (left + 240 > viewportWidth) {
    left = viewportWidth - 250;
  }

  actionMenuPosition.value = {
    top: `${top}px`,
    left: `${left}px`,
  };
  showActionMenu.value = true;
};

// 액션 메뉴 숨기기
const hideActionMenu = () => {
  showActionMenu.value = false;
};

// 액션 핸들러
const handleBookmark = () => {
  emit('bookmark', {
    start: selectedVerses.value.start,
    end: selectedVerses.value.end,
    text: selectedText.value,
  });
  hideActionMenu();
  clearSelection();
};

const handleHighlight = () => {
  emit('highlight', {
    start: selectedVerses.value.start,
    end: selectedVerses.value.end,
    text: selectedText.value,
  });
  hideActionMenu();
  clearSelection();
};

const handleCopy = async () => {
  const bookName = props.book;
  const verseRef = selectedVerses.value.start === selectedVerses.value.end
    ? `${selectedVerses.value.start}절`
    : `${selectedVerses.value.start}-${selectedVerses.value.end}절`;
  const copyText = `${selectedText.value}\n\n- ${bookName} ${props.chapter}장 ${verseRef}`;

  try {
    await navigator.clipboard.writeText(copyText);
    emit('copy', copyText);
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = copyText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    emit('copy', copyText);
  }

  hideActionMenu();
  clearSelection();
};

const handleShare = async () => {
  const bookName = props.book;
  const verseRef = selectedVerses.value.start === selectedVerses.value.end
    ? `${selectedVerses.value.start}절`
    : `${selectedVerses.value.start}-${selectedVerses.value.end}절`;
  const shareText = `${selectedText.value}\n\n- ${bookName} ${props.chapter}장 ${verseRef}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `${bookName} ${props.chapter}장 ${verseRef}`,
        text: shareText,
      });
    } catch {
      // User cancelled or error
    }
  } else {
    // Fallback: copy to clipboard
    await handleCopy();
  }

  hideActionMenu();
  clearSelection();
};

const clearSelection = () => {
  window.getSelection()?.removeAllRanges();
};

// 스크롤 위치 복원
const restoreScrollPosition = () => {
  if (props.initialScrollPosition && viewerRef.value) {
    const { scrollHeight, clientHeight } = viewerRef.value;
    const maxScroll = scrollHeight - clientHeight;
    viewerRef.value.scrollTop = props.initialScrollPosition * maxScroll;
  }
};

// 특정 절로 스크롤
const scrollToVerse = (verseNumber: number) => {
  if (!viewerRef.value) return;

  const verseEl = viewerRef.value.querySelector(`[data-verse="${verseNumber}"]`);
  if (verseEl) {
    verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

// 문서 클릭 시 메뉴 닫기
const handleDocumentClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.verse-action-menu')) {
    hideActionMenu();
  }
};

// 라이프사이클
onMounted(() => {
  document.addEventListener('click', handleDocumentClick);

  // 초기 스크롤 위치 복원 (컨텐츠 로드 후)
  nextTick(() => {
    restoreScrollPosition();
  });
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
});

// 컨텐츠 변경 시 스크롤 위치 복원
watch(() => props.content, () => {
  nextTick(() => {
    restoreScrollPosition();
  });
});

// expose
defineExpose({
  scrollToVerse,
  restoreScrollPosition,
});
</script>

<style scoped>
.bible-viewer {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  padding-bottom: 100px;
  font-family: var(--reading-font-family);
  font-size: var(--reading-font-size);
  font-weight: var(--reading-font-weight);
  line-height: var(--reading-line-height);
  text-align: var(--reading-text-align);
  transition: background-color 0.3s, color 0.3s;
}

/* 테마 */
.theme-light {
  background: var(--color-bg-primary, #faf8f6);
  color: var(--text-primary, #1f2937);
}

.theme-dark {
  background: var(--color-bg-primary-dark, #1a1a1a);
  color: var(--text-primary-dark, #e5e5e5);
}

/* 로딩 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border, #e5e7eb);
  border-top-color: var(--primary-color, #6366f1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-container p {
  color: var(--text-secondary, #6b7280);
  font-size: 0.875rem;
}

/* 성경 본문 */
.bible-content {
  word-break: keep-all;
  -webkit-user-select: text;
  user-select: text;
}

.bible-content :deep(p),
.bible-content :deep(.verse-line) {
  margin-bottom: 0.5em;
}

.bible-content :deep(.verse-num) {
  color: var(--primary-color, #6366f1);
  font-weight: 700;
  font-size: 0.75em;
  margin-right: 0.25em;
  vertical-align: super;
  cursor: pointer;
  transition: color 0.2s;
}

.bible-content :deep(.verse-num:hover) {
  color: var(--primary-dark, #4f46e5);
}

/* 절 연결 모드 */
.verse-joining .bible-content :deep(p),
.verse-joining .bible-content :deep(.verse-line) {
  display: inline;
}

.verse-joining .bible-content :deep(br) {
  display: none;
}

/* 섹션 제목 */
.bible-content :deep(.section-title),
.bible-content :deep(h3),
.bible-content :deep(h4) {
  font-weight: 600;
  margin: 1.5em 0 0.75em;
  color: var(--text-primary, #1f2937);
}

/* 에러 메시지 */
.bible-content :deep(.error-message) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-secondary, #6b7280);
}

.bible-content :deep(.error-message h3) {
  margin: 1rem 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

.bible-content :deep(.error-message p) {
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.bible-content :deep(.external-link) {
  padding: 0.75rem 1.5rem;
  background: var(--primary-color, #6366f1);
  color: white;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s;
}

.bible-content :deep(.external-link:hover) {
  background: var(--primary-dark, #4f46e5);
}

/* 액션 메뉴 */
.verse-action-menu {
  position: fixed;
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  background: var(--color-bg-card, #fff);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border-radius: 8px;
  color: var(--text-primary, #1f2937);
  font-size: 0.6875rem;
  transition: background 0.2s;
  min-width: 52px;
}

.action-button:hover {
  background: var(--color-bg-hover, #f3f4f6);
}

.action-button:active {
  background: var(--color-bg-active, #e5e7eb);
}

.action-button svg {
  color: var(--text-secondary, #6b7280);
}

/* 액션 메뉴 애니메이션 */
.action-menu-enter-active,
.action-menu-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.action-menu-enter-from,
.action-menu-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* iOS 안전영역 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .bible-viewer {
    padding-bottom: calc(100px + env(safe-area-inset-bottom));
  }
}

/* 다크모드 액션 메뉴 */
.theme-dark .verse-action-menu {
  background: var(--color-bg-card-dark, #2d2d2d);
}

.theme-dark .action-button {
  color: var(--text-primary-dark, #e5e5e5);
}

.theme-dark .action-button:hover {
  background: var(--color-bg-hover-dark, #3d3d3d);
}
</style>
