<template>
  <div class="container">
    <!-- 고정 영역 -->
    <div class="fixed-area">
      <PageHeader
        :title="title"
        :show-back="showBackButton"
        :on-back="onBack"
      >
        <template #right>
          <slot name="header-action"></slot>
        </template>
      </PageHeader>
    </div>

    <!-- 스크롤 영역 -->
    <div class="scroll-area" :class="[scrollAreaClass, { 'with-floating-nav': showFloatingNav }]">
      <slot></slot>
    </div>

    <!-- 플로팅 네비게이션 -->
    <FloatingNav v-if="showFloatingNav" />
  </div>
</template>

<script setup>
import FloatingNav from '~/components/home-v2/FloatingNav.vue'

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
  },
  showFloatingNav: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped>
.container {
  max-width: 768px;
  margin: 0 auto;
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
  background: var(--color-bg-card);
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

/* 플로팅 네비게이션이 있을 때 하단 여백 */
.scroll-area.with-floating-nav {
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
}
</style>
