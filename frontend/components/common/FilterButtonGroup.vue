<template>
  <div class="filter-button-group" :class="groupClass">
    <div v-if="label" class="filter-label">{{ label }}</div>
    <div class="filter-buttons">
      <button
        v-for="option in options"
        :key="option.value"
        class="filter-button"
        :class="{ active: modelValue === option.value }"
        @click="handleSelect(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true
  },
  options: {
    type: Array,
    required: true,
    validator: (value) => value.every(opt => opt.label && opt.value !== undefined)
  },
  label: {
    type: String,
    default: ''
  },
  groupClass: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const handleSelect = (value) => {
  emit('update:modelValue', value)
}
</script>

<style scoped>
.filter-button-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  background: white;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.filter-button:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: var(--primary-light);
}

.filter-button.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.filter-button:active {
  transform: scale(0.95);
}

@media (max-width: 640px) {
  .filter-button {
    padding: 0.4rem 0.875rem;
    font-size: 0.8125rem;
  }
}
</style>
