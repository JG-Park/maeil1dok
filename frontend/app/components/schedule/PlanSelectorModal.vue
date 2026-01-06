<template>
  <Transition name="fade">
    <div v-if="show" class="modal-overlay" @click="$emit('close')">
      <div class="modal-wrapper" @click.stop>
        <div class="modal">
          <div class="modal-content">
            <h3>플랜 선택</h3>
            <div class="plan-list">
              <button
                v-for="subscription in subscriptions"
                :key="subscription.plan_id"
                class="plan-item"
                :class="{ active: String(subscription.plan_id) === String(selectedPlanId) }"
                @click="$emit('select', subscription)"
              >
                <div class="plan-item-content">
                  <div class="plan-info">
                    <div class="check-icon-wrapper">
                      <svg
                        v-show="String(subscription.plan_id) === String(selectedPlanId)"
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
            <div class="modal-buttons">
              <button class="cancel-button" @click="$emit('close')">취소</button>
              <button class="manage-plan-button" @click="$emit('manage')">
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
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { SubscriptionSummary } from '~/types/plan';

defineProps<{
  show: boolean;
  subscriptions: SubscriptionSummary[];
  selectedPlanId: number | string | null;
}>();

defineEmits<{
  close: [];
  select: [subscription: SubscriptionSummary];
  manage: [];
}>();
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-wrapper {
  width: 100%;
  max-width: 400px;
}

.modal {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-content {
  padding: 1.5rem;
}

.modal-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  text-align: center;
}

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
  margin-top: 1.25rem;
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

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
