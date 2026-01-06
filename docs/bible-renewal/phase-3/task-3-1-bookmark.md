# Task 3-1: 북마크 기능

> **Phase**: 3 - 부가 기능
> **상태**: ⬜ 대기
> **의존성**: Phase 2 완료 필요
> **Backend**: ✅ 구현 완료 (`BibleBookmark` 모델)

---

## 목표

- 성경 구절/장 북마크 기능
- 북마크 목록 페이지 (`/bible/bookmarks`)
- 북마크 버튼 및 관리 UI

---

## 서브태스크

### 3.1.1 useBookmark composable
- [ ] GET `/api/v1/bible/bookmarks/` 연동 (목록)
- [ ] GET `/api/v1/bible/bookmarks/by-chapter/` 연동 (장별)
- [ ] POST `/api/v1/bible/bookmarks/` 연동 (생성)
- [ ] PUT `/api/v1/bible/bookmarks/<id>/` 연동 (수정)
- [ ] DELETE `/api/v1/bible/bookmarks/<id>/` 연동 (삭제)

### 3.1.2 북마크 버튼 (BibleHeader)
- [ ] `BookmarkButton.vue` 컴포넌트
- [ ] 현재 장 북마크 여부 표시
- [ ] 클릭 시 북마크 토글 (장 단위)

### 3.1.3 절 북마크 (액션 메뉴)
- [ ] 절 선택 시 액션 메뉴에서 북마크 추가
- [ ] `BookmarkModal.vue` - 제목, 색상, 메모 입력

### 3.1.4 북마크 목록 페이지
- [ ] `/bible/bookmarks` 페이지 구현
- [ ] 북마크 목록 표시 (최신순)
- [ ] 북마크 클릭 시 해당 위치로 이동
- [ ] 북마크 수정/삭제

---

## 구현 상세

### useBookmark.ts

```typescript
// composables/useBookmark.ts
import { ref, computed } from 'vue';
import { useApi } from '~/composables/useApi';
import { useAuthStore } from '~/stores/auth';

interface Bookmark {
  id: number;
  bookmark_type: 'chapter' | 'verse';
  book: string;
  book_name: string;
  chapter: number;
  start_verse?: number;
  end_verse?: number;
  title: string;
  color: string;
  memo: string;
  created_at: string;
  updated_at: string;
}

export const useBookmark = () => {
  const api = useApi();
  const authStore = useAuthStore();

  const bookmarks = ref<Bookmark[]>([]);
  const currentChapterBookmarks = ref<Bookmark[]>([]);
  const isLoading = ref(false);

  // 전체 북마크 목록 조회
  const fetchBookmarks = async () => {
    if (!authStore.isAuthenticated) return;

    isLoading.value = true;
    try {
      const response = await api.get('/api/v1/bible/bookmarks/');
      bookmarks.value = response.data;
    } catch (error) {
      console.error('북마크 목록 조회 실패:', error);
    } finally {
      isLoading.value = false;
    }
  };

  // 현재 장의 북마크 조회
  const fetchChapterBookmarks = async (book: string, chapter: number) => {
    if (!authStore.isAuthenticated) return;

    try {
      const response = await api.get('/api/v1/bible/bookmarks/by-chapter/', {
        params: { book, chapter }
      });
      currentChapterBookmarks.value = response.data;
    } catch (error) {
      console.error('장별 북마크 조회 실패:', error);
    }
  };

  // 장 북마크 여부
  const isChapterBookmarked = computed(() => {
    return currentChapterBookmarks.value.some(b => b.bookmark_type === 'chapter');
  });

  // 장 북마크 토글
  const toggleChapterBookmark = async (book: string, chapter: number) => {
    if (!authStore.isAuthenticated) {
      throw new Error('로그인이 필요합니다');
    }

    const existing = currentChapterBookmarks.value.find(
      b => b.bookmark_type === 'chapter'
    );

    if (existing) {
      // 삭제
      await api.delete(`/api/v1/bible/bookmarks/${existing.id}/`);
      currentChapterBookmarks.value = currentChapterBookmarks.value.filter(
        b => b.id !== existing.id
      );
      return false;
    } else {
      // 생성
      const response = await api.post('/api/v1/bible/bookmarks/', {
        bookmark_type: 'chapter',
        book,
        chapter
      });
      currentChapterBookmarks.value.push(response.data);
      return true;
    }
  };

  // 절 북마크 추가
  const addVerseBookmark = async (data: {
    book: string;
    chapter: number;
    start_verse: number;
    end_verse: number;
    title?: string;
    color?: string;
    memo?: string;
  }) => {
    if (!authStore.isAuthenticated) {
      throw new Error('로그인이 필요합니다');
    }

    const response = await api.post('/api/v1/bible/bookmarks/', {
      bookmark_type: 'verse',
      ...data
    });

    currentChapterBookmarks.value.push(response.data);
    return response.data;
  };

  // 북마크 수정
  const updateBookmark = async (id: number, data: Partial<Bookmark>) => {
    const response = await api.put(`/api/v1/bible/bookmarks/${id}/`, data);

    const index = bookmarks.value.findIndex(b => b.id === id);
    if (index !== -1) {
      bookmarks.value[index] = response.data;
    }

    return response.data;
  };

  // 북마크 삭제
  const deleteBookmark = async (id: number) => {
    await api.delete(`/api/v1/bible/bookmarks/${id}/`);

    bookmarks.value = bookmarks.value.filter(b => b.id !== id);
    currentChapterBookmarks.value = currentChapterBookmarks.value.filter(b => b.id !== id);
  };

  return {
    bookmarks,
    currentChapterBookmarks,
    isLoading,
    isChapterBookmarked,
    fetchBookmarks,
    fetchChapterBookmarks,
    toggleChapterBookmark,
    addVerseBookmark,
    updateBookmark,
    deleteBookmark
  };
};
```

