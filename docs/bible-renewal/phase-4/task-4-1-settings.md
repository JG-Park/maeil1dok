# Task 4-1: 읽기 설정 페이지

> **Phase**: 4 - 설정 및 마무리
> **상태**: ⬜ 대기
> **의존성**: Phase 3 완료 필요

---

## 목표

- 읽기 설정 페이지 (`/bible/settings`) 구현
- 폰트, 테마, 자동 완료 등 설정 관리
- 설정 저장 (localStorage + 서버 동기화 옵션)

---

## 서브태스크

### 4.1.1 설정 페이지 레이아웃
- [ ] `/bible/settings` 페이지 구현
- [ ] 설정 섹션별 구분 (표시, 동작, 데이터)

### 4.1.2 표시 설정
- [ ] 폰트 크기 (12px ~ 24px 슬라이더)
- [ ] 폰트 패밀리 (시스템, 나눔명조, 나눔고딕)
- [ ] 줄 간격 (1.4 ~ 2.0)
- [ ] 테마 (라이트, 다크, 세피아)
- [ ] 실시간 미리보기

### 4.1.3 동작 설정
- [ ] 기본 진입점 (마지막 위치 / 홈 / 목차)
- [ ] 통독모드 자동 완료 (On/Off)
- [ ] 절 번호 표시 (On/Off)

### 4.1.4 데이터 관리
- [ ] 읽기 기록 초기화
- [ ] 북마크 전체 삭제
- [ ] 묵상노트 전체 삭제
- [ ] 하이라이트 전체 삭제

### 4.1.5 설정 스토어 확장
- [ ] `readingSettings` store에 새 설정 추가
- [ ] localStorage 동기화
- [ ] 설정 내보내기/가져오기 (옵션)

---

## 구현 상세

### readingSettings store 확장

```typescript
// stores/readingSettings.ts
import { defineStore } from 'pinia';

interface ReadingSettings {
  // 표시 설정
  fontSize: number;
  fontFamily: 'system' | 'nanum-myeongjo' | 'nanum-gothic';
  lineHeight: number;
  theme: 'light' | 'dark' | 'sepia';
  showVerseNumbers: boolean;

  // 동작 설정
  defaultEntryPoint: 'last-position' | 'home' | 'toc';
  tongdokAutoComplete: boolean;

  // 기타
  lastUpdated: string;
}

const DEFAULT_SETTINGS: ReadingSettings = {
  fontSize: 16,
  fontFamily: 'system',
  lineHeight: 1.8,
  theme: 'light',
  showVerseNumbers: true,
  defaultEntryPoint: 'last-position',
  tongdokAutoComplete: false,
  lastUpdated: ''
};

export const useReadingSettingsStore = defineStore('readingSettings', {
  state: () => ({
    settings: { ...DEFAULT_SETTINGS } as ReadingSettings
  }),

  actions: {
    loadSettings() {
      const saved = localStorage.getItem('readingSettings');
      if (saved) {
        try {
          this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        } catch (e) {
          console.error('설정 로드 실패:', e);
        }
      }
    },

    updateSettings(partial: Partial<ReadingSettings>) {
      this.settings = {
        ...this.settings,
        ...partial,
        lastUpdated: new Date().toISOString()
      };
      this.saveSettings();
    },

    saveSettings() {
      localStorage.setItem('readingSettings', JSON.stringify(this.settings));
    },

    resetSettings() {
      this.settings = { ...DEFAULT_SETTINGS };
      this.saveSettings();
    },

    // 설정 내보내기
    exportSettings() {
      return JSON.stringify(this.settings, null, 2);
    },

    // 설정 가져오기
    importSettings(json: string) {
      try {
        const imported = JSON.parse(json);
        this.settings = { ...DEFAULT_SETTINGS, ...imported };
        this.saveSettings();
        return true;
      } catch (e) {
        return false;
      }
    }
  }
});
```

### /bible/settings.vue

