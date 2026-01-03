<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-content">
        <header class="modal-header">
          <h3>{{ isEdit ? '북마크 편집' : '북마크 추가' }}</h3>
          <button class="close-btn" @click="close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </header>

        <div class="modal-body">
          <div class="reference">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            {{ bookName }} {{ chapter }}장
            <span v-if="startVerse">{{ startVerse }}<template v-if="endVerse && endVerse !== startVerse">-{{ endVerse }}</template>절</span>
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
                type="button"
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
          <button class="btn-secondary" @click="close" type="button">취소</button>
          <button class="btn-primary" @click="save" :disabled="isSaving" type="button">
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
import { BOOK_NAMES } from '~/constants/bible'

const props = defineProps<{
  isOpen: boolean
  book: string
  chapter: number
  startVerse?: number
  endVerse?: number
  editBookmark?: {
    id: number
    title: string
    color: string
    memo: string
  } | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const { addBookmark } = useBookmark()

const isEdit = computed(() => !!props.editBookmark)
const bookName = computed(() => BOOK_NAMES[props.book] || props.book)

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

// 모달 열릴 때 폼 초기화
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && !props.editBookmark) {
    form.title = ''
    form.color = '#3B82F6'
    form.memo = ''
  }
})

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
      title: form.title || undefined,
      color: form.color,
      memo: form.memo || undefined,
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
  background: var(--bg-color, #fff);
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
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border: none;
  background: transparent;
  color: var(--text-secondary, #6b7280);
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
  background: var(--bg-secondary, #f9fafb);
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
  color: var(--text-secondary, #6b7280);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.5rem;
  font-size: 1rem;
  background: var(--bg-color, #fff);
  color: var(--text-primary, #111827);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color, #3b82f6);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
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

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: var(--text-primary, #111827);
  transform: scale(1.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.btn-secondary {
  padding: 0.625rem 1rem;
  border: 1px solid var(--border-color, #e5e7eb);
  background: var(--bg-color, #fff);
  color: var(--text-primary, #111827);
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-secondary:hover {
  background: var(--bg-secondary, #f9fafb);
}

.btn-primary {
  padding: 0.625rem 1rem;
  border: none;
  background: var(--primary-color, #3b82f6);
  color: white;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
