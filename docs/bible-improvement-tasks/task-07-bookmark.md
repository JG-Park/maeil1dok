# Task 7: 북마크 기능

> **상태**: ✅ 완료
> **의존성**: Task 6 완료 필요
> **예상 파일**: 북마크 컴포넌트들

---

## 목표

장 단위 및 절 단위 북마크 기능을 구현한다.

---

## 기능 스펙

### 북마크 타입
1. **장 북마크**: "창세기 1장" 전체 저장
2. **절 북마크**: "요한복음 3:16-17" 특정 절 저장

### 북마크 속성
- 제목 (선택)
- 색상 (기본: #3B82F6)
- 메모 (선택)

---

## 생성 파일

| 파일 | 설명 |
|------|------|
| `frontend/app/components/bible/BookmarkButton.vue` | 북마크 추가 버튼 |
| `frontend/app/components/bible/BookmarkModal.vue` | 북마크 추가/편집 모달 |
| `frontend/app/components/bible/BookmarkList.vue` | 북마크 목록 |
| `frontend/app/components/bible/BookmarkPanel.vue` | 사이드 패널 |

---

## 구현 상세

### BookmarkButton.vue

```vue
<template>
  <button
    :class="['bookmark-btn', { active: isBookmarked }]"
    @click="handleClick"
    :title="isBookmarked ? '북마크 제거' : '북마크 추가'"
  >
    <i :class="isBookmarked ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'"></i>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBookmarkStore } from '~/stores/bookmark'

const props = defineProps<{
  book: string
  chapter: number
  verse?: number
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'add'): void
  (e: 'remove', id: number): void
}>()

const bookmarkStore = useBookmarkStore()

const isBookmarked = computed(() =>
  bookmarkStore.hasBookmark(props.book, props.chapter, props.verse)
)

const handleClick = () => {
  emit('toggle')
}
</script>

<style scoped>
.bookmark-btn {
  padding: 0.5rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.bookmark-btn:hover {
  color: var(--primary-color);
}

.bookmark-btn.active {
  color: #F59E0B;
}
</style>
```

### BookmarkModal.vue

```vue
<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-content">
        <header class="modal-header">
          <h3>{{ isEdit ? '북마크 편집' : '북마크 추가' }}</h3>
          <button class="close-btn" @click="close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </header>

        <div class="modal-body">
          <div class="reference">
            <i class="fa-solid fa-book-bible"></i>
            {{ bookName }} {{ chapter }}장
            <span v-if="startVerse">{{ startVerse }}-{{ endVerse || startVerse }}절</span>
          </div>

          <div class="form-group">
            <label>제목 (선택)</label>
            <input
              v-model="form.title"
              type="text"
              placeholder="북마크 제목을 입력하세요"
              maxlength="100"
            />
          </div>

          <div class="form-group">
            <label>색상</label>
            <div class="color-picker">
              <button
                v-for="color in colors"
                :key="color"
                :class="['color-btn', { active: form.color === color }]"
                :style="{ backgroundColor: color }"
                @click="form.color = color"
              ></button>
            </div>
          </div>

          <div class="form-group">
            <label>메모 (선택)</label>
            <textarea
              v-model="form.memo"
              placeholder="메모를 입력하세요"
              rows="3"
            ></textarea>
          </div>
        </div>

        <footer class="modal-footer">
          <button class="btn-secondary" @click="close">취소</button>
          <button class="btn-primary" @click="save" :disabled="isSaving">
            {{ isSaving ? '저장 중...' : '저장' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useBookmark } from '~/composables/useBookmark'
import { BIBLE_BOOKS } from '~/constants/bible'

const props = defineProps<{
  isOpen: boolean
  book: string
  chapter: number
  startVerse?: number
  endVerse?: number
  editBookmark?: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const { addBookmark } = useBookmark()

const isEdit = computed(() => !!props.editBookmark)
const bookName = computed(() =>
  BIBLE_BOOKS.find(b => b.code === props.book)?.name || props.book
)

const colors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'
]

const form = reactive({
  title: '',
  color: '#3B82F6',
  memo: ''
})

const isSaving = ref(false)

// 편집 모드일 때 폼 초기화
watch(() => props.editBookmark, (bookmark) => {
  if (bookmark) {
    form.title = bookmark.title || ''
    form.color = bookmark.color || '#3B82F6'
    form.memo = bookmark.memo || ''
  } else {
    form.title = ''
    form.color = '#3B82F6'
    form.memo = ''
  }
}, { immediate: true })

const close = () => {
  emit('close')
}

const save = async () => {
  isSaving.value = true

  try {
    await addBookmark({
      bookmark_type: props.startVerse ? 'verse' : 'chapter',
      book: props.book,
      chapter: props.chapter,
      start_verse: props.startVerse,
      end_verse: props.endVerse,
      title: form.title,
      color: form.color,
      memo: form.memo,
    })

    emit('saved')
    close()
  } catch (error) {
    console.error('Failed to save bookmark:', error)
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 1.25rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.modal-body {
  padding: 1.25rem;
}

.reference {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-weight: 500;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 1rem;
}

.color-picker {
  display: flex;
  gap: 0.5rem;
}

.color-btn {
  width: 32px;
  height: 32px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn.active {
  border-color: var(--text-primary);
  transform: scale(1.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-color);
}

.btn-secondary {
  padding: 0.625rem 1rem;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
}

.btn-primary {
  padding: 0.625rem 1rem;
  border: none;
  background: var(--primary-color);
  color: white;
  border-radius: 0.5rem;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

### BookmarkList.vue

```vue
<template>
  <div class="bookmark-list">
    <div v-if="isLoading" class="loading">
      <div class="loading-spinner"></div>
    </div>

    <div v-else-if="bookmarks.length === 0" class="empty">
      <i class="fa-regular fa-bookmark"></i>
      <p>저장된 북마크가 없습니다</p>
    </div>

    <div v-else class="list">
      <div
        v-for="bookmark in bookmarks"
        :key="bookmark.id"
        class="bookmark-item"
        @click="$emit('select', bookmark)"
      >
        <div class="color-bar" :style="{ backgroundColor: bookmark.color }"></div>

        <div class="content">
          <div class="reference">
            {{ bookmark.book_name }} {{ bookmark.chapter }}장
            <span v-if="bookmark.start_verse">
              {{ bookmark.start_verse }}
              <template v-if="bookmark.end_verse && bookmark.end_verse !== bookmark.start_verse">
                -{{ bookmark.end_verse }}
              </template>
              절
            </span>
          </div>

          <div v-if="bookmark.title" class="title">{{ bookmark.title }}</div>
          <div v-if="bookmark.memo" class="memo">{{ bookmark.memo }}</div>
        </div>

        <button class="delete-btn" @click.stop="handleDelete(bookmark.id)">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useBookmarkStore } from '~/stores/bookmark'
