<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="settings-overlay" @click="close">
        <div class="settings-modal" @click.stop>
          <!-- Header -->
          <div class="settings-header">
            <h3>읽기 설정</h3>
            <button class="close-button" @click="close" aria-label="닫기">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <!-- Preview Area -->
          <div class="settings-preview" :style="previewStyles">
            <h4 class="preview-title">예수의 계보</h4>
            <div class="preview-verses">
              <p class="preview-text">
                <span class="verse-number">1</span>
                <span class="verse-text"><span class="bible-name">아브라함</span>의 자손이요 <span class="bible-name">다윗</span>의 자손인 <span class="bible-name">예수 그리스도</span>의 계보는 이러하다.</span>
              </p>
              <p class="preview-text">
                <span class="verse-number">2</span>
                <span class="verse-text"><span class="bible-name">아브라함</span>은 <span class="bible-name">이삭</span>을 낳고, <span class="bible-name">이삭</span>은 <span class="bible-name">야곱</span>을 낳고,</span>
              </p>
              <p class="preview-text">
                <span class="verse-number">3</span>
                <span class="verse-text"><span class="bible-name">야곱</span>은 <span class="bible-area">유다</span>와 그의 형제들을 낳고,</span>
              </p>
            </div>
          </div>

          <!-- Settings Body (Scrollable) -->
          <div class="settings-body">
            <!-- Theme Section -->
            <section class="settings-section">
              <h4 class="section-title">화면 모드</h4>
              <div class="theme-options">
                <button
                  v-for="option in themeOptions"
                  :key="option.value"
                  class="theme-button"
                  :class="{ active: settings.theme === option.value }"
                  @click="updateSetting('theme', option.value)"
                >
                  <span class="theme-icon" v-html="option.icon"></span>
                  <span>{{ option.label }}</span>
                </button>
              </div>
            </section>

            <!-- Font Section -->
            <section class="settings-section">
              <h4 class="section-title">글꼴</h4>
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
                  <span class="font-type">{{ font.type === 'serif' ? '명조' : font.type === 'sans-serif' ? '고딕' : '시스템' }}</span>
                </button>
              </div>
            </section>

            <!-- Font Size Section -->
            <section class="settings-section">
              <h4 class="section-title">글자 크기</h4>
              <div class="slider-control">
                <span class="slider-label small">가</span>
                <input
                  type="range"
                  :value="settings.fontSize"
                  min="14"
                  max="24"
                  step="1"
                  class="font-size-slider"
                  @input="updateSetting('fontSize', Number(($event.target as HTMLInputElement).value))"
                />
                <span class="slider-label large">가</span>
                <span class="slider-value">{{ settings.fontSize }}px</span>
              </div>
            </section>

            <!-- Font Weight Section -->
            <section class="settings-section">
              <h4 class="section-title">글자 두께</h4>
              <div class="toggle-group">
                <button
                  v-for="option in fontWeightOptions"
                  :key="option.value"
                  class="toggle-button"
                  :class="{ active: settings.fontWeight === option.value }"
                  :style="{ fontWeight: option.weight }"
                  @click="updateSetting('fontWeight', option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </section>

            <!-- Line Height Section -->
            <section class="settings-section">
              <h4 class="section-title">줄 간격</h4>
              <div class="toggle-group">
                <button
                  v-for="option in lineHeightOptions"
                  :key="option.value"
                  class="toggle-button"
                  :class="{ active: settings.lineHeight === option.value }"
                  @click="updateSetting('lineHeight', option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </section>

            <!-- Text Align Section -->
            <section class="settings-section">
              <h4 class="section-title">정렬</h4>
              <div class="toggle-group">
                <button
                  v-for="option in textAlignOptions"
                  :key="option.value"
                  class="toggle-button"
                  :class="{ active: settings.textAlign === option.value }"
                  @click="updateSetting('textAlign', option.value)"
                >
                  <span v-html="option.icon"></span>
                  {{ option.label }}
                </button>
              </div>
            </section>

            <!-- Verse Joining Section -->
            <section class="settings-section">
              <div class="switch-row">
                <div class="switch-info">
                  <h4 class="section-title inline">절 붙임 (통독 모드)</h4>
                  <p class="switch-description">
                    절을 문단으로 연결하여 흐름있게 읽기
                  </p>
                </div>
                <label class="switch">
                  <input
                    type="checkbox"
                    :checked="settings.verseJoining"
                    @change="updateSetting('verseJoining', ($event.target as HTMLInputElement).checked)"
                  />
                  <span class="switch-slider"></span>
                </label>
              </div>
            </section>

            <!-- View Options (KNT specific) -->
            <section v-if="currentVersion === 'KNT'" class="settings-section">
              <h4 class="section-title">표시 옵션 (새한글)</h4>
              <div class="checkbox-list">
                <label class="checkbox-item">
                  <input
                    type="checkbox"
                    :checked="settings.showDescription"
                    @change="updateSetting('showDescription', ($event.target as HTMLInputElement).checked)"
                  />
                  <span class="checkmark"></span>
                  <span>시편 머리말 표시</span>
                </label>
                <label class="checkbox-item">
                  <input
                    type="checkbox"
                    :checked="settings.showCrossRef"
                    @change="updateSetting('showCrossRef', ($event.target as HTMLInputElement).checked)"
                  />
                  <span class="checkmark"></span>
                  <span>교차 참조 표시</span>
                </label>
                <label class="checkbox-item">
                  <input
                    type="checkbox"
                    :checked="settings.showFootnotes"
                    @change="updateSetting('showFootnotes', ($event.target as HTMLInputElement).checked)"
                  />
                  <span class="checkmark"></span>
                  <span>각주 표시</span>
                </label>
              </div>
            </section>

            <!-- View Options (Non-KNT) -->
            <section v-else class="settings-section">
              <h4 class="section-title">표시 옵션</h4>
              <div class="checkbox-list">
                <label class="checkbox-item">
                  <input
                    type="checkbox"
                    :checked="settings.highlightNames"
                    @change="updateSetting('highlightNames', ($event.target as HTMLInputElement).checked)"
                  />
                  <span class="checkmark"></span>
                  <span>인명/지명 강조</span>
                </label>
              </div>
            </section>
          </div>

          <!-- Footer -->
          <div class="settings-footer">
            <button class="reset-button" @click="resetToDefaults">
              기본값으로 초기화
            </button>
            <div class="action-buttons">
              <button class="cancel-button" @click="cancel">
                취소
              </button>
              <button class="save-button" :class="{ disabled: !hasChanges }" @click="save">
                저장
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useReadingSettingsStore, FONT_FAMILIES, LINE_HEIGHTS, FONT_WEIGHTS, type FontFamily, type ThemeMode, type FontWeight, type LineHeight, type TextAlign, type ReadingSettings } from '~/stores/readingSettings'

