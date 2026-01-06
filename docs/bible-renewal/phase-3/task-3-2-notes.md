# Task 3-2: 묵상노트 기능

> **Phase**: 3 - 부가 기능
> **상태**: ⬜ 대기
> **의존성**: Task 3-1 완료 필요
> **Backend**: ✅ 구현 완료 (`ReflectionNote` 모델)

---

## 목표

- 묵상노트 작성/편집 기능
- 간단 메모 (모달) + 상세 편집 (별도 페이지)
- 묵상노트 목록 페이지 (`/bible/notes`)

---

## 서브태스크

### 3.2.1 useNote composable
- [ ] GET `/api/v1/bible/notes/` 연동 (목록)
- [ ] GET `/api/v1/bible/notes/by-chapter/` 연동 (장별)
- [ ] GET `/api/v1/bible/notes/<id>/` 연동 (상세)
- [ ] POST `/api/v1/bible/notes/` 연동 (생성)
- [ ] PUT `/api/v1/bible/notes/<id>/` 연동 (수정)
- [ ] DELETE `/api/v1/bible/notes/<id>/` 연동 (삭제)

### 3.2.2 노트 버튼 (BibleHeader)
- [ ] `NoteButton.vue` 컴포넌트
- [ ] 현재 장의 노트 개수 표시
- [ ] 클릭 시 빠른 메모 모달 or 목록

### 3.2.3 빠른 메모 모달
- [ ] `NoteQuickModal.vue` - 한 줄 메모
- [ ] 빠른 입력 + 저장
- [ ] "상세 편집" 버튼으로 전체 페이지 이동

### 3.2.4 상세 편집 페이지
- [ ] `/bible/notes/[id].vue` 구현
- [ ] 텍스트 에디터 (마크다운 지원 옵션)
- [ ] 공개/비공개 설정
- [ ] 저장/삭제

### 3.2.5 노트 목록 페이지
- [ ] `/bible/notes/index.vue` 구현
- [ ] 노트 목록 (최신순)
- [ ] 검색/필터 (책별)
- [ ] 노트 클릭 시 상세 페이지로

---

## 구현 상세

### useNote.ts

```typescript
// composables/useNote.ts
import { ref } from 'vue';
import { useApi } from '~/composables/useApi';
import { useAuthStore } from '~/stores/auth';

interface Note {
  id: number;
  book: string;
  book_name: string;
  chapter: number;
  start_verse?: number;
  end_verse?: number;
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export const useNote = () => {
  const api = useApi();
  const authStore = useAuthStore();

  const notes = ref<Note[]>([]);
  const currentChapterNotes = ref<Note[]>([]);
  const currentNote = ref<Note | null>(null);
  const isLoading = ref(false);

  // 전체 노트 목록 조회
  const fetchNotes = async () => {
    if (!authStore.isAuthenticated) return;

    isLoading.value = true;
    try {
      const response = await api.get('/api/v1/bible/notes/');
      notes.value = response.data;
    } catch (error) {
      console.error('노트 목록 조회 실패:', error);
    } finally {
      isLoading.value = false;
    }
  };

  // 현재 장의 노트 조회
  const fetchChapterNotes = async (book: string, chapter: number) => {
    if (!authStore.isAuthenticated) return;

    try {
      const response = await api.get('/api/v1/bible/notes/by-chapter/', {
        params: { book, chapter }
      });
      currentChapterNotes.value = response.data;
    } catch (error) {
      console.error('장별 노트 조회 실패:', error);
    }
  };

  // 노트 상세 조회
  const fetchNote = async (id: number) => {
    isLoading.value = true;
    try {
      const response = await api.get(`/api/v1/bible/notes/${id}/`);
      currentNote.value = response.data;
      return response.data;
    } catch (error) {
      console.error('노트 조회 실패:', error);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // 노트 생성
  const createNote = async (data: {
    book: string;
    chapter: number;
    start_verse?: number;
    end_verse?: number;
    content: string;
    is_private?: boolean;
  }) => {
    if (!authStore.isAuthenticated) {
      throw new Error('로그인이 필요합니다');
    }

    const response = await api.post('/api/v1/bible/notes/', {
      is_private: true,
      ...data
    });

    currentChapterNotes.value.push(response.data);
    return response.data;
  };

  // 노트 수정
  const updateNote = async (id: number, data: Partial<Note>) => {
    const response = await api.put(`/api/v1/bible/notes/${id}/`, data);

    // 목록 업데이트
    const index = notes.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notes.value[index] = response.data;
    }

    // 현재 장 노트 업데이트
    const chapterIndex = currentChapterNotes.value.findIndex(n => n.id === id);
    if (chapterIndex !== -1) {
      currentChapterNotes.value[chapterIndex] = response.data;
    }

    currentNote.value = response.data;
    return response.data;
  };

  // 노트 삭제
  const deleteNote = async (id: number) => {
    await api.delete(`/api/v1/bible/notes/${id}/`);

    notes.value = notes.value.filter(n => n.id !== id);
    currentChapterNotes.value = currentChapterNotes.value.filter(n => n.id !== id);

    if (currentNote.value?.id === id) {
      currentNote.value = null;
    }
  };

  return {
    notes,
    currentChapterNotes,
    currentNote,
    isLoading,
    fetchNotes,
    fetchChapterNotes,
    fetchNote,
    createNote,
    updateNote,
    deleteNote
  };
};
```

