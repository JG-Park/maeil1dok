<template>
  <div
    ref="viewerRef"
    class="bible-viewer"
    :class="[
      `theme-${effectiveTheme}`,
      {
        'verse-joining': settings.verseJoining,
        'hide-highlight-names': !settings.highlightNames
      }
    ]"
    :style="viewerStyle"
    @scroll="handleScroll"
  >
    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>성경을 불러오는 중...</p>
    </div>

    <!-- 성경 본문 -->
    <template v-else>
      <div
        class="bible-content"
        :class="{ 'verse-joining': settings.verseJoining }"
        @click="handleVerseClick"
        v-html="renderedContent"
      ></div>

      <!-- 본문 하단 슬롯 (읽음 표시 버튼 등) -->
      <slot name="bottom"></slot>
    </template>

    <!-- 절 클릭 복사 메뉴 -->
    <Transition name="copy-menu-fade">
      <div v-if="showCopyMenu" class="copy-menu" ref="copyMenuRef">
        <span class="copy-menu-label">
          {{ clickSelectedVerses.length === 1 ? '복사' : '구간 복사' }}
        </span>
        <div class="copy-menu-buttons">
          <template v-if="clickSelectedVerses.length === 1">
            <button class="copy-button" @click="handleClickCopy('includeLocation')">
              위치 포함
            </button>
            <span class="action-divider">|</span>
            <button class="copy-button" @click="handleClickCopy('numOnly')">
              절 번호만
            </button>
            <span class="action-divider">|</span>
            <button class="copy-button" @click="handleClickCopy('textOnly')">
              내용만
            </button>
          </template>
          <template v-else>
            <button class="copy-button" @click="handleClickCopy('includeLocationRange')">
              위치 포함
            </button>
            <span class="action-divider">|</span>
            <button class="copy-button" @click="handleClickCopy('excludeLocationRange')">
              절 번호만
            </button>
          </template>
          <button class="copy-button cancel" @click="clearClickSelection">
            <XMarkIcon :size="14" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- 텍스트 드래그 선택 액션 메뉴 (기존) -->
    <Teleport to="body">
      <Transition name="action-menu">
        <div
          v-if="showActionMenu"
          class="verse-action-menu"
          :style="actionMenuPosition"
          @click.stop
        >
          <button class="action-button" @click="handleBookmark">
            <BookmarkIcon :size="18" />
            <span>북마크</span>
          </button>
          <button class="action-button" @click="handleHighlight">
            <PenIcon :size="18" />
            <span>하이라이트</span>
          </button>
          <button class="action-button" @click="handleCopy">
            <CopyIcon :size="18" />
            <span>복사</span>
          </button>
          <button class="action-button" @click="handleShare">
            <ShareIcon :size="18" />
            <span>공유</span>
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useReadingSettingsStore, FONT_FAMILIES, FONT_WEIGHTS } from '~/stores/readingSettings';

interface Highlight {
  id: number;
  start_verse: number;
  end_verse: number;
  color: string;
  memo?: string;
}

interface Props {
  content: string;
  book: string;
  chapter: number;
  isLoading?: boolean;
  initialScrollPosition?: number;
  highlights?: Highlight[];
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  initialScrollPosition: 0,
  highlights: () => [],
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
const copyMenuRef = ref<HTMLElement | null>(null);

// 절 클릭 선택 상태 (reading.vue 방식)
const showCopyMenu = ref(false);
const clickSelectedStart = ref<number | null>(null);
const clickSelectedEnd = ref<number | null>(null);
const clickSelectedVerses = ref<Array<{ number: number; text: string }>>([]);

// 텍스트 드래그 선택 상태 (기존 방식)
const showActionMenu = ref(false);
const selectedVerses = ref({ start: 0, end: 0 });
const selectedText = ref('');
const actionMenuPosition = ref({ top: '0px', left: '0px' });

// 스타일 계산
const viewerStyle = computed(() => ({
  '--reading-font-family': FONT_FAMILIES[settings.value.fontFamily].css,
  '--reading-font-size': `${settings.value.fontSize}px`,
  '--reading-font-weight': FONT_WEIGHTS[settings.value.fontWeight],
  '--reading-line-height': settings.value.lineHeight,
  '--reading-text-align': settings.value.textAlign,
}));

// 특정 절의 하이라이트 찾기
const getHighlightForVerse = (verseNum: number): Highlight | undefined => {
  return props.highlights.find(
    h => verseNum >= h.start_verse && verseNum <= h.end_verse
  );
};

// 본문 렌더링 (절 번호에 data-verse 속성 추가 + 하이라이트 적용)
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

