import { useReflectionStore } from '~/stores/reflection'

export function useReflection() {
  const { $api } = useNuxtApp()
  const reflectionStore = useReflectionStore()

  const fetchNotes = async () => {
    reflectionStore.isLoading = true
    try {
      const { data } = await $api.get('/api/v1/todos/bible/notes/')
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
      const { data } = await $api.post('/api/v1/todos/bible/notes/', note)
      reflectionStore.addNote(data)
      return data
    } catch (error) {
      console.error('Failed to add note:', error)
      throw error
    }
  }

  const updateNote = async (id: number, content: string) => {
    try {
      const { data } = await $api.put(`/api/v1/todos/bible/notes/${id}/`, { content })
      reflectionStore.updateNote(id, data)
      return data
    } catch (error) {
      console.error('Failed to update note:', error)
      throw error
    }
  }

  const removeNote = async (id: number) => {
    try {
      await $api.delete(`/api/v1/todos/bible/notes/${id}/`)
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