### NoteButton.vue

```vue
<template>
  <button
    class="note-btn"
    :class="{ 'has-notes': noteCount > 0 }"
    @click="$emit('click')"
    title="묵상노트"
  >
    <i class="fa-regular fa-note-sticky" />
    <span v-if="noteCount > 0" class="note-count">{{ noteCount }}</span>
  </button>
</template>

<script setup>
defineProps<{
  noteCount: number;
}>();

defineEmits(['click']);
</script>

<style scoped>
.note-btn {
  position: relative;
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

.note-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.note-btn.has-notes i {
  color: var(--color-primary);
}

.note-count {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: var(--color-primary);
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
```

### NoteQuickModal.vue

```vue
<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal-content">
        <h2 class="modal-title">빠른 메모</h2>

        <div class="note-location">
          <i class="fa-solid fa-book-bible" />
          <span>{{ bookName }} {{ chapter }}장</span>
        </div>

        <div class="form-group">
          <textarea
            v-model="content"
            placeholder="묵상 내용을 적어보세요..."
            rows="4"
            ref="textareaRef"
          />
        </div>

        <div class="modal-footer">
          <button class="btn-detail" @click="goToDetail">
            <i class="fa-solid fa-expand" />
            상세 편집
          </button>

          <div class="modal-actions">
            <button class="btn-cancel" @click="close">취소</button>
            <button
              class="btn-confirm"
              @click="save"
              :disabled="!content.trim() || isSaving"
            >
              {{ isSaving ? '저장 중...' : '저장' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  book: string;
  bookName: string;
  chapter: number;
  existingNote?: any;
}>();

const emit = defineEmits(['update:modelValue', 'save', 'go-detail']);

const content = ref('');
const isSaving = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

// 기존 노트가 있으면 로드
watch(() => props.existingNote, (val) => {
  if (val) {
    content.value = val.content || '';
  }
}, { immediate: true });

// 모달 열릴 때 포커스
watch(() => props.modelValue, async (val) => {
  if (val) {
    await nextTick();
    textareaRef.value?.focus();
  }
});

const close = () => {
  emit('update:modelValue', false);
  content.value = '';
};

const save = async () => {
  if (!content.value.trim()) return;

  isSaving.value = true;
  try {
    emit('save', content.value);
    close();
  } finally {
    isSaving.value = false;
  }
};

const goToDetail = () => {
  emit('go-detail', content.value);
  close();
};
</script>
```

### /bible/notes/index.vue

```vue
<template>
  <div class="notes-page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">
        <i class="fa-solid fa-chevron-left" />
      </button>
      <h1>묵상노트</h1>
    </header>

    <!-- 필터 -->
    <div class="filter-bar">
      <select v-model="filterBook">
        <option value="">전체</option>
        <option v-for="book in bibleBooks" :key="book.id" :value="book.id">
          {{ book.name }}
        </option>
      </select>
    </div>

    <div v-if="isLoading" class="loading">
      <i class="fa-solid fa-spinner fa-spin" />
    </div>

    <div v-else-if="filteredNotes.length === 0" class="empty">
      <i class="fa-regular fa-note-sticky" />
      <p>작성된 묵상노트가 없습니다</p>
    </div>

    <ul v-else class="note-list">
      <li
        v-for="note in filteredNotes"
        :key="note.id"
        class="note-item"
        @click="goToNote(note.id)"
      >
        <div class="note-header">
          <span class="note-location">
            {{ note.book_name }} {{ note.chapter }}장
          </span>
          <span class="note-date">
            {{ formatDate(note.updated_at) }}
          </span>
        </div>
        <p class="note-preview">
          {{ truncate(note.content, 100) }}
        </p>
        <div class="note-meta">
          <span v-if="note.is_private" class="private-badge">
            <i class="fa-solid fa-lock" /> 비공개
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNote } from '~/composables/useNote';
import { useBibleData } from '~/composables/useBibleData';

const router = useRouter();
const { notes, isLoading, fetchNotes } = useNote();
const { bibleBooks } = useBibleData();

const filterBook = ref('');

onMounted(() => {
  fetchNotes();
});

const filteredNotes = computed(() => {
  if (!filterBook.value) return notes.value;
  return notes.value.filter(n => n.book === filterBook.value);
});

const goToNote = (id: number) => {
  router.push(`/bible/notes/${id}`);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const truncate = (text: string, length: number) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};
</script>
```