const props = defineProps<{
  isOpen: boolean
  currentVersion: string
}>()

const emit = defineEmits<{
  close: []
}>()

const store = useReadingSettingsStore()

// 로컬 설정 상태 (미리보기용)
const localSettings = ref<ReadingSettings>({ ...store.settings })
const hasChanges = computed(() => JSON.stringify(localSettings.value) !== JSON.stringify(store.settings))

// 모달이 열릴 때 현재 설정을 로컬에 복사
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    localSettings.value = { ...store.settings }
  }
})

const settings = computed(() => localSettings.value)

const fontFamilies = FONT_FAMILIES

const themeOptions: Array<{ value: ThemeMode; label: string; icon: string }> = [
  {
    value: 'light',
    label: '라이트',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
  },
  {
    value: 'dark',
    label: '다크',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
  },
  {
    value: 'system',
    label: '시스템',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'
  },
]

const fontWeightOptions: Array<{ value: FontWeight; label: string; weight: number }> = [
  { value: 'normal', label: '보통', weight: 400 },
  { value: 'medium', label: '중간', weight: 500 },
  { value: 'bold', label: '굵게', weight: 600 },
]

const lineHeightOptions: Array<{ value: LineHeight; label: string }> = [
  { value: 'compact', label: '좁게' },
  { value: 'normal', label: '보통' },
  { value: 'wide', label: '넓게' },
]

