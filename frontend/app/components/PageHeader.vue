<template>
  <div class="header fade-in">
    <button v-if="showBack" class="back-button" @click="handleBack">
      <ChevronLeftIcon :size="20" />
    </button>
    <div v-else class="back-placeholder"></div>

    <h1>{{ title }}</h1>

    <div class="right-slot">
      <slot name="right">
        <div class="right-placeholder"></div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import ChevronLeftIcon from '~/components/icons/ChevronLeftIcon.vue';

interface Props {
  title: string;
  backPath?: string;
  showBack?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  backPath: '/',
  showBack: true
});

const router = useRouter();

const handleBack = () => {
  router.push(props.backPath);
};
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-bg-card);
  box-shadow: var(--shadow-sm);
  height: 50px;
  flex-shrink: 0;
}

.header h1 {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  text-align: center;
}

.back-button {
  padding: 0.5rem;
  margin: -0.5rem;
  color: var(--color-text-primary);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  min-width: 32px;
}

.back-button:hover {
  background: var(--primary-light);
}

.back-placeholder {
  min-width: 32px;
}

.right-slot {
  min-width: 64px;
  display: flex;
  justify-content: flex-end;
}

.right-placeholder {
  min-width: 64px;
}

@media (max-width: 640px) {
  .header {
    padding: 0.75rem;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  opacity: 0;
  animation: fadeIn 0.4s ease-out forwards;
}
</style>
