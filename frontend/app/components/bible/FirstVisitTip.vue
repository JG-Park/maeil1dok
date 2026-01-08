<template>
  <Transition name="tip-slide">
    <div v-if="showTip" class="first-visit-tip">
      <div class="tip-content">
        <div class="tip-icon">💡</div>
        <div class="tip-text">
          <strong>팁</strong>
          <p>{{ tipText }}</p>
        </div>
        <button class="tip-close" @click="dismissTip" aria-label="닫기">
          <XMarkIcon :size="18" />
        </button>
      </div>
      <div class="tip-progress">
        <div class="tip-progress-bar" :style="{ width: `${progress}%` }"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import XMarkIcon from '~/components/icons/XMarkIcon.vue';

interface Props {
  tipKey: string;  // localStorage 키 (예: 'highlight_tip_shown')
  tipText: string;
  duration?: number;  // 자동 숨김 시간 (ms), 0이면 자동 숨김 안함
  delay?: number;  // 표시 지연 시간 (ms)
}

const props = withDefaults(defineProps<Props>(), {
  duration: 8000,
  delay: 1000,
});

const showTip = ref(false);
const progress = ref(100);
let progressTimer: ReturnType<typeof setInterval> | null = null;
let showTimer: ReturnType<typeof setTimeout> | null = null;

const localStorageKey = computed(() => `bible_tip_${props.tipKey}`);

onMounted(() => {
  // 이미 본 팁인지 확인
  if (typeof window !== 'undefined') {
    const seen = localStorage.getItem(localStorageKey.value);
    if (seen === 'true') return;

    // 지연 후 표시
    showTimer = setTimeout(() => {
      showTip.value = true;
      startProgressTimer();
    }, props.delay);
  }
});

onUnmounted(() => {
  cleanup();
});

function startProgressTimer() {
  if (props.duration <= 0) return;

  const interval = 50;
  const step = (100 / props.duration) * interval;

  progressTimer = setInterval(() => {
    progress.value -= step;
    if (progress.value <= 0) {
      dismissTip();
    }
  }, interval);
}

function dismissTip() {
  showTip.value = false;
  // localStorage에 본 것으로 기록
  if (typeof window !== 'undefined') {
    localStorage.setItem(localStorageKey.value, 'true');
  }
  cleanup();
}

function cleanup() {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }
}
</script>

<style scoped>
.first-visit-tip {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 400px;
  background: var(--color-bg-card, #fff);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 200;
  overflow: hidden;
}

.tip-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
}

.tip-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.tip-text {
  flex: 1;
  min-width: 0;
}

.tip-text strong {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin-bottom: 0.25rem;
}

.tip-text p {
  font-size: 0.8125rem;
  color: var(--text-secondary, #6b7280);
  line-height: 1.5;
  margin: 0;
}

.tip-close {
  padding: 0.25rem;
  margin: -0.25rem;
  color: var(--text-muted, #9ca3af);
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.tip-close:hover {
  background: var(--color-bg-secondary, #f3f4f6);
  color: var(--text-secondary, #6b7280);
}

.tip-progress {
  height: 3px;
  background: var(--color-bg-tertiary, #e5e7eb);
}

.tip-progress-bar {
  height: 100%;
  background: var(--primary-color, #6366f1);
  transition: width 0.05s linear;
}

/* 애니메이션 */
.tip-slide-enter-active,
.tip-slide-leave-active {
  transition: all 0.3s ease;
}

.tip-slide-enter-from,
.tip-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* 다크모드 */
:root.dark .first-visit-tip {
  background: var(--color-bg-card);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

:root.dark .tip-progress {
  background: var(--color-bg-tertiary);
}

/* iOS 안전영역 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .first-visit-tip {
    bottom: calc(100px + env(safe-area-inset-bottom));
  }
}
</style>
