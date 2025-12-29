<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>새 그룹 만들기</h3>
        <button @click="$emit('close')" class="close-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
      
      <form @submit.prevent="createGroup" class="modal-content">
        <div class="form-group">
          <label for="name">그룹 이름</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            maxlength="100"
            placeholder="그룹 이름을 입력하세요"
          >
        </div>
        
        <div class="form-group">
          <label for="description">설명</label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            maxlength="500"
            placeholder="그룹 설명을 입력하세요 (선택사항)"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label>성경 읽기 플랜 (복수 선택 가능)</label>
          <div class="plans-checkbox-list">
            <label v-for="plan in availablePlans" :key="plan.id" class="plan-checkbox-label">
              <input
                type="checkbox"
                :value="plan.id"
                v-model="form.planIds"
              >
              <span>{{ plan.name }}</span>
              <span v-if="plan.description" class="plan-description">{{ plan.description }}</span>
            </label>
          </div>
          <p v-if="form.planIds.length === 0" class="help-text error">최소 1개 이상의 플랜을 선택해주세요.</p>
        </div>
        
        <div class="form-group">
          <label for="maxMembers">최대 인원</label>
          <input
            id="maxMembers"
            v-model.number="form.maxMembers"
            type="number"
            min="2"
            max="100"
            required
            placeholder="최대 인원 (2-100명)"
          >
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="form.isPublic"
            >
            <span>공개 그룹</span>
          </label>
          <p class="help-text">비공개 그룹은 초대를 통해서만 가입할 수 있습니다.</p>
        </div>
      </form>
      
      <div class="modal-footer">
        <button @click="$emit('close')" type="button" class="modal-button">
          취소
        </button>
        <button @click="createGroup" type="submit" class="modal-button primary" :disabled="isCreating">
          {{ isCreating ? '생성 중...' : '그룹 만들기' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGroupsStore } from '~/stores/groups'
import { useApi } from '~/composables/useApi'

const emit = defineEmits(['close', 'created'])
const groupsStore = useGroupsStore()
const api = useApi()

const form = reactive({
  name: '',
  description: '',
  planIds: [] as number[],
  maxMembers: 20,
  isPublic: true
})

const isCreating = ref(false)
const availablePlans = ref([])

// 플랜 목록 로드
onMounted(async () => {
  try {
    const response = await api.get('/api/v1/todos/plans/')
    // response.data.plans 또는 response.plans 확인
    if (response.data?.success) {
      availablePlans.value = response.data.plans || []
    } else if (response.data?.plans) {
      availablePlans.value = response.data.plans
    } else {
      availablePlans.value = response.data || response
    }
  } catch (error) {
    console.error('Failed to load plans:', error)
    alert('플랜 목록을 불러오는데 실패했습니다.')
  }
})

const createGroup = async () => {
  if (!form.name || form.planIds.length === 0 || !form.maxMembers) {
    alert('필수 항목을 모두 입력해주세요.\n최소 1개 이상의 플랜을 선택해야 합니다.')
    return
  }

  isCreating.value = true

  try {
    const result = await groupsStore.createGroup({
      name: form.name,
      description: form.description,
      plan_ids: form.planIds,
      max_members: form.maxMembers,
      is_public: form.isPublic
    })

    if (result.success && result.data) {
      emit('created', result.data)
    } else {
      alert(result.error || '그룹 생성에 실패했습니다.')
    }
  } catch (error) {
    alert('그룹 생성 중 오류가 발생했습니다.')
  } finally {
    isCreating.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
}

.modal-container {
  background-color: white;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #E5E7EB;
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-button {
  color: var(--text-secondary);
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
  background: none;
  border: none;
  cursor: pointer;
}

.close-button:hover {
  background-color: #F3F4F6;
}

.modal-content {
  padding: 1.5rem 1rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #E5E7EB;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(97, 116, 117, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.help-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.help-text.error {
  color: #EF4444;
}

.plans-checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 0.75rem;
  border: 1px solid #E5E7EB;
  border-radius: 0.375rem;
  background-color: #F9FAFB;
}

.plan-checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.plan-checkbox-label:hover {
  background-color: #F3F4F6;
}

.plan-checkbox-label input[type="checkbox"] {
  width: auto;
  margin-top: 0.125rem;
  flex-shrink: 0;
}

.plan-checkbox-label span:first-of-type {
  font-weight: 500;
  color: var(--text-primary);
}

.plan-description {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.125rem;
  margin-left: 1.25rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #E5E7EB;
}

.modal-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: #F3F4F6;
  color: var(--text-primary);
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.modal-button:hover {
  background-color: #E5E7EB;
}

.modal-button.primary {
  background-color: var(--primary-color);
  color: white;
}

.modal-button.primary:hover {
  background-color: var(--primary-dark);
}

.modal-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

:root {
  --primary-color: #617475;
  --primary-light: #E9ECEC;
  --primary-dark: #4A5A5B;
  --text-primary: #2C3E50;
  --text-secondary: #666666;
}
</style>