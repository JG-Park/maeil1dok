<template>
  <div class="bible-page settings-page">
    <header class="bible-page-header">
      <button class="bible-back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1>읽기 설정</h1>
      <button class="header-action-btn" @click="goToBible">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </header>

    <div class="settings-content">
      <!-- 미리보기 (상단 고정) -->
      <section class="preview-section">
        <div class="preview-header">
          <span class="preview-label">미리보기</span>
        </div>
        <div class="preview-content" :style="previewStyles">
          <template v-if="settings.verseJoining">
            <p class="verse-paragraph">
              <sup class="verse-sup">1</sup>태초에 하나님이 천지를 창조하시니라
              <sup class="verse-sup">2</sup>땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 영은 수면 위에 운행하시니라
            </p>
          </template>
          <template v-else>
            <div class="preview-verse">
              <span v-if="settings.showVerseNumbers" class="verse-number">1</span>
              <span class="verse-text">태초에 하나님이 천지를 창조하시니라</span>
            </div>
            <div class="preview-verse">
              <span v-if="settings.showVerseNumbers" class="verse-number">2</span>
              <span class="verse-text">땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 영은 수면 위에 운행하시니라</span>
            </div>
          </template>
        </div>
      </section>

      <!-- 글꼴 설정 -->
      <section class="settings-section">
        <h2 class="section-title">글꼴</h2>
        
        <!-- 글꼴 선택 -->
        <div class="font-grid">
          <button
            v-for="(font, key) in fontFamilies"
            :key="key"
            class="font-button"
            :class="{ active: settings.fontFamily === key }"
            @click="updateSetting('fontFamily', key)"
          >
            <span class="font-preview" :style="{ fontFamily: font.css }">가</span>
            <span class="font-name">{{ font.name }}</span>
          </button>
        </div>

        <!-- 크기 & 줄간격 슬라이더 -->
        <div class="slider-group">
          <div class="slider-row">
            <span class="slider-label">크기</span>
            <div class="slider-control">
              <span class="slider-icon small">가</span>
              <input
                type="range"
                :value="settings.fontSize"
                min="14"
                max="24"
                step="1"
                class="slider"
                @input="updateSetting('fontSize', Number(($event.target as HTMLInputElement).value))"
              />
              <span class="slider-icon large">가</span>
              <span class="slider-value">{{ settings.fontSize }}</span>
            </div>
          </div>
          
          <div class="slider-row">
            <span class="slider-label">줄간격</span>
            <div class="slider-control">
              <span class="slider-icon-text">좁게</span>
              <input
                type="range"
                :value="settings.lineHeight"
                :min="LINE_HEIGHT_MIN"
                :max="LINE_HEIGHT_MAX"
                :step="LINE_HEIGHT_STEP"
                class="slider"
                @input="updateSetting('lineHeight', Number(($event.target as HTMLInputElement).value))"
              />
              <span class="slider-icon-text">넓게</span>
              <span class="slider-value">{{ settings.lineHeight.toFixed(1) }}</span>
            </div>
          </div>
        </div>

        <!-- 두께 & 정렬 -->
        <div class="inline-options">
          <div class="inline-option-group">
            <span class="option-label">두께</span>
            <div class="chip-buttons">
              <button
                v-for="option in fontWeightOptions"
                :key="option.value"
                class="chip-btn"
                :class="{ active: settings.fontWeight === option.value }"
                @click="updateSetting('fontWeight', option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
          <div class="inline-option-group">
            <span class="option-label">정렬</span>
            <div class="chip-buttons">
              <button
                v-for="option in textAlignOptions"
                :key="option.value"
                class="chip-btn"
                :class="{ active: settings.textAlign === option.value }"
                @click="updateSetting('textAlign', option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 테마 설정 -->
      <section class="settings-section">
        <h2 class="section-title">테마</h2>
        <div class="theme-selector">
          <button
            v-for="theme in themeOptions"
            :key="theme.value"
            class="theme-btn"
            :class="{ active: settings.theme === theme.value }"
            @click="updateSetting('theme', theme.value)"
          >
            <span class="theme-icon" v-html="theme.icon"></span>
            <span>{{ theme.label }}</span>
          </button>
        </div>
      </section>

      <!-- 읽기 옵션 -->
      <section class="settings-section">
        <h2 class="section-title">읽기 옵션</h2>
        
        <div class="toggle-item">
          <div class="toggle-info">
            <span class="toggle-title">절 번호 표시</span>
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              :checked="settings.showVerseNumbers"
              @change="updateSetting('showVerseNumbers', ($event.target as HTMLInputElement).checked)"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="toggle-item">
          <div class="toggle-info">
            <span class="toggle-title">절 붙임 (통독 모드)</span>
            <span class="toggle-desc">절을 문단으로 연결하여 흐름있게 읽기</span>
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              :checked="settings.verseJoining"
              @change="updateSetting('verseJoining', ($event.target as HTMLInputElement).checked)"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="toggle-item">
          <div class="toggle-info">
            <span class="toggle-title">인명/지명 강조</span>
            <span class="toggle-desc">성경 인물과 지명을 색상으로 구분</span>
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              :checked="settings.highlightNames"
              @change="updateSetting('highlightNames', ($event.target as HTMLInputElement).checked)"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </section>

      <!-- 통독 설정 -->
      <section class="settings-section">
        <h2 class="section-title">통독 설정</h2>

        <div class="toggle-item">
          <div class="toggle-info">
            <span class="toggle-title">통독모드 자동 완료</span>
            <span class="toggle-desc">마지막 장을 넘길 때 자동으로 완료 처리</span>
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              :checked="settings.tongdokAutoComplete"
              @change="updateSetting('tongdokAutoComplete', ($event.target as HTMLInputElement).checked)"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="setting-item">
          <label class="setting-label">기본 진입점</label>
          <div class="radio-options">
            <label 
              v-for="option in entryPointOptions" 
              :key="option.value"
              class="radio-option"
              :class="{ active: settings.defaultEntryPoint === option.value }"
            >
              <input
                type="radio"
                name="defaultEntryPoint"
                :value="option.value"
                :checked="settings.defaultEntryPoint === option.value"
                @change="updateSetting('defaultEntryPoint', option.value)"
              />
              <span class="radio-label">{{ option.label }}</span>
            </label>
          </div>
          <p class="setting-hint">/bible 접속 시 기본으로 이동할 위치</p>
        </div>
      </section>

      <!-- 데이터 관리 -->
      <section class="settings-section danger-section">
        <h2 class="section-title danger">데이터 관리</h2>
        <p class="danger-hint">아래 작업은 되돌릴 수 없습니다.</p>

        <div class="danger-buttons">
          <button class="danger-btn" :disabled="isDeleting" @click="deleteAllBookmarks">
            북마크 전체 삭제
          </button>
          <button class="danger-btn" :disabled="isDeleting" @click="deleteAllNotes">
            노트 전체 삭제
          </button>
          <button class="danger-btn" :disabled="isDeleting" @click="deleteAllHighlights">
            하이라이트 전체 삭제
          </button>
          <button class="danger-btn reset" :disabled="isDeleting" @click="resetAllSettings">
            모든 설정 초기화
          </button>
        </div>
      </section>
    </div>

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  useReadingSettingsStore, 
  FONT_FAMILIES, 
  FONT_WEIGHTS,
  LINE_HEIGHT_MIN,
  LINE_HEIGHT_MAX,
  LINE_HEIGHT_STEP,
  type ThemeMode, 
  type DefaultEntryPoint, 
  type FontWeight, 
  type TextAlign 
} from '~/stores/readingSettings';
import { useAuthStore } from '~/stores/auth';
import { useApi } from '~/composables/useApi';
import { useErrorHandler } from '~/composables/useErrorHandler';
import { useModal } from '~/composables/useModal';
import { useToast } from '~/composables/useToast';
import Toast from '~/components/Toast.vue';

