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