### /bible/notes/[id].vue

```vue
<template>
  <div class="note-detail-page">
    <header class="page-header">
      <button class="back-btn" @click="goBack">
        <i class="fa-solid fa-chevron-left" />
      </button>
      <h1>묵상노트</h1>
      <button class="delete-btn" @click="handleDelete">
        <i class="fa-solid fa-trash" />
      </button>
    </header>

    <div v-if="isLoading" class="loading">
      <i class="fa-solid fa-spinner fa-spin" />
    </div>

    <div v-else-if="note" class="note-editor">
      <div class="note-location">
        <i class="fa-solid fa-book-bible" />
        <span>{{ note.book_name }} {{ note.chapter }}장</span>
      </div>

      <textarea
        v-model="editContent"
        placeholder="묵상 내용을 적어보세요..."
        class="content-editor"
      />

      <div class="note-options">
        <label class="private-toggle">
          <input type="checkbox" v-model="isPrivate" />
          <span>비공개</span>
        </label>
      </div>

      <button
        class="save-btn"
        @click="handleSave"
        :disabled="!hasChanges || isSaving"
      >
        {{ isSaving ? '저장 중...' : '저장' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNote } from '~/composables/useNote';

const route = useRoute();
const router = useRouter();
const { currentNote: note, isLoading, fetchNote, updateNote, deleteNote } = useNote();

const editContent = ref('');
const isPrivate = ref(true);
const isSaving = ref(false);

const noteId = computed(() => parseInt(route.params.id as string));

onMounted(async () => {
  await fetchNote(noteId.value);
  if (note.value) {
    editContent.value = note.value.content;
    isPrivate.value = note.value.is_private;
  }
});

const hasChanges = computed(() => {
  if (!note.value) return false;
  return editContent.value !== note.value.content ||
         isPrivate.value !== note.value.is_private;
});

const handleSave = async () => {
  isSaving.value = true;
  try {
    await updateNote(noteId.value, {
      content: editContent.value,
      is_private: isPrivate.value
    });
    // 토스트 표시
  } finally {
    isSaving.value = false;
  }
};

const handleDelete = async () => {
  if (confirm('묵상노트를 삭제하시겠습니까?')) {
    await deleteNote(noteId.value);
    router.push('/bible/notes');
  }
};

const goBack = () => {
  if (hasChanges.value) {
    if (confirm('저장하지 않은 변경사항이 있습니다. 나가시겠습니까?')) {
      router.back();
    }
  } else {
    router.back();
  }
};
</script>
```

---

## 테스트 체크리스트

### 빌드 테스트
- [ ] `npm run build` 성공

### 기능 테스트 (Chrome DevTools MCP)

**빠른 메모:**
- [ ] `/bible?book=gen&chapter=1` 접속
- [ ] 노트 버튼 클릭 → 빠른 메모 모달
- [ ] 내용 입력 후 저장
- [ ] 노트 버튼에 개수 표시

**상세 편집:**
- [ ] 빠른 메모에서 "상세 편집" 클릭
- [ ] `/bible/notes/{id}` 페이지 이동
- [ ] 내용 수정 후 저장
- [ ] 공개/비공개 설정 변경

**노트 목록:**
- [ ] `/bible/notes` 접속
- [ ] 노트 목록 표시
- [ ] 책별 필터 동작
- [ ] 노트 클릭 → 상세 페이지

**삭제:**
- [ ] 상세 페이지에서 삭제 버튼
- [ ] 확인 후 삭제 및 목록으로 이동

---

## 완료 기준

1. 빠른 메모 모달 동작
2. 상세 편집 페이지 동작
3. 노트 목록 페이지 동작
4. CRUD 모두 정상
5. 빌드 성공

---

## 완료 정보

- **완료일**: -
- **커밋**: -
- **비고**: -
