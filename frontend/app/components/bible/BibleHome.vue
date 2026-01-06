<template>
  <div class="bible-home">
    <header class="home-header">
      <h1>성경</h1>
      <button class="settings-btn" @click="$router.push('/bible/settings')">
        <SettingsIcon :size="20" />
      </button>
    </header>

    <div class="home-content">
      <!-- 계속 읽기 -->
      <section v-if="lastPosition" class="continue-section">
        <h2 class="section-title">계속 읽기</h2>
        <button class="continue-card" @click="$emit('continue-reading')">
          <div class="continue-info">
            <span class="book-name">{{ lastPosition.book_name }}</span>
            <span class="chapter">{{ lastPosition.chapter }}장</span>
          </div>
          <ArrowRightIcon :size="20" />
        </button>
      </section>

      <!-- 빠른 접근 -->
      <section class="quick-section">
        <h2 class="section-title">빠른 접근</h2>
        <div class="quick-grid">
          <button class="quick-btn" @click="$router.push('/bible/bookmarks')">
            <BookmarkIcon :size="20" />
            <span>북마크</span>
            <span class="count" v-if="bookmarkCount > 0">{{ bookmarkCount }}</span>
          </button>
          <button class="quick-btn" @click="$router.push('/bible/notes')">
            <DocumentIcon :size="20" />
            <span>묵상노트</span>
            <span class="count" v-if="noteCount > 0">{{ noteCount }}</span>
          </button>
          <button class="quick-btn" @click="$router.push('/bible/highlights')">
            <LayersIcon :size="20" />
            <span>하이라이트</span>
            <span class="count" v-if="highlightCount > 0">{{ highlightCount }}</span>
          </button>
          <button class="quick-btn" @click="$router.push('/bible/history')">
            <HistoryIcon :size="20" />
            <span>읽기 기록</span>
          </button>
        </div>
      </section>

      <!-- 최근 읽은 기록 -->
      <section v-if="recentRecords.length > 0" class="recent-section">
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
          <ListIcon :size="20" />
          성경 전체 목차
        </button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '~/composables/useApi';
import { useReadingPosition } from '~/composables/useReadingPosition';
import { useBibleData } from '~/composables/useBibleData';
import type { BiblePosition, RecentRecord } from '~/types/bible';

const router = useRouter();
const api = useApi();
const { loadReadingPosition, lastReadingPosition } = useReadingPosition();
const { getBookName } = useBibleData();

const emit = defineEmits<{
  (e: 'continue-reading'): void;
  (e: 'select-book', bookId: string, chapter: number): void;
  (e: 'show-toc'): void;
}>();

const lastPosition = ref<BiblePosition | null>(null);
const bookmarkCount = ref(0);
const noteCount = ref(0);
const highlightCount = ref(0);
const recentRecords = ref<RecentRecord[]>([]);

onMounted(async () => {
  // 마지막 읽기 위치 로드
  const lastPos = await loadReadingPosition();
  if (lastPos) {
    lastPosition.value = {
      book: lastPos.book,
      chapter: lastPos.chapter,
      book_name: getBookName(lastPos.book)
    };
  }

  // 카운트 및 최근 기록 로드
  try {
    const [bookmarksRes, notesRes, highlightsRes, recordsRes] = await Promise.all([
      api.get('/api/v1/todos/bible/bookmarks/'),
      api.get('/api/v1/todos/bible/notes/'),
      api.get('/api/v1/todos/bible/highlights/'),
      api.get('/api/v1/todos/bible/personal-records/?limit=5')
    ]);

    bookmarkCount.value = bookmarksRes.data?.length || 0;
    noteCount.value = notesRes.data?.length || 0;
    highlightCount.value = highlightsRes.data?.length || 0;

    if (recordsRes.data?.results) {
      recentRecords.value = recordsRes.data.results.map((r: any) => ({
        ...r,
        book_name: getBookName(r.book)
      }));
    }
  } catch (error) {
    console.error('홈 데이터 로드 실패:', error);
  }
});

