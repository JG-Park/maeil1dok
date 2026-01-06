# Task 4-3: 기본 진입점 설정

> **Phase**: 4 - 설정 및 마무리
> **상태**: ⬜ 대기
> **의존성**: Task 4-2 완료 필요

---

## 목표

- `/bible` 기본 진입점 동작 구현
- 설정에 따른 3가지 진입 모드
- 홈/대시보드 뷰 구현

---

## 서브태스크

### 4.3.1 진입점 로직 구현
- [ ] `defaultEntryPoint` 설정 읽기
- [ ] 설정에 따른 분기 처리
- [ ] URL에 book/chapter가 있으면 해당 위치로 직접 이동

### 4.3.2 마지막 위치 모드 (기본)
- [ ] API에서 마지막 위치 조회
- [ ] 자동으로 해당 위치로 이동
- [ ] 위치 없으면 창세기 1장

### 4.3.3 홈/대시보드 모드
- [ ] `BibleHome.vue` 컴포넌트 구현
- [ ] 최근 읽은 기록 표시
- [ ] 북마크 미리보기
- [ ] 묵상노트 미리보기
- [ ] "계속 읽기" 버튼

### 4.3.4 성경 목차 모드
- [ ] `BibleTOC.vue` 컴포넌트 구현
- [ ] 66권 목록 표시
- [ ] 구약/신약 탭
- [ ] 책 클릭 시 해당 책 1장으로 이동

---

## 구현 상세

### /bible/index.vue 진입점 로직

```vue
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useReadingSettingsStore } from '~/stores/readingSettings';
import { useReadingPosition } from '~/composables/useReadingPosition';

const route = useRoute();
const router = useRouter();
const settingsStore = useReadingSettingsStore();
const { fetchLastPosition } = useReadingPosition();

// 현재 뷰 모드
const viewMode = ref<'reader' | 'home' | 'toc'>('reader');

// 성경 뷰어 상태
const currentBook = ref('gen');
const currentChapter = ref(1);
const currentVersion = ref('GAE');

// 초기화
onMounted(async () => {
  // URL에 명시적인 위치가 있으면 바로 뷰어로
  if (route.query.book || route.query.chapter || route.query.plan) {
    viewMode.value = 'reader';
    currentBook.value = (route.query.book as string) || 'gen';
    currentChapter.value = parseInt(route.query.chapter as string) || 1;
    return;
  }

  // 설정에 따른 진입점
  const entryPoint = settingsStore.settings.defaultEntryPoint || 'last-position';

  switch (entryPoint) {
    case 'last-position':
      await handleLastPositionEntry();
      break;
    case 'home':
      viewMode.value = 'home';
      break;
    case 'toc':
      viewMode.value = 'toc';
      break;
  }
});

// 마지막 위치로 진입
const handleLastPositionEntry = async () => {
  const lastPos = await fetchLastPosition();

  if (lastPos) {
    currentBook.value = lastPos.book;
    currentChapter.value = lastPos.chapter;
    currentVersion.value = lastPos.version;
  }
  // 없으면 기본값 (창세기 1장) 유지

  viewMode.value = 'reader';
};

// 홈에서 계속 읽기 클릭
const handleContinueReading = async () => {
  await handleLastPositionEntry();
};

// 목차에서 책 선택
const handleBookSelect = (bookId: string) => {
  currentBook.value = bookId;
  currentChapter.value = 1;
  viewMode.value = 'reader';

  // URL 업데이트
  router.replace({
    query: { book: bookId, chapter: 1 }
  });
};
</script>

<template>
  <div class="bible-page">
    <!-- 홈/대시보드 -->
    <BibleHome
      v-if="viewMode === 'home'"
      @continue-reading="handleContinueReading"
      @select-book="handleBookSelect"
    />

    <!-- 목차 -->
    <BibleTOC
      v-else-if="viewMode === 'toc'"
      @select-book="handleBookSelect"
    />

    <!-- 뷰어 -->
    <BibleViewer
      v-else
      :book="currentBook"
      :chapter="currentChapter"
      :version="currentVersion"
      @change="handleViewerChange"
    />
  </div>
</template>
```

### BibleHome.vue (대시보드)