```vue
<template>
  <div class="settings-page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">
        <i class="fa-solid fa-chevron-left" />
      </button>
      <h1>읽기 설정</h1>
    </header>

    <div class="settings-content">
      <!-- 표시 설정 -->
      <section class="settings-section">
        <h2 class="section-title">표시</h2>

        <!-- 폰트 크기 -->
        <div class="setting-item">
          <label>폰트 크기</label>
          <div class="slider-control">
            <span class="value">{{ settings.fontSize }}px</span>
            <input
              type="range"
              min="12"
              max="24"
              :value="settings.fontSize"
              @input="updateSetting('fontSize', +$event.target.value)"
            />
          </div>
        </div>

        <!-- 폰트 패밀리 -->
        <div class="setting-item">
          <label>폰트</label>
          <select
            :value="settings.fontFamily"
            @change="updateSetting('fontFamily', $event.target.value)"
          >
            <option value="system">시스템 기본</option>
            <option value="nanum-myeongjo">나눔명조</option>
            <option value="nanum-gothic">나눔고딕</option>
          </select>
        </div>

        <!-- 줄 간격 -->
        <div class="setting-item">
          <label>줄 간격</label>
          <div class="slider-control">
            <span class="value">{{ settings.lineHeight.toFixed(1) }}</span>
            <input
              type="range"
              min="1.4"
              max="2.0"
              step="0.1"
              :value="settings.lineHeight"
              @input="updateSetting('lineHeight', +$event.target.value)"
            />
          </div>
        </div>

        <!-- 테마 -->
        <div class="setting-item">
          <label>테마</label>
          <div class="theme-selector">
            <button
              v-for="theme in themes"
              :key="theme.value"
              class="theme-btn"
              :class="[theme.value, { active: settings.theme === theme.value }]"
              @click="updateSetting('theme', theme.value)"
            >
              {{ theme.label }}
            </button>
          </div>
        </div>

        <!-- 절 번호 -->
        <div class="setting-item">
          <label>절 번호 표시</label>
          <label class="toggle">
            <input
              type="checkbox"
              :checked="settings.showVerseNumbers"
              @change="updateSetting('showVerseNumbers', $event.target.checked)"
            />
            <span class="toggle-slider" />
          </label>
        </div>
      </section>

      <!-- 미리보기 -->
      <section class="preview-section">
        <h2 class="section-title">미리보기</h2>
        <div
          class="preview-content"
          :class="[`theme-${settings.theme}`, `font-${settings.fontFamily}`]"
          :style="{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight
          }"
        >
          <sup v-if="settings.showVerseNumbers">1</sup>태초에 하나님이 천지를 창조하시니라
          <sup v-if="settings.showVerseNumbers">2</sup>땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고
          하나님의 영은 수면 위에 운행하시니라
        </div>
      </section>

      <!-- 동작 설정 -->
      <section class="settings-section">
        <h2 class="section-title">동작</h2>

        <!-- 기본 진입점 -->
        <div class="setting-item">
          <label>기본 진입점</label>
          <select
            :value="settings.defaultEntryPoint"
            @change="updateSetting('defaultEntryPoint', $event.target.value)"
          >
            <option value="last-position">마지막 읽던 위치</option>
            <option value="home">홈 (대시보드)</option>
            <option value="toc">성경 목차</option>
          </select>
        </div>

        <!-- 통독모드 자동 완료 -->
        <div class="setting-item">
          <label>통독모드 자동 완료</label>
          <label class="toggle">
            <input
              type="checkbox"
              :checked="settings.tongdokAutoComplete"
              @change="updateSetting('tongdokAutoComplete', $event.target.checked)"
            />
            <span class="toggle-slider" />
          </label>
          <p class="setting-hint">
            통독모드에서 마지막 장을 넘길 때 자동으로 완료 처리합니다
          </p>
        </div>
      </section>

      <!-- 데이터 관리 -->
      <section class="settings-section danger">
        <h2 class="section-title">데이터 관리</h2>

        <button class="danger-btn" @click="resetReadingRecords">
          <i class="fa-solid fa-rotate-left" />
          읽기 기록 초기화
        </button>

        <button class="danger-btn" @click="deleteAllBookmarks">
          <i class="fa-solid fa-bookmark" />
          북마크 전체 삭제
        </button>

        <button class="danger-btn" @click="deleteAllNotes">
          <i class="fa-solid fa-note-sticky" />
          묵상노트 전체 삭제
        </button>

        <button class="danger-btn" @click="deleteAllHighlights">
          <i class="fa-solid fa-highlighter" />
          하이라이트 전체 삭제
        </button>

        <button class="danger-btn reset" @click="resetAllSettings">
          <i class="fa-solid fa-trash" />
          모든 설정 초기화
        </button>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useReadingSettingsStore } from '~/stores/readingSettings';
import { useApi } from '~/composables/useApi';

const settingsStore = useReadingSettingsStore();
const api = useApi();

const settings = computed(() => settingsStore.settings);

const themes = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
  { value: 'sepia', label: '세피아' }
];

const updateSetting = (key: string, value: any) => {
  settingsStore.updateSettings({ [key]: value });
};

const resetReadingRecords = async () => {
  if (confirm('모든 읽기 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
    try {
      await api.delete('/api/v1/bible/personal-records/all/');
      alert('읽기 기록이 초기화되었습니다.');
    } catch (error) {
      alert('초기화 중 오류가 발생했습니다.');
    }
  }
};

const deleteAllBookmarks = async () => {
  if (confirm('모든 북마크를 삭제하시겠습니까?')) {
    try {
      await api.delete('/api/v1/bible/bookmarks/all/');
      alert('북마크가 모두 삭제되었습니다.');
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  }
};

const deleteAllNotes = async () => {
  if (confirm('모든 묵상노트를 삭제하시겠습니까?'));
    try {
      await api.delete('/api/v1/bible/notes/all/');
      alert('묵상노트가 모두 삭제되었습니다.');
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  }
};

const deleteAllHighlights = async () => {
  if (confirm('모든 하이라이트를 삭제하시겠습니까?')) {
    try {
      await api.delete('/api/v1/bible/highlights/all/');
      alert('하이라이트가 모두 삭제되었습니다.');
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  }
};

const resetAllSettings = () => {
  if (confirm('모든 설정을 기본값으로 초기화하시겠습니까?')) {
    settingsStore.resetSettings();
    alert('설정이 초기화되었습니다.');
  }
};
</script>
```

