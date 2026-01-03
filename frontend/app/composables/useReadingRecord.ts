export function useReadingRecord() {
  const { $api } = useNuxtApp()

  const addRecord = async (book: string, chapter: number, readDate?: string) => {
    try {
      const { data } = await $api.post('/api/v1/todos/bible/personal-records/', {
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
      const { data } = await $api.get('/api/v1/todos/bible/personal-records/stats/')
      return data.stats
    } catch (error) {
      console.error('Failed to get reading stats:', error)
      return null
    }
  }

  const getBookRecords = async (book: string) => {
    try {
      const { data } = await $api.get('/api/v1/todos/bible/personal-records/by-book/', {
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
