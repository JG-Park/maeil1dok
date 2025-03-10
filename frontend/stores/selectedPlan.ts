import { defineStore } from 'pinia'

interface SelectedPlanState {
  selectedPlanId: number | null
}

export const useSelectedPlanStore = defineStore('selectedPlan', {
  state: (): SelectedPlanState => ({
    selectedPlanId: null
  }),

  actions: {
    setSelectedPlanId(planId: number | null) {
      this.selectedPlanId = planId
      // localStorage에 저장
      if (planId) {
        localStorage.setItem('selectedPlanId', planId.toString())
      } else {
        localStorage.removeItem('selectedPlanId')
      }
    },

    initializeFromStorage() {
      const storedPlanId = localStorage.getItem('selectedPlanId')
      if (storedPlanId) {
        this.selectedPlanId = parseInt(storedPlanId)
      }
    }
  }
}) 