### BookmarkButton.vue

```vue
<template>
  <button
    class="bookmark-btn"
    :class="{ active: isBookmarked }"
    @click="handleClick"
    :disabled="isLoading"
    title="북마크"
  >
    <i :class="isBookmarked ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'" />
  </button>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps<{
  isBookmarked: boolean;
}>();

const emit = defineEmits(['toggle']);

const isLoading = ref(false);

const handleClick = async () => {
  isLoading.value = true;
  try {
    emit('toggle');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.bookmark-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.bookmark-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.bookmark-btn.active i {
  color: var(--color-primary);
}

.bookmark-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

### BookmarkModal.vue

```vue
<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal-content">
        <h2 class="modal-title">
          {{ isEdit ? '북마크 수정' : '북마크 추가' }}
        </h2>

        <div class="bookmark-location">
          <i class="fa-solid fa-book-bible" />
          <span>{{ locationText }}</span>
        </div>

        <div class="form-group">
          <label>제목 (선택)</label>
          <input
            type="text"
            v-model="form.title"
            placeholder="북마크 제목을 입력하세요"
          />
        </div>

        <div class="form-group">
          <label>색상</label>
          <div class="color-picker">
            <button
              v-for="color in colors"
              :key="color"
              class="color-btn"
              :class="{ active: form.color === color }"
              :style="{ background: color }"
              @click="form.color = color"
            />
          </div>
        </div>

        <div class="form-group">
          <label>메모 (선택)</label>
          <textarea
            v-model="form.memo"
            placeholder="메모를 입력하세요"
            rows="3"
          />
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="close">취소</button>
          <button class="btn-confirm" @click="save" :disabled="isSaving">
            {{ isSaving ? '저장 중...' : '저장' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  bookmark?: any;
  book: string;
  bookName: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
}>();

const emit = defineEmits(['update:modelValue', 'save']);

const isEdit = computed(() => !!props.bookmark);

const locationText = computed(() => {
  if (props.startVerse && props.endVerse) {
    if (props.startVerse === props.endVerse) {
      return `${props.bookName} ${props.chapter}:${props.startVerse}`;
    }
    return `${props.bookName} ${props.chapter}:${props.startVerse}-${props.endVerse}`;
  }
  return `${props.bookName} ${props.chapter}장`;
});

const colors = [
  '#3B82F6', // blue (기본)
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
];

const form = reactive({
  title: '',
  color: '#3B82F6',
  memo: ''
});

const isSaving = ref(false);

// 수정 모드일 때 기존 값 로드
watch(() => props.bookmark, (val) => {
  if (val) {
    form.title = val.title || '';
    form.color = val.color || '#3B82F6';
    form.memo = val.memo || '';
  }
}, { immediate: true });

const close = () => emit('update:modelValue', false);

const save = async () => {
  isSaving.value = true;
  try {
    emit('save', { ...form });
    close();
  } finally {
    isSaving.value = false;
  }
};
</script>
```

### /bible/bookmarks.vue

```vue
<template>
  <div class="bookmarks-page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">
        <i class="fa-solid fa-chevron-left" />
      </button>
      <h1>북마크</h1>
    </header>

    <div v-if="isLoading" class="loading">
      <i class="fa-solid fa-spinner fa-spin" />
    </div>

    <div v-else-if="bookmarks.length === 0" class="empty">
      <i class="fa-regular fa-bookmark" />
      <p>저장된 북마크가 없습니다</p>
    </div>

    <ul v-else class="bookmark-list">
      <li
        v-for="bookmark in bookmarks"
        :key="bookmark.id"
        class="bookmark-item"
        @click="goToBookmark(bookmark)"
      >
        <div class="bookmark-color" :style="{ background: bookmark.color }" />
        <div class="bookmark-content">
          <div class="bookmark-location">
            {{ bookmark.book_name }}
            {{ bookmark.bookmark_type === 'verse'
              ? `${bookmark.chapter}:${bookmark.start_verse}-${bookmark.end_verse}`
              : `${bookmark.chapter}장`
            }}
          </div>
          <div v-if="bookmark.title" class="bookmark-title">
            {{ bookmark.title }}
          </div>
          <div v-if="bookmark.memo" class="bookmark-memo">
            {{ bookmark.memo }}
          </div>
        </div>
        <button class="delete-btn" @click.stop="handleDelete(bookmark.id)">
          <i class="fa-solid fa-trash" />
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBookmark } from '~/composables/useBookmark';

