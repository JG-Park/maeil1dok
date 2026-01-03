import { useBookmarkStore } from '~/stores/bookmark'

export function useBookmark() {
  const { $api } = useNuxtApp()
  const bookmarkStore = useBookmarkStore()

  const fetchBookmarks = async () => {
    bookmarkStore.isLoading = true
    try {
      const { data } = await $api.get('/api/v1/todos/bible/bookmarks/')
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
      const { data } = await $api.post('/api/v1/todos/bible/bookmarks/', bookmark)
      bookmarkStore.addBookmark(data)
      return data
    } catch (error) {
      console.error('Failed to add bookmark:', error)
      throw error
    }
  }

  const removeBookmark = async (id: number) => {
    try {
      await $api.delete(`/api/v1/todos/bible/bookmarks/${id}/`)
      bookmarkStore.removeBookmark(id)
    } catch (error) {
      console.error('Failed to remove bookmark:', error)
      throw error
    }
  }

  const fetchChapterBookmarks = async (book: string, chapter: number) => {
    try {
      const { data } = await $api.get('/api/v1/todos/bible/bookmarks/by-chapter/', {
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
