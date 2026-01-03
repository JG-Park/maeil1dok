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