definePageMeta({
  layout: 'default'
});

const router = useRouter();
const settingsStore = useReadingSettingsStore();
const authStore = useAuthStore();
const api = useApi();
const toast = useToast();
const modal = useModal();
const { handleApiError } = useErrorHandler();

const isDeleting = ref(false);

const settings = computed(() => settingsStore.settings);

const fontFamilies = FONT_FAMILIES;

// 테마 옵션
const themeOptions: Array<{ value: ThemeMode; label: string; icon: string }> = [
  { 
    value: 'light', 
    label: '라이트',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
  },
  { 
    value: 'dark', 
    label: '다크',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
  },
  { 
    value: 'system', 
    label: '자동',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>'
  },
];

// 글꼴 두께 옵션
const fontWeightOptions: Array<{ value: FontWeight; label: string }> = [
  { value: 'normal', label: '보통' },
  { value: 'medium', label: '중간' },
  { value: 'bold', label: '굵게' },
];

// 텍스트 정렬 옵션
const textAlignOptions: Array<{ value: TextAlign; label: string }> = [
  { value: 'left', label: '왼쪽' },
  { value: 'justify', label: '양쪽' },
];

// 기본 진입점 옵션
const entryPointOptions: Array<{ value: DefaultEntryPoint; label: string }> = [
  { value: 'last-position', label: '마지막 읽던 위치' },
  { value: 'home', label: '홈 (대시보드)' },
  { value: 'toc', label: '성경 목차' },
];

