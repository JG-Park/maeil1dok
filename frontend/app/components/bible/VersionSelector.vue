<template>
  <UiModalBaseModal
    :model-value="modelValue"
    title="역본 선택"
    size="sm"
    @update:model-value="$emit('update:modelValue', $event)"
  >
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
  </UiModalBaseModal>
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

const selectVersion = (version: string) => {
  emit('select', version);
  emit('update:modelValue', false);
};
</script>

<style scoped>
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
