# Task 2-1: 성경 뷰어 컴포넌트 완성

> **Phase**: 2 - 핵심 기능
> **상태**: ⬜ 대기
> **의존성**: Task 1-2, Task 1-3 완료 필요

---

## 목표

- `BibleViewer.vue` 핵심 컴포넌트 완성
- 성경 본문 표시, 스크롤, 폰트 설정 등 핵심 UX 구현
- 절 선택 기능 (하이라이트/북마크용 준비)

---

## 서브태스크

### 2.1.1 BibleViewer 컴포넌트 구현
- [ ] 성경 본문 렌더링 (HTML 파싱)
- [ ] 절 번호 표시 옵션
- [ ] 폰트 크기/줄간격 적용
- [ ] 스크롤 위치 저장/복원

### 2.1.2 절 선택 기능
- [ ] 절 텍스트 선택 시 액션 메뉴 표시
- [ ] 액션 메뉴: 북마크, 하이라이트, 복사, 공유
- [ ] 선택 범위 (시작 절 ~ 끝 절) 추적

### 2.1.3 읽기 설정 연동
- [ ] `useReadingSettings` store 연동
- [ ] 실시간 설정 변경 반영
- [ ] 테마 (라이트/다크/세피아) 적용

### 2.1.4 성능 최적화
- [ ] 긴 장 (시편 119편 등) 렌더링 최적화
- [ ] 스크롤 이벤트 throttle
- [ ] 이미지/미디어 lazy loading

---

## 구현 상세

### BibleViewer.vue

```vue
<template>
  <div
    class="bible-viewer"
    :class="[`theme-${theme}`, `font-${fontFamily}`]"
    :style="viewerStyle"
    ref="viewerRef"
    @scroll="handleScroll"
  >
    <div class="bible-content" v-html="renderedContent" />

    <!-- 절 선택 액션 메뉴 -->
    <Teleport to="body">
      <div
        v-if="showActionMenu"
        class="verse-action-menu"
        :style="actionMenuPosition"
      >
        <button @click="handleBookmark">
          <i class="fa-regular fa-bookmark" /> 북마크
        </button>
        <button @click="handleHighlight">
          <i class="fa-solid fa-highlighter" /> 하이라이트
        </button>
        <button @click="handleCopy">
          <i class="fa-regular fa-copy" /> 복사
        </button>
        <button @click="handleShare">
          <i class="fa-solid fa-share-nodes" /> 공유
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useReadingSettingsStore } from '~/stores/readingSettings';

const props = defineProps<{
  content: string;
  book: string;
  chapter: number;
  isLoading: boolean;
  initialScrollPosition?: number;
}>();

const emit = defineEmits([
  'scroll',
  'verse-select',
  'bookmark',
  'highlight',
  'copy',
  'share'
]);

const settingsStore = useReadingSettingsStore();
const viewerRef = ref<HTMLElement | null>(null);

// 설정
const theme = computed(() => settingsStore.settings.theme || 'light');
const fontFamily = computed(() => settingsStore.settings.fontFamily || 'system');
const fontSize = computed(() => settingsStore.settings.fontSize || 16);
const lineHeight = computed(() => settingsStore.settings.lineHeight || 1.8);

// 스타일
const viewerStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  lineHeight: lineHeight.value
}));

// 절 선택
const showActionMenu = ref(false);
const selectedVerses = ref({ start: 0, end: 0 });
const actionMenuPosition = ref({ top: '0px', left: '0px' });

// 본문 렌더링 (절 번호 클릭 가능하게)
const renderedContent = computed(() => {
  // 절 번호에 data-verse 속성 추가
  return props.content.replace(
    /<sup>(\d+)<\/sup>/g,
    '<sup class="verse-num" data-verse="$1">$1</sup>'
  );
});

// 스크롤 핸들러 (throttle 적용)
let scrollTimeout: NodeJS.Timeout;
const handleScroll = () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    if (viewerRef.value) {
      const { scrollTop, scrollHeight, clientHeight } = viewerRef.value;
      const position = scrollTop / (scrollHeight - clientHeight);
      emit('scroll', position);
    }
  }, 100);
};

// 초기 스크롤 위치 복원
onMounted(() => {
  if (props.initialScrollPosition && viewerRef.value) {
    const { scrollHeight, clientHeight } = viewerRef.value;
    viewerRef.value.scrollTop = props.initialScrollPosition * (scrollHeight - clientHeight);
  }
});
</script>
```

### 테마 스타일

```css
.bible-viewer {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* 라이트 테마 */
.theme-light {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

/* 다크 테마 */
.theme-dark {
  background: #1a1a1a;
  color: #e0e0e0;
}

/* 세피아 테마 */
.theme-sepia {
  background: #f4ecd8;
  color: #5c4b37;
}

/* 폰트 패밀리 */
.font-system { font-family: system-ui, sans-serif; }
.font-nanum-myeongjo { font-family: 'Nanum Myeongjo', serif; }
.font-nanum-gothic { font-family: 'Nanum Gothic', sans-serif; }
```

---

## 테스트 체크리스트

### 빌드 테스트
- [ ] `npm run build` 성공

### 기능 테스트 (Chrome DevTools MCP)
- [ ] 성경 본문 정상 표시
- [ ] 절 번호 표시
- [ ] 폰트 크기 변경 반영
- [ ] 줄간격 변경 반영
- [ ] 테마 변경 (라이트/다크/세피아)
- [ ] 스크롤 위치 저장
- [ ] 스크롤 위치 복원
- [ ] 절 선택 시 액션 메뉴 표시
- [ ] 긴 장 (시편 119편) 렌더링 성능

---

## 완료 기준

1. 성경 본문 정상 렌더링
2. 읽기 설정 실시간 반영
3. 절 선택 기능 동작
4. 스크롤 위치 저장/복원
5. 빌드 성공

---

## 완료 정보

- **완료일**: -
- **커밋**: -
- **비고**: -