// 미리보기 스타일
const previewStyles = computed(() => ({
  fontFamily: FONT_FAMILIES[settings.value.fontFamily].css,
  fontSize: `${settings.value.fontSize}px`,
  fontWeight: FONT_WEIGHTS[settings.value.fontWeight],
  lineHeight: settings.value.lineHeight,
  textAlign: settings.value.textAlign,
}));

// 네비게이션
const goBack = () => {
  router.back();
};

const goToBible = () => {
  navigateTo('/bible');
};

// 설정 업데이트
const updateSetting = <K extends keyof typeof settings.value>(key: K, value: typeof settings.value[K]) => {
  settingsStore.updateSetting(key, value);
};

// 북마크 전체 삭제
const deleteAllBookmarks = async () => {
  if (!authStore.isAuthenticated) {
    toast.error('로그인이 필요합니다');
    return;
  }
  const confirmed = await modal.confirm({
    title: '북마크 전체 삭제',
    description: '모든 북마크를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    confirmText: '삭제',
    cancelText: '취소',
    confirmVariant: 'danger',
    icon: 'warning'
  });
  if (!confirmed) return;

  isDeleting.value = true;
  try {
    await api.delete('/api/v1/todos/bible/bookmarks/delete-all/');
    toast.success('북마크가 모두 삭제되었습니다');
  } catch (error) {
    handleApiError(error, '북마크 삭제');
  } finally {
    isDeleting.value = false;
  }
};

// 노트 전체 삭제
const deleteAllNotes = async () => {
  if (!authStore.isAuthenticated) {
    toast.error('로그인이 필요합니다');
    return;
  }
  const confirmed = await modal.confirm({
    title: '노트 전체 삭제',
    description: '모든 노트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    confirmText: '삭제',
    cancelText: '취소',
    confirmVariant: 'danger',
    icon: 'warning'
  });
  if (!confirmed) return;

  isDeleting.value = true;
  try {
    await api.delete('/api/v1/todos/bible/notes/delete-all/');
    toast.success('노트가 모두 삭제되었습니다');
  } catch (error) {
    handleApiError(error, '노트 삭제');
  } finally {
    isDeleting.value = false;
  }
};

// 하이라이트 전체 삭제
const deleteAllHighlights = async () => {
  if (!authStore.isAuthenticated) {
    toast.error('로그인이 필요합니다');
    return;
  }
  const confirmed = await modal.confirm({
    title: '하이라이트 전체 삭제',
    description: '모든 하이라이트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    confirmText: '삭제',
    cancelText: '취소',
    confirmVariant: 'danger',
    icon: 'warning'
  });
  if (!confirmed) return;

  isDeleting.value = true;
  try {
    await api.delete('/api/v1/todos/bible/highlights/delete-all/');
    toast.success('하이라이트가 모두 삭제되었습니다');
  } catch (error) {
    handleApiError(error, '하이라이트 삭제');
  } finally {
    isDeleting.value = false;
  }
};

