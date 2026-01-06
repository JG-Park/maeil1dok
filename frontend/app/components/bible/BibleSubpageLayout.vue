<template>
  <div class="bible-page bible-subpage">
    <header class="bible-page-header">
      <button class="bible-back-btn" @click="handleBack">
        <ChevronLeftIcon :size="20" />
      </button>
      <h1>{{ title }}</h1>
      <div class="bible-header-actions">
        <slot name="actions" />
      </div>
    </header>

    <!-- 필터 슬롯 -->
    <slot name="filter" />

    <!-- 로딩 상태 -->
    <div v-if="loading" class="bible-loading-state">
      <SpinnerIcon :size="32" />
      <p>{{ loadingText }}</p>
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="empty" class="bible-empty-state">
      <slot name="empty-icon">
        <InfoCircleIcon :size="48" class="empty-icon" />
      </slot>
      <p>{{ emptyText }}</p>
      <span v-if="emptyHint" class="empty-hint">{{ emptyHint }}</span>
      <slot name="empty-action" />
    </div>

    <!-- 컨텐츠 -->
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

interface Props {
  title: string;
  loading?: boolean;
  loadingText?: string;
  empty?: boolean;
  emptyText?: string;
  emptyHint?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  loadingText: '불러오는 중...',
  empty: false,
  emptyText: '데이터가 없습니다',
  emptyHint: '',
});

const router = useRouter();

const handleBack = () => {
  router.back();
};
</script>

<style scoped>
/*
 * BibleSubpageLayout specific styles
 * 공통 스타일은 bible-page.css에서 관리됨
 */

/* 레이아웃 래퍼 - 전역 .bible-page에 추가 스타일 */
.bible-subpage {
  display: flex;
  flex-direction: column;
}

/* 로딩/빈 상태가 flex: 1을 차지하도록 */
.bible-subpage :deep(.bible-loading-state),
.bible-subpage :deep(.bible-empty-state) {
  flex: 1;
  min-height: auto;
}
</style>
