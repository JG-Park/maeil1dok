<template>
  <div class="highlights-page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <h1>하이라이트</h1>
    </header>

    <!-- 로딩 -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>하이라이트를 불러오는 중...</p>
    </div>

    <!-- 로그인 필요 -->
    <div v-else-if="!authStore.isAuthenticated" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p>로그인 후 하이라이트를 확인할 수 있습니다</p>
      <NuxtLink to="/login" class="login-btn">로그인</NuxtLink>
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="highlights.length === 0" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p>저장된 하이라이트가 없습니다</p>
      <span class="empty-hint">성경을 읽으며 중요한 구절에 하이라이트를 추가해보세요</span>
    </div>

    <!-- 하이라이트 목록 -->
    <ul v-else class="highlight-list">
      <li
        v-for="highlight in highlights"
        :key="highlight.id"
        class="highlight-item"
        @click="goToHighlight(highlight)"
      >
        <div class="highlight-color" :style="{ background: highlight.color || '#FEF3C7' }"></div>
        <div class="highlight-content">
          <div class="highlight-location">
            {{ highlight.book_name || highlight.book }}
            {{ formatLocation(highlight) }}
          </div>
          <div v-if="highlight.memo" class="highlight-memo">
            {{ highlight.memo }}
          </div>
          <div class="highlight-date">
            {{ formatDate(highlight.created_at) }}
          </div>
        </div>
        <button class="delete-btn" @click.stop="handleDelete(highlight)" title="삭제">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </li>
    </ul>

    <!-- 토스트 -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useHighlight, type Highlight } from '~/composables/useHighlight';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';
import Toast from '~/components/Toast.vue';

definePageMeta({
  layout: 'default'
});

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const { fetchHighlights, deleteHighlight: removeHighlight, highlights: highlightState } = useHighlight();

const highlights = ref<Highlight[]>([]);
const isLoading = ref(true);

onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      await fetchHighlights();
      highlights.value = highlightState.value;
    } catch (error) {
      console.error('하이라이트 로드 실패:', error);
      toast.error('하이라이트를 불러오는데 실패했습니다');
    }
  }
  isLoading.value = false;
});

const formatLocation = (highlight: Highlight): string => {
  if (highlight.start_verse && highlight.end_verse) {
    if (highlight.start_verse !== highlight.end_verse) {
      return `${highlight.chapter}:${highlight.start_verse}-${highlight.end_verse}`;
    }
    return `${highlight.chapter}:${highlight.start_verse}`;
  }
  return `${highlight.chapter}장`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
};

const goToHighlight = (highlight: Highlight) => {
  const query: Record<string, string> = {
    book: highlight.book,
    chapter: String(highlight.chapter),
    verse: String(highlight.start_verse)
  };

  router.push({ path: '/bible', query });
};

const handleDelete = async (highlight: Highlight) => {
  if (!confirm('이 하이라이트를 삭제하시겠습니까?')) return;

  try {
    const success = await removeHighlight(highlight.id);
    if (success) {
      highlights.value = highlights.value.filter(h => h.id !== highlight.id);
      toast.success('하이라이트가 삭제되었습니다');
    } else {
      toast.error('하이라이트 삭제에 실패했습니다');
    }
  } catch (error) {
    console.error('하이라이트 삭제 실패:', error);
    toast.error('하이라이트 삭제에 실패했습니다');
  }
};
</script>

<style scoped>
.highlights-page {
  max-width: 768px;
  margin: 0 auto;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-bg-primary, #f9fafb);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-card, #fff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  padding: 0.5rem;
  margin: -0.5rem;
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
}

.back-btn:hover {
  background: var(--color-bg-hover, #f3f4f6);
}

.page-header h1 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

/* 로딩 상태 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 60px);
  padding: 2rem;
  color: var(--text-secondary, #6b7280);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border, #e5e7eb);
  border-top-color: var(--primary-color, #6366f1);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 60px);
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary, #6b7280);
}

.empty-state svg {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  font-size: 0.9375rem;
  margin-bottom: 0.5rem;
}

.empty-hint {
  font-size: 0.8125rem;
  opacity: 0.7;
}

.login-btn {
  margin-top: 1rem;
  padding: 0.625rem 1.25rem;
  background: var(--primary-color, #6366f1);
  color: white;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s;
}

.login-btn:hover {
  background: var(--primary-dark, #4f46e5);
}

/* 하이라이트 목록 */
.highlight-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.highlight-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-bg-card, #fff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  cursor: pointer;
  transition: background 0.2s;
}

.highlight-item:hover {
  background: var(--color-bg-hover, #f9fafb);
}

.highlight-item:last-child {
  border-bottom: none;
}

.highlight-color {
  width: 8px;
  min-height: 40px;
  border-radius: 4px;
  flex-shrink: 0;
  align-self: stretch;
}

.highlight-content {
  flex: 1;
  min-width: 0;
}

.highlight-location {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin-bottom: 0.25rem;
}

.highlight-memo {
  font-size: 0.8125rem;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 0.375rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.highlight-date {
  font-size: 0.75rem;
  color: var(--text-muted, #9ca3af);
}

.delete-btn {
  padding: 0.5rem;
  margin: -0.25rem;
  color: var(--text-secondary, #6b7280);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.delete-btn:hover {
  background: var(--color-error-light, #fef2f2);
  color: var(--color-error, #ef4444);
}

/* 다크모드 */
:root.dark .highlights-page {
  background: var(--color-bg-primary);
}

:root.dark .page-header {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .highlight-item {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .highlight-item:hover {
  background: var(--color-bg-hover);
}

:root.dark .delete-btn:hover {
  background: rgba(239, 68, 68, 0.15);
}
</style>