// 설정 초기화
const resetAllSettings = async () => {
  const confirmed = await modal.confirm({
    title: '설정 초기화',
    description: '모든 설정을 기본값으로 초기화하시겠습니까?',
    confirmText: '초기화',
    cancelText: '취소',
    confirmVariant: 'danger',
    icon: 'warning'
  });
  if (!confirmed) return;
  settingsStore.resetToDefaults();
  toast.success('설정이 초기화되었습니다');
};
</script>

<style scoped>
/* 헤더 */
.bible-page-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-card, #fff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  position: sticky;
  top: 0;
  z-index: 10;
}

.bible-back-btn,
.header-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.2s;
}

.bible-back-btn:hover,
.header-action-btn:hover {
  background: var(--color-bg-hover, #f3f4f6);
  color: var(--text-primary, #1f2937);
}

.bible-page-header h1 {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin: 0;
}

/* 설정 컨텐츠 */
.settings-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;
}

/* 미리보기 섹션 */
.preview-section {
  background: var(--color-bg-card, #fff);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.preview-header {
  padding: 0.5rem 1rem;
  background: var(--color-bg-secondary, #f9fafb);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.preview-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted, #9ca3af);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-content {
  padding: 1rem;
  color: var(--text-primary, #1f2937);
  min-height: 80px;
}

.preview-verse {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.preview-verse:last-child {
  margin-bottom: 0;
}

.verse-number {
  font-size: 0.7em;
  color: var(--text-muted, #9ca3af);
  font-weight: 500;
  min-width: 1.25em;
  text-align: right;
  flex-shrink: 0;
  line-height: 2;
  font-family: system-ui, sans-serif;
}

.verse-text {
  flex: 1;
}

.verse-paragraph {
  margin: 0;
}

.verse-sup {
  font-size: 0.6em;
  color: var(--text-muted, #9ca3af);
  font-family: system-ui, sans-serif;
  vertical-align: super;
  margin-right: 0.15em;
}

/* 섹션 공통 */
.settings-section {
  background: var(--color-bg-card, #fff);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin: 0 0 1rem;
}

.section-title.danger {
  color: var(--color-error, #ef4444);
}

/* 폰트 그리드 */
.font-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.font-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.625rem 0.5rem;
  border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 10px;
  background: var(--color-bg-card, #fff);
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  transition: all 0.2s;
}

.font-button:hover {
  border-color: var(--primary-color, #6366f1);
}

.font-button.active {
  border-color: var(--primary-color, #6366f1);
  background: var(--primary-light, #eef2ff);
}

.font-preview {
  font-size: 1.375rem;
  line-height: 1.2;
}

.font-name {
  font-size: 0.625rem;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
  color: var(--text-secondary, #6b7280);
}

/* 슬라이더 그룹 */
.slider-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--color-bg-secondary, #f9fafb);
  border-radius: 10px;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.slider-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  min-width: 48px;
}

.slider-control {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.slider-icon {
  color: var(--text-muted, #9ca3af);
}

.slider-icon.small {
  font-size: 0.75rem;
}

.slider-icon.large {
  font-size: 1.125rem;
}

.slider-icon-text {
  font-size: 0.6875rem;
  color: var(--text-muted, #9ca3af);
  white-space: nowrap;
}

.slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--color-border, #e5e7eb);
  border-radius: 2px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color, #6366f1);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color, #6366f1);
  cursor: pointer;
  border: none;
}

.slider-value {
  min-width: 28px;
  text-align: right;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--primary-color, #6366f1);
}

/* 인라인 옵션 */
.inline-options {
  display: flex;
  gap: 1rem;
}

.inline-option-group {
  flex: 1;
}

.option-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 0.375rem;
}

.chip-buttons {
  display: flex;
  gap: 0.25rem;
}

.chip-btn {
  flex: 1;
  padding: 0.5rem 0.5rem;
  border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 6px;
  background: var(--color-bg-card, #fff);
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0.8125rem;
  font-weight: 500;
}

.chip-btn:hover {
  border-color: var(--primary-color, #6366f1);
}

.chip-btn.active {
  border-color: var(--primary-color, #6366f1);
  background: var(--primary-color, #6366f1);
  color: white;
}

/* 테마 선택 */
.theme-selector {
  display: flex;
  gap: 0.5rem;
}

.theme-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.75rem;
  border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 10px;
  background: var(--color-bg-card, #fff);
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.8125rem;
  font-weight: 500;
}

.theme-btn:hover {
  border-color: var(--primary-color, #6366f1);
}

.theme-btn.active {
  border-color: var(--primary-color, #6366f1);
  background: var(--primary-light, #eef2ff);
  color: var(--primary-color, #6366f1);
}

.theme-icon {
  display: flex;
  align-items: center;
}

/* 토글 아이템 */
.toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.625rem 0;
  border-bottom: 1px solid var(--color-border-light, #f3f4f6);
}

.toggle-item:last-child {
  border-bottom: none;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.toggle-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary, #1f2937);
}

.toggle-desc {
  font-size: 0.75rem;
  color: var(--text-muted, #9ca3af);
}

/* 토글 스위치 */
.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 26px;
  flex-shrink: 0;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-border, #e5e7eb);
  transition: 0.2s;
  border-radius: 26px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle input:checked + .toggle-slider {
  background-color: var(--primary-color, #6366f1);
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(18px);
}

/* 설정 아이템 */
.setting-item {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border-light, #f3f4f6);
}

.setting-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 0.5rem;
}

.setting-hint {
  font-size: 0.75rem;
  color: var(--text-muted, #9ca3af);
  margin-top: 0.375rem;
}

/* 라디오 옵션 */
.radio-options {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.radio-option:hover {
  background: var(--color-bg-hover, #f3f4f6);
}

.radio-option.active {
  background: var(--primary-light, #eef2ff);
}

.radio-option input {
  accent-color: var(--primary-color, #6366f1);
}

.radio-label {
  font-size: 0.9375rem;
  color: var(--text-primary, #1f2937);
}

/* 위험 섹션 */
.danger-section {
  border: 1px solid var(--color-error-light, #fecaca);
}

.danger-hint {
  font-size: 0.75rem;
  color: var(--color-error, #ef4444);
  margin: 0 0 0.75rem;
}

.danger-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.danger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1rem;
  background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.2s;
}

.danger-btn:hover:not(:disabled) {
  border-color: var(--color-error, #ef4444);
  background: var(--color-error-light, #fef2f2);
  color: var(--color-error, #ef4444);
}

.danger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.danger-btn.reset {
  border-color: var(--color-error, #ef4444);
  color: var(--color-error, #ef4444);
}

.danger-btn.reset:hover:not(:disabled) {
  background: var(--color-error, #ef4444);
  color: white;
}

/* 다크모드 */
:root.dark .bible-page-header {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

:root.dark .preview-section {
  background: var(--color-bg-card);
}

:root.dark .preview-header {
  background: var(--color-bg-secondary);
  border-color: var(--color-border);
}

:root.dark .settings-section {
  background: var(--color-bg-card);
}

:root.dark .font-button {
  background: var(--color-bg-secondary);
  border-color: var(--color-border);
}

:root.dark .font-button.active {
  background: var(--primary-dark);
  border-color: var(--primary-color);
}

:root.dark .slider-group {
  background: var(--color-bg-secondary);
}

:root.dark .slider {
  background: var(--color-bg-tertiary);
}

:root.dark .chip-btn {
  background: var(--color-bg-secondary);
  border-color: var(--color-border);
}

:root.dark .theme-btn {
  background: var(--color-bg-secondary);
  border-color: var(--color-border);
}

:root.dark .theme-btn.active {
  background: var(--primary-dark);
  border-color: var(--primary-color);
}

:root.dark .toggle-item {
  border-color: var(--color-border);
}

:root.dark .setting-item {
  border-color: var(--color-border);
}

:root.dark .radio-option:hover {
  background: var(--color-bg-hover);
}

:root.dark .radio-option.active {
  background: var(--primary-dark);
}

:root.dark .danger-btn {
  background: var(--color-bg-secondary);
  border-color: var(--color-border);
}

:root.dark .danger-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.15);
}

:root.dark .danger-btn.reset:hover:not(:disabled) {
  background: var(--color-error);
}
</style>