  // 하이라이트가 있으면 절에 배경색 적용
  if (props.highlights.length > 0) {
    // .verse 요소에 하이라이트 적용 (verse-number에서 절 번호 추출)
    content = content.replace(
      /<div class="verse"><span class="verse-number">(\d+)<\/span>/g,
      (match, verseNum) => {
        const highlight = getHighlightForVerse(parseInt(verseNum));
        if (highlight) {
          return `<div class="verse highlighted" data-highlight-id="${highlight.id}" style="background-color: ${highlight.color}"><span class="verse-number">${verseNum}</span>`;
        }
        return match;
      }
    );
  }

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

// ====== 절 클릭 선택 기능 (reading.vue 방식) ======

// 절 하이라이트 해제
const clearVerseHighlight = () => {
  if (!viewerRef.value) return;
  viewerRef.value.querySelectorAll('.verse.selected-verse')
    .forEach(el => el.classList.remove('selected-verse'));
};

// 절 클릭 선택 초기화
const clearClickSelection = () => {
  showCopyMenu.value = false;
  clearVerseHighlight();
  clickSelectedVerses.value = [];
  clickSelectedStart.value = null;
  clickSelectedEnd.value = null;
};

// 절 하이라이트 적용
const highlightVerses = (start: number, end: number) => {
  if (!viewerRef.value) return;
  viewerRef.value.querySelectorAll('.verse').forEach((el) => {
    const numEl = el.querySelector('.verse-number');
    if (!numEl) return;
    const n = parseInt(numEl.textContent?.trim() || '0', 10);
    if (n >= start && n <= end) {
      el.classList.add('selected-verse');
    } else {
      el.classList.remove('selected-verse');
    }
  });
};

// 복사 텍스트 생성
const getCopyText = (type: string): string => {
  if (!clickSelectedVerses.value.length) return '';
  const bookName = props.book;
  const chapter = props.chapter;

  if (clickSelectedVerses.value.length === 1) {
    const { number, text } = clickSelectedVerses.value[0];
    if (type === 'includeLocation') {
      return `[${bookName}${chapter}:${number}] ${text}`;
    } else if (type === 'numOnly') {
      return `${number} ${text}`;
    } else if (type === 'textOnly') {
      return text;
    }
  } else {
    const start = clickSelectedVerses.value[0].number;
    const end = clickSelectedVerses.value[clickSelectedVerses.value.length - 1].number;
    const versesTexts = clickSelectedVerses.value.map(v => `${v.number} ${v.text}`);
    if (type === 'includeLocationRange') {
      return `[${bookName}${chapter}:${start}-${end}]\n${versesTexts.join('\n')}`;
    } else if (type === 'excludeLocationRange') {
      return versesTexts.join('\n');
    }
  }
  return '';
};

// 절 클릭 복사 핸들러
const handleClickCopy = async (type: string) => {
  const text = getCopyText(type);
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    emit('copy', text);
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    emit('copy', text);
  }

  clearClickSelection();
};

// 절 클릭 핸들러
const handleVerseClick = (event: MouseEvent | TouchEvent) => {
  const target = event.target as HTMLElement;
  const verseEl = target.closest('.verse');
  if (!verseEl) return;

  event.stopPropagation();

  const numEl = verseEl.querySelector('.verse-number');
  const textEl = verseEl.querySelector('.verse-text');
  if (!numEl || !textEl) return;

  const num = parseInt(numEl.textContent?.trim() || '0', 10);
  const txt = textEl.textContent?.trim() || '';

  // 단일 절 선택 상태에서 같은 절을 다시 클릭하면 해제
  if (
    clickSelectedStart.value !== null &&
    clickSelectedEnd.value === null &&
    clickSelectedStart.value === num &&
    clickSelectedVerses.value.length === 1
  ) {
    showCopyMenu.value = false;
    setTimeout(() => {
      clearClickSelection();
    }, 250);
    return;
  }

  if (clickSelectedStart.value === null) {
    // 시작점 설정
    clearClickSelection();
    clickSelectedStart.value = num;
    clickSelectedVerses.value = [{ number: num, text: txt }];
    highlightVerses(num, num);
    showCopyMenu.value = true;
  } else if (clickSelectedEnd.value === null) {
    // 끝점 설정 및 범위 선택
    clickSelectedEnd.value = num;
    const start = Math.min(clickSelectedStart.value, clickSelectedEnd.value);
    const end = Math.max(clickSelectedStart.value, clickSelectedEnd.value);
    highlightVerses(start, end);

    // 선택 구간의 number/text 저장
    const versesArray: Array<{ number: number; text: string }> = [];
    if (viewerRef.value) {
      viewerRef.value.querySelectorAll('.verse').forEach((el) => {
        const nEl = el.querySelector('.verse-number');
        const tEl = el.querySelector('.verse-text');
        if (!nEl || !tEl) return;
        const n = parseInt(nEl.textContent?.trim() || '0', 10);
        if (n >= start && n <= end) {
          versesArray.push({
            number: n,
            text: tEl.textContent?.trim() || ''
          });
        }
      });
    }
    clickSelectedVerses.value = versesArray;
    showCopyMenu.value = true;
  } else {
    // 재선택: 메뉴를 닫고 새로 열기
    clearClickSelection();
    showCopyMenu.value = false;
    setTimeout(() => {
      clickSelectedStart.value = num;
      clickSelectedVerses.value = [{ number: num, text: txt }];
      highlightVerses(num, num);
      showCopyMenu.value = true;
    }, 250);
  }
};