const textAlignOptions: Array<{ value: TextAlign; label: string; icon: string }> = [
  {
    value: 'left',
    label: '왼쪽',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>'
  },
  {
    value: 'justify',
    label: '양쪽',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>'
  },
]

// 테마별 배경색/글자색 (themes.css와 동일하게)
const themeColors = {
  light: {
    bg: '#faf8f6',
    text: '#2a1111',
    verseNumber: '#999999',
  },
  dark: {
    bg: '#1a1a1a',
    text: '#e0e0e0',
    verseNumber: '#666666',
  },
}

// 현재 테마 설정에 따른 실제 테마 (system 처리)
const effectiveTheme = computed(() => {
  if (settings.value.theme === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }
  return settings.value.theme
})

const previewStyles = computed(() => {
  const colors = themeColors[effectiveTheme.value]
  return {
    fontFamily: FONT_FAMILIES[settings.value.fontFamily].css,
    fontSize: `${settings.value.fontSize}px`,
    fontWeight: FONT_WEIGHTS[settings.value.fontWeight],
    lineHeight: LINE_HEIGHTS[settings.value.lineHeight],
    textAlign: settings.value.textAlign,
    backgroundColor: colors.bg,
    color: colors.text,
    '--verse-number-color': colors.verseNumber,
  }
})

function updateSetting<K extends keyof ReadingSettings>(key: K, value: ReadingSettings[K]) {
  localSettings.value = { ...localSettings.value, [key]: value }
}

function resetToDefaults() {
  // 로컬 설정을 기본값으로 초기화 (저장은 아직 안 함)
  localSettings.value = {
    theme: 'light',
    fontFamily: 'ridi-batang',
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 'normal',
    textAlign: 'left',
    verseJoining: false,
    showDescription: true,
    showCrossRef: true,
    highlightNames: true,
    showFootnotes: false,
  }
}

function save() {
  store.updateSettings(localSettings.value)
  emit('close')
}

function cancel() {
  // 변경 사항 버리고 닫기
  localSettings.value = { ...store.settings }
  emit('close')
}

