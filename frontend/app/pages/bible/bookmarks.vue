<template>
  <BibleSubpageLayout
    title="북마크"
    :loading="isLoading"
    loading-text="북마크를 불러오는 중..."
    :empty="isEmpty"
    :empty-text="emptyText"
    :empty-hint="emptyHint"
    :empty-guide="emptyGuide"
  >
    <!-- 빈 상태 아이콘 -->
    <template #empty-icon>
      <BookmarkIcon :size="48" />
    </template>

    <!-- 빈 상태 액션 -->
    <template #empty-action>
      <NuxtLink v-if="!authStore.isAuthenticated" to="/login" class="bible-login-btn">로그인</NuxtLink>
    </template>

    <!-- 북마크 목록 -->
    <ul class="bookmark-list">
      <li
        v-for="bookmark in bookmarks"
        :key="bookmark.id"
        class="bookmark-item"
        @click="goToBookmark(bookmark)"
      >
        <div class="bookmark-color" :style="{ background: bookmark.color || '#3B82F6' }"></div>
        <div class="bookmark-content">
          <div class="bookmark-location">
            {{ bookmark.book_name || bookmark.book }}
            {{ formatLocation(bookmark) }}
          </div>
          <div v-if="bookmark.title" class="bookmark-title">
            {{ bookmark.title }}
          </div>
          <div v-if="bookmark.memo" class="bookmark-memo">
            {{ bookmark.memo }}
          </div>
          <div class="bookmark-date">
            {{ formatRelativeDate(bookmark.created_at) }}
          </div>
        </div>
        <button class="delete-btn" @click.stop="handleDelete(bookmark)" title="삭제">
          <TrashIcon :size="18" />
        </button>
      </li>
    </ul>

    <!-- 토스트 -->
    <Toast />
  </BibleSubpageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBookmark, type Bookmark } from '~/composables/useBookmark';
import { useAuthService } from '~/composables/useAuthService';
import { useErrorHandler } from '~/composables/useErrorHandler';
import { useModal } from '~/composables/useModal';
import { useApi } from '~/composables/useApi';
import Toast from '~/components/Toast.vue';
import BibleSubpageLayout from '~/components/bible/BibleSubpageLayout.vue';
import BookmarkIcon from '~/components/icons/BookmarkIcon.vue';
import TrashIcon from '~/components/icons/TrashIcon.vue';

definePageMeta({
  layout: 'default'
});

const router = useRouter();
const authStore = useAuthService();
const { handleApiError } = useErrorHandler();
const modal = useModal();
const api = useApi();
const { getAllBookmarks } = useBookmark();
const { formatRelativeDate } = useDateFormat();

const bookmarks = ref<Bookmark[]>([]);
const isLoading = ref(true);

// 빈 상태 계산
const isEmpty = computed(() => !authStore.isAuthenticated.value || bookmarks.value.length === 0);
const emptyText = computed(() =>
  !authStore.isAuthenticated.value
    ? '로그인 후 북마크를 확인할 수 있습니다'
    : '저장된 북마크가 없습니다'
);
const emptyHint = computed(() =>
  authStore.isAuthenticated.value ? '자주 찾는 장을 저장해두세요' : ''
);
const emptyGuide = computed(() =>
  authStore.isAuthenticated.value
    ? [
        '성경 읽기 화면으로 이동하세요',
        '상단의 북마크 아이콘(🔖)을 탭하세요',
        '현재 장이 북마크에 저장됩니다'
      ]
    : undefined
);

onMounted(async () => {
  if (authStore.isAuthenticated.value) {
    try {
      bookmarks.value = await getAllBookmarks();
    } catch (error) {
      handleApiError(error, '북마크 로드');
    }
  }
  isLoading.value = false;
});

const formatLocation = (bookmark: Bookmark): string => {
  if (bookmark.bookmark_type === 'verse' && bookmark.start_verse) {
    if (bookmark.end_verse && bookmark.start_verse !== bookmark.end_verse) {
      return `${bookmark.chapter}:${bookmark.start_verse}-${bookmark.end_verse}`;
    }
    return `${bookmark.chapter}:${bookmark.start_verse}`;
  }
  return `${bookmark.chapter}장`;
};

const goToBookmark = (bookmark: Bookmark) => {
  const query: Record<string, string> = {
    book: bookmark.book,
    chapter: String(bookmark.chapter)
  };

  if (bookmark.bookmark_type === 'verse' && bookmark.start_verse) {
    query.verse = String(bookmark.start_verse);
  }

  router.push({ path: '/bible', query });
};

const handleDelete = async (bookmark: Bookmark) => {
  const confirmed = await modal.confirm({
    title: '북마크 삭제',
    description: '이 북마크를 삭제하시겠습니까?',
    confirmText: '삭제',
    cancelText: '취소',
    confirmVariant: 'danger',
    icon: 'warning'
  });
  if (!confirmed) return;

  try {
    await api.delete(`/api/v1/todos/bible/bookmarks/${bookmark.id}/`);
    bookmarks.value = bookmarks.value.filter(b => b.id !== bookmark.id);
  } catch (error) {
    handleApiError(error, '북마크 삭제');
  }
};
</script>

<style scoped>
/*
 * Bookmarks Page specific styles
 * 공통 스타일은 bible-page.css에서 관리됨
 */

/* 북마크 목록 */
.bookmark-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.bookmark-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-bg-card, #fff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  cursor: pointer;
  transition: background 0.2s;
}

.bookmark-item:hover {
  background: var(--color-bg-hover, #f9fafb);
}

.bookmark-item:last-child {
  border-bottom: none;
}

.bookmark-color {
  width: 4px;
  min-height: 40px;
  border-radius: 2px;
  flex-shrink: 0;
  align-self: stretch;
}

.bookmark-content {
  flex: 1;
  min-width: 0;
}

.bookmark-location {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin-bottom: 0.25rem;
}

.bookmark-title {
  font-size: 0.875rem;
  color: var(--text-primary, #1f2937);
  margin-bottom: 0.25rem;
}

.bookmark-memo {
  font-size: 0.8125rem;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 0.375rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.bookmark-date {
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
:root.dark .bookmark-item {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .bookmark-item:hover {
  background: var(--color-bg-hover);
}

:root.dark .delete-btn:hover {
  background: rgba(239, 68, 68, 0.15);
}
</style>