// ====== 텍스트 드래그 선택 기능 (기존) ======

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

  // 텍스트 드래그 선택 메뉴 닫기
  if (!target.closest('.verse-action-menu')) {
    hideActionMenu();
  }

  // 절 클릭 복사 메뉴 닫기 (메뉴 외부 클릭 시)
  if (showCopyMenu.value && !target.closest('.copy-menu') && !target.closest('.verse')) {
    clearClickSelection();
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
  // 선택 상태 정리
  clearClickSelection();
});

// 컨텐츠 변경 시 스크롤 위치 복원 및 선택 상태 초기화
watch(() => props.content, () => {
  // 컨텐츠 변경 시 선택 상태 초기화
  clearClickSelection();
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
  background: var(--color-bg-primary, #f9fafb);
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
  font-family: var(--reading-font-family, "RIDIBatang", serif);
  font-size: var(--reading-font-size, 16px);
  font-weight: var(--reading-font-weight, 400);
  line-height: var(--reading-line-height, 1.8);
  text-align: var(--reading-text-align, left);
}

/* 절 스타일 (reading.vue 동일) */
.bible-content :deep(.verse) {
  display: flex;
  align-items: flex-start;
  font-family: var(--reading-font-family, "RIDIBatang", serif);
  letter-spacing: -0.02em;
  font-weight: var(--reading-font-weight, normal);
  transition: background-color 0.3s ease-in-out;
  padding: 0.25rem 0.35rem;
  border-radius: 8px;
}

/* 절 번호 스타일 (reading.vue 동일) */
.bible-content :deep(.verse-number) {
  color: var(--verse-number-color, #999999);
  font-weight: 500;
  margin-right: 0.3rem;
  min-width: 0.8em;
  flex-shrink: 0;
  text-align: right;
  font-size: 0.75em;
  font-family: "Pretendard", sans-serif;
  position: relative;
  line-height: 2;
}

/* 절 본문 스타일 */
.bible-content :deep(.verse-text) {
  flex: 1;
}

/* 하이라이트된 절 스타일 */
.bible-content :deep(.verse.highlighted) {
  border-radius: 6px;
  margin: 0.125rem 0;
  position: relative;
}

.bible-content :deep(.verse.highlighted)::before {
  content: '';
  position: absolute;
  left: -4px;
  top: 0;
  bottom: 0;
  width: 3px;
  background: currentColor;
  border-radius: 2px;
  opacity: 0.4;
}

/* 다크모드에서 하이라이트 투명도 조정 */
.theme-dark .bible-content :deep(.verse.highlighted) {
  opacity: 0.85;
}

/* 인명/지명 강조 스타일 (reading.vue 동일) */
.bible-content :deep(.bible-name) {
  color: var(--highlight-name-color, #7c5a3c);
  cursor: pointer;
  text-decoration-line: underline;
  text-decoration-style: dotted;
  text-decoration-color: currentColor;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
  transition: all 0.15s ease;
}

.bible-content :deep(.bible-name:hover) {
  text-decoration-style: solid;
  opacity: 0.8;
}

.bible-content :deep(.bible-name:active) {
  opacity: 0.6;
}

.bible-content :deep(.bible-area) {
  color: var(--highlight-place-color, #5a6e54);
  cursor: pointer;
  text-decoration-line: underline;
  text-decoration-style: dotted;
  text-decoration-color: currentColor;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
  transition: all 0.15s ease;
}

.bible-content :deep(.bible-area:hover) {
  text-decoration-style: solid;
  opacity: 0.8;
}

.bible-content :deep(.bible-area:active) {
  opacity: 0.6;
}

/* 인명/지명 강조 비활성화 */
.hide-highlight-names .bible-content :deep(.bible-name),
.hide-highlight-names .bible-content :deep(.bible-area) {
  color: inherit;
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
.verse-joining .bible-content :deep(.verse-line),
.bible-content.verse-joining :deep(p),
.bible-content.verse-joining :deep(.verse-line) {
  display: inline;
}

.verse-joining .bible-content :deep(br),
.bible-content.verse-joining :deep(br) {
  display: none;
}

/* 절 붙임 모드에서 절 스타일 */
.bible-content.verse-joining :deep(.verse),
.bible-content.verse-joining :deep(.verse-group) {
  display: inline;
  padding: 0;
}

.bible-content.verse-joining :deep(.verse-number) {
  display: inline;
  font-size: 0.65em;
  vertical-align: super;
  margin: 0 0.1em;
  min-width: auto;
  text-align: left;
  line-height: 1;
}

.bible-content.verse-joining :deep(.verse-text) {
  display: inline;
}

.bible-content.verse-joining :deep(.verse-text)::after {
  content: " ";
}

/* 섹션 타이틀에서 단락 분리 */
.bible-content.verse-joining :deep(.section-title),
.bible-content.verse-joining :deep(h3),
.bible-content.verse-joining :deep(h4) {
  display: block;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

/* 섹션 제목 (reading.vue 동일) */
.bible-content :deep(.section-title),
.bible-content :deep(h3),
.bible-content :deep(h4) {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--section-title-color, #4a5d4a);
  margin: 2rem 0 0.25rem;
  text-align: center;
}

.bible-content :deep(.section-title:first-child),
.bible-content :deep(h3:first-child),
.bible-content :deep(h4:first-child) {
  margin-top: 0;
}

/* 섹션 제목 내 참조 */
.bible-content :deep(.section-title .reference),
.bible-content :deep(h3 .reference),
.bible-content :deep(h4 .reference) {
  font-size: 0.75em;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  margin-left: 0.25rem;
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
  /* 시스템 폰트 강제 적용 */
  font-family: "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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

/* 다크모드 인명/지명 색상 */
.theme-dark .bible-content :deep(.bible-name) {
  color: var(--highlight-name-color-dark, #c9a67a);
}

.theme-dark .bible-content :deep(.bible-area) {
  color: var(--highlight-place-color-dark, #9cb094);
}

/* 다크모드 섹션 제목 색상 */
.theme-dark .bible-content :deep(.section-title),
.theme-dark .bible-content :deep(h3),
.theme-dark .bible-content :deep(h4) {
  color: var(--section-title-color-dark, #8ba888);
}

/* 다크모드 절 번호 색상 */
.theme-dark .bible-content :deep(.verse-number) {
  color: var(--verse-number-color-dark, #666666);
}

/* ====== 절 클릭 선택 스타일 ====== */

/* 선택된 절 하이라이트 */
.bible-content :deep(.verse.selected-verse) {
  background-color: rgba(99, 102, 241, 0.12) !important;
  transition: background-color 0.2s ease;
  border-radius: 8px;
}

.theme-dark .bible-content :deep(.verse.selected-verse) {
  background-color: rgba(99, 102, 241, 0.2) !important;
}

/* 절 hover 효과 */
.bible-content :deep(.verse:hover) {
  background-color: rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 8px;
}

.theme-dark .bible-content :deep(.verse:hover) {
  background-color: rgba(255, 255, 255, 0.06);
}

/* 터치 디바이스에서는 hover 배경색 비활성화 */
@media (hover: none) and (pointer: coarse) {
  .bible-content :deep(.verse:hover):not(.selected-verse) {
    background-color: inherit !important;
  }
}

@supports (-webkit-touch-callout: none) {
  @media (hover: none) {
    .bible-content :deep(.verse:hover):not(.selected-verse) {
      background-color: inherit !important;
    }
  }
}

/* 복사 메뉴 */
.copy-menu {
  position: fixed;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-bg-card, #fff);
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--color-border, #e5e7eb);
  min-width: 200px;
  width: max-content;
  max-width: 95vw;
  gap: 0.75rem;
  /* 시스템 폰트 강제 적용 (본문 폰트 상속 방지) */
  font-family: "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.theme-dark .copy-menu {
  background: var(--color-bg-card-dark, #2d2d2d);
  border-color: var(--color-border-dark, #404040);
}

.copy-menu-label {
  font-size: 0.875rem;
  color: var(--primary-color, #6366f1);
  font-weight: 600;
  white-space: nowrap;
}

.copy-menu-buttons {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.copy-button {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.25rem 0.5rem;
  border: none;
  background: none;
  color: var(--text-secondary, #6b7280);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.copy-button:hover {
  color: var(--text-primary, #1f2937);
}

.theme-dark .copy-button {
  color: var(--text-secondary-dark, #9ca3af);
}

.theme-dark .copy-button:hover {
  color: var(--text-primary-dark, #e5e5e5);
}

.copy-button.cancel {
  color: #dc2626;
  padding: 0.25rem;
}

.copy-button.cancel:hover {
  color: #b91c1c;
}

.action-divider {
  color: var(--color-border, #d1d5db);
  font-size: 0.75rem;
}

/* 복사 메뉴 애니메이션 */
.copy-menu-fade-enter-active,
.copy-menu-fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.copy-menu-fade-enter-from,
.copy-menu-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(16px) scale(0.98);
}

.copy-menu-fade-enter-to,
.copy-menu-fade-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}
</style>
