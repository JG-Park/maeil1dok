<template>
  <BaseModal
    v-model="isOpen"
    title="플랜 선택"
    size="sm"
    @close="handleClose"
  >
    <div class="plan-list">
      <button
        v-for="subscription in subscriptions"
        :key="subscription.plan_id"
        class="plan-item"
        :class="{ active: isSelected(subscription.plan_id) }"
        @click="handleSelect(subscription)"
      >
        <div class="plan-item-content">
          <div class="plan-info">
            <div class="check-icon-wrapper">
              <svg
                v-show="isSelected(subscription.plan_id)"
                class="check-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span class="plan-name">{{ subscription.plan_name }}</span>
          </div>
          <div class="plan-badges">
            <span v-if="subscription.is_default" class="default-badge">기본</span>
          </div>
        </div>
      </button>
    </div>

    <template #footer>
      <div class="modal-buttons">
        <button class="cancel-button" @click="handleClose">취소</button>
        <button class="manage-plan-button" @click="handleManage">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          플랜 관리
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseModal from '~/components/ui/modal/BaseModal.vue';
import type { SubscriptionSummary } from '~/types/plan';

const props = defineProps<{
  show: boolean;
  subscriptions: SubscriptionSummary[];
  selectedPlanId: number | string | null;
}>();

const emit = defineEmits<{
  close: [];
  select: [subscription: SubscriptionSummary];
  manage: [];
}>();

// v-model 바인딩을 위한 computed
const isOpen = computed({
  get: () => props.show,
  set: (value: boolean) => {
    if (!value) {
      emit('close');
    }
  },
});

// 선택 여부 확인 (타입 안전한 비교)
function isSelected(planId: number): boolean {
  if (props.selectedPlanId === null) return false;
  return Number(planId) === Number(props.selectedPlanId);
}

function handleClose() {
  emit('close');
}

function handleSelect(subscription: SubscriptionSummary) {
  emit('select', subscription);
}

function handleManage() {
  emit('manage');
}
</script>

<style scoped>
.plan-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.plan-item {
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--color-slate-50);
  border: 1px solid var(--color-slate-200);
  border-radius: 10px;
  text-align: left;
  transition: all 0.2s;
}

.plan-item:hover {
  background: var(--color-slate-100);
}

.plan-item.active {
  background: var(--primary-light);
  border-color: var(--primary-color);
}

.plan-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plan-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.check-icon-wrapper {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  color: var(--primary-color);
}

.plan-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary);
}

.plan-badges {
  display: flex;
  gap: 0.25rem;
}

.default-badge {
  font-size: 0.65rem;
  padding: 0.15em 0.5em;
  background: var(--color-slate-200);
  color: var(--color-slate-600);
  border-radius: 4px;
  font-weight: 500;
}

.modal-buttons {
  display: flex;
  gap: 0.75rem;
  width: 100%;
}

.cancel-button,
.manage-plan-button {
  flex: 1;
  padding: 0.75rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.cancel-button {
  background: var(--color-slate-100);
  color: var(--color-slate-600);
  border: 1px solid var(--color-slate-200);
}

.cancel-button:hover {
  background: var(--color-slate-200);
}

.manage-plan-button {
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
}

.manage-plan-button:hover {
  background: var(--primary-dark);
}
</style>
