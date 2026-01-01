import { defineStore } from 'pinia'

interface SelectedPlanState {
  selectedPlanId: number | null
  defaultPlanId: number | null
}

export const useSelectedPlanStore = defineStore('selectedPlan', {
  state: (): SelectedPlanState => ({
    selectedPlanId: null,
    defaultPlanId: null
  }),

  getters: {
    // 선택된 플랜 또는 기본 플랜 ID 반환
    effectivePlanId: (state): number | null => {
      return state.selectedPlanId || state.defaultPlanId
    }
  },

  actions: {
    setSelectedPlanId(planId: number | null) {
      this.selectedPlanId = planId
      // localStorage에 저장
      if (typeof window !== 'undefined') {
        if (planId) {
          localStorage.setItem('selectedPlanId', planId.toString())
        } else {
          localStorage.removeItem('selectedPlanId')
        }
      }
    },

    setDefaultPlanId(planId: number | null) {
      this.defaultPlanId = planId
    },

    initializeFromStorage() {
      if (typeof window === 'undefined') return
      const storedPlanId = localStorage.getItem('selectedPlanId')
      if (storedPlanId) {
        this.selectedPlanId = parseInt(storedPlanId, 10)
      }
    }
  }
}) 