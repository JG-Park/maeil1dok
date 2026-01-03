# Task 3: Frontend 기반 구조 생성

> **상태**: ✅ 완료
> **의존성**: Task 2 완료 필요
> **예상 파일**: pages, stores, composables

---

## 목표

Frontend의 새로운 폴더 구조, Store, Composable을 생성한다.

---

## 생성 파일

| 파일 | 설명 |
|------|------|
| `frontend/app/pages/bible/index.vue` | 성경읽기 메인 페이지 (스켈레톤) |
| `frontend/app/pages/bible/plan.vue` | 통독플랜 페이지 (스켈레톤) |
| `frontend/app/stores/bible.ts` | 성경 읽기 상태 관리 |
| `frontend/app/stores/bookmark.ts` | 북마크 관리 |
| `frontend/app/stores/reflection.ts` | 묵상노트 관리 |
| `frontend/app/composables/useBibleReader.ts` | 읽기 공통 로직 |
| `frontend/app/composables/useBookmark.ts` | 북마크 훅 |
| `frontend/app/composables/useReflection.ts` | 묵상노트 훅 |
| `frontend/app/composables/useReadingRecord.ts` | 읽기 기록 훅 |

---

## 구현 상세

### 1. Pages 스켈레톤

```vue
<!-- frontend/app/pages/bible/index.vue -->
<template>
  <div class="bible-page">
    <h1>성경읽기 (구현 예정)</h1>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: '성경읽기'
})
</script>
```

```vue
<!-- frontend/app/pages/bible/plan.vue -->
<template>
  <div class="bible-plan-page">
    <h1>통독플랜 (구현 예정)</h1>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: '통독플랜'
})
</script>
```

### 2. Stores

```typescript
// frontend/app/stores/bible.ts
import { defineStore } from 'pinia'

interface ReadingPosition {
  book: string
  chapter: number
  verse: number | null
  scrollPosition: number
  version: string
}

interface BibleState {
  currentBook: string
  currentChapter: number
  currentVersion: string
  lastPosition: ReadingPosition | null
  isLoading: boolean
  tongdokMode: boolean
  currentSchedule: any | null
  viewOptions: {
    showDescription: boolean
    showCrossRef: boolean
    highlightNames: boolean
    showFootnotes: boolean
  }
}

export const useBibleStore = defineStore('bible', {
  state: (): BibleState => ({
    currentBook: 'gen',
    currentChapter: 1,
    currentVersion: 'GAE',
    lastPosition: null,
    isLoading: false,
    tongdokMode: false,
    currentSchedule: null,
    viewOptions: {
      showDescription: true,
      showCrossRef: true,
      highlightNames: true,
      showFootnotes: false,
    }
  }),

  getters: {
    isInTongdokMode: (state) => state.tongdokMode && state.currentSchedule !== null,
  },

  actions: {
    setCurrentPosition(book: string, chapter: number) {
      this.currentBook = book
      this.currentChapter = chapter
    },

    setVersion(version: string) {
      this.currentVersion = version
    },

    setTongdokMode(enabled: boolean, schedule?: any) {
      this.tongdokMode = enabled
      this.currentSchedule = schedule || null
    },

    setViewOptions(options: Partial<BibleState['viewOptions']>) {
      this.viewOptions = { ...this.viewOptions, ...options }
      if (import.meta.client) {
        localStorage.setItem('bibleViewOptions', JSON.stringify(this.viewOptions))
      }
    },

    loadViewOptionsFromStorage() {
      if (import.meta.client) {
        const saved = localStorage.getItem('bibleViewOptions')
        if (saved) {
          try {
            this.viewOptions = { ...this.viewOptions, ...JSON.parse(saved) }
          } catch (e) {
            console.error('Failed to parse view options:', e)
          }
        }
      }
    }
  }
})
```

