import { defineStore } from 'pinia'

interface Task {
  id: number
  title: string
  completed: boolean
}

interface TaskState {
  todayTasks: Task[]
  introTasks: Task[]
}

export const useTaskStore = defineStore('tasks', {
  state: (): TaskState => ({
    todayTasks: [
      { id: 1, title: '성경통독', completed: false },
      { id: 2, title: '하세나하시조', completed: false }
    ],
    introTasks: [
      { id: 3, title: '출애굽기 개론', completed: false }
    ]
  }),

  actions: {
    completeTask(taskId: number) {
      const allTasks = [...this.todayTasks, ...this.introTasks]
      const task = allTasks.find(t => t.id === taskId)
      if (task) {
        task.completed = true
      }
    }
  }
}) 