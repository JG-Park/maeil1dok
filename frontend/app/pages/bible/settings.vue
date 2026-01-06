<template>
  <div class="settings-page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <h1>읽기 설정</h1>
    </header>

    <div class="settings-content">
      <!-- 표시 설정 섹션 -->
      <section class="settings-section">
        <h2 class="section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          표시
        </h2>

        <!-- 폰트 크기 -->
        <div class="setting-item">
          <label class="setting-label">폰트 크기</label>
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
            <span class="slider-value">{{ settings.fontSize }}px</span>
          </div>
        </div>

        <!-- 폰트 패밀리 -->
        <div class="setting-item">
          <label class="setting-label">글꼴</label>
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
        </div>

        <!-- 줄 간격 -->
        <div class="setting-item">
          <label class="setting-label">줄 간격</label>
          <div class="option-buttons">
            <button
              v-for="option in lineHeightOptions"
              :key="option.value"
              class="option-btn"
              :class="{ active: settings.lineHeight === option.value }"
              @click="updateSetting('lineHeight', option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <!-- 테마 -->
        <div class="setting-item">
          <label class="setting-label">테마</label>
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
        </div>

        <!-- 절 번호 표시 -->
        <div class="setting-item toggle-item">
          <div class="toggle-info">
            <span class="toggle-title">절 번호 표시</span>
            <span class="toggle-desc">각 절의 번호를 표시합니다</span>
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

        <!-- 인명/지명 강조 -->
        <div class="setting-item toggle-item">
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

      <!-- 미리보기 -->
      <section class="preview-section">
        <h2 class="section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          미리보기
        </h2>
        <div
          class="preview-content"
          :style="previewStyles"
        >
          <span v-if="settings.showVerseNumbers" class="verse-number">1</span>
          <span class="verse-text">
            태초에 하나님이 천지를 창조하시니라
          </span>
        </div>
        <div
          class="preview-content"
          :style="previewStyles"
        >
          <span v-if="settings.showVerseNumbers" class="verse-number">2</span>
          <span class="verse-text">
            땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고
            하나님의 영은 수면 위에 운행하시니라
          </span>
        </div>
      </section>

      <!-- 동작 설정 섹션 -->
      <section class="settings-section">
        <h2 class="section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          동작
        </h2>

        <!-- 기본 진입점 -->
        <div class="setting-item">
          <label class="setting-label">기본 진입점</label>
          <select
            :value="settings.defaultEntryPoint"
            class="select-input"
            @change="updateSetting('defaultEntryPoint', ($event.target as HTMLSelectElement).value as DefaultEntryPoint)"
          >
            <option value="last-position">마지막 읽던 위치</option>
            <option value="home">홈 (대시보드)</option>
            <option value="toc">성경 목차</option>
          </select>
          <p class="setting-hint">/bible 접속 시 기본으로 이동할 위치입니다</p>
        </div>

        <!-- 통독모드 자동 완료 -->
        <div class="setting-item toggle-item">
          <div class="toggle-info">
            <span class="toggle-title">통독모드 자동 완료</span>
            <span class="toggle-desc">통독모드에서 마지막 장을 넘길 때 자동으로 완료 처리합니다</span>
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

        <!-- 절 붙임 (통독 모드) -->
        <div class="setting-item toggle-item">
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
      </section>

      <!-- 데이터 관리 섹션 -->
      <section class="settings-section danger-section">
        <h2 class="section-title danger">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          데이터 관리
        </h2>
        <p class="danger-hint">아래 작업은 되돌릴 수 없습니다.</p>

        <div class="danger-buttons">
          <button class="danger-btn" :disabled="isDeleting" @click="deleteAllBookmarks">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            북마크 전체 삭제
          </button>

          <button class="danger-btn" :disabled="isDeleting" @click="deleteAllNotes">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            묵상노트 전체 삭제
          </button>

          <button class="danger-btn" :disabled="isDeleting" @click="deleteAllHighlights">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            하이라이트 전체 삭제
          </button>

          <button class="danger-btn reset" :disabled="isDeleting" @click="resetAllSettings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
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
import { useReadingSettingsStore, FONT_FAMILIES, LINE_HEIGHTS, type ThemeMode, type LineHeight, type DefaultEntryPoint } from '~/stores/readingSettings';
import { useAuthStore } from '~/stores/auth';
import { useApi } from '~/composables/useApi';
import { useToast } from '~/composables/useToast';
import Toast from '~/components/Toast.vue';

definePageMeta({
  layout: 'default'
});

const settingsStore = useReadingSettingsStore();
const authStore = useAuthStore();
const api = useApi();
const toast = useToast();

const isDeleting = ref(false);

const settings = computed(() => settingsStore.settings);

const fontFamilies = FONT_FAMILIES;

// 테마 옵션
const themeOptions: Array<{ value: ThemeMode; label: string; icon: string }> = [
  {
    value: 'light',
    label: '라이트',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
  },
  {
    value: 'dark',
    label: '다크',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
  },
  {
    value: 'system',
    label: '자동',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'
  },
];

// 줄 간격 옵션
const lineHeightOptions: Array<{ value: LineHeight; label: string }> = [
  { value: 'compact', label: '좁게' },
  { value: 'normal', label: '보통' },
  { value: 'wide', label: '넓게' },
];