import { useBookmark } from '~/composables/useBookmark'

const emit = defineEmits<{
  (e: 'select', bookmark: any): void
}>()

const bookmarkStore = useBookmarkStore()
const { bookmarks, isLoading } = storeToRefs(bookmarkStore)
const { fetchBookmarks, removeBookmark } = useBookmark()

onMounted(() => {
  fetchBookmarks()
})

const handleDelete = async (id: number) => {
  if (confirm('이 북마크를 삭제하시겠습니까?')) {
    await removeBookmark(id)
  }
}
</script>

<style scoped>
.bookmark-list {
  padding: 1rem;
}

.loading, .empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.empty i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.bookmark-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.bookmark-item:hover {
  background: var(--bg-hover);
}

.color-bar {
  width: 4px;
  height: 100%;
  min-height: 40px;
  border-radius: 2px;
}

.content {
  flex: 1;
}

.reference {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.title {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.memo {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  margin-top: 0.25rem;
}

.delete-btn {
  padding: 0.5rem;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.bookmark-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--error);
}
</style>
```

---

## 테스트 체크리스트

- [ ] 장 북마크 추가/삭제
- [ ] 절 북마크 추가/삭제 (텍스트 선택 시)
- [ ] 북마크 목록 표시
- [ ] 북마크 클릭 시 해당 위치로 이동
- [ ] 색상/메모 저장
- [ ] 빌드 에러 없음

---

## 완료 조건

1. 북마크 CRUD 완전 동작
2. UI가 직관적으로 동작
3. 서버와 동기화 정상

---

## 완료 기록

- **완료일**: 2026-01-03
- **커밋**: (pending)
- **비고**: BookmarkButton, BookmarkModal, BookmarkList 컴포넌트 생성, BibleReader 통합
