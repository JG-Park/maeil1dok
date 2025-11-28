<template>
  <div class="container">
    <!-- 고정 영역 -->
    <div class="fixed-area">
      <PageHeader
        :title="title"
        :show-back-button="showBackButton"
        :on-back="onBack"
      >
        <template #action>
          <slot name="header-action"></slot>
        </template>
      </PageHeader>
    </div>

    <!-- 스크롤 영역 -->
    <div class="scroll-area" :class="scrollAreaClass">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import PageHeader from './PageHeader.vue'

defineProps({
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
  },
  scrollAreaClass: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.container {
  max-width: 768px;
  margin: 0 auto;
  height: 100vh;
  height: 100dvh; /* 동적 뷰포트 높이 */
  display: flex;
  flex-direction: column;
  background: var(--background-color);
  position: relative;
  width: 100%;
}

.fixed-area {
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
}

.scroll-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* iOS 안전영역 대응 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .scroll-area {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
