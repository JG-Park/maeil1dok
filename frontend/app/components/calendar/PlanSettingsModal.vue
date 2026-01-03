<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">캘린더 설정</h3>
        <button class="close-btn" @click="$emit('close')">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
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

      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('close')">닫기</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PlanDisplaySetting } from '~/stores/calendarDisplay'

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

.modal-content {
  background: var(--color-bg-card);
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-slate-200);
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-slate-800);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-slate-500);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--color-slate-100);
  color: var(--color-slate-800);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
}

.section-description {
  font-size: 0.8125rem;
  color: var(--color-slate-500);
  margin: 0 0 1rem 0;
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
  background: var(--color-slate-50);
  border-radius: 10px;
  cursor: grab;
  transition: all 0.2s ease;
}

.plan-item:hover {
  background: var(--color-slate-100);
}

.plan-item.dragging {
  opacity: 0.5;
  background: var(--color-slate-200);
}

.drag-handle {
  color: var(--color-slate-400);
  cursor: grab;
}

.plan-info {
  flex: 1;
  min-width: 0;
}

.plan-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-slate-800);
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
  border-color: var(--color-slate-800);
  box-shadow: 0 0 0 2px var(--color-bg-card), 0 0 0 4px currentColor;
}

.modal-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-slate-200);
  display: flex;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-slate-200);
  background: var(--color-bg-card);
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-slate-500);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--color-slate-100);
  border-color: var(--color-slate-300);
}

@media (max-width: 640px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal-content {
    max-width: 100%;
    max-height: 85vh;
    border-radius: 16px 16px 0 0;
  }

  .color-picker {
    gap: 3px;
  }

  .color-option {
    width: 18px;
    height: 18px;
  }
}
</style>