```vue
<template>
  <div class="bible-home">
    <header class="home-header">
      <h1>성경</h1>
      <button class="settings-btn" @click="$router.push('/bible/settings')">
        <i class="fa-solid fa-gear" />
      </button>
    </header>

    <!-- 계속 읽기 -->
    <section class="continue-section" v-if="lastPosition">
      <h2 class="section-title">계속 읽기</h2>
      <button class="continue-card" @click="$emit('continue-reading')">
        <div class="continue-info">
          <span class="book-name">{{ lastPosition.book_name }}</span>
          <span class="chapter">{{ lastPosition.chapter }}장</span>
        </div>
        <i class="fa-solid fa-arrow-right" />
      </button>
    </section>

    <!-- 빠른 접근 -->
    <section class="quick-section">
      <h2 class="section-title">빠른 접근</h2>
      <div class="quick-grid">
        <button class="quick-btn" @click="$router.push('/bible/bookmarks')">
          <i class="fa-solid fa-bookmark" />
          <span>북마크</span>
          <span class="count">{{ bookmarkCount }}</span>
        </button>
        <button class="quick-btn" @click="$router.push('/bible/notes')">
          <i class="fa-solid fa-note-sticky" />
          <span>묵상노트</span>
          <span class="count">{{ noteCount }}</span>
        </button>
        <button class="quick-btn" @click="$router.push('/bible/highlights')">
          <i class="fa-solid fa-highlighter" />
          <span>하이라이트</span>
          <span class="count">{{ highlightCount }}</span>
        </button>
        <button class="quick-btn" @click="$router.push('/bible/history')">
          <i class="fa-solid fa-chart-line" />
          <span>읽기 기록</span>
        </button>
      </div>
    </section>

    <!-- 최근 읽은 기록 -->
    <section class="recent-section" v-if="recentRecords.length">
      <h2 class="section-title">최근 읽은 성경</h2>
      <ul class="recent-list">
        <li
          v-for="record in recentRecords"
          :key="`${record.book}-${record.chapter}`"
          @click="handleRecordClick(record)"
        >
          <span class="record-location">
            {{ record.book_name }} {{ record.chapter }}장
          </span>
          <span class="record-date">
            {{ formatDate(record.read_date) }}
          </span>
        </li>
      </ul>
    </section>

    <!-- 성경 전체 보기 -->
    <section class="toc-shortcut">
      <button class="toc-btn" @click="$emit('show-toc')">
        <i class="fa-solid fa-list" />
        성경 전체 목차
      </button>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '~/composables/useApi';
import { useReadingPosition } from '~/composables/useReadingPosition';
import { useBibleData } from '~/composables/useBibleData';

const router = useRouter();
const api = useApi();
const { fetchLastPosition, lastPosition } = useReadingPosition();
const { getBookName } = useBibleData();

const emit = defineEmits(['continue-reading', 'select-book', 'show-toc']);

const bookmarkCount = ref(0);
const noteCount = ref(0);
const highlightCount = ref(0);
const recentRecords = ref([]);

onMounted(async () => {
  await fetchLastPosition();

  // 카운트 로드
  try {
    const [bookmarks, notes, highlights, records] = await Promise.all([
      api.get('/api/v1/bible/bookmarks/'),
      api.get('/api/v1/bible/notes/'),
      api.get('/api/v1/bible/highlights/'),
      api.get('/api/v1/bible/personal-records/?limit=5')
    ]);

    bookmarkCount.value = bookmarks.data.length;
    noteCount.value = notes.data.length;
    highlightCount.value = highlights.data.length;
    recentRecords.value = records.data.map(r => ({
      ...r,
      book_name: getBookName(r.book)
    }));
  } catch (error) {
    console.error('홈 데이터 로드 실패:', error);
  }
});

const handleRecordClick = (record: any) => {
  emit('select-book', record.book);
  // 해당 장으로 이동하려면 추가 처리 필요
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const diff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return '오늘';
  if (diff === 1) return '어제';
  if (diff < 7) return `${diff}일 전`;

  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
};
</script>
```

### BibleTOC.vue (목차)

```vue
<template>
  <div class="bible-toc">
    <header class="toc-header">
      <button class="back-btn" @click="$router.back()">
        <i class="fa-solid fa-chevron-left" />
      </button>
      <h1>성경 목차</h1>
    </header>

    <!-- 탭 -->
    <div class="testament-tabs">
      <button
        :class="{ active: activeTab === 'old' }"
        @click="activeTab = 'old'"
      >
        구약 (39권)
      </button>
      <button
        :class="{ active: activeTab === 'new' }"
        @click="activeTab = 'new'"
      >
        신약 (27권)
      </button>
    </div>

    <!-- 책 목록 -->
    <div class="books-list">
      <button
        v-for="book in currentBooks"
        :key="book.id"
        class="book-item"
        @click="$emit('select-book', book.id)"
      >
        <span class="book-name">{{ book.name }}</span>
        <span class="book-chapters">{{ book.chapters }}장</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useBibleData } from '~/composables/useBibleData';

const emit = defineEmits(['select-book']);

const { bibleBooks } = useBibleData();

const activeTab = ref<'old' | 'new'>('old');

const currentBooks = computed(() => {
  return activeTab.value === 'old' ? bibleBooks.old : bibleBooks.new;
});
</script>

<style scoped>
.bible-toc {
  min-height: 100vh;
  background: var(--color-bg-primary);
}

.toc-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
}

.testament-tabs {
  display: flex;
  padding: 0.5rem 1rem;
  gap: 0.5rem;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
}

.testament-tabs button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  border-radius: 8px;
  cursor: pointer;
}

.testament-tabs button.active {
  background: var(--color-primary);
  color: white;
}

.books-list {
  padding: 0.5rem;
}

.book-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 1rem;
  background: var(--color-bg-card);
  border: none;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.book-item:hover {
  background: var(--color-bg-secondary);
}

.book-name {
  font-weight: 500;
}

.book-chapters {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}
</style>
```

---

## 테스트 체크리스트

### 빌드 테스트
- [ ] `npm run build` 성공

### 기능 테스트 (Chrome DevTools MCP)

**마지막 위치 모드:**
- [ ] 설정에서 "마지막 읽던 위치" 선택
- [ ] `/bible` 접속
- [ ] 마지막 읽던 위치로 자동 이동

**홈 모드:**
- [ ] 설정에서 "홈 (대시보드)" 선택
- [ ] `/bible` 접속
- [ ] 홈 화면 표시
- [ ] "계속 읽기" 버튼 동작
- [ ] 빠른 접근 버튼들 동작
- [ ] 최근 읽은 기록 표시

**목차 모드:**
- [ ] 설정에서 "성경 목차" 선택
- [ ] `/bible` 접속
- [ ] 목차 화면 표시
- [ ] 구약/신약 탭 전환
- [ ] 책 클릭 시 해당 책으로 이동

**URL 직접 접근:**
- [ ] `/bible?book=mat&chapter=5` 접속
- [ ] 설정과 관계없이 해당 위치로 직접 이동

---

## 완료 기준

1. 3가지 진입점 모드 동작
2. 홈 대시보드 UI 완성
3. 목차 UI 완성
4. URL 직접 접근 정상
5. 빌드 성공

---

## 완료 정보

- **완료일**: -
- **커밋**: -
- **비고**: -
