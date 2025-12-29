<template>
  <Card :clickable="clickable" @click="handleClick" class="stat-card">
    <div class="stat-content">
      <div v-if="icon || $slots.icon" class="stat-icon" :style="{ color: iconColor }">
        <slot name="icon">
          <component :is="icon" v-if="icon" />
        </slot>
      </div>

      <div class="stat-info">
        <div class="stat-value">{{ value }}</div>
        <div class="stat-label">{{ label }}</div>
      </div>
    </div>
  </Card>
</template>

<script setup>
import Card from './Card.vue'

const props = defineProps({
  icon: {
    type: [String, Object],
    default: null
  },
  iconColor: {
    type: String,
    default: 'var(--primary-color)'
  },
  value: {
    type: [String, Number],
    required: true
  },
  label: {
    type: String,
    required: true
  },
  clickable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const handleClick = (event) => {
  if (props.clickable) {
    emit('click', event)
  }
}
</script>

<style scoped>
.stat-card {
  min-height: 100px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.75rem;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary-light);
  font-size: 24px;
}

.stat-icon :deep(svg) {
  width: 24px;
  height: 24px;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

@media (max-width: 640px) {
  .stat-card {
    min-height: 90px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .stat-icon :deep(svg) {
    width: 20px;
    height: 20px;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stat-label {
    font-size: 0.8125rem;
  }
}
</style>
