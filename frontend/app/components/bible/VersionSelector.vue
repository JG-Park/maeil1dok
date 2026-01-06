<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click="close">
      <div class="modal-content version-modal" @click.stop>
        <div class="modal-header">
          <h3>역본 선택</h3>
          <button class="close-button" @click="close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="versions-list">
            <button
              v-for="(name, code) in versionNames"
              :key="code"
              class="version-select-button"
              :class="{ active: currentVersion === code }"
              @click="selectVersion(code as string)"
            >
              <div class="button-content">
                <span>{{ name }}<span class="new-badge" v-if="name === '새한글'">N</span></span>
                <svg v-if="currentVersion === code" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { VERSION_NAMES } from '~/composables/useBibleData';

const props = defineProps<{
  modelValue: boolean;
  currentVersion: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'select': [version: string];
}>();

const versionNames = VERSION_NAMES;

const close = () => {
  emit('update:modelValue', false);
};

const selectVersion = (version: string) => {
  emit('select', version);
  close();
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--color-bg-card, #fff);
  border-radius: 16px;
  width: 100%;
  max-width: 360px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

.close-button {
  background: none;
  border: none;
  padding: 0.25rem;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.close-button:hover {
  background: var(--color-bg-hover, #f3f4f6);
  color: var(--text-primary, #1f2937);
}

.modal-body {
  padding: 0.75rem;
}

.versions-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.version-select-button {
  width: 100%;
  padding: 0.875rem 1rem;
  border: none;
  border-radius: 10px;
  background: var(--color-bg-primary, #f9fafb);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.version-select-button:hover {
  background: var(--color-bg-hover, #f3f4f6);
}

.version-select-button.active {
  background: var(--primary-light, #eef2ff);
}

.version-select-button .button-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9375rem;
  color: var(--text-primary, #1f2937);
}

.version-select-button.active .button-content {
  color: var(--primary-color, #6366f1);
  font-weight: 500;
}

.version-select-button.active svg {
  color: var(--primary-color, #6366f1);
}

.new-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.375rem;
  padding: 0.125rem 0.375rem;
  font-size: 0.625rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 4px;
  vertical-align: middle;
}
</style>
