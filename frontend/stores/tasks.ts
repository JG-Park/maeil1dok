import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'

interface Task {
  id: number
  title: string
  completed: boolean
}

interface BibleReading {
  book: string
  chapter: number
  end_chapter: number
  date: string  // ISO 형식의 날짜 문자열 (예: "2024-03-14")
}

interface TaskState {
  todayTasks: Task[]
  introTasks: Task[]
  todayReading: BibleReading | null
  bibleSchedules: BibleReading[]
}

export const useTaskStore = defineStore('tasks', {
  state: (): TaskState => ({
    todayTasks: [
      { id: 1, title: '성경일독', completed: false },
      { id: 2, title: '하세나하시조', completed: false }
    ],
    introTasks: [
      { id: 3, title: '출애굽기 개론', completed: false }
    ],
    todayReading: null as BibleReading | null,
    bibleSchedules: [] as BibleReading[]
  }),

  actions: {
    completeTask(taskId: number) {
      const allTasks = [...this.todayTasks, ...this.introTasks]
      const task = allTasks.find(t => t.id === taskId)
      if (task) {
        task.completed = true
      }
    },
    async fetchTodayReading() {
      const api = useApi()
      try {
        const response = await api.get('/api/v1/todos/today-reading/')
        this.todayReading = response
        return response
      } catch (error) {
        console.error('Error fetching today\'s reading:', error)
        return null
      }
    },
    async fetchReadingSchedule(book: string, chapter: number) {
      const api = useApi()
      try {
        const response = await api.get(
          `/api/v1/todos/reading-schedule/?book=${book}&chapter=${chapter}`
        )
        return response
      } catch (error) {
        console.error('Error fetching reading schedule:', error)
        return null
      }
    },
    async fetchBibleSchedules() {
      const api = useApi()
      try {
        const response = await api.get('/api/v1/todos/bible-schedules/upcoming/')
        this.bibleSchedules = response
        return response
      } catch (error) {
        console.error('Error fetching bible schedules:', error)
        return []
      }
    }
  }
}) 