const router = useRouter();
const { bookmarks, isLoading, fetchBookmarks, deleteBookmark } = useBookmark();

onMounted(() => {
  fetchBookmarks();
});

const goToBookmark = (bookmark: any) => {
  router.push({
    path: '/bible',
    query: {
      book: bookmark.book,
      chapter: bookmark.chapter,
      ...(bookmark.start_verse && { verse: bookmark.start_verse })
    }
  });
};

const handleDelete = async (id: number) => {
  if (confirm('북마크를 삭제하시겠습니까?')) {
    await deleteBookmark(id);
  }
};
</script>
```

---

## 테스트 체크리스트

### 빌드 테스트
- [ ] `npm run build` 성공

### 기능 테스트 (Chrome DevTools MCP)

**장 북마크:**
- [ ] `/bible?book=gen&chapter=1` 접속
- [ ] 북마크 버튼 클릭 → 북마크 추가
- [ ] 버튼 아이콘 변경 (채워진 북마크)
- [ ] 다시 클릭 → 북마크 삭제
- [ ] 토스트 메시지 표시

**절 북마크:**
- [ ] 절 텍스트 선택
- [ ] 액션 메뉴에서 "북마크" 클릭
- [ ] 북마크 모달 표시
- [ ] 제목, 색상, 메모 입력 후 저장

**북마크 목록:**
- [ ] `/bible/bookmarks` 접속
- [ ] 북마크 목록 표시
- [ ] 북마크 클릭 → 해당 위치로 이동
- [ ] 삭제 버튼 동작

---

## 완료 기준

1. 장 북마크 토글 동작
2. 절 북마크 추가 동작
3. 북마크 목록 페이지 정상
4. 북마크에서 해당 위치로 이동
5. 빌드 성공

---

## 완료 정보

- **완료일**: -
- **커밋**: -
- **비고**: -
