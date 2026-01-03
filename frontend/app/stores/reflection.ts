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