function close() {
  // X 버튼 클릭 시 - cancel과 동일
  cancel()
}
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--modal-overlay, rgba(0, 0, 0, 0.5));
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.settings-modal {
  background-color: var(--modal-bg, #ffffff);
  color: var(--text-primary, #2a1111);
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (min-width: 640px) {
  .settings-overlay {
    align-items: center;
  }

  .settings-modal {
    border-radius: 16px;
    max-height: 80vh;
    margin: 20px;
  }
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.settings-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.close-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--button-bg, #f3f4f6);
  color: var(--text-primary, #2a1111);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.close-button:hover {
  background: var(--button-hover-bg, #e5e7eb);
}

.settings-preview {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.preview-title {
  color: var(--section-title-color, #5a6e54);
  font-size: 0.9em;
  font-weight: 600;
  margin: 0 0 12px 0;
  text-align: center;
}

.preview-verses {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-text {
  margin: 0;
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.preview-text .verse-number {
  color: var(--verse-number-color, #999);
  font-family: "Pretendard", sans-serif;
  font-size: 0.75em;
  font-weight: 500;
  min-width: 1.2em;
  text-align: right;
  flex-shrink: 0;
  line-height: 1.8;
}

.preview-text .verse-text {
  flex: 1;
}

/* 인명/지명 강조 */
.preview-text .bible-name {
  color: var(--highlight-name-color, #7c5a3c);
}

.preview-text .bible-area {
  color: var(--highlight-place-color, #5a6e54);
}

.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.settings-section {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light, #f0f0f0);
}

.settings-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary, #555);
  margin: 0 0 12px 0;
}

.section-title.inline {
  margin-bottom: 4px;
}

/* Theme Options */
.theme-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.theme-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  background: var(--bg-secondary, #fff);
  color: var(--text-primary, #2a1111);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.theme-button:hover {
  border-color: var(--accent-primary, #4B9F7E);
}

.theme-button.active {
  border-color: var(--accent-primary, #4B9F7E);
  background: var(--accent-primary-light, #e9f5f0);
}

.theme-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Font Grid */
.font-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.font-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  background: var(--bg-secondary, #fff);
  color: var(--text-primary, #2a1111);
  cursor: pointer;
  transition: all 0.2s;
}

.font-button:hover {
  border-color: var(--accent-primary, #4B9F7E);
}

.font-button.active {
  border-color: var(--accent-primary, #4B9F7E);
  background: var(--accent-primary-light, #e9f5f0);
}

.font-preview {
  font-size: 24px;
  line-height: 1;
}

.font-name {
  font-size: 12px;
  font-weight: 500;
}

.font-type {
  font-size: 10px;
  color: var(--text-tertiary, #888);
}

/* Slider Control */
.slider-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-label {
  color: var(--text-tertiary, #888);
}

.slider-label.small {
  font-size: 12px;
}

.slider-label.large {
  font-size: 20px;
}

.font-size-slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--border-color, #e5e7eb);
  border-radius: 3px;
  outline: none;
}

.font-size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-primary, #4B9F7E);
  cursor: pointer;
}

.font-size-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-primary, #4B9F7E);
  cursor: pointer;
  border: none;
}

.slider-value {
  min-width: 45px;
  text-align: right;
  font-size: 14px;
  font-weight: 500;
  color: var(--accent-primary, #4B9F7E);
}

/* Toggle Group */
.toggle-group {
  display: flex;
  gap: 8px;
}

.toggle-button {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  background: var(--bg-secondary, #fff);
  color: var(--text-primary, #2a1111);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.toggle-button:hover {
  border-color: var(--accent-primary, #4B9F7E);
}

.toggle-button.active {
  border-color: var(--accent-primary, #4B9F7E);
  background: var(--accent-primary, #4B9F7E);
  color: white;
}

/* Switch Row */
.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.switch-info {
  flex: 1;
}

.switch-description {
  font-size: 12px;
  color: var(--text-tertiary, #888);
  margin: 0;
}

/* Switch Toggle */
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 28px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-color, #e5e7eb);
  transition: 0.3s;
  border-radius: 28px;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.switch input:checked + .switch-slider {
  background-color: var(--accent-primary, #4B9F7E);
}

.switch input:checked + .switch-slider:before {
  transform: translateX(20px);
}

/* Checkbox List */
.checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-size: 14px;
}

.checkbox-item input {
  display: none;
}

.checkmark {
  width: 22px;
  height: 22px;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.checkbox-item input:checked + .checkmark {
  background: var(--accent-primary, #4B9F7E);
  border-color: var(--accent-primary, #4B9F7E);
}

.checkbox-item input:checked + .checkmark::after {
  content: '';
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin-bottom: 2px;
}

/* Footer */
.settings-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.reset-button {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary, #555);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.reset-button:hover {
  background: var(--button-bg, #f3f4f6);
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.cancel-button {
  flex: 1;
  padding: 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary, #555);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.cancel-button:hover {
  background: var(--button-bg, #f3f4f6);
}

.save-button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: var(--accent-primary, #4B9F7E);
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.save-button:hover {
  background: var(--color-accent-primary-hover, #3B7E63);
}

.save-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-button.disabled:hover {
  background: var(--accent-primary, #4B9F7E);
}

/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .settings-modal,
.modal-leave-active .settings-modal {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .settings-modal,
.modal-leave-to .settings-modal {
  transform: translateY(100%);
}

@media (min-width: 640px) {
  .modal-enter-from .settings-modal,
  .modal-leave-to .settings-modal {
    transform: scale(0.95) translateY(20px);
  }
}
</style>