```typescript
// frontend/app/stores/bookmark.ts
import { defineStore } from 'pinia'

interface Bookmark {
  id: number
  bookmark_type: 'chapter' | 'verse'
  book: string
  book_name: string
  chapter: number
  start_verse: number | null
  end_verse: number | null
  title: string
  color: string
  memo: string
  created_at: string
}

interface BookmarkState {
  bookmarks: Bookmark[]
  isLoading: boolean
}

export const useBookmarkStore = defineStore('bookmark', {
  state: (): BookmarkState => ({
    bookmarks: [],
    isLoading: false,
  }),

  getters: {
    chapterBookmarks: (state) => (book: string, chapter: number) =>
      state.bookmarks.filter(b => b.book === book && b.chapter === chapter),

    hasBookmark: (state) => (book: string, chapter: number, verse?: number) =>
      state.bookmarks.some(b =>
        b.book === book &&
        b.chapter === chapter &&
        (verse ? b.start_verse === verse : b.bookmark_type === 'chapter')
      ),
  },

  actions: {
    setBookmarks(bookmarks: Bookmark[]) {
      this.bookmarks = bookmarks
    },

    addBookmark(bookmark: Bookmark) {
      this.bookmarks.unshift(bookmark)
    },

    removeBookmark(id: number) {
      this.bookmarks = this.bookmarks.filter(b => b.id !== id)
    },

    updateBookmark(id: number, updates: Partial<Bookmark>) {
      const index = this.bookmarks.findIndex(b => b.id === id)
      if (index !== -1) {
        this.bookmarks[index] = { ...this.bookmarks[index], ...updates }
      }
    }
  }
})
```

```typescript
// frontend/app/stores/reflection.ts
import { defineStore } from 'pinia'

interface ReflectionNote {
  id: number
  book: string
  book_name: string
  chapter: number
  start_verse: number | null
  end_verse: number | null
  content: string
  is_private: boolean
  created_at: string
  updated_at: string
}

interface ReflectionState {
  notes: ReflectionNote[]
  isLoading: boolean
}

export const useReflectionStore = defineStore('reflection', {
  state: (): ReflectionState => ({
    notes: [],
    isLoading: false,
  }),

  getters: {
    chapterNotes: (state) => (book: string, chapter: number) =>
      state.notes.filter(n => n.book === book && n.chapter === chapter),

    hasNote: (state) => (book: string, chapter: number) =>
      state.notes.some(n => n.book === book && n.chapter === chapter),
  },

  actions: {
    setNotes(notes: ReflectionNote[]) {
      this.notes = notes
    },

    addNote(note: ReflectionNote) {
      this.notes.unshift(note)
    },

    removeNote(id: number) {
      this.notes = this.notes.filter(n => n.id !== id)
    },

    updateNote(id: number, updates: Partial<ReflectionNote>) {
      const index = this.notes.findIndex(n => n.id === id)
      if (index !== -1) {
        this.notes[index] = { ...this.notes[index], ...updates }
      }
    }
  }
})
```

### 3. Composables

```typescript
// frontend/app/composables/useBibleReader.ts
import { useDebounceFn } from '@vueuse/core'

export function useBibleReader() {
  const api = useApi()
  const authStore = useAuthStore()
  const bibleStore = useBibleStore()

  // 마지막 위치 저장 (debounce 3초)
  const savePosition = useDebounceFn(async (position: {
    book: string
    chapter: number
    verse?: number
    scrollPosition?: number
    version?: string
  }) => {
    if (!authStore.isAuthenticated) return

    try {
      await api.post('/api/v1/bible/reading-position/', {
        book: position.book,
        chapter: position.chapter,
        verse: position.verse || null,
        scroll_position: position.scrollPosition || 0,
        version: position.version || bibleStore.currentVersion,
      })
    } catch (error) {
      console.error('Failed to save reading position:', error)
    }
  }, 3000)

  // 마지막 위치 불러오기
  const loadLastPosition = async () => {
    if (!authStore.isAuthenticated) return null

    try {
      const { data } = await api.get('/api/v1/bible/reading-position/')
      if (data.success && data.position) {
        bibleStore.lastPosition = data.position
        return data.position
      }
      return null
    } catch (error) {
      console.error('Failed to load reading position:', error)
      return null
    }
  }

  return {
    savePosition,
    loadLastPosition,
  }
}
```