// 미리보기 스타일
const previewStyles = computed(() => ({
  fontFamily: FONT_FAMILIES[settings.value.fontFamily].css,
  fontSize: `${settings.value.fontSize}px`,
  lineHeight: LINE_HEIGHTS[settings.value.lineHeight],
}));

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
  if (!confirm('모든 북마크를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

  isDeleting.value = true;
  try {
    await api.delete('/api/v1/todos/bible/bookmarks/delete-all/');
    toast.success('북마크가 모두 삭제되었습니다');
  } catch (error) {
    toast.error('삭제 중 오류가 발생했습니다');
  } finally {
    isDeleting.value = false;
  }
};

// 묵상노트 전체 삭제
const deleteAllNotes = async () => {
  if (!authStore.isAuthenticated) {
    toast.error('로그인이 필요합니다');
    return;
  }
  if (!confirm('모든 묵상노트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

  isDeleting.value = true;
  try {
    await api.delete('/api/v1/todos/bible/notes/delete-all/');
    toast.success('묵상노트가 모두 삭제되었습니다');
  } catch (error) {
    toast.error('삭제 중 오류가 발생했습니다');
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
  if (!confirm('모든 하이라이트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

  isDeleting.value = true;
  try {
    await api.delete('/api/v1/todos/bible/highlights/delete-all/');
    toast.success('하이라이트가 모두 삭제되었습니다');
  } catch (error) {
    toast.error('삭제 중 오류가 발생했습니다');
  } finally {
    isDeleting.value = false;
  }
};

// 설정 초기화
const resetAllSettings = () => {
  if (!confirm('모든 설정을 기본값으로 초기화하시겠습니까?')) return;
  settingsStore.resetToDefaults();
  toast.success('설정이 초기화되었습니다');
};
</script>

<style scoped>
.settings-page {
  max-width: 768px;
  margin: 0 auto;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-bg-primary, #f9fafb);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-card, #fff);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  padding: 0.5rem;
  margin: -0.5rem;
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
}

.back-btn:hover {
  background: var(--color-bg-hover, #f3f4f6);
}

.page-header h1 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

/* 설정 컨텐츠 */
.settings-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 섹션 */
.settings-section {
  background: var(--color-bg-card, #fff);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin: 0 0 1rem;
}

.section-title svg {
  color: var(--primary-color, #6366f1);
}

.section-title.danger svg {
  color: var(--color-error, #ef4444);
}

/* 설정 아이템 */
.setting-item {
  margin-bottom: 1.25rem;
}

.setting-item:last-child {
  margin-bottom: 0;
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

/* 슬라이더 */
.slider-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.slider-icon {
  color: var(--text-muted, #9ca3af);
}

.slider-icon.small {
  font-size: 0.75rem;
}

.slider-icon.large {
  font-size: 1.25rem;
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
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color, #6366f1);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color, #6366f1);
  cursor: pointer;
  border: none;
}

.slider-value {
  min-width: 40px;
  text-align: right;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary-color, #6366f1);
}

/* 폰트 그리드 */
.font-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.font-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 0.5rem;
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
  font-size: 1.5rem;
  line-height: 1.2;
}

.font-name {
  font-size: 0.6875rem;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
}

/* 옵션 버튼 */
.option-buttons {
  display: flex;
  gap: 0.5rem;
}

.option-btn {
  flex: 1;
  padding: 0.625rem 0.75rem;
  border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  background: var(--color-bg-card, #fff);
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
}

.option-btn:hover {
  border-color: var(--primary-color, #6366f1);
}

.option-btn.active {
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
  padding: 0.5rem 0;
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
  width: 48px;
  height: 28px;
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
  border-radius: 28px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
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
  transform: translateX(20px);
}

/* 미리보기 섹션 */
.preview-section {
  background: var(--color-bg-card, #fff);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.preview-content {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  color: var(--text-primary, #1f2937);
}

.preview-content:last-child {
  border-bottom: none;
}

.verse-number {
  font-size: 0.7em;
  color: var(--text-muted, #9ca3af);
  font-weight: 500;
  min-width: 1.5em;
  text-align: right;
  flex-shrink: 0;
  line-height: 2;
  font-family: system-ui, sans-serif;
}

.verse-text {
  flex: 1;
}

/* Select 입력 */
.select-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 10px;
  font-size: 0.9375rem;
  color: var(--text-primary, #1f2937);
  background: var(--color-bg-card, #fff);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.5rem;
}

.select-input:focus {
  outline: none;
  border-color: var(--primary-color, #6366f1);
}

/* 위험 섹션 */
.danger-section {
  border: 1px solid var(--color-error-light, #fecaca);
}

.danger-hint {
  font-size: 0.75rem;
  color: var(--color-error, #ef4444);
  margin: 0 0 1rem;
}

.danger-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.danger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 10px;
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
:root.dark .settings-page {
  background: var(--color-bg-primary);
}

:root.dark .page-header {
  background: var(--color-bg-card);
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

:root.dark .option-btn {
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

:root.dark .slider {
  background: var(--color-bg-tertiary);
}

:root.dark .select-input {
  background: var(--color-bg-secondary);
  border-color: var(--color-border);
  color: var(--text-primary);
}

:root.dark .preview-section {
  background: var(--color-bg-card);
}

:root.dark .preview-content {
  border-color: var(--color-border);
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