---

## 테스트 체크리스트

### 빌드 테스트
- [ ] `npm run build` 성공

### 기능 테스트 (Chrome DevTools MCP)

**표시 설정:**
- [ ] `/bible/settings` 접속
- [ ] 폰트 크기 슬라이더 동작
- [ ] 폰트 패밀리 변경
- [ ] 줄 간격 슬라이더 동작
- [ ] 테마 변경 (라이트/다크/세피아)
- [ ] 절 번호 표시 토글
- [ ] 미리보기에 실시간 반영

**동작 설정:**
- [ ] 기본 진입점 변경 후 `/bible` 재접속 시 동작 확인
- [ ] 통독모드 자동 완료 설정 변경

**데이터 관리:**
- [ ] 각 삭제 버튼 확인 모달 표시
- [ ] 삭제 후 해당 데이터 없음 확인

**설정 저장:**
- [ ] 설정 변경 후 페이지 새로고침
- [ ] 설정 유지 확인

---

## 완료 기준

1. 모든 설정 UI 동작
2. 설정 저장/로드 정상
3. 미리보기 실시간 반영
4. 데이터 삭제 기능 동작
5. 빌드 성공

---

## 완료 정보

- **완료일**: 2026-01-06
- **커밋**: c0e8949
- **비고**:
  - 스토어에 showVerseNumbers, defaultEntryPoint 설정 추가
  - /bible/settings.vue 페이지 완전 구현 (표시, 동작, 데이터 관리 섹션)
  - 백엔드 ViewSet에 delete-all 액션 추가 (북마크, 묵상노트, 하이라이트)
