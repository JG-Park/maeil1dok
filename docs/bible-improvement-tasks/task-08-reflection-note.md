# Task 8: 묵상노트 기능

> **상태**: ⬜ 대기
> **의존성**: Task 7 완료 필요
> **예상 파일**: 묵상노트 컴포넌트들

---

## 목표

성경 장/절 단위로 묵상 기록을 남기는 기능을 구현한다.

---

## 기능 스펙

### 묵상노트 속성
- 책/장 (필수)
- 절 범위 (선택)
- 내용 (텍스트, 필수)
- 비공개 여부 (기본: true)

### 저장 시점
- 저장 버튼 클릭 시
- 자동 저장 (선택적, debounce)

---

## 생성 파일

| 파일 | 설명 |
|------|------|
| `frontend/app/components/bible/ReflectionNoteEditor.vue` | 묵상노트 편집기 |
| `frontend/app/components/bible/ReflectionNoteList.vue` | 묵상노트 목록 |
| `frontend/app/components/bible/ReflectionNoteButton.vue` | 묵상노트 버튼 |

---

## 구현 상세

### ReflectionNoteEditor.vue

```vue
<template>
  <div class="note-editor">
    <header class="editor-header">
      <div class="reference">
        <i class="fa-solid fa-feather"></i>
        {{ bookName }} {{ chapter }}장
        <span v-if="startVerse">{{ startVerse }}-{{ endVerse || startVerse }}절</span>
      </div>
      <button class="close-btn" @click="$emit('close')">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </header>

    <div class="editor-body">
      <textarea
        ref="textareaRef"
        v-model="content"
        placeholder="이 말씀에서 받은 은혜를 기록해보세요..."
        @input="handleInput"
      ></textarea>
    </div>

    <footer class="editor-footer">
      <div class="footer-left">
        <span v-if="lastSaved" class="save-status">
          <i class="fa-solid fa-check"></i>
          {{ formatTime(lastSaved) }} 저장됨
        </span>
        <span v-else-if="isDirty" class="save-status unsaved">
          <i class="fa-solid fa-circle"></i>
          저장되지 않음
        </span>
      </div>

      <div class="footer-right">
        <label class="private-toggle">
          <input type="checkbox" v-model="isPrivate">
          비공개
        </label>

        <button class="btn-secondary" @click="$emit('close')">취소</button>
        <button class="btn-primary" @click="save" :disabled="isSaving || !content.trim()">
          {{ isSaving ? '저장 중...' : '저장' }}
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useReflection } from '~/composables/useReflection'
import { BIBLE_BOOKS } from '~/constants/bible'

const props = defineProps<{
  book: string
  chapter: number
  startVerse?: number
  endVerse?: number
  existingNote?: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', note: any): void
}>()

const { addNote, updateNote } = useReflection()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const content = ref('')
const isPrivate = ref(true)
const isSaving = ref(false)
const isDirty = ref(false)
const lastSaved = ref<Date | null>(null)

const bookName = computed(() =>
  BIBLE_BOOKS.find(b => b.code === props.book)?.name || props.book
)

// 기존 노트 로드
onMounted(() => {
  if (props.existingNote) {
    content.value = props.existingNote.content || ''
    isPrivate.value = props.existingNote.is_private ?? true
    lastSaved.value = new Date(props.existingNote.updated_at)
  }

  // 포커스
  textareaRef.value?.focus()
})

const handleInput = () => {
  isDirty.value = true
  autoSave()
}

// 자동 저장 (5초 debounce)
const autoSave = useDebounceFn(async () => {
  if (!content.value.trim()) return
  await save()
}, 5000)

const save = async () => {
  if (!content.value.trim()) return

  isSaving.value = true

  try {
    let note

    if (props.existingNote) {
      // 기존 노트 업데이트
      note = await updateNote(props.existingNote.id, content.value)
    } else {
      // 새 노트 추가
      note = await addNote({
        book: props.book,
        chapter: props.chapter,
        start_verse: props.startVerse,
        end_verse: props.endVerse,
        content: content.value,
        is_private: isPrivate.value,
      })
    }

    lastSaved.value = new Date()
    isDirty.value = false
    emit('saved', note)
  } catch (error) {
    console.error('Failed to save note:', error)
  } finally {
    isSaving.value = false
  }
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.note-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 1rem;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.reference {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 1.25rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.editor-body {
  flex: 1;
  padding: 1rem;
}

.editor-body textarea {
  width: 100%;
  height: 100%;
  min-height: 200px;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 1rem;
  line-height: 1.6;
  resize: none;
}

.editor-body textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-color);
}

.footer-left {
  flex: 1;
}

.save-status {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: var(--text-tertiary);
}

.save-status.unsaved {
  color: var(--warning);
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.private-toggle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.btn-secondary {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 0.375rem;
  cursor: pointer;
}

.btn-primary {
  padding: 0.5rem 0.75rem;
  border: none;
  background: var(--primary-color);
  color: white;
  border-radius: 0.375rem;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

### ReflectionNoteList.vue

```vue
<template>
  <div class="note-list">
    <div v-if="isLoading" class="loading">
      <div class="loading-spinner"></div>
    </div>

    <div v-else-if="notes.length === 0" class="empty">
      <i class="fa-solid fa-feather"></i>
      <p>작성된 묵상노트가 없습니다</p>
    </div>

    <div v-else class="list">
      <div
        v-for="note in notes"
        :key="note.id"
        class="note-item"
        @click="$emit('select', note)"
      >
        <div class="note-header">
          <span class="reference">
            {{ note.book_name }} {{ note.chapter }}장
            <span v-if="note.start_verse">{{ note.start_verse }}절</span>
          </span>
          <span class="date">{{ formatDate(note.updated_at) }}</span>
        </div>

        <div class="note-content">
          {{ truncate(note.content, 100) }}
        </div>

        <div class="note-actions">
          <button class="action-btn" @click.stop="$emit('edit', note)">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="action-btn delete" @click.stop="handleDelete(note.id)">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useReflectionStore } from '~/stores/reflection'
