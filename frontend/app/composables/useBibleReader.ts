import { useDebounceFn } from '@vueuse/core'
import { useBibleStore } from '~/stores/bible'
import { useAuthStore } from '~/stores/auth'

export function useBibleReader() {
  const { $api } = useNuxtApp()
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
      await $api.post('/api/v1/todos/bible/reading-position/', {
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
      const { data } = await $api.get('/api/v1/todos/bible/reading-position/')
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