```typescript
// frontend/app/composables/useBookmark.ts
export function useBookmark() {
  const api = useApi()
  const bookmarkStore = useBookmarkStore()

  const fetchBookmarks = async () => {
    bookmarkStore.isLoading = true
    try {
      const { data } = await api.get('/api/v1/bible/bookmarks/')
      bookmarkStore.setBookmarks(data)
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error)
    } finally {
      bookmarkStore.isLoading = false
    }
  }

  const addBookmark = async (bookmark: {
    bookmark_type: 'chapter' | 'verse'
    book: string
    chapter: number
    start_verse?: number
    end_verse?: number
    title?: string
    color?: string
    memo?: string
  }) => {
    try {
      const { data } = await api.post('/api/v1/bible/bookmarks/', bookmark)
      bookmarkStore.addBookmark(data)
      return data
    } catch (error) {
      console.error('Failed to add bookmark:', error)
      throw error
    }
  }

  const removeBookmark = async (id: number) => {
    try {
      await api.delete(`/api/v1/bible/bookmarks/${id}/`)
      bookmarkStore.removeBookmark(id)
    } catch (error) {
      console.error('Failed to remove bookmark:', error)
      throw error
    }
  }

  const fetchChapterBookmarks = async (book: string, chapter: number) => {
    try {
      const { data } = await api.get('/api/v1/bible/bookmarks/by-chapter/', {
        params: { book, chapter }
      })
      return data.bookmarks
    } catch (error) {
      console.error('Failed to fetch chapter bookmarks:', error)
      return []
    }
  }

  return {
    fetchBookmarks,
    addBookmark,
    removeBookmark,
    fetchChapterBookmarks,
  }
}
```

```typescript
// frontend/app/composables/useReflection.ts
export function useReflection() {
  const api = useApi()
  const reflectionStore = useReflectionStore()

  const fetchNotes = async () => {
    reflectionStore.isLoading = true
    try {
      const { data } = await api.get('/api/v1/bible/notes/')
      reflectionStore.setNotes(data)
    } catch (error) {
      console.error('Failed to fetch notes:', error)
    } finally {
      reflectionStore.isLoading = false
    }
  }

  const addNote = async (note: {
    book: string
    chapter: number
    start_verse?: number
    end_verse?: number
    content: string
    is_private?: boolean
  }) => {
    try {
      const { data } = await api.post('/api/v1/bible/notes/', note)
      reflectionStore.addNote(data)
      return data
    } catch (error) {
      console.error('Failed to add note:', error)
      throw error
    }
  }

  const updateNote = async (id: number, content: string) => {
    try {
      const { data } = await api.put(`/api/v1/bible/notes/${id}/`, { content })
      reflectionStore.updateNote(id, data)
      return data
    } catch (error) {
      console.error('Failed to update note:', error)
      throw error
    }
  }

  const removeNote = async (id: number) => {
    try {
      await api.delete(`/api/v1/bible/notes/${id}/`)
      reflectionStore.removeNote(id)
    } catch (error) {
      console.error('Failed to remove note:', error)
      throw error
    }
  }

  return {
    fetchNotes,
    addNote,
    updateNote,
    removeNote,
  }
}
```

```typescript
// frontend/app/composables/useReadingRecord.ts
export function useReadingRecord() {
  const api = useApi()

  const addRecord = async (book: string, chapter: number, readDate?: string) => {
    try {
      const { data } = await api.post('/api/v1/bible/personal-records/', {
        book,
        chapter,
        read_date: readDate || new Date().toISOString().split('T')[0]
      })
      return data
    } catch (error) {
      console.error('Failed to add reading record:', error)
      throw error
    }
  }

  const getStats = async () => {
    try {
      const { data } = await api.get('/api/v1/bible/personal-records/stats/')
      return data.stats
    } catch (error) {
      console.error('Failed to get reading stats:', error)
      return null
    }
  }

  const getBookRecords = async (book: string) => {
    try {
      const { data } = await api.get('/api/v1/bible/personal-records/by-book/', {
        params: { book }
      })
      return data.records
    } catch (error) {
      console.error('Failed to get book records:', error)
      return []
    }
  }

  return {
    addRecord,
    getStats,
    getBookRecords,
  }
}
```

---

## 테스트 체크리스트

- [ ] `/bible` 페이지 접근 가능
- [ ] `/bible/plan` 페이지 접근 가능
- [ ] Store가 정상 로드됨 (Vue DevTools 확인)
- [ ] 빌드 에러 없음

---

## 완료 조건

1. 모든 파일이 생성됨
2. 빌드 성공
3. 페이지 접근 가능

---

## 완료 기록

- **완료일**: -
- **커밋**: -
- **비고**: -