import { useReflection } from '~/composables/useReflection'

const emit = defineEmits<{
  (e: 'select', note: any): void
  (e: 'edit', note: any): void
}>()

const reflectionStore = useReflectionStore()
const { notes, isLoading } = storeToRefs(reflectionStore)
const { fetchNotes, removeNote } = useReflection()

onMounted(() => {
  fetchNotes()
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
}

const truncate = (text: string, length: number) => {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

const handleDelete = async (id: number) => {
  if (confirm('이 묵상노트를 삭제하시겠습니까?')) {
    await removeNote(id)
  }
}
</script>

<style scoped>
.note-list {
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

.note-item {
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.note-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.note-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.reference {
  font-weight: 500;
}

.date {
  font-size: 0.8rem;
  color: var(--text-tertiary);
}

.note-content {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.note-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.75rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.note-item:hover .note-actions {
  opacity: 1;
}

.action-btn {
  padding: 0.375rem 0.5rem;
  border: none;
  background: var(--bg-secondary);
  border-radius: 0.25rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.action-btn:hover {
  background: var(--bg-hover);
}

.action-btn.delete:hover {
  color: var(--error);
}
</style>
```

---

## 테스트 체크리스트

- [ ] 묵상노트 작성
- [ ] 묵상노트 편집
- [ ] 묵상노트 삭제
- [ ] 자동 저장 동작 (5초 debounce)
- [ ] 묵상노트 목록 표시
- [ ] 비공개 설정 동작
- [ ] 빌드 에러 없음

---

## 완료 조건

1. 묵상노트 CRUD 완전 동작
2. 자동 저장 동작
3. UI가 직관적

---

## 완료 기록

- **완료일**: -
- **커밋**: -
- **비고**: -
