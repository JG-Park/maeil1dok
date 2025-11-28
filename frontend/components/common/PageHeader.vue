<template>
  <div class="page-header fade-in">
    <button
      v-if="showBackButton"
      class="header-button back-button"
      @click="handleBack"
      aria-label="뒤로 가기"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
    </button>
    <div v-else class="header-spacer"></div>

    <h1 class="header-title">{{ title }}</h1>

    <div class="header-action">
      <slot name="action"></slot>
    </div>
  </div>
</template>

<script setup>
const router = useRouter()

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  showBackButton: {
    type: Boolean,
    default: true
  },
  onBack: {
    type: Function,
    default: null
  }
})

const handleBack = () => {
  if (props.onBack) {
    props.onBack()
  } else {
    router.back()
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  height: 50px;
}

.header-button {
  padding: 0.5rem;
  margin: -0.5rem;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-button:hover {
  background: var(--primary-light);
}

.header-button:active {
  transform: scale(0.95);
}

.back-button svg {
  width: 20px;
  height: 20px;
}

.header-spacer {
  width: 20px;
  height: 20px;
}

.header-title {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
}
</style>
