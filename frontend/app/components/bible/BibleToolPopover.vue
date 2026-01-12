<template>
  <div class="bible-tool-popover" ref="popoverRef">
    <!-- 트리거 버튼 -->
    <button
      class="tool-trigger-button"
      :class="{ active: isOpen, 'has-indicator': hasIndicator }"
      @click="togglePopover"
      title="도구"
    >
      <EllipsisIcon />
      <span v-if="hasIndicator" class="indicator-dot"></span>
    </button>

    <!-- 팝오버 -->
    <Transition name="popover-fade">
      <div v-if="isOpen" class="popover-content" @click.stop>
        <!-- 성경통독표 -->
        <button class="popover-item" @click="handleReadingPlan">
          <div class="item-icon">
            <ListCheckIcon />
          </div>
          <div class="item-content">
            <span class="item-label">성경통독표</span>
          </div>
        </button>

        <div class="popover-divider"></div>

        <!-- 노트 -->
        <button class="popover-item" @click="handleNote">
          <div class="item-icon">
            <NoteIcon />
          </div>
          <div class="item-content">
            <span class="item-label">노트</span>
            <span v-if="noteCount > 0" class="item-badge">{{ noteCount }}</span>
          </div>
        </button>

        <!-- 현재 장 북마크 토글 (통독 모드에서만 표시) -->
        <button v-if="showBookmarkToggle" class="popover-item" :class="{ active: isBookmarked }" @click="handleBookmarkToggle">
          <div class="item-icon">
            <BookmarkFilledIcon v-if="isBookmarked" />
            <BookmarkOutlineIcon v-else />
          </div>
          <div class="item-content">
            <span class="item-label">{{ isBookmarked ? '북마크 삭제' : '북마크 추가' }}</span>
          </div>
        </button>

        <!-- 북마크 목록 -->
        <button class="popover-item" @click="handleBookmarkList">
          <div class="item-icon">
            <BookmarkOutlineIcon />
          </div>
          <div class="item-content">
            <span class="item-label">북마크 목록</span>
          </div>
        </button>

        <div class="popover-divider"></div>

        <!-- 읽기 설정 -->
        <button class="popover-item" @click="handleSettings">
          <div class="item-icon">
            <SettingsIcon />
          </div>
          <div class="item-content">
            <span class="item-label">읽기 설정</span>
          </div>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineComponent, h } from 'vue';

// 아이콘 컴포넌트들
const EllipsisIcon = defineComponent({
  render() {
    return h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none' }, [
      h('circle', { cx: 12, cy: 12, r: 1.5, fill: 'currentColor' }),
      h('circle', { cx: 6, cy: 12, r: 1.5, fill: 'currentColor' }),
      h('circle', { cx: 18, cy: 12, r: 1.5, fill: 'currentColor' }),
    ]);
  }
});

const NoteIcon = defineComponent({
  render() {
    return h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
      h('path', { d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      h('polyline', { points: '14 2 14 8 20 8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      h('line', { x1: 16, y1: 13, x2: 8, y2: 13, 'stroke-linecap': 'round' }),
      h('line', { x1: 16, y1: 17, x2: 8, y2: 17, 'stroke-linecap': 'round' }),
    ]);
  }
});

const BookmarkOutlineIcon = defineComponent({
  render() {
    return h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
      h('path', { d: 'M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    ]);
  }
});

const BookmarkFilledIcon = defineComponent({
  render() {
    return h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'currentColor', stroke: 'currentColor', 'stroke-width': 2 }, [
      h('path', { d: 'M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    ]);
  }
});

const SettingsIcon = defineComponent({
  render() {
    return h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
      h('circle', { cx: 12, cy: 12, r: 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      h('path', { d: 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    ]);
  }
});

const ListCheckIcon = defineComponent({
  render() {
    return h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
      h('path', { d: 'M11 6h9', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      h('path', { d: 'M11 12h9', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      h('path', { d: 'M11 18h9', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      h('path', { d: 'M4 6l2 2 4-4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      h('path', { d: 'M4 12l2 2 4-4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      h('path', { d: 'M4 18l2 2 4-4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    ]);
  }
});

const props = defineProps<{
  noteCount: number;
  showBookmarkToggle?: boolean;
  isBookmarked?: boolean;
}>();

const emit = defineEmits<{
  'note-click': [];
  'reading-plan-click': [];
  'bookmark-toggle': [];
}>();

const popoverRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);

// 인디케이터 표시 여부 (노트가 있는 경우)
const hasIndicator = computed(() => props.noteCount > 0);

const togglePopover = () => {
  isOpen.value = !isOpen.value;
};

const closePopover = () => {
  isOpen.value = false;
};

const handleNote = () => {
  emit('note-click');
  closePopover();
};

const handleBookmarkToggle = () => {
  emit('bookmark-toggle');
  closePopover();
};

const handleBookmarkList = () => {
  closePopover();
  navigateTo('/bible/bookmarks');
};

const handleSettings = () => {
  closePopover();
  navigateTo('/bible/settings');
};

const handleReadingPlan = () => {
  emit('reading-plan-click');
  closePopover();
};

// 외부 클릭 시 닫기
const handleClickOutside = (e: MouseEvent) => {
  if (popoverRef.value && !popoverRef.value.contains(e.target as Node)) {
    closePopover();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.bible-tool-popover {
  position: relative;
}

.tool-trigger-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--text-secondary, #6b7280);
  background: transparent;
  border-radius: 8px;
  transition: all 0.2s;
  position: relative;
}

.tool-trigger-button:hover {
  background: var(--color-bg-hover, #f3f4f6);
  color: var(--text-primary, #1f2937);
}

.tool-trigger-button.active {
  background: var(--color-bg-active, #e5e7eb);
  color: var(--text-primary, #1f2937);
}

.indicator-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  background: var(--primary-color, #6366f1);
  border-radius: 50%;
}

/* 팝오버 컨텐츠 */
.popover-content {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: var(--color-bg-card, #fff);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--color-border, #e5e7eb);
  padding: 0.5rem;
  z-index: 100;
}

.popover-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  background: transparent;
  border-radius: 8px;
  transition: all 0.15s;
  text-align: left;
}

.popover-item:hover {
  background: var(--color-bg-hover, #f3f4f6);
}

.popover-item.active {
  color: var(--primary-color, #6366f1);
}

.popover-item.active .item-icon {
  color: var(--primary-color, #6366f1);
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--text-secondary, #6b7280);
  flex-shrink: 0;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.item-label {
  font-size: 0.9375rem;
  color: var(--text-primary, #1f2937);
}

.item-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 0.375rem;
  background: var(--primary-color, #6366f1);
  color: white;
  font-size: 0.6875rem;
  font-weight: 600;
  border-radius: 9px;
}

.popover-divider {
  height: 1px;
  background: var(--color-border, #e5e7eb);
  margin: 0.375rem 0;
}

/* 애니메이션 */
.popover-fade-enter-active,
.popover-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 다크모드 */
:root.dark .tool-trigger-button {
  color: var(--text-secondary);
}

:root.dark .tool-trigger-button:hover {
  background: var(--color-bg-hover);
  color: var(--text-primary);
}

:root.dark .popover-content {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .popover-item:hover {
  background: var(--color-bg-hover);
}

:root.dark .item-label {
  color: var(--text-primary);
}

:root.dark .item-icon {
  color: var(--text-secondary);
}

:root.dark .popover-divider {
  background: var(--color-border);
}
</style>