const handleRecordClick = (record: RecentRecord) => {
  emit('select-book', record.book, record.chapter);
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

<style scoped>
.bible-home {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--background-color);
}

.home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--color-bg-card, #fff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  position: sticky;
  top: 0;
  z-index: 10;
}

.home-header h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary, #1f2937);
}

.settings-btn {
  padding: 0.5rem;
  color: var(--text-secondary, #6b7280);
  border-radius: 8px;
  transition: all 0.2s;
}

.settings-btn:hover {
  background: var(--color-bg-secondary, #f3f4f6);
  color: var(--text-primary, #1f2937);
}

.home-content {
  padding: 1rem;
}

/* 섹션 */
.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin-bottom: 0.75rem;
}

/* 계속 읽기 */
.continue-section {
  margin-bottom: 1.5rem;
}

.continue-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1rem 1.25rem;
  background: var(--primary-color, #6366f1);
  color: white;
  border-radius: 12px;
  transition: all 0.2s;
}

.continue-card:hover {
  background: var(--primary-dark, #4f46e5);
  transform: translateY(-1px);
}

.continue-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.continue-info .book-name {
  font-weight: 600;
  font-size: 1rem;
}

.continue-info .chapter {
  opacity: 0.9;
  font-size: 0.9375rem;
}

/* 빠른 접근 */
.quick-section {
  margin-bottom: 1.5rem;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.quick-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 0.75rem 0.5rem;
  background: var(--color-bg-card, #fff);
  border-radius: 10px;
  transition: all 0.2s;
  position: relative;
  border: 1px solid var(--color-border, #e5e7eb);
}

.quick-btn:hover {
  background: var(--color-bg-secondary, #f3f4f6);
}

.quick-btn svg {
  color: var(--primary-color, #6366f1);
}

.quick-btn span:not(.count) {
  font-size: 0.6875rem;
  color: var(--text-secondary, #6b7280);
}

.quick-btn .count {
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 0 0.375rem;
  min-width: 18px;
  height: 18px;
  background: var(--color-error, #ef4444);
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 최근 읽은 기록 */
.recent-section {
  margin-bottom: 1.5rem;
}

.recent-list {
  background: var(--color-bg-card, #fff);
  border-radius: 10px;
  border: 1px solid var(--color-border, #e5e7eb);
  overflow: hidden;
}

.recent-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.recent-list li:not(:last-child) {
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.recent-list li:hover {
  background: var(--color-bg-secondary, #f3f4f6);
}

.record-location {
  font-size: 0.9375rem;
  color: var(--text-primary, #1f2937);
}

.record-date {
  font-size: 0.75rem;
  color: var(--text-muted, #9ca3af);
}

/* 목차 바로가기 */
.toc-shortcut {
  margin-top: 1rem;
}

.toc-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem;
  background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 10px;
  font-size: 0.9375rem;
  color: var(--text-primary, #1f2937);
  transition: all 0.2s;
}

.toc-btn:hover {
  background: var(--color-bg-secondary, #f3f4f6);
}

.toc-btn svg {
  color: var(--primary-color, #6366f1);
}

/* 다크모드 */
:root.dark .home-header {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .quick-btn {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .quick-btn:hover {
  background: var(--color-bg-tertiary);
}

:root.dark .recent-list {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .recent-list li:not(:last-child) {
  border-color: var(--color-border);
}

:root.dark .recent-list li:hover {
  background: var(--color-bg-tertiary);
}

:root.dark .toc-btn {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .toc-btn:hover {
  background: var(--color-bg-tertiary);
}

/* 모바일 반응형 */
@media (max-width: 400px) {
  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .quick-btn {
    padding: 1rem;
  }

  .quick-btn span:not(.count) {
    font-size: 0.75rem;
  }
}
</style>
