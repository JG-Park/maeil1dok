<template>
  <BaseModal
    :model-value="true"
    title="캘린더 설정"
    size="md"
    :close-on-overlay="true"
    :close-on-esc="true"
    @update:model-value="handleClose"
    @close="handleClose"
  >
    <div class="plan-settings-content">
      <p class="section-description">플랜 색상을 변경하거나 순서를 드래그하여 조정할 수 있습니다.</p>

      <div class="plan-list">
        <div
          v-for="(setting, index) in localSettings"
          :key="setting.id"
          class="plan-item"
          draggable="true"
          @dragstart="handleDragStart(index)"
          @dragover.prevent="handleDragOver(index)"
          @dragend="handleDragEnd"
          :class="{ dragging: dragIndex === index }"
        >
          <div class="drag-handle">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="8" y1="6" x2="8" y2="6"/>
              <line x1="16" y1="6" x2="16" y2="6"/>
              <line x1="8" y1="12" x2="8" y2="12"/>
              <line x1="16" y1="12" x2="16" y2="12"/>
              <line x1="8" y1="18" x2="8" y2="18"/>
              <line x1="16" y1="18" x2="16" y2="18"/>
            </svg>
          </div>

          <div class="plan-info">
            <span class="plan-name">{{ setting.plan_name }}</span>
          </div>

          <div class="color-picker">
            <button
              v-for="color in availableColors"
              :key="color"
              class="color-option"
              :class="{ selected: setting.color === color }"
              :style="{ backgroundColor: color }"
              @click="handleColorChange(setting.id, color)"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer-content">
        <button class="btn-secondary" @click="handleClose">닫기</button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PlanDisplaySetting } from '~/stores/calendarDisplay'
import BaseModal from '~/components/ui/modal/BaseModal.vue'

const props = defineProps<{
  settings: PlanDisplaySetting[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update-color', id: number, color: string): void
  (e: 'reorder', orderedIds: number[]): void
}>()

const availableColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316'  // Orange
]

const localSettings = ref([...props.settings])
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const handleClose = () => {
  emit('close')
}

const handleColorChange = (id: number, color: string) => {
  const setting = localSettings.value.find(s => s.id === id)
  if (setting) {
    setting.color = color
  }
  emit('update-color', id, color)
}

const handleDragStart = (index: number) => {
  dragIndex.value = index
}

const handleDragOver = (index: number) => {
  if (dragIndex.value === null || dragIndex.value === index) return

  dragOverIndex.value = index

  const items = [...localSettings.value]
  const draggedItem = items[dragIndex.value]
  items.splice(dragIndex.value, 1)
  items.splice(index, 0, draggedItem)
  localSettings.value = items
  dragIndex.value = index
}

const handleDragEnd = () => {
  if (dragIndex.value !== null) {
    const orderedIds = localSettings.value.map(s => s.id)
    emit('reorder', orderedIds)
  }
  dragIndex.value = null
  dragOverIndex.value = null
}
</script>

<style scoped>
.plan-settings-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-description {
  font-size: 0.8125rem;
  color: var(--text-secondary, #64748B);
  margin: 0;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.plan-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-bg-secondary, #F8FAFC);
  border-radius: 10px;
  cursor: grab;
  transition: all 0.2s ease;
}

.plan-item:hover {
  background: var(--color-bg-hover, #F1F5F9);
}

.plan-item.dragging {
  opacity: 0.5;
  background: var(--color-border, #E2E8F0);
}

.drag-handle {
  color: var(--text-tertiary, #94A3B8);
  cursor: grab;
}

.plan-info {
  flex: 1;
  min-width: 0;
}

.plan-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary, #1E293B);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.color-picker {
  display: flex;
  gap: 4px;
}

.color-option {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: var(--text-primary, #1E293B);
  box-shadow: 0 0 0 2px var(--color-bg-card, #fff), 0 0 0 4px currentColor;
}

.modal-footer-content {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border, #E2E8F0);
  background: var(--color-bg-card, #fff);
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary, #64748B);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--color-bg-secondary, #F8FAFC);
  border-color: var(--color-border-hover, #CBD5E1);
}

/* Dark mode support */
:root.dark .plan-item {
  background: var(--color-bg-secondary);
}

:root.dark .plan-item:hover {
  background: var(--color-bg-hover);
}

:root.dark .color-option.selected {
  border-color: var(--text-primary);
  box-shadow: 0 0 0 2px var(--color-bg-card), 0 0 0 4px currentColor;
}
</style